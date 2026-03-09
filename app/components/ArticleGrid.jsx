"use client"

import { useArticles } from "../context/ArticleContext"
import ArticleCard from "./ArticleCard"

export default function ArticleGrid() {
  const { articles } = useArticles()
  return (
    <div className="grid grid-cols-3 gap-4 p-10 items-start">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
