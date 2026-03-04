import { NextResponse } from 'next/server'
import { getEmbedding } from '../../../../lib/embeddings.js'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const text = body?.text

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 })
    }

    const embedding = await getEmbedding(text)
    return NextResponse.json({ embedding })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Failed to generate embedding' }, { status: 500 })
  }
}
