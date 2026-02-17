// Embedding provider using local Next.js API route (Gemini official SDK)
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') throw new Error('No text provided for embedding')
  const res = await fetch(
    typeof window === 'undefined' ?
      'http://localhost:3000/api/embed' :
      '/api/embed',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  )
  if (!res.ok) throw new Error(`Gemini embedding failed: ${res.status}`)
  const json = await res.json()
  if (!json.embedding || !Array.isArray(json.embedding)) throw new Error('No embedding in Gemini response')
  return json.embedding
}
