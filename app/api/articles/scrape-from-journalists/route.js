import { NextResponse } from 'next/server'; 
import journalistList from '../../../../lib/journalistList.js';
import { readDB, writeDB } from '../../../../lib/db.js';

// This route scrapes tweets from DRC journalists using Bright Data HTTP API
// Env vars required: BRIGHTDATA_API_TOKEN, BRIGHTDATA_DATASET_ID

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
    console.error('BRIGHTDATA_API_TOKEN not set')
    return NextResponse.json({ error: 'BRIGHTDATA_API_TOKEN not set' }, { status: 400 })
  }
  if (!datasetId) {
    console.error('BRIGHTDATA_DATASET_ID not set')
    return NextResponse.json({ error: 'BRIGHTDATA_DATASET_ID not set' }, { status: 400 })
  }

  // Step 2: Configure request inputs with journalist URLs (no date filters)
  const inputs = [
    {
      urls: journalistList,
    },
  ]

  // Step 3: Define which tweet fields to fetch from Bright Data
  const custom_output_fields = [
    'id',
    'user_posted',
    'name',
    'description',
    'date_posted',
    'photos',
    'url',
    'profile_image_link',
    'external_image_urls',
    'videos',
    'external_video_urls',
    'user_id',
    'timestamp',
    'error',
    'error_code',
    'warning',
    'warning_code',
  ]

  // Step 4: Build request body for Bright Data API
  const requestBody = {
    input: inputs,
    custom_output_fields,
  }

  // Step 5: Construct trigger URL with dataset configuration
  const brightDataTriggerUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true&type=discover_new&discover_by=profiles_array&limit_per_input=3`

  try {
    // Step 6: Send POST request to trigger Bright Data scraping job
    console.log('Triggering Bright Data dataset:', brightDataTriggerUrl)
    const triggerResponse = await fetch(brightDataTriggerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brightToken}`,
      },
      body: JSON.stringify(requestBody),
    })

    // Step 7: Parse and validate trigger response
    const triggerResponseText = await triggerResponse.text()
    let triggerData
    try {
      triggerData = JSON.parse(triggerResponseText)
    } catch (jsonParseError) {
      return NextResponse.json({ error: 'BrightData response not JSON', status: triggerResponse.status, body: triggerResponseText }, { status: 502 })
    }

    if (!triggerResponse.ok) {
      return NextResponse.json({ error: 'BrightData trigger failed', status: triggerResponse.status, body: triggerData }, { status: 502 })
    }

    // Step 8: Extract snapshot ID from trigger response
    const snapshotId = triggerData.snapshot_id || triggerData.snapshotId || triggerData.id || (triggerData.data && (triggerData.data.snapshot_id || triggerData.data.snapshotId)) || null

    if (!snapshotId) {
      return NextResponse.json({ source: 'brightdata', triggerResponse: triggerData })
    }

    // Step 9: Setup polling configuration (default: 1 min interval, 10 min timeout)
    const pollIntervalMs = parseInt(process.env.BRIGHTDATA_POLL_INTERVAL_MS || '60000', 10)
    const pollTimeoutMs = parseInt(process.env.BRIGHTDATA_POLL_TIMEOUT_MS || '600000', 10)
    const pollStartTime = Date.now()

    const getProgressEndpointUrl = (id) => `https://api.brightdata.com/datasets/v3/progress/${id}`
    const getSnapshotDownloadUrl = (id, format = 'json') => `https://api.brightdata.com/datasets/v3/snapshot/${id}?format=${format}`

    // Step 10: Poll Bright Data progress endpoint until snapshot is ready or failed
    while (Date.now() - pollStartTime < pollTimeoutMs) {
      try {
        const progressEndpointUrl = getProgressEndpointUrl(snapshotId)
        console.log('Polling progress endpoint:', progressEndpointUrl)
        const progressResponse = await fetch(progressEndpointUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${brightToken}`,
          },
        })

        // Step 11: Parse progress response and extract snapshot status
        const progressResponseBody = await progressResponse.text()
        let progressData
        try {
          progressData = JSON.parse(progressResponseBody)
        } catch (progressParseError) {
          console.error('Progress response not JSON', progressParseError)
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
          continue
        }

        const snapshotStatus = String(progressData.status || '').toLowerCase()
        console.log('Snapshot status:', snapshotStatus)

        // Step 12: When snapshot is ready, download and return tweets
        if (snapshotStatus === 'ready') {
          const snapshotDownloadUrl = getSnapshotDownloadUrl(snapshotId, 'json')
          const snapshotResponse = await fetch(snapshotDownloadUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${brightToken}` },
          })

          const snapshotResponseText = await snapshotResponse.text()
          let snapshotPayload
          try {
            snapshotPayload = JSON.parse(snapshotResponseText)
          } catch (snapshotParseError) {
            return NextResponse.json(
              {
                error: 'BrightData snapshot response not JSON',
                snapshotId,
                status: snapshotResponse.status,
                body: snapshotResponseText,
              },
              { status: 502 }
            )
          }

          if (!snapshotResponse.ok) {
            return NextResponse.json(
              {
                error: 'BrightData snapshot download failed',
                snapshotId,
                status: snapshotResponse.status,
                body: snapshotPayload,
              },
              { status: 502 }
            )
          }

          const snapshotItems = Array.isArray(snapshotPayload)
            ? snapshotPayload
            : Array.isArray(snapshotPayload?.data)
              ? snapshotPayload.data
              : []

          const brightDataErrors = extractBrightDataErrors(snapshotItems)

          if (brightDataErrors.length > 0) {
            return NextResponse.json(
              {
                error: 'BrightData returned input-level errors',
                snapshotId,
                errorCount: brightDataErrors.length,
                errors: brightDataErrors,
              },
              { status: 502 }
            )
          }
          
          // Step 12a: Save tweets to db.json (filter out metadata)
          const existingData = await readDB()
          const newTweets = snapshotItems.filter(item => item.id && (item.description || item.user_posted))

          if (newTweets.length === 0) {
            return NextResponse.json({
              source: 'brightdata',
              snapshotId,
              saved: 0,
              tweets: [],
              note: 'No valid tweets returned by BrightData (no matching posts or invalid inputs).',
            })
          }

          const updatedData = [...existingData, ...newTweets]
          await writeDB(updatedData)
          
          return NextResponse.json({ 
            source: 'brightdata', 
            snapshotId,
            tweets: snapshotItems,
            saved: newTweets.length
          })
        }

        // Step 13: Handle failed snapshot status
        if (snapshotStatus === 'failed') {
          return NextResponse.json({ source: 'brightdata', triggerResponse: triggerData, snapshot: progressData, note: 'snapshot failed' }, { status: 502 })
        }
      } catch (pollingError) {
        // Step 14: Log polling errors and continue to next poll attempt
        console.error('Progress poll error:', pollingError)
      }

      // Step 15: Wait before next poll attempt
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    // Step 16: Return timeout response if snapshot not ready within timeout period
    return NextResponse.json({ source: 'brightdata', triggerResponse: triggerData, note: 'poll timeout, snapshot not ready' })
  } catch (error) {
    // Step 17: Handle any unexpected errors during the entire process
    const errorObject = error instanceof Error ? error : new Error(String(error))
    console.error('BrightData request failed:', errorObject)
    return NextResponse.json({ error: 'BrightData request failed', message: errorObject.message, stack: errorObject.stack }, { status: 502 })
  }
}
