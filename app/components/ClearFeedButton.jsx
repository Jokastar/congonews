"use client"
import { useState } from "react"
import { useFeed } from "../context/FeedContext"

export default function ClearFeedButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { setArticles } = useFeed()

  const handleClear = async () => {
    if (!window.confirm("Delete all articles and tweets from the database? This cannot be undone.")) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/feed", { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to clear feed")
      setArticles([])
    } catch (e) {
      setError(e.message || "Error clearing feed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleClear}
        className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Clearing..." : "Clear Feed"}
      </button>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </div>
  )
}
