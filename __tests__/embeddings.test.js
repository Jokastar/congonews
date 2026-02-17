
import { describe, it, expect } from 'vitest'
import { getEmbedding } from '../lib/embeddings.js'

describe('getEmbedding (Google Gemini)', () => {
  it('returns a vector for a simple string', async () => {
    const text = 'This is a test sentence.'
    const emb = await getEmbedding(text)
    expect(Array.isArray(emb)).toBe(true)
    expect(emb.length).toBeGreaterThan(0)
    expect(typeof emb[0]).toBe('number')
  })

  it('returns different vectors for different texts', async () => {
    const emb1 = await getEmbedding('politics')
    const emb2 = await getEmbedding('sports')
    expect(emb1).not.toEqual(emb2)
  })
})
