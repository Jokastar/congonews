
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { readDB, writeDB } from '../lib/db.js'
import fs from 'fs/promises'
import path from 'path'

describe('db.js', () => {
  const tempPath = path.join(process.cwd(), '__tests__', 'db.temp.json')
  const sample = [
    { id: 'a', text: 'foo' },
    { id: 'b', text: 'bar' }
  ]

  beforeEach(async () => {
    await fs.writeFile(tempPath, JSON.stringify(sample, null, 2), 'utf8')
  })
  afterAll(async () => {
    await fs.unlink(tempPath).catch(() => {})
  })

  it('reads and writes db.json', async () => {
    // Patch DB_PATH in module
    const orig = process.cwd
    process.cwd = () => path.join(__dirname, '..', '__tests__')
    await writeDB(sample)
    const data = await readDB()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(2)
    expect(data[0].id).toBe('a')
    process.cwd = orig
  })
})
