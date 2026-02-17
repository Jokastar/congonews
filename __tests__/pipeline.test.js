
import { describe, it, expect } from 'vitest'
import { getEmbedding } from '../lib/embeddings.js'
import { THEMES } from '../lib/themes.js'

// Cosine similarity for test
function cosineSim(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8)
}

describe('embedding + theming pipeline', () => {
  it('assigns a theme to a real text', async () => {
    const text = 'The president announced a new policy for the government.'
    const emb = await getEmbedding(text)
    expect(Array.isArray(emb)).toBe(true)
    // Compute theme centroids
    const centroids = {}
    for (const theme of THEMES) {
      const embs = []
      for (const seed of theme.seeds.slice(0, 2)) {
        embs.push(await getEmbedding(seed))
      }
      centroids[theme.name] = embs[0].map((_, i) => embs.reduce((sum, v) => sum + v[i], 0) / embs.length)
    }
    // Find best theme
    let bestTheme = null, bestScore = -1
    for (const [theme, centroid] of Object.entries(centroids)) {
      const sim = cosineSim(emb, centroid)
      if (sim > bestScore) {
        bestScore = sim
        bestTheme = theme
      }
    }
    expect(typeof bestTheme).toBe('string')
    expect(bestScore).toBeGreaterThan(0.5)
  })
})
