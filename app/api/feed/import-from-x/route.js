import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase.js';

// GET /api/feed/import-from-x
// Scrapes tweets from active sources via Bright Data and saves them to Supabase.
// Env vars required: BRIGHTDATA_API_TOKEN, BRIGHTDATA_DATASET_ID

const POSTS_LIMIT_PER_SOURCE = 5

function extractBrightDataErrors(items) {
  if (!Array.isArray(items)) return []
  return items
    .filter((item) => {
      if (!item || typeof item !== 'object') return false
      return Boolean(item.error || item.error_message || item.error_code || item.input_errors)
    })
    .map((item) => ({
      input: item.url || item.input || item.user_posted || null,
      error: item.error || item.error_message || item.error_code || item.input_errors,
      code: item.error_code || null,
    }))
}

export async function GET() {
  // Step 1: Validate required environment variables
  const brightToken = process.env.BRIGHTDATA_API_TOKEN
  const datasetId = process.env.BRIGHTDATA_DATASET_ID

  if (!brightToken) {
    return NextResponse.json({ ok: false, error: 'BRIGHTDATA_API_TOKEN not set' }, { status: 400 })
  }
  if (!datasetId) {
    return NextResponse.json({ ok: false, error: 'BRIGHTDATA_DATASET_ID not set' }, { status: 400 })
  }

  // Step 2: Load active sources from Supabase
  const { data: sourcesData, error: sourcesError } = await supabase
    .from('sources')
    .select('url')
    .eq('active', true)

  if (sourcesError) {
    return NextResponse.json({ ok: false, error: `Failed to load sources: ${sourcesError.message}` }, { status: 500 })
  }
  if (!sourcesData || sourcesData.length === 0) {
    return NextResponse.json({ ok: false, error: 'No active sources found' }, { status: 400 })
  }

  // Step 3: Build BrightData request
  // Each source gets its own input so limit_per_input applies per source, not total
  const inputs = sourcesData.map(s => ({ urls: [s.url], start_date: '', end_date: '' }))

  const brightDataTriggerUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true&type=discover_new&discover_by=profiles_array&limit_per_input=${POSTS_LIMIT_PER_SOURCE}`

  const custom_output_fields = [
    'id', 'user_posted', 'name', 'description', 'date_posted', 'photos',
    'url', 'profile_image_link', 'external_image_urls', 'videos',
    'external_video_urls', 'user_id', 'timestamp',
    'error', 'error_code', 'warning', 'warning_code',
  ]

  try {
    // Step 4: Trigger BrightData job
    const triggerResponse = await fetch(brightDataTriggerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${brightToken}` },
      body: JSON.stringify({ input: inputs, custom_output_fields }),
    })

    const triggerResponseText = await triggerResponse.text()
    let triggerData
    try {
      triggerData = JSON.parse(triggerResponseText)
    } catch {
      return NextResponse.json({ ok: false, error: 'BrightData response not JSON', body: triggerResponseText }, { status: 502 })
    }

    if (!triggerResponse.ok) {
      return NextResponse.json({ ok: false, error: 'BrightData trigger failed', body: triggerData }, { status: 502 })
    }

    const snapshotId = triggerData.snapshot_id || triggerData.snapshotId || triggerData.id ||
      (triggerData.data && (triggerData.data.snapshot_id || triggerData.data.snapshotId)) || null

    if (!snapshotId) {
      return NextResponse.json({ ok: true, message: 'Import triggered (no snapshot ID returned)', triggerResponse: triggerData })
    }

    // Step 5: Poll until snapshot is ready
    const pollIntervalMs = parseInt(process.env.BRIGHTDATA_POLL_INTERVAL_MS || '60000', 10)
    const pollTimeoutMs = parseInt(process.env.BRIGHTDATA_POLL_TIMEOUT_MS || '600000', 10)
    const pollStartTime = Date.now()

    while (Date.now() - pollStartTime < pollTimeoutMs) {
      try {
        const progressResponse = await fetch(`https://api.brightdata.com/datasets/v3/progress/${snapshotId}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${brightToken}` },
        })
        let progressData
        try {
          progressData = JSON.parse(await progressResponse.text())
        } catch {
          await new Promise(r => setTimeout(r, pollIntervalMs))
          continue
        }

        const snapshotStatus = String(progressData.status || '').toLowerCase()
        console.log('Snapshot status:', snapshotStatus)

        if (snapshotStatus === 'ready') {
          const snapshotResponse = await fetch(
            `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
            { headers: { Authorization: `Bearer ${brightToken}` } }
          )
          let snapshotPayload
          try {
            snapshotPayload = JSON.parse(await snapshotResponse.text())
          } catch {
            return NextResponse.json({ ok: false, error: 'BrightData snapshot not JSON', snapshotId }, { status: 502 })
          }

          if (!snapshotResponse.ok) {
            return NextResponse.json({ ok: false, error: 'BrightData snapshot download failed', snapshotId }, { status: 502 })
          }

          const snapshotItems = Array.isArray(snapshotPayload)
            ? snapshotPayload
            : Array.isArray(snapshotPayload?.data) ? snapshotPayload.data : []

          const errors = extractBrightDataErrors(snapshotItems)
          const newTweets = snapshotItems
            .filter(item => item.id && (item.description || item.user_posted))
            .map(({ id, user_posted, name, description, date_posted, photos, url, profile_image_link, external_image_urls, videos, external_video_urls, user_id, timestamp }) => ({
              id, user_posted, name, description, date_posted, photos, url, profile_image_link, external_image_urls, videos, external_video_urls, user_id,
              timestamp: timestamp ? Date.parse(timestamp) || null : null,
            }))

          if (newTweets.length === 0) {
            return NextResponse.json({ ok: true, message: 'No valid tweets returned', snapshotId, saved: 0 })
          }

          const { error: upsertError } = await supabase
            .from('tweets')
            .upsert(newTweets, { onConflict: 'id', ignoreDuplicates: true })

          if (upsertError) throw new Error(upsertError.message)

          return NextResponse.json({ ok: true, message: `Saved ${newTweets.length} tweets`, snapshotId, saved: newTweets.length, errors: errors.length || undefined })
        }

        if (snapshotStatus === 'failed') {
          return NextResponse.json({ ok: false, error: 'Snapshot failed', snapshotId }, { status: 502 })
        }
      } catch (pollingError) {
        return NextResponse.json({ ok: false, error: pollingError.message || 'Polling failed' }, { status: 502 })
      }

      await new Promise(r => setTimeout(r, pollIntervalMs))
    }

    return NextResponse.json({ ok: false, error: 'Poll timeout — snapshot not ready', snapshotId })
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
  }
}
