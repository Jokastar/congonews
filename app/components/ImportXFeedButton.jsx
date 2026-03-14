"use client"
import { useState } from "react"
import { useFeed } from "../context/FeedContext"

export default function ImportXFeedButton() {
  const { fetchAndEnrichNews, loading, error } = useFeed()
  const [result, setResult] = useState(null)

  const handleImport = async () => {
    try {
      const data = await fetchAndEnrichNews()
      setResult(data)
    } catch (e) {
      console.error("Error:", e)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleImport}
        className="text-sm text-white px-6 py-2.5 rounded-full disabled:opacity-50 cursor-pointer"
        style={{ backgroundImage: 'linear-gradient(90deg, #444444 6%, #111116 48%)' }}
        disabled={loading}
      >
        {loading ? "Importing & Enriching..." : "Import from X"}
      </button>
      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      {result && (
        <div className="text-xs text-gray-600 mt-2">
          <p>✓ Imported {result.scrapeData?.saved || 0} new tweets</p>
          <p>✓ Generated embeddings for {result.enrichData?.enrichedCount || 0} items</p>
          <p>✓ Classified {result.classifyData?.updated || 0} items by theme</p>
        </div>
      )}
    </div>
  )
}
