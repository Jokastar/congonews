import { describe, it, expect } from 'vitest'
import { writeDB, readDB } from '../lib/db.js'
import { getEmbedding } from '../lib/embeddings.js'
import { THEMES } from '../lib/themes.js'

// Simple cosine similarity
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8)
}

async function assignTheme(item, centroids, threshold = 0.7) {
  let bestTheme = null, bestScore = -1
  for (const [theme, centroid] of Object.entries(centroids)) {
    const sim = cosineSim(item.embedding, centroid)
    if (sim > bestScore) {
      bestScore = sim
      bestTheme = theme
    }
  }
  if (bestScore >= threshold) return bestTheme
  return 'other'
}

describe('Embedding and theme assignment', () => {
  it('stores embedding and assigns theme for each item', async () => {
    // Prepare test items
    const items = [
      { id: '1', text: 'The president gave a speech about the government.' },
      { id: '2', text: 'The football team won the championship.' }
    ]
    // Generate embeddings
    for (const item of items) {
      item.embedding = await getEmbedding(item.text)
      expect(Array.isArray(item.embedding)).toBe(true)
      expect(item.embedding.length).toBeGreaterThan(0)
      console.log(`Embedding for '${item.text.slice(0, 30)}...':`, item.embedding.slice(0, 5), '...')
    }
    // Write to DB
    await writeDB(items)
    const db = await readDB()
    expect(db[0].embedding).toBeDefined()
    expect(db[1].embedding).toBeDefined()
    // Compute theme centroids
    const centroids = {}
    for (const theme of THEMES) {
      const embs = []
      for (const seed of theme.seeds.slice(0, 2)) {
        embs.push(await getEmbedding(seed))
      }
      centroids[theme.name] = embs[0].map((_, i) => embs.reduce((sum, v) => sum + v[i], 0) / embs.length)
    }
    // Assign themes
    for (const item of db) {
      item.theme = await assignTheme(item, centroids)
      expect(typeof item.theme).toBe('string')
      console.log(`Assigned theme for '${item.text.slice(0, 30)}...':`, item.theme)
      expect(['politics', 'sports', 'humanitarian', 'economy', 'health', 'other']).toContain(item.theme)
    }
  })
})
