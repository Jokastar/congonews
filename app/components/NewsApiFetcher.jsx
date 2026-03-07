"use client"
import { useState } from "react"
import { useArticles } from "../context/ArticleContext"

export default function NewsApiFetcher() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setArticles } = useArticles()

  const fetchNews = async () => {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/articles/fetch-from-newsapi")
      const data = await res.json()
      if (data.error) {
        setStatus(`Error: ${data.error}`)
      } else {
        setStatus(`✓ Saved ${data.saved} new articles (${data.duplicatesSkipped} duplicates skipped)`)
        // Reload articles
        const reload = await fetch("/api/articles/get-all")
        const fresh = await reload.json()
        setArticles(fresh.items || [])
      }
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={fetchNews}
        disabled={loading}
        className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Fetching from NewsAPI..." : "Fetch from NewsAPI"}
      </button>
      {status && <p className="text-sm mt-1">{status}</p>}
    </div>
  )
}
