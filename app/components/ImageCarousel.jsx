"use client"

import { useState } from "react"

export default function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0)

  if (!images || images.length === 0) return null

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt="media"
        className="w-full aspect-video object-contain rounded bg-black"
      />
    )
  }

  const prev = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent((i) => (i === 0 ? images.length - 1 : i - 1))
  }

  const next = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrent((i) => (i === images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="relative w-full aspect-video rounded overflow-hidden bg-black">
      <img
        src={images[current]}
        alt={`media ${current + 1}`}
        className="w-full h-full object-contain"
      />

      {/* Prev button */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70"
      >
        ‹
      </button>

      {/* Next button */}
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(i) }}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>

      {/* Counter */}
      <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
        {current + 1}/{images.length}
      </span>
    </div>
  )
}
