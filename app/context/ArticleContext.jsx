"use client"
import { createContext, useContext, useState, useEffect } from "react"

const ArticleContext = createContext()

export function ArticleProvider({ children }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

    return `${stepName}: ${responseData.error || responseData.message || fallbackMessage}`
  }

  // Load articles from db.json on mount
  useEffect(() => {
    const loadArticles = async () => {
      try {
        const res = await fetch("/api/articles/get-all")
        const data = await res.json()
        setArticles(data.items || [])
      } catch (err) {
        console.error("Failed to load articles:", err)
      }
    }
    loadArticles()
  }, [])

  const fetchAndEnrichNews = async () => {
    setLoading(true)
    setError(null)
    try {
      const pipelineErrors = []

      // Step 1: Scrape news from journalists
      const scrapeRes = await fetch("/api/articles/scrape-from-journalists", { method: "GET" })
      const scrapeData = await scrapeRes.json()
      
      if (!scrapeRes.ok) {
        throw new Error(buildApiErrorMessage("Scrape", scrapeData, "Failed to scrape news"))
      }

      // Step 2: Auto-enrich with embeddings
      const enrichRes = await fetch("/api/articles/generate-embeddings", { method: "POST" })
      const enrichData = await enrichRes.json()
      
      if (!enrichRes.ok) {
        const enrichmentError = buildApiErrorMessage("Embeddings", enrichData, "Failed to generate embeddings")
        pipelineErrors.push(enrichmentError)
        console.warn("Enrichment partially failed:", enrichmentError)
      }

      // Step 3: Auto-classify articles by theme
      const classifyRes = await fetch("/api/themes/classify-articles", { method: "POST" })
      const classifyData = await classifyRes.json()

      if (!classifyRes.ok) {
        const classificationError = buildApiErrorMessage("Theme classification", classifyData, "Failed to classify themes")
        pipelineErrors.push(classificationError)
        console.warn("Theme classification partially failed:", classificationError)
      }

      if (pipelineErrors.length > 0) {
        setError(pipelineErrors.join(" | "))
      }

      // Step 4: Reload articles
      const getRes = await fetch("/api/articles/get-all")
      const freshData = await getRes.json()
      setArticles(freshData.items || [])

      return { scrapeData, enrichData, classifyData }
    } catch (err) {
      const errorMsg = err.message || "Error fetching news"
      setError(errorMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <ArticleContext.Provider value={{ articles, setArticles, loading, error, fetchAndEnrichNews }}>
      {children}
    </ArticleContext.Provider>
  )
}

export function useArticles() {
  const context = useContext(ArticleContext)
  if (!context) {
    throw new Error("useArticles must be used within ArticleProvider")
  }
  return context
}
