import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../lib/db.js'

export async function DELETE() {
  // Remove all news data (except theme summaries if you want to keep them)
  await writeDB([])
  return NextResponse.json({ ok: true })
}

export async function GET() {
  // Return all news items (not summaries)
  const db = await readDB()
  console.log("GET /api/news - total items in DB:", db.length); 
  console.log("GET /api/news - returning items:", db.length);
  return NextResponse.json(db)
}
