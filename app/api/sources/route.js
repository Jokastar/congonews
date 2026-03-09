import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase.js'

// GET /api/sources — return all sources
export async function GET() {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/sources — add a new source
// Body: { url: string, start_date?: string, end_date?: string }
export async function POST(req) {
  const body = await req.json().catch(() => ({}))
  const { url, start_date = '', end_date = '' } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sources')
    .insert({ url: url.trim(), start_date, end_date })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
