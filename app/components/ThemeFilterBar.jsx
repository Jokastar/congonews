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

function AnimatedLabel({ label }) {
  return (
    <span className="relative flex overflow-hidden h-[1.5em]">
      <span className="translate-y-0 group-hover:-translate-y-full transition-transform duration-400 ease-in-out">{label}</span>
      <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-in-out">{label}</span>
    </span>
  )
}

export default function ThemeFilterBar() {
  const { activeTheme, setActiveTheme, articles } = useFeed()

  const countFor = (themeId) => articles.filter((a) => a.theme === themeId).length

  return (
    <div className="flex flex-wrap gap-4 pb-5 justify-center border-b border-b-black">
      <button
        onClick={() => setActiveTheme(null)}
        className={`group px-4 rounded-full cursor-pointer ${
          activeTheme === null ? "font-medium" : "font-regular"
        }`}
      >
        <AnimatedLabel label="Tous" />
      </button>

      {THEMES.filter((theme) => countFor(theme.id) > 0).map((theme) => (
        <button
          key={theme.id}
          onClick={() => setActiveTheme(activeTheme === theme.id ? null : theme.id)}
          className={`group px-4 rounded-full cursor-pointer ${
            activeTheme === theme.id ? "font-medium" : "font-regular"
          }`}
        >
          <AnimatedLabel label={theme.label} />
        </button>
      ))}
    </div>
  )
}
