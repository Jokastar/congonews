import { NextResponse } from 'next/server'
import { readDB, writeDB } from '../../../../lib/db'
import { getEmbedding } from '../../../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'

// Step 1: Calculate cosine similarity between two embedding vectors
function cosineSim(vectorA, vectorB) {
  let dotProduct = 0, magnitudeA = 0, magnitudeB = 0
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i]
    magnitudeA += vectorA[i] * vectorA[i]
    magnitudeB += vectorB[i] * vectorB[i]
  }
  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) + 1e-8)
}

// Step 2: Parse pgvector values returned by Supabase
function parseVectorValue(vectorValue) {
  if (Array.isArray(vectorValue)) return vectorValue
  if (typeof vectorValue !== 'string') return []

  const trimmedValue = vectorValue.trim()
  if (!trimmedValue.startsWith('[') || !trimmedValue.endsWith(']')) return []

  return trimmedValue
    .slice(1, -1)
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value))
}

// Step 3: Normalize vector dimensions to match centroid length
function normalizeVectorDimensions(vector, targetDimensions) {
  if (!Array.isArray(vector)) return []
  if (vector.length === targetDimensions) return vector
  if (vector.length > targetDimensions) return vector.slice(0, targetDimensions)
  return [...vector, ...new Array(targetDimensions - vector.length).fill(0)]
}

// Step 4: Initialize Supabase client from environment variables
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

// Step 5: Load theme centroids from Supabase table
async function getThemeCentroidsFromSupabase() {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('theme_centroids')
    .select('theme_name, centroid_vector, embedding_dimensions')

  if (error) {
    throw new Error(`Failed to load centroids from Supabase: ${error.message}`)
  }

  const themeCentroids = {}
  for (const row of data || []) {
    const parsedCentroidVector = parseVectorValue(row.centroid_vector)
    const expectedDimensions = Number.isFinite(row.embedding_dimensions)
      ? row.embedding_dimensions
      : parsedCentroidVector.length

    if (!parsedCentroidVector.length) continue
    themeCentroids[row.theme_name] = normalizeVectorDimensions(parsedCentroidVector, expectedDimensions)
  }

  return themeCentroids
}

export async function POST(req) {
  try {
    // Step 6: Parse request body
    const requestBody = await req.json().catch(() => ({}))
    
    // Step 7: Get items from request body or load from database
    let itemsToProcess = requestBody.items
    if (!Array.isArray(itemsToProcess)) {
      itemsToProcess = await readDB()
    }
    
    // Step 8: Filter items that have content (description or article text)
    itemsToProcess = itemsToProcess.filter(
      (item) => item && (item.description || (item.article && item.article.text))
    )
    
    // Step 9: Load precomputed centroids from Supabase
    const themeCentroids = await getThemeCentroidsFromSupabase()
    if (!Object.keys(themeCentroids).length) {
      return NextResponse.json({ error: 'No centroids found in Supabase table theme_centroids' }, { status: 400 })
    }

    const similarityThreshold = parseFloat(process.env.THEME_SIMILARITY_THRESHOLD || '0.65')
    
    // Step 10: Process each item to compute embeddings and assign themes
    let processedCount = 0
    for (const item of itemsToProcess) {
      // Step 10.1: Extract tweet description text
      const tweetDescription = item.description
      if (!tweetDescription) continue
      
      // Step 10.2: Generate embedding for tweet text
      try {
        item.embedding = await getEmbedding(tweetDescription)
      } catch (embeddingError) {
        item.theme = 'embedding_error'
        delete item.theme_scores
        continue
      }
      
      // Step 10.3: Find best matching theme by highest similarity score
      let bestMatchingTheme = null
      let bestSimilarityScore = -1
      const themeScores = {}
      
      for (const [themeName, themeCentroid] of Object.entries(themeCentroids)) {
        const normalizedItemEmbedding = normalizeVectorDimensions(item.embedding, themeCentroid.length)
        const similarityScore = cosineSim(normalizedItemEmbedding, themeCentroid)
        themeScores[themeName] = similarityScore
        
        if (similarityScore > bestSimilarityScore) {
          bestSimilarityScore = similarityScore
          bestMatchingTheme = themeName
        }
      }
      
      // Step 10.4: Assign theme only if similarity meets threshold
      if (bestSimilarityScore >= similarityThreshold) {
        item.theme = bestMatchingTheme
      } else {
        delete item.theme
      }
      item.theme_scores = themeScores
      processedCount++
    }
    
    // Step 11: Save updated items back to database (unless dry run requested)
    if (!requestBody.dry) {
      await writeDB(itemsToProcess)
    }
    
    // Step 12: Return results with count of processed items
    return NextResponse.json({ updated: processedCount, items: itemsToProcess })
  } catch (error) {
    // Step 13: Handle any unexpected errors
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  // Step 14: Return API documentation for GET requests
  return NextResponse.json({ 
    info: 'POST to classify articles by theme. Themes are assigned using centroids from Supabase.' 
  })
}
