"use client"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

const FeedContext = createContext()

export function FeedProvider({ children }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [activeTheme, setActiveTheme] = useState(null)
  const [page, setPage] = useState(null)       // null = not yet initialised, no fetch
  const [refreshKey, setRefreshKey] = useState(0)

  // Single fetch effect — runs whenever page or refreshKey changes.
  // Skipped while page is null (before refresh() is first called).
  useEffect(() => {
    if (page === null) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/feed?page=${page}&limit=20`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Server error ${res.status}`)
        }
        return res.json()
      })
      .then(({ items, hasMore }) => {
        if (cancelled) return
        setArticles((prev) => (page === 1 ? items : [...prev, ...items]))
        setHasMore(hasMore)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error("Feed fetch failed:", err)
        setError(err.message)
        setHasMore(false)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [page, refreshKey])

  // Stable — no deps so its reference never changes and never causes spurious effect re-runs
  const loadMore = useCallback(() => setPage((p) => (p ?? 1) + 1), [])

  // Reset and re-fetch from page 1
  const refresh = useCallback(() => {
    setArticles([])
    setError(null)
    setHasMore(false)
    setPage(1)
    setRefreshKey((k) => k + 1)
  }, [])

  const filteredArticles = activeTheme
    ? articles.filter((a) => a.theme === activeTheme)
    : articles

  return (
    <FeedContext.Provider
      value={{
        articles,
        setArticles,
        filteredArticles,
        loading,
        error,
        hasMore,
        loadMore,
        refresh,
        activeTheme,
        setActiveTheme,
      }}
    >
      {children}
    </FeedContext.Provider>
  )
}

export function useFeed() {
  const ctx = useContext(FeedContext)
  if (!ctx) throw new Error("useFeed must be used within FeedProvider")
  return ctx
}
