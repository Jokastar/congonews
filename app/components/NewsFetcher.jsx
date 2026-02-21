"use client"
import { useState } from "react"

export default function NewsFetcher({ onFetched }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const fetchNews = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/scrape")
      const data = await res.json()
      setResult(data)
      if (onFetched) onFetched(data)
    } catch (e) {
      setError(e.message || "Error fetching news")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={fetchNews}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Fetching..." : "Fetch Latest News"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {result && result.result && (
        <div className="text-xs text-gray-500 mt-2">Fetched {Array.isArray(result.result) ? result.result.length : 1} items.</div>
      )}
    </div>
  )
}
