"use client"
import { useState } from "react"

export default function EmbeddingAllTweetsButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleEmbedAll = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/themes/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dry: false }) // triggers embedding/classification for all in db.json
      })
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e.message || "Error embedding tweets")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleEmbedAll}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Embedding..." : "Embed All Tweets"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {result && result.updated !== undefined && (
        <div className="text-xs text-gray-500 mt-2">Embedded {result.updated} tweets.</div>
      )}
    </div>
  )
}
