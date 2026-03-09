import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'

// GET /api/feed — return all tweets + articles merged
export async function GET() {
  const [{ data: articles, error: e1 }, { data: tweets, error: e2 }] = await Promise.all([
    supabase.from('articles').select('*'),
    supabase.from('tweets').select('*'),
  ])
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
  const all = [...(articles ?? []), ...(tweets ?? [])]
  console.log('GET /api/feed - total items:', all.length)
  return NextResponse.json(all)
}

// DELETE /api/feed — wipe all tweets + articles
export async function DELETE() {
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('articles').delete().neq('id', ''),
    supabase.from('tweets').delete().neq('id', ''),
  ])
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
