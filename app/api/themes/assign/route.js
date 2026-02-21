import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../lib/db'
import { getEmbedding } from '../../../../lib/embeddings'
import { THEMES } from '../../../../lib/themes'

// Cosine similarity between two vectors
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8)
}

// Compute theme centroids (average embedding of seed words)
async function getThemeCentroids() {
  const centroids = {}
  for (const theme of THEMES) {
    const embs = []
    for (const seed of theme.seeds) {
      try {
        const emb = await getEmbedding(seed)
        embs.push(emb)
      } catch (e) {}
    }
    if (embs.length) {
      // Average
      const avg = embs[0].map((_, i) => embs.reduce((sum, v) => sum + v[i], 0) / embs.length)
      centroids[theme.name] = avg
    }
  }
  return centroids
}

export async function POST(req) {
  try {
    const body = await req.json()
    // If items provided, use them; else use db.json
    let items = body.items
    if (!Array.isArray(items)) {
      items = await readDB()
    }
    // Only process items with tweet description or article text
    items = items.filter(x => x && (x.description || (x.article && x.article.text)))
    // Compute centroids
    const centroids = await getThemeCentroids()
    const threshold = parseFloat(process.env.THEME_SIMILARITY_THRESHOLD || '0.5')
    let updated = 0
    for (const item of items) {
      // Only embed the description field (tweet text)
      const tweetText = item.description
      if (!tweetText) continue
      // Always recompute embedding for all items (as requested)
      try {
        item.embedding = await getEmbedding(tweetText)
      } catch (e) {
        item.theme = 'embedding_error'
        delete item.theme_scores
        continue
      }
      // Assign theme by max similarity
      let bestTheme = null, bestScore = -1
      for (const [theme, centroid] of Object.entries(centroids)) {
        const sim = cosineSim(item.embedding, centroid)
        if (sim > bestScore) {
          bestScore = sim
          bestTheme = theme
        }
      }
      if (bestScore >= threshold) {
        item.theme = bestTheme
      } else {
        delete item.theme
      }
      delete item.theme_scores
      updated++
    }
    // Save back to db.json if not just a dry run
    if (!body.dry) await writeDB(items)
    return NextResponse.json({ updated, items })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ info: 'POST to this endpoint with {items: [...]}, or empty body to process db.json.' })
}
