import { JSDOM, VirtualConsole } from 'jsdom'
import { Readability } from '@mozilla/readability'

export async function scrapeArticle(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Congonews/1.0)'
    }
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const html = await res.text()
  // Create a VirtualConsole to filter noisy JSDOM warnings (e.g. CSS parse warnings)
  const virtualConsole = new VirtualConsole()
  virtualConsole.on('warn', (msg) => {
    if (String(msg).includes('Could not parse CSS stylesheet')) return
    console.warn('[jsdom]', msg)
  })
  virtualConsole.on('error', (err) => {
    if (String(err).includes('Could not parse CSS stylesheet')) return
    console.error('[jsdom]', err)
  })

  const dom = new JSDOM(html, { url, virtualConsole })
  const doc = dom.window.document
  const reader = new Readability(doc)
  const article = reader.parse()

  // Try to find published date from common meta tags if Readability doesn't provide it
  let published_at = null
  const metaKeys = ['article:published_time', 'pubdate', 'publication_date', 'date', 'ptime', 'og:article:published_time']
  for (const key of metaKeys) {
    const m = doc.querySelector(`meta[property="${key}"], meta[name="${key}"]`)
    if (m && m.content) {
      published_at = m.content
      break
    }
  }

  const top_image = article?.lead_image_url || null
  const title = article?.title || null
  const text = article?.textContent || null
  const authors = article?.byline ? [article.byline] : []

  return {
    title,
    text,
    top_image,
    published_at,
    authors,
  }
}
