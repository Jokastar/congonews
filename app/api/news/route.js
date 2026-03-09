import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'

export async function DELETE() {
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('articles').delete().neq('id', ''),
    supabase.from('tweets').delete().neq('id', ''),
  ])
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const [{ data: articles, error: e1 }, { data: tweets, error: e2 }] = await Promise.all([
    supabase.from('articles').select('*'),
    supabase.from('tweets').select('*'),
  ])
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
  const all = [...(articles ?? []), ...(tweets ?? [])]
  console.log('GET /api/news - total items in DB:', all.length)
  return NextResponse.json(all)
}
