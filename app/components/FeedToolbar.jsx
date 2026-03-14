"use client"
import { useState } from "react"
import { createPortal } from "react-dom"
import { useFeed } from "../context/FeedContext"
import SourcesManager from "./SourcesManager"

const BTN = "text-sm text-white px-6 py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"

/** Calls an API fetch, throws if not ok or data.ok === false */
async function apiFetch(url, options) {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`)
  return data
}

export default function FeedToolbar() {
  const [activeTask, setActiveTask] = useState(null)
  const [message, setMessage] = useState(null) // { type: "info"|"success"|"error", text: string }
  const [showSources, setShowSources] = useState(false)
  const { refresh, setArticles } = useFeed()

  const busy = activeTask !== null

  const run = async (taskName, fn) => {
    if (busy) return
    setActiveTask(taskName)
    setMessage(null)
    try {
      const successText = await fn()
      if (successText) setMessage({ type: "success", text: successText })
    } catch (e) {
      setMessage({ type: "error", text: e.message || "Unknown error" })
    } finally {
      setActiveTask(null)
    }
  }

  const importX = async () => {
    setMessage({ type: "info", text: "Importing tweets from X..." })
    const scrapeData = await apiFetch("/api/feed/import-from-x")

    setMessage({ type: "info", text: `✓ ${scrapeData.saved} tweets saved — generating embeddings...` })
    const embedData = await apiFetch("/api/feed/generate-embeddings", { method: "POST" })

    setMessage({ type: "info", text: "✓ Embeddings done — classifying themes..." })
    const classifyData = await apiFetch("/api/themes/classify", { method: "POST" })

    return `✓ ${scrapeData.saved} tweets, ${embedData.enrichedCount} embedded, ${classifyData.updated} classified`
  }

  const importNewsApi = async () => {
    setMessage({ type: "info", text: "Importing articles from NewsAPI..." })
    const importData = await apiFetch("/api/feed/import-from-newsapi")

    setMessage({ type: "info", text: `✓ ${importData.saved} articles saved — generating embeddings...` })
    const embedData = await apiFetch("/api/feed/generate-embeddings", { method: "POST" })

    setMessage({ type: "info", text: "✓ Embeddings done — classifying themes..." })
    const classifyData = await apiFetch("/api/themes/classify", { method: "POST" })

    refresh()
    return `✓ ${importData.saved} articles, ${embedData.enrichedCount} embedded, ${classifyData.updated} classified`
  }

  const fetchX = () =>
    run("fetchX", async () => {
      const result = await importX()
      refresh()
      return result
    })

  const fetchNews = () =>
    run("fetch", async () => {
      const [xResult, newsApiResult] = await Promise.all([importX(), importNewsApi()])
      return `${xResult}\n${newsApiResult}`
    })

  const clearFeed = () =>
    run("clear", async () => {
      if (!window.confirm("Delete all articles and tweets from the database? This cannot be undone.")) return null
      const data = await apiFetch("/api/feed", { method: "DELETE" })
      setArticles([])
      return `✓ ${data.message}`
    })

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {message && (
          <pre className={`text-sm ${message.type === "error" ? "text-red-500" : "text-gray-500"}`}>
            {message.text}
          </pre>
        )}
        <div className="flex gap-2 flex-wrap justify-center bg-gray-300 px-2 py-2 rounded-full">
          <button
            onClick={fetchX}
            disabled={busy}
            className={BTN}
            style={{ backgroundColor: "#000000" }}
          >
            {activeTask === "fetchX" ? "Fetching X..." : "Fetch X"}
          </button>
          <button
            onClick={fetchNews}
            disabled={busy}
            className={BTN}
            style={{ backgroundColor: "blue" }}
          >
            {activeTask === "fetch" ? "Fetching News..." : "Fetch All"}
          </button>
          
          <button
            onClick={() => setShowSources(true)}
            disabled={busy}
            className={BTN}
            style={{ backgroundImage: "linear-gradient(90deg, #444444 6%, #111116 48%)" }}
          >
            Sources
          </button>
          <button
            onClick={clearFeed}
            disabled={busy}
            className={BTN}
            style={{ backgroundColor:"red" }}
          >
            {activeTask === "clear" ? "Clearing..." : "Clear Feed"}
          </button>
        </div>

    
      </div>

      {/* Sources modal — portalled to body to escape header stacking context */}
      {showSources && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSources(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowSources(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl leading-none cursor-pointer"
            >
              ✕
            </button>
            <SourcesManager />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
