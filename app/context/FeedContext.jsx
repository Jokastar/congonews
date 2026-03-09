"use client"
import { createContext, useContext, useState, useEffect } from "react"

const FeedContext = createContext()

export function FeedProvider({ children }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTheme, setActiveTheme] = useState(null)

  const filteredArticles = activeTheme
    ? articles.filter((a) => a.theme === activeTheme)
    : articles

  const buildApiErrorMessage = (stepName, responseData, fallbackMessage) => {
    if (!responseData || typeof responseData !== "object") {
      return `${stepName}: ${fallbackMessage}`
    }

    if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      const firstError = responseData.errors[0]
      const detailedError =
        (typeof firstError === "object" && (firstError.error || firstError.message)) ||
        String(firstError)
      return `${stepName}: ${responseData.error || fallbackMessage} (${detailedError})`
    }

    const baseMsg = responseData.error || responseData.message || fallbackMessage
    if (responseData.body) {
      const bodyDetail =
        typeof responseData.body === "object"
          ? JSON.stringify(responseData.body)
          : String(responseData.body)
      return `${stepName}: ${baseMsg} — ${bodyDetail}`
    }

    return `${stepName}: ${baseMsg}`
  }

  // Load feed items from Supabase on mount
  const refreshFeed = async () => {
    try {
      const res = await fetch("/api/feed")
      const data = await res.json()
      setArticles(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load feed:", err)
    }
  }

  useEffect(() => { refreshFeed() }, [])

  const fetchAndEnrichNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const pipelineErrors = []

      // Step 1: Import tweets from X via BrightData
      const scrapeRes = await fetch("/api/feed/import-from-x", { method: "GET" })
      const scrapeData = await scrapeRes.json()

      if (!scrapeRes.ok) {
        throw new Error(buildApiErrorMessage("Import from X", scrapeData, "Failed to import tweets"))
      }

      // Step 2: Generate embeddings for new items
      const enrichRes = await fetch("/api/feed/generate-embeddings", { method: "POST" })
      const enrichData = await enrichRes.json()

      if (!enrichRes.ok) {
        const enrichmentError = buildApiErrorMessage("Embeddings", enrichData, "Failed to generate embeddings")
        pipelineErrors.push(enrichmentError)
        console.warn("Embeddings partially failed:", enrichmentError)
      }

      // Step 3: Classify items by theme
      const classifyRes = await fetch("/api/themes/classify", { method: "POST" })
      const classifyData = await classifyRes.json()

      if (!classifyRes.ok) {
        const classificationError = buildApiErrorMessage("Theme classification", classifyData, "Failed to classify themes")
        pipelineErrors.push(classificationError)
        console.warn("Theme classification partially failed:", classificationError)
      }

      if (pipelineErrors.length > 0) {
        setError(pipelineErrors.join(" | "))
      }

      // Step 4: Reload feed
      await refreshFeed()

      return { scrapeData, enrichData, classifyData }
    } catch (err) {
      const errorMsg = err.message || "Error fetching feed"
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <FeedContext.Provider value={{ articles, setArticles, filteredArticles, loading, error, fetchAndEnrichNews, refreshFeed, activeTheme, setActiveTheme }}>
      {children}
    </FeedContext.Provider>
  )
}

export function useFeed() {
  const context = useContext(FeedContext)
  if (!context) {
    throw new Error("useFeed must be used within FeedProvider")
  }
  return context
}
