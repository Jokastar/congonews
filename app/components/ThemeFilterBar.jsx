"use client"

import { useState } from "react"
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

function FilterPills({ onSelect }) {
  const { activeTheme, setActiveTheme, articles, loading } = useFeed()

  const isInitialLoading = loading && articles.length === 0
  const countFor = (id) => articles.filter((a) => a.theme === id).length
  const displayThemes = isInitialLoading ? THEMES : THEMES.filter((t) => countFor(t.id) > 0)

  const select = (id) => {
    if (isInitialLoading) return
    setActiveTheme(id)
    onSelect?.()
  }

  return (
    <>
      <button
        onClick={() => select(null)}
        className={`fs-filter group px-4 rounded-full cursor-pointer transition-colors ${
          isInitialLoading ? "text-gray-300 cursor-default" : activeTheme === null ? "font-medium" : "font-regular"
        }`}
      >
        <AnimatedLabel label="Tous" />
      </button>
      {displayThemes.map((theme) => (
        <button
          key={theme.id}
          onClick={() => select(activeTheme === theme.id ? null : theme.id)}
          className={`fs-filter group px-4 rounded-full cursor-pointer transition-colors ${
            isInitialLoading ? "text-gray-300 cursor-default" : activeTheme === theme.id ? "font-medium" : "font-regular"
          }`}
        >
          <AnimatedLabel label={theme.label} />
        </button>
      ))}
    </>
  )
}

export default function ThemeFilterBar() {
  const { activeTheme, setActiveTheme, articles, loading } = useFeed()
  const [menuOpen, setMenuOpen] = useState(false)

  const isInitialLoading = loading && articles.length === 0
  const countFor = (id) => articles.filter((a) => a.theme === id).length
  const visibleThemes = isInitialLoading ? THEMES : THEMES.filter((t) => countFor(t.id) > 0)

  const select = (id) => {
    setActiveTheme(id)
    setMenuOpen(false)
  }

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        className="sm:hidden fixed top-5 left-5 z-50 flex flex-col gap-1.5 cursor-pointer"
        onClick={() => setMenuOpen(true)}
      >
        <span className="block w-6 h-0.5 bg-black" />
        <span className="block w-6 h-0.5 bg-black" />
        <span className="block w-6 h-0.5 bg-black" />
      </button>

      {/* Desktop filter bar */}
      <div className="hidden sm:flex flex-wrap gap-4 pb-5 justify-center border-b border-b-black">
        <FilterPills />
      </div>

      {/* Mobile fullscreen overlay */}
      {menuOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-white flex flex-col px-10 py-20">
          <button
            className="absolute top-5 right-5 fs-close text-gray-400 hover:text-black cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            ✕
          </button>
          <nav className="flex flex-col gap-6 mt-auto mb-auto">
            <button
              onClick={() => select(null)}
              className={`group fs-menu text-left cursor-pointer leading-none transition-colors ${
                isInitialLoading ? "text-gray-200 cursor-default" : activeTheme === null ? "font-medium" : "text-gray-300"
              }`}
            >
              <AnimatedLabel label="Tous" />
            </button>
            {visibleThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => select(activeTheme === theme.id ? null : theme.id)}
                className={`group fs-menu text-left cursor-pointer leading-none transition-colors ${
                  isInitialLoading ? "text-gray-200 cursor-default" : activeTheme === theme.id ? "font-medium" : "text-gray-300"
                }`}
              >
                <AnimatedLabel label={theme.label} />
              </button>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}

export function FixedFilterBar() {
  return (
    <div className="hidden sm:flex fixed top-0 left-0 right-0 z-30 bg-[#f8f8f8] border-b border-black justify-center gap-4 py-3 px-[clamp(20px,3vw,40px)]">
      <FilterPills />
    </div>
  )
}
