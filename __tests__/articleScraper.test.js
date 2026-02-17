
import { describe, it, expect } from 'vitest'
import { scrapeArticle } from '../lib/articleScraper.js'

global.fetch = async (url) => {
  if (url.includes('example.com')) {
    return {
      ok: true,
      text: async () => '<html><head><title>Example Domain</title></head><body><article><h1>Example Domain</h1><p>This is a test.</p></article></body></html>'
    }
  }
  throw new Error('fetch mock: only example.com supported')
}

describe('scrapeArticle', () => {
  it('extracts title and text from a simple HTML', async () => {
    const url = 'https://example.com/'
    const result = await scrapeArticle(url)
    expect(result.title).toMatch(/Example Domain/)
    expect(typeof result.text).toBe('string')
  })

  it('throws on fetch error', async () => {
    await expect(scrapeArticle('https://fail.com/')).rejects.toThrow()
  })
})
