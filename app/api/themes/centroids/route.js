import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase.js'
import { getEmbedding } from '../../../../lib/embeddings'
import { THEMES } from '../../../../lib/themes'

// GET /api/themes/centroids — list all stored theme centroids
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('theme_centroids')
      .select('theme_name, seed_count, embedding_model, embedding_dimensions, computed_at')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ count: data?.length || 0, centroids: data || [] })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/themes/centroids — (re)generate and store theme centroids
// Body (optional): { mock?: boolean, mockThemeName?: string, mockSeedWord?: string }
export async function POST(req) {
  try {
    const requestBody = await req.json().catch(() => ({}))
    const useMockMode = requestBody.mock === true
    const mockThemeName = requestBody.mockThemeName || 'politique'
    const mockSeedWord = requestBody.mockSeedWord || 'élection'
    const databaseVectorDimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10)
    const embeddingModelName = process.env.EMBEDDING_MODEL || process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'

    const themesToProcess = useMockMode
      ? [{ name: mockThemeName, seeds: [mockSeedWord] }]
      : THEMES

    const generatedCentroids = []

    for (const theme of themesToProcess) {
      console.log(`Generating centroid for theme: ${theme.name}`)
      const seedEmbeddings = []

      for (const seedWord of theme.seeds) {
        try {
          seedEmbeddings.push(await getEmbedding(seedWord))
        } catch (e) {
          console.warn(`Failed to embed seed "${seedWord}" for theme "${theme.name}":`, e.message)
        }
      }

      if (seedEmbeddings.length === 0) continue

      const centroidVector = seedEmbeddings[0].map(
        (_, i) => seedEmbeddings.reduce((sum, emb) => sum + emb[i], 0) / seedEmbeddings.length
      )

      const normalized = centroidVector.length === databaseVectorDimensions
        ? centroidVector
        : centroidVector.length > databaseVectorDimensions
          ? centroidVector.slice(0, databaseVectorDimensions)
          : [...centroidVector, ...new Array(databaseVectorDimensions - centroidVector.length).fill(0)]

      generatedCentroids.push({
        theme_name: theme.name,
        centroid_vector: normalized,
        seed_count: seedEmbeddings.length,
        embedding_model: embeddingModelName,
        embedding_dimensions: normalized.length,
        computed_at: new Date().toISOString(),
      })
    }

    if (generatedCentroids.length === 0) {
      return NextResponse.json({ error: 'No centroids were generated' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('theme_centroids')
      .upsert(generatedCentroids, { onConflict: 'theme_name' })
      .select()

    if (error) throw new Error(`Failed to store centroids: ${error.message}`)

    return NextResponse.json({
      success: true,
      message: `Generated and stored ${data.length} theme centroids`,
      mode: useMockMode ? 'mock' : 'full',
      centroids: data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
