"use client"
import { useEffect, useState } from "react"

function isTweet(item) {
  return item.type === "tweet" || (item.url && item.url.includes("twitter.com"))
}
function isArticle(item) {
  return item.type === "article" || (item.external_url && !isTweet(item))
}

export default function ThemeColumns() {
  const [themes, setThemes] = useState([])
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const res = await fetch("/api/news")
      const items = await res.json()
      // Group by theme
      const byTheme = {}
      for (const item of items) {
        if (!item.theme) continue
        if (!byTheme[item.theme]) byTheme[item.theme] = []
        byTheme[item.theme].push(item)
      }
      setThemes(Object.entries(byTheme))
      setSources(items)
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return <div>Loading news...</div>
  if (!themes.length) return <div>No news found.</div>

  return (
    <div className="flex flex-wrap gap-6 mt-8">
      {themes.map(([theme, items]) => (
        <div key={theme} className="flex-1 min-w-[320px] bg-gray-50 rounded shadow p-4">
          <h2 className="text-xl font-bold mb-2 capitalize">{theme}</h2>
          {items.map(item => (
            <SourceCard key={item.id} item={item} />
          ))}
        </div>
      ))}
    </div>
  )
}

function SourceCard({ item }) {
  if (isTweet(item)) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block border-b py-2 hover:bg-blue-50">
        <div className="flex items-center gap-2">
          {item.user_image && <img src={item.user_image} alt="Account" className="w-8 h-8 rounded-full" />}
          <div>
            <div className="font-semibold">{item.user_posted || item.name}</div>
            <div className="text-xs text-gray-500">{item.date_posted}</div>
          </div>
        </div>
        <div className="mt-1">{item.text}</div>
        {item.photos && item.photos.length > 0 && (
          <img src={item.photos[0]} alt="Tweet" className="mt-2 rounded max-h-48" />
        )}
      </a>
    )
  }
  if (isArticle(item)) {
    return (
      <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="block border-b py-2 hover:bg-green-50">
        {item.external_image_urls && item.external_image_urls.length > 0 && (
          <img src={item.external_image_urls[0]} alt="Article" className="w-full rounded max-h-48 object-cover" />
        )}
        <div className="font-semibold mt-2">{item.name || item.title}</div>
        <div className="text-xs text-gray-500">{item.date_posted}</div>
        <div className="mt-1 text-sm">{item.description}</div>
      </a>
    )
  }
  // fallback
  return <div className="border-b py-2">{item.text || item.name}</div>
}
