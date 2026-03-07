"use client"

import NewsFetcher from "./components/NewsFetcher"
import DeleteAllDataButton from "./components/DeleteAllDataButton"
import GenerateCentroidsButton from "./components/GenerateCentroidsButton"
import NewsApiFetcher from "./components/NewsApiFetcher"
import { ArticleProvider, useArticles } from "./context/ArticleContext"

function ArticleGrid() {
  const { articles } = useArticles()
  return (
    <div className="grid grid-cols-3 gap-4 p-10">
      {articles.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[#F8F8F8] text-black flex flex-col cursor-pointer hover:shadow-lg transition-shadow rounded p-5 h-[480px] overflow-y-auto"
        >
          {/* Author row */}
          <div className="flex items-center gap-2 mb-3">
            {article.profile_image_link ? (
              <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center">
                <img
                  src={article.profile_image_link}
                  alt={article.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gray-300 flex-shrink-0" />
            )}
            <span className="text-sm font-semibold leading-tight line-clamp-1">{article.name}</span>
          </div>

          {/* Article image or video */}
          {article.videos?.[0]?.video_url ? (
            <video
              src={`/api/video-proxy?url=${encodeURIComponent(article.videos[0].video_url)}`}
              className="w-full aspect-video object-cover rounded"
              controls
              muted
              playsInline
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          ) : article.external_image_urls?.[0] ? (
            <img
              src={article.external_image_urls[0]}
              alt="Article"
              className="w-full aspect-video object-cover rounded"
            />
          ) : null}

          {/* Tweet text */}
          <p className="text-sm p-3 flex-1 line-clamp-4">{article.description}</p>

          {/* Source */}
          <div className="flex items-center justify-between px-3 pb-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              {article.source === 'newsapi' ? (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 22V4h16v18H4zm2-2h12V6H6v14zm2-3h8v-2H8v2zm0-4h8v-2H8v2zm0-4h8V7H8v2z"/>
                  </svg>
                  <span>{article.name}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.252 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>X (Twitter)</span>
                </>
              )}
            </div>
            {article.date_posted && (
              <span>{new Date(article.date_posted).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
            )}
          </div>
        </a>
      ))}
    </div>
  )
}

export default function Home() {
  return (
    <ArticleProvider>
      <main>
        <h1>Congo News</h1>
        <div className="mb-4 space-y-2">
          <NewsFetcher />
          <NewsApiFetcher />
          <GenerateCentroidsButton />
          <DeleteAllDataButton />
        </div>
        <ArticleGrid />
      </main>
    </ArticleProvider>
  )
}
