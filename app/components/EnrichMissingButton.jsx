"use client"
import { useState } from "react"
import { useFeed } from "../context/FeedContext"

export default function EnrichMissingButton() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const { refresh } = useFeed()

  const handleEnrich = async () => {
    setLoading(true)
    setStatus(null)
    try {
      setStatus("Classifying all articles with Gemini...")
      const classifyRes = await fetch("/api/themes/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reclassify: true }),
      })
      const classifyData = await classifyRes.json()
      if (classifyData.error) throw new Error(classifyData.error)

      refresh()
      setStatus(`✓ Done — ${classifyData.updated} classified, ${classifyData.deleted ?? 0} non-DRC deleted, ${classifyData.failed ?? 0} failed`)
    } catch (err) {
      setStatus(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleEnrich}
        disabled={loading}
        className="fs-body text-white px-6 py-2.5 rounded-full disabled:opacity-50 cursor-pointer"
        style={{ backgroundImage: 'linear-gradient(90deg, #4F46E5 0%, #6D28D9 100%)' }}
      >
        {loading ? "Classifying..." : "Reclassify all themes (Gemini)"}
      </button>
      {status && <p className="fs-body mt-1">{status}</p>}
    </div>
  )
}
