import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase.js'

// GET /api/sources/[id] — get a single source
export async function GET(req, { params }) {
  const { id } = await params

  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/sources/[id] — update a source
// Body: { url?, start_date?, end_date?, active? }
export async function PATCH(req, { params }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const allowed = ['url', 'start_date', 'end_date', 'active']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  )

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sources')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/sources/[id] — delete a source
export async function DELETE(req, { params }) {
  const { id } = await params

  const { error } = await supabase
    .from('sources')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
