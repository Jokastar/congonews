import 'dotenv/config'
import { describe, it, expect } from 'vitest'
import { composeDailyDigest } from '../lib/digest.js'

describe('composeDailyDigest', () => {
  it('generates a daily digest from theme summaries', async () => {
    // composeDailyDigest reads theme summaries directly from Supabase
    const digest = await composeDailyDigest()
    expect(typeof digest).toBe('string')
    expect(digest.length).toBeGreaterThan(0)
    console.log('\n---\nDAILY DIGEST:\n' + digest)
  }, 30000)
})
