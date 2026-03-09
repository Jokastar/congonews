"use client"

import { useFeed } from "../context/FeedContext"
import FeedItemCard from "./FeedItemCard"

export default function FeedGrid() {
  const { filteredArticles } = useFeed()
  return (
    <div className="grid grid-cols-3 gap-4 p-10 items-start">
      {filteredArticles.map((article) => (
        <FeedItemCard key={article.id} article={article} />
      ))}
    </div>
  )
}
