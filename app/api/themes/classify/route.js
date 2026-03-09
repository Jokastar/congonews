import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase.js'

// POST /api/themes/classify
// Uses Gemini to classify articles and tweets by theme.
// Body (optional): { reclassify?: boolean }  — if true, reclassifies items that already have a theme

const THEMES = ['politique', 'economie', 'art', 'culture', 'sport', 'fait_divers']

const THEME_DESCRIPTIONS = {
  politique: 'Politique, diplomatie, gouvernement, conflits armés, élections, sécurité nationale, relations internationales, armée',
  economie: 'Économie, mines, commerce, finance, infrastructure, agriculture, investissement, emploi, monnaie',
  art: 'Beaux-arts, musique, cinéma, littérature, mode, gastronomie, spectacles, médias, divertissement',
  culture: 'Culture, patrimoine culturel, traditions, coutumes, identité culturelle, langue, religion, événements culturels',
  sport: 'Sport, football, basketball, athlétisme, sports de combat, compétitions sportives, équipes nationales, jeux africains',
  fait_divers: 'Faits divers, accidents, crimes, santé publique, météo, catastrophes, vie quotidienne, éducation',
}

const SYSTEM_INSTRUCTION = `Tu es un classificateur spécialisé d'articles de presse sur la République Démocratique du Congo.
Tu reçois le titre et/ou la description d'un article et tu dois le classer dans exactement UN des thèmes suivants :
- politique : ${THEME_DESCRIPTIONS.politique}
- economie : ${THEME_DESCRIPTIONS.economie}
- art : ${THEME_DESCRIPTIONS.art}
- culture : ${THEME_DESCRIPTIONS.culture}
- sport : ${THEME_DESCRIPTIONS.sport}
- fait_divers : ${THEME_DESCRIPTIONS.fait_divers}

Règles strictes :
1. Réponds avec UN SEUL mot parmi : politique, economie, art, culture, sport, fait_divers, null
2. Réponds "null" uniquement si l'article ne concerne absolument pas la RDC ou ne rentre dans aucun thème
3. Aucune explication, aucune ponctuation, aucun autre mot`

async function classifyWithGemini(title, description) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY')

  const text = [title, description].filter(Boolean).join('\n').slice(0, 1000)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ parts: [{ text: text }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini classify failed: ${res.status} ${err}`)
  }

  const json = await res.json()
  const answer = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase().replace(/[^a-z_]/g, '') ?? ''
  return THEMES.includes(answer) ? answer : null
}

export async function POST(req) {
  try {
    const { reclassify = false } = await req.json().catch(() => ({}))

    // Fetch items — only unclassified by default, all if reclassify=true
    const applyFilter = (q) => reclassify ? q : q.is('theme', null)

    const [{ data: articles, error: e1 }, { data: tweets, error: e2 }] = await Promise.all([
      applyFilter(supabase.from('articles').select('id, title, description')),
      applyFilter(supabase.from('tweets').select('id, description')),
    ])
    if (e1) throw new Error(e1.message)
    if (e2) throw new Error(e2.message)

    const allItems = [
      ...(articles ?? []).map(r => ({ ...r, _table: 'articles' })),
      ...(tweets ?? []).map(r => ({ ...r, _table: 'tweets' })),
    ].filter(item => item.title || item.description)

    if (allItems.length === 0) {
      // Still clean up any pre-existing nulls
      const [{ count: delA }, { count: delT }] = await Promise.all([
        supabase.from('articles').delete({ count: 'exact' }).is('theme', null),
        supabase.from('tweets').delete({ count: 'exact' }).is('theme', null),
      ])
      return NextResponse.json({ updated: 0, deleted: (delA ?? 0) + (delT ?? 0), note: 'No items to classify' })
    }

    let updated = 0
    let failed = 0

    // Process in batches of 5 to respect rate limits
    const BATCH_SIZE = 5
    for (let i = 0; i < allItems.length; i += BATCH_SIZE) {
      const batch = allItems.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(async (item) => {
        try {
          const theme = await classifyWithGemini(item.title, item.description)
          const { error } = await supabase
            .from(item._table)
            .update({ theme })
            .eq('id', item.id)
          if (error) { console.error(`Update failed for ${item.id}:`, error.message); failed++; return }
          updated++
        } catch (err) {
          console.error(`Classify failed for ${item.id}:`, err.message)
          failed++
        }
      }))
    }

    // Delete all items still without a theme (not about DRC or unclassifiable)
    const [{ count: delA, error: dA }, { count: delT, error: dT }] = await Promise.all([
      supabase.from('articles').delete({ count: 'exact' }).is('theme', null),
      supabase.from('tweets').delete({ count: 'exact' }).is('theme', null),
    ])
    if (dA) console.error('Delete null articles error:', dA.message)
    if (dT) console.error('Delete null tweets error:', dT.message)
    const deleted = (delA ?? 0) + (delT ?? 0)

    return NextResponse.json({ updated, failed, deleted, total: allItems.length })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ info: 'POST to classify all feed items by theme using Gemini.' })
}
