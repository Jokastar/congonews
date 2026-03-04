"use client"
import { useState } from "react"
import { useArticles } from "../context/ArticleContext"

export default function NewsFetcher() {
  const { fetchAndEnrichNews, loading, error } = useArticles()
  const [result, setResult] = useState(null)

  const handleFetchNews = async () => {
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
        onClick={handleFetchNews}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 hover:bg-green-700"
        disabled={loading}
      >
        {loading ? "Fetching & Enriching..." : "Fetch Latest News"}
      </button>
      {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      {result && (
        <div className="text-xs text-gray-600 mt-2">
          <p>✓ Scraped {result.scrapeData?.saved || 0} new articles</p>
          <p>✓ Generated embeddings for {result.enrichData?.enrichedCount || 0} articles</p>
          <p>✓ Assigned themes for {result.classifyData?.updated || 0} tweets</p>
        </div>
      )}
    </div>
  )
}
