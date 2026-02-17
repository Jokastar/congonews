import { scrapeArticle } from '../../../lib/articleScraper'
import { readDB, writeDB } from '../../../lib/db'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const tweet = body.tweet || body

    if (!tweet || typeof tweet !== 'object') {
      return NextResponse.json({ error: 'Missing tweet object in body' }, { status: 400 })
    }

    const result = { ...tweet }

    if (tweet.external_url) {
      try {
        const article = await scrapeArticle(tweet.external_url)
        result.article = article
      } catch (err) {
        result.article = { error: String(err) }
      }
    }

    // persist: append or replace by id if available
    const db = await readDB()
    if (tweet.id) {
      const idx = db.findIndex((r) => r.id === tweet.id)
      if (idx >= 0) db[idx] = { ...db[idx], ...result }
      else db.push(result)
    } else {
      db.push(result)
    }
    await writeDB(db)

    return NextResponse.json({ saved: result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const db = await readDB()
    return NextResponse.json({ items: db })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
