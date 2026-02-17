
import { describe, it, expect } from 'vitest'
import { THEMES, THEME_NAMES } from '../lib/themes.js'

describe('themes.js', () => {
  it('exports theme names and seeds', () => {
    expect(Array.isArray(THEMES)).toBe(true)
    expect(THEMES.length).toBeGreaterThan(0)
    for (const theme of THEMES) {
      expect(typeof theme.name).toBe('string')
      expect(Array.isArray(theme.seeds)).toBe(true)
    }
    expect(Array.isArray(THEME_NAMES)).toBe(true)
    expect(THEME_NAMES.length).toBe(THEMES.length)
  })
})
