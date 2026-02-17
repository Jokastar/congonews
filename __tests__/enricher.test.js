
import { describe, it, expect } from 'vitest'
import { enrichItems } from '../lib/enricher.js'

global.fetch = async (url) => {
  // Mock for scrapeArticle: always return same article
  if (url.includes('example.com')) {
    return {
      ok: true,
      text: async () => '<html><head><title>Test</title></head><body><article><h1>Test</h1><p>Text</p></article></body></html>'
    }
  }
  throw new Error('fetch mock: only example.com supported')
}

describe('enrichItems', () => {
  it('enriches items with article data', async () => {
    const items = [
      { id: '1', external_url: 'https://example.com/' },
      { id: '2', external_url: 'https://example.com/' }
    ]
    const { results } = await enrichItems(items, { concurrency: 2 })
    expect(results[0].article).toBeDefined()
    expect(results[0].article.title).toMatch(/Test/)
  })
})
