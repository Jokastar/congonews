"use client"
import { useState } from "react"
import { useFeed } from "../context/FeedContext"

export default function ImportNewsApiButton() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { refreshFeed } = useFeed()

  const handleImport = async () => {
    setLoading(true)
    setStatus(null)
    try {
      // Step 1: Import from NewsAPI
      setStatus("Importing articles...")
      const importRes = await fetch("/api/feed/import-from-newsapi")
      const importData = await importRes.json()
      if (importData.error) throw new Error(importData.error)

      // Step 2: Generate embeddings
      setStatus(`✓ ${importData.saved} articles saved — generating embeddings...`)
      const embedRes = await fetch("/api/feed/generate-embeddings", { method: "POST" })
      const embedData = await embedRes.json()
      if (embedData.error) throw new Error(embedData.error)

      // Step 3: Classify themes
      setStatus(`✓ Embeddings done — classifying themes...`)
      const classifyRes = await fetch("/api/themes/classify", { method: "POST" })
      const classifyData = await classifyRes.json()
      if (classifyData.error) throw new Error(classifyData.error)

      // Step 4: Refresh grid
      await refreshFeed()
      setStatus(`✓ Done — ${importData.saved} articles, ${embedData.enrichedCount} embedded, ${classifyData.updated} classified`)
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleImport}
        disabled={loading}
        className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Importing from NewsAPI..." : "Import from NewsAPI"}
      </button>
      {status && <p className="text-sm mt-1">{status}</p>}
    </div>
  )
}
