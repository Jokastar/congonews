import { NextResponse } from 'next/server'
import { getEmbedding } from '../../../../lib/embeddings'
import { THEMES } from '../../../../lib/themes'
import { createClient } from '@supabase/supabase-js'

// Step 1: Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Step 2: Normalize vectors to match database dimension
function normalizeVectorDimensions(vector, targetDimensions) {
  if (!Array.isArray(vector)) return []
  if (vector.length === targetDimensions) return vector
  if (vector.length > targetDimensions) return vector.slice(0, targetDimensions)
  return [...vector, ...new Array(targetDimensions - vector.length).fill(0)]
}

// Step 3: Generate theme centroids by averaging seed embeddings
async function generateThemeCentroids(options = {}) {
  const {
    useMockMode = false,
    mockThemeName = 'politique',
    mockSeedWord = 'élection',
    databaseVectorDimensions = 1536,
  } = options

  const themesToProcess = useMockMode
    ? [{ name: mockThemeName, seeds: [mockSeedWord] }]
    : THEMES
  const embeddingModelName = process.env.EMBEDDING_MODEL || process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'

  const generatedCentroids = []

  for (const theme of themesToProcess) {
    console.log(`Generating centroid for theme: ${theme.name}`)
    
    const seedEmbeddings = []
    
    // Step 3.1: Embed each seed word
    for (const seedWord of theme.seeds) {
      try {
        const embedding = await getEmbedding(seedWord)
        seedEmbeddings.push(embedding)
      } catch (embedError) {
        console.warn(`Failed to embed seed word "${seedWord}" for theme "${theme.name}":`, embedError.message)
      }
    }

    if (seedEmbeddings.length === 0) {
      console.warn(`No valid embeddings for theme "${theme.name}"`)
      continue
    }

    // Step 3.2: Calculate average embedding (centroid)
    const centroidVector = seedEmbeddings[0].map(
      (_, dimensionIndex) =>
        seedEmbeddings.reduce((sum, embedding) => sum + embedding[dimensionIndex], 0) / seedEmbeddings.length
    )

    const normalizedCentroidVector = normalizeVectorDimensions(centroidVector, databaseVectorDimensions)

    generatedCentroids.push({
      theme_name: theme.name,
      centroid_vector: normalizedCentroidVector,
      seed_count: seedEmbeddings.length,
      embedding_model: embeddingModelName,
      embedding_dimensions: normalizedCentroidVector.length,
      computed_at: new Date().toISOString()
    })
  }

  return generatedCentroids
}

// Step 4: Store centroids in Supabase
async function storeCentroidsInSupabase(centroids) {
  const { data, error } = await supabase
    .from('theme_centroids')
    .upsert(centroids, { onConflict: 'theme_name' })
    .select()

  if (error) {
    throw new Error(`Failed to store centroids in Supabase: ${error.message}`)
  }

  return data
}

export async function POST(req) {
  try {
    // Step 5: Parse request options (full mode defaults to true)
    const requestBody = await req.json().catch(() => ({}))
    const useMockMode = requestBody.mock === true
    const mockThemeName = requestBody.mockThemeName || 'politique'
    const mockSeedWord = requestBody.mockSeedWord || 'élection'
    const databaseVectorDimensions = parseInt(process.env.THEME_CENTROID_DB_DIMENSIONS || '1536', 10)

    // Step 6: Generate centroids
    console.log('Starting centroid generation...', { useMockMode, mockThemeName, mockSeedWord, databaseVectorDimensions })
    const generatedCentroids = await generateThemeCentroids({
      useMockMode,
      mockThemeName,
      mockSeedWord,
      databaseVectorDimensions,
    })

    if (generatedCentroids.length === 0) {
      return NextResponse.json(
        { error: 'No centroids were generated' },
        { status: 400 }
      )
    }

    // Step 7: Store in Supabase
    console.log(`Storing ${generatedCentroids.length} centroids in Supabase...`)
    const storedCentroids = await storeCentroidsInSupabase(generatedCentroids)

    // Step 8: Return success response
    return NextResponse.json({
      success: true,
      message: `Successfully generated and stored ${storedCentroids.length} theme centroids`,
      mode: useMockMode ? 'mock' : 'full',
      centroids: storedCentroids,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Centroid generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate centroids' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    info: 'POST to generate and store theme centroids for article classification'
  })
}
