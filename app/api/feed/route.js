import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'

// GET /api/feed — return all tweets + articles merged
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')
  const rangeFrom = (page - 1) * limit
  const rangeTo = rangeFrom + limit - 1

  const [{ data: articles, error: e1 }, { data: tweets, error: e2 }] = await Promise.all([
    supabase.from('articles').select('*').order('date_posted', { ascending: false }).range(rangeFrom, rangeTo),
    supabase.from('tweets').select('*').order('date_posted', { ascending: false }).range(rangeFrom, rangeTo),
  ])
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })
  const all = [...(articles ?? []), ...(tweets ?? [])]
  // hasMore is true if either table returned a full page — means there could be more rows
  const hasMore = (articles?.length ?? 0) === limit || (tweets?.length ?? 0) === limit
  return NextResponse.json({ items: all, hasMore })
}

// DELETE /api/feed — wipe all tweets + articles
export async function DELETE() {
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from('articles').delete().neq('id', ''),
    supabase.from('tweets').delete().neq('id', ''),
  ])
  if (e1) return NextResponse.json({ ok: false, error: e1.message }, { status: 500 })
  if (e2) return NextResponse.json({ ok: false, error: e2.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Feed cleared' })
}
