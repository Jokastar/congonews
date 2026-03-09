"use client"

import { useFeed } from "../context/FeedContext"

const THEMES = [
  { id: "politique", label: "Politique" },
  { id: "economie", label: "Économie" },
  { id: "art", label: "Art" },
  { id: "culture", label: "Culture" },
  { id: "sport", label: "Sport" },
  { id: "fait_divers", label: "Fait divers" },
]

export default function ThemeFilterBar() {
  const { activeTheme, setActiveTheme, articles } = useFeed()

  const countFor = (themeId) => articles.filter((a) => a.theme === themeId).length
  const totalCount = articles.length

  return (
    <div className="flex flex-wrap gap-2 px-10 py-4">
      <button
        onClick={() => setActiveTheme(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          activeTheme === null
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Tout ({totalCount})
      </button>

      {THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => setActiveTheme(activeTheme === theme.id ? null : theme.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeTheme === theme.id
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {theme.label} ({countFor(theme.id)})
        </button>
      ))}
    </div>
  )
}
