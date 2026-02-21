import { scrapeArticle } from './articleScraper'
import { readDB, writeDB } from './db'
import { mapWithConcurrency } from './pool'
import cleanText from './cleanText.js'

export async function enrichItems(items, options = {}) {
  const concurrency = options.concurrency || 4
  const toProcess = Array.isArray(items) ? items : []
  const backoffMs = parseInt(process.env.ENRICH_BACKOFF_MS || '2000', 10)

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

  const results = await mapWithConcurrency(toProcess, async (tweet) => {
    const out = { ...tweet }
    if (tweet && tweet.external_url) {
      try {
        const article = await scrapeArticle(tweet.external_url)
        if (article && typeof article.text === 'string') {
          article.text = cleanText(article.text) // Keep this line as it is in enricher.js
        }
        out.article = article
      } catch (err) {
        // On failure: record the error and wait a short backoff before continuing.
        out.article = { error: String(err) }
        try {
          await sleep(backoffMs)
        } catch (e) {
          // ignore
        }
      }
    }
    return out
  }, concurrency)

  // Filter out items with errors
  const filteredResults = results.filter(item => !item.error && !item.error_code);

  // Merge into DB: replace by id if available, otherwise append
  const db = await readDB()
  for (const item of filteredResults) {
    if (!item || typeof item !== 'object') continue
    if (item.id) {
      const idx = db.findIndex((r) => r.id === item.id)
      if (idx >= 0) db[idx] = { ...db[idx], ...item }
      else db.push(item)
    } else {
      db.push(item)
    }
  }

  await writeDB(db)

  const summary = {
    processed: results.length,
    errors: results.filter((r) => r && r.article && r.article.error).length,
  }
  return { summary, results }
}
