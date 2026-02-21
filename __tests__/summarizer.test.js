import { describe, it, expect } from 'vitest'
import { summarizeByTheme } from '../lib/summarizer.js'
import { writeDB } from '../lib/db.js'

describe('summarizeByTheme', () => {
  it('generates a summary for each theme present in the DB', async () => {
    // Write mock data to DB
    const mock = [
      { id: '1', text: 'The president gave a speech about the government.', theme: 'politics' },
      { id: '2', text: 'The football team won the championship.', theme: 'sports' },
      { id: '3', text: 'Doctors are fighting malaria in the region.', theme: 'health' }
    ]
    await writeDB(mock)
    const summaries = await summarizeByTheme()
    expect(typeof summaries).toBe('object')
    const themes = Object.keys(summaries)
    expect(themes.length).toBeGreaterThan(0)
    for (const theme of themes) {
      expect(typeof summaries[theme]).toBe('string')
      expect(summaries[theme].length).toBeGreaterThan(0)
      console.log(`Summary for theme '${theme}':\n${summaries[theme]}`)
    }
  })
})
