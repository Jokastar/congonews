"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useFeed } from "../context/FeedContext"
import ArticleCard from "./ArticleCard"
import TweetCard from "./TweetCard"

export default function FeedGrid() {
  const { filteredArticles, loadMore, hasMore, loading, error, refresh } = useFeed()

  // rootMargin triggers the sentinel 300px before it actually enters the viewport,
  // so the next page starts loading before the user hits the bottom.
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 300px 0px",
  })

  // Initial load on mount
  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // When the sentinel enters the extended viewport, load the next page.
  // loadMore() already guards against calls while loading or hasMore=false,
  // so this effect can simply call it whenever inView or loadMore changes.
  useEffect(() => {
    if (inView && hasMore && !loading) loadMore()
  }, [inView, hasMore, loading, loadMore])

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 pt-8 items-start">
        {filteredArticles.map((article) =>
          article.source === "newsapi"
            ? <ArticleCard key={article.id} article={article} />
            : <TweetCard key={article.id} article={article} />
        )}
      </div>

      {/* Sentinel — 1px height ensures IntersectionObserver fires reliably */}
      <div ref={ref} className="h-px" />

      {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
    </>
  )
}
