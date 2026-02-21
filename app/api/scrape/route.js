import { NextResponse } from 'next/server'; 
import journalistList from '../../../lib/journalistList.js';
import cleanText from '../../../lib/cleanText.js';

// This route uses Bright Data HTTP API only. Ensure the following env vars are set:
// BRIGHTDATA_API_URL and BRIGHTDATA_API_TOKEN

export async function GET() {
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

  // Build request body to match the fields you asked for
  const inputs = [
    {
      urls: journalistList,
      start_date: '',
      end_date: '',
    },
  ]

  const custom_output_fields = [
    'id','user_posted','name','description','date_posted','photos','url','external_url','external_image_urls','videos','external_video_urls','user_id','timestamp','input','error','error_code','warning','warning_code'
  ]

  const body = {
    input: inputs,
    custom_output_fields,
  }

  // Use the async trigger endpoint which returns a snapshot_id to poll
  const brightUrl = `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true&type=discover_new&discover_by=profiles_array&limit_per_input=20`

  try {
    console.log('Triggering Bright Data dataset:', brightUrl)
    const res = await fetch(brightUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${brightToken}`,
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()
    let json
    try {
      json = JSON.parse(text)
    } catch (parseErr) {
      return NextResponse.json({ error: 'BrightData response not JSON', status: res.status, body: text }, { status: 502 })
    }

    // If trigger failed, return error
    if (!res.ok) {
      return NextResponse.json({ error: 'BrightData trigger failed', status: res.status, body: json }, { status: 502 })
    }

    // Extract snapshot id from triggerResponse
    const triggerResponse = json
    const snapshotId = triggerResponse.snapshot_id || triggerResponse.snapshotId || triggerResponse.id || (triggerResponse.data && (triggerResponse.data.snapshot_id || triggerResponse.data.snapshotId)) || null

    if (!snapshotId) {
      // No snapshot id returned — return the trigger response for inspection
      return NextResponse.json({ source: 'brightdata', triggerResponse })
    }

    // Poll the Monitor Progress API until the snapshot status is 'ready' or 'failed'
    const pollIntervalMs = parseInt(process.env.BRIGHTDATA_POLL_INTERVAL_MS || '60000', 10) // default 1 minute
    const pollTimeoutMs = parseInt(process.env.BRIGHTDATA_POLL_TIMEOUT_MS || '600000', 10) // default 10 minutes
    const start = Date.now()

    const progressEndpoint = (id) => `https://api.brightdata.com/datasets/v3/progress/${id}`
    const snapshotDownloadEndpoint = (id, format = 'json') => `https://api.brightdata.com/datasets/v3/snapshot/${id}?format=${format}`

    while (Date.now() - start < pollTimeoutMs) {
      try {
        const progressUrl = progressEndpoint(snapshotId)
        console.log('Polling progress endpoint:', progressUrl)
        const pr = await fetch(progressUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${brightToken}`,
          },
        })

        const progressText = await pr.text()
        let progressJson
        try {
          progressJson = JSON.parse(progressText)
        } catch (parseErr) {
          console.error('Progress response not JSON', parseErr)
          // wait and continue
          await new Promise((res) => setTimeout(res, pollIntervalMs))
          continue
        }

        const status = String(progressJson.status || '').toLowerCase()
        console.log('Snapshot status:', status)

        if (status === 'ready') {
          // Download snapshot result (JSON)
          const downloadUrl = snapshotDownloadEndpoint(snapshotId, 'json')
          try {
            const df = await fetch(downloadUrl, {
              method: 'GET',
              headers: { Authorization: `Bearer ${brightToken}` },
            })
            const bodyText = await df.text()
            try {
              let resultJson = JSON.parse(bodyText)
              // Remove discovery_input and clean article.text
              resultJson = resultJson.map(item => {
                const newItem = { ...item }
                delete newItem.discovery_input
                if (newItem.article && typeof newItem.article.text === 'string') {
                  newItem.article.text = cleanText(newItem.article.text)
                }
                return newItem
              })
              // Fire-and-forget: enrich snapshot items using local enricher endpoint
              try {
                const baseUrl = process.env.INTERNAL_BASE_URL || 'http://127.0.0.1:3000'
                const enrichUrl = `${baseUrl}/api/enrich/batch`
                await fetch(enrichUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items: resultJson }),
                })
                // After enriching, trigger embedding/classification
                const assignUrl = `${baseUrl}/api/themes/assign`
                fetch(assignUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ dry: false })
                }).catch((e) => console.error('Assign POST failed:', e))
              } catch (hookErr) {
                console.error('Failed to dispatch enrich/assign job:', hookErr)
              }
              return NextResponse.json({ source: 'brightdata', triggerResponse, snapshot: progressJson, result: resultJson })
            } catch (parseErr) {
              return NextResponse.json({ source: 'brightdata', triggerResponse, snapshot: progressJson, result_raw: bodyText })
            }
          } catch (downloadErr) {
            console.error('Failed to download snapshot:', downloadErr)
            return NextResponse.json({ error: 'Failed to download snapshot', details: String(downloadErr) }, { status: 502 })
          }
        }

        if (status === 'failed') {
          return NextResponse.json({ source: 'brightdata', triggerResponse, snapshot: progressJson, note: 'snapshot failed' }, { status: 502 })
        }
      } catch (pollErr) {
        console.error('Progress poll error:', pollErr)
      }

      // wait before next poll
      await new Promise((res) => setTimeout(res, pollIntervalMs))
    }

    // Timeout
    return NextResponse.json({ source: 'brightdata', triggerResponse, note: 'poll timeout, snapshot not ready' })
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err))
    console.error('BrightData request failed:', e)
    return NextResponse.json({ error: 'BrightData request failed', message: e.message, stack: e.stack }, { status: 502 })
  }

  // If Bright Data is not configured, return a clear error.
  console.error('Bright Data not configured. Set BRIGHTDATA_API_URL and BRIGHTDATA_API_TOKEN in .env')
  return NextResponse.json({ error: 'BrightData not configured' }, { status: 400 })
}
