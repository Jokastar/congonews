import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { writeDB } from '../lib/db.js'
import { composeDailyDigest } from '../lib/digest.js'

describe('composeDailyDigest', () => {
  it('generates a daily digest from theme summaries', async () => {
    // Write mock theme summaries to DB
    const mock = [
      {
        id: 'summary:politics',
        type: 'theme_summary',
        theme: 'politics',
        summary: 'The president addressed the nation about government operations.',
        thoughts: 'Summarized as a journalist.',
        sourceIds: ['1']
      },
      {
        id: 'summary:sports',
        type: 'theme_summary',
        theme: 'sports',
        summary: 'The football team won the championship.',
        thoughts: 'Summarized as a journalist.',
        sourceIds: ['2']
      }
    ]
    await writeDB(mock)
    const digest = await composeDailyDigest()
    expect(typeof digest).toBe('string')
    expect(digest.length).toBeGreaterThan(0)
    console.log('\n---\nDAILY DIGEST:\n' + digest)
  }, 30000)
})
