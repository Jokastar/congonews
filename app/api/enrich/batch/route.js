import { NextResponse } from 'next/server'
import { enrichItems } from '../../../../lib/enricher'

export async function POST(request) {
  try {
    const body = await request.json()
    const items = body.items || body.result || body || []
    const concurrency = parseInt(process.env.ENRICH_CONCURRENCY || '4', 10)

    if (!Array.isArray(items)) return NextResponse.json({ error: 'Expected items array' }, { status: 400 })

    const { summary, results } = await enrichItems(items, { concurrency })
    return NextResponse.json({ summary, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ info: 'POST snapshot JSON to this endpoint as { items: [...] } to enrich and persist.' })
}
