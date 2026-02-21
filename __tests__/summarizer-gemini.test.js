import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { summarizeByThemeAndStore } from '../lib/summarizer.js'
import { writeDB, readDB } from '../lib/db.js'

describe('summarizeByThemeAndStore', () => {
  it('generates and stores Gemini summaries for each theme', async () => {
    // Write mock data to DB
    const mock = [
      { id: '1', text: 'The president gave a speech about the government.', theme: 'politics' },
      { id: '2', text: 'The football team won the championship.', theme: 'sports' },
      { id: '3', text: 'Doctors are fighting malaria in the region.', theme: 'health' }
    ]
    await writeDB(mock)
    const summaries = await summarizeByThemeAndStore()
    expect(Array.isArray(summaries)).toBe(true)
    expect(summaries.length).toBeGreaterThan(0)
    for (const s of summaries) {
      expect(typeof s.theme).toBe('string')
      expect(typeof s.summary).toBe('string')
      expect(typeof s.thoughts).toBe('string')
      expect(Array.isArray(s.sourceIds)).toBe(true)
      console.log(`\n---\nTheme: ${s.theme}\nSummary: ${s.summary}\nThoughts: ${s.thoughts}\nSources: ${s.sourceIds.join(', ')}`)
    }
    // Check DB contains the new summaries
    const db = await readDB()
    const summaryEntries = db.filter(x => x.type === 'theme_summary')
    expect(summaryEntries.length).toBe(summaries.length)
  }, 30000)
})
