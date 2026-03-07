import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const videoUrl = searchParams.get('url')

  if (!videoUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  if (!videoUrl.startsWith('https://video.twimg.com/')) {
    return NextResponse.json({ error: 'Only Twitter video URLs are allowed' }, { status: 403 })
  }

  try {
    // Forward the Range header from the browser so seeking works
    const rangeHeader = request.headers.get('range')

    const upstreamHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://twitter.com/',
    }
    if (rangeHeader) upstreamHeaders['Range'] = rangeHeader

    const response = await fetch(videoUrl, { headers: upstreamHeaders })

    if (!response.ok && response.status !== 206) {
      return NextResponse.json({ error: `Twitter CDN returned ${response.status}` }, { status: response.status })
    }

    const headers = new Headers()
    // Forward relevant headers back to the browser
    for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const val = response.headers.get(key)
      if (val) headers.set(key, val)
    }
    headers.set('Cache-Control', 'public, max-age=3600')

    return new Response(response.body, { status: response.status, headers })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
