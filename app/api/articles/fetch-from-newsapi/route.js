import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase.js'
import { createHash } from 'crypto'

// NewsAPI free tier: 100 requests/day, headlines only
// Docs: https://newsapi.org/docs/endpoints/everything

const NEWSAPI_KEY = process.env.NEWSAPI_KEY
const SEARCH_QUERY = '"République démocratique du Congo" OR "RD Congo" OR "Congo-Kinshasa" OR "Democratic Republic of the Congo" OR "DR Congo"'
const PAGE_SIZE = 20

async function fetchByLanguage(language) {
  const url = new URL('https://newsapi.org/v2/everything')
  url.searchParams.set('q', SEARCH_QUERY)
  url.searchParams.set('language', language)
  url.searchParams.set('sortBy', 'publishedAt')
  url.searchParams.set('pageSize', PAGE_SIZE)
  url.searchParams.set('apiKey', NEWSAPI_KEY)

  const res = await fetch(url.toString())
  const data = await res.json()
  if (data.status !== 'ok') throw new Error(data.message || `NewsAPI error (${language})`)
  return data.articles
}

export async function GET() {
  if (!NEWSAPI_KEY) {
    return NextResponse.json({ error: 'Missing NEWSAPI_KEY in .env' }, { status: 400 })
  }

  try {
    // Step 1: Fetch French and English articles in parallel (costs 2 requests)
    const [frArticles, enArticles] = await Promise.all([
      fetchByLanguage('fr'),
      fetchByLanguage('en'),
    ])

    const allArticles = [...frArticles, ...enArticles]

    // Step 2: Normalize articles to match our db schema
    const normalized = allArticles
      .filter(a => a.title && a.title !== '[Removed]')
      .map(a => ({
        id: `newsapi_${createHash('md5').update(a.url).digest('hex')}`,
        source: 'newsapi',
        name: a.source?.name || a.author || 'Unknown',
        description: a.description || a.title,
        title: a.title,
        url: a.url,
        external_image_urls: a.urlToImage ? [a.urlToImage] : null,
        profile_image_link: null,
        date_posted: a.publishedAt,
        videos: null,
      }))

    // Step 3: Upsert into Supabase (dedup handled by onConflict)
    const { error } = await supabase
      .from('articles')
      .upsert(normalized, { onConflict: 'id', ignoreDuplicates: true })

    if (error) throw new Error(error.message)

    return NextResponse.json({
      fetched: allArticles.length,
      saved: normalized.length,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
