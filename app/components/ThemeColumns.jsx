"use client"
import { useEffect, useState } from "react"

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
  if (item.article) {
    return (
      <a href={item.external_url} target="_blank" rel="noopener noreferrer" className="block border-b py-2 hover:bg-green-50">
        <div className="font-semibold">{item.article?.title}</div>
        <div className="text-xs text-gray-500">{item.article?.published_at}</div>
        <div>{item.article?.text?.slice(0, 200)}...</div>
      </a>
    )
  }
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block border-b py-2 hover:bg-blue-50">
      <div className="flex items-center gap-2">
        {item.photos && item.photos.length > 0 && <img src={item.photos[0]} alt={item.user_posted || item.name} className="w-16 h-16 object-cover" />}
        <div>
          <div className="font-semibold">{item.user_posted || item.name}</div>
          <div className="text-xs text-gray-500">{item.date_posted}</div>
          <div>{item.description}</div>
        </div>
      </div>
    </a>
  )
}