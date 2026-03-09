export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('No text provided for embedding')
  }

  const apiKey = process.env.GEMINI_API_KEY
  const modelName = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY')
  }

  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/gemini-embedding-001",
      content: {
        parts: [{ text }]
      }
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Gemini embedding failed: ${res.status} ${errorBody}`)
  }

  const json = await res.json()
  const embedding = json?.embedding?.values ?? json?.embedding

  if (!Array.isArray(embedding)) {
    throw new Error('No embedding in Gemini response')
  }

  // Truncate to configured dimensions (default 1536) to match the DB VECTOR column
  const targetDims = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536', 10)
  return embedding.length > targetDims ? embedding.slice(0, targetDims) : embedding
}
