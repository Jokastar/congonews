import { promises as fs } from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'db.json')

export async function readDB() {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8')
    return JSON.parse(raw || '[]')
  } catch (err) {
    if (err.code === 'ENOENT') return []
    throw err
  }
}

export async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}
