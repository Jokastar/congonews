"use client"

import { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useFeed } from "../context/FeedContext"
import ArticleCard from "./ArticleCard"
import TweetCard from "./TweetCard"

function SkeletonCard() {
  return (
    <div className="bg-[#F0F0F0] rounded p-5 h-120 flex flex-col gap-3">
      <div className="skeleton w-full aspect-video rounded" />
      <div className="skeleton h-5 w-20 rounded-full" />
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="skeleton h-3 w-full rounded mt-1" />
      <div className="skeleton h-3 w-5/6 rounded" />
      <div className="skeleton h-3 w-4/6 rounded" />
      <div className="flex-1" />
      <div className="flex justify-between items-center mt-3">
        <div className="skeleton h-5 w-24 rounded-full" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  )
}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 pt-8 items-start">
        {loading && filteredArticles.length === 0
          ? Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)
          : filteredArticles.map((article) =>
              article.source === "newsapi"
                ? <ArticleCard key={article.id} article={article} />
                : <TweetCard key={article.id} article={article} />
            )
        }
      </div>

      {/* Sentinel — 1px height ensures IntersectionObserver fires reliably */}
      <div ref={ref} className="h-px" />

      {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}
      {!hasMore && !loading && filteredArticles.length > 0 && (
        <div className="text-center py-8 text-gray-400 fs-body">— No more articles —</div>
      )}
      {error && <div className="text-center py-8 text-red-500">{error}</div>}
    </>
  )
}
