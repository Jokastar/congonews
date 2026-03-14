"use client"

import ImageCarousel from "./ImageCarousel"

export default function FeedItemCard({ article }) {
  return (
    <a
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
          <div className="w-9 h-9 rounded-full bg-gray-400 flex-shrink-0" />
        )}
        <span className="fs-body font-semibold leading-tight line-clamp-1">{article.name}</span>
      </div>

      {/* Media: video > carousel of images */}
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
      ) : (
        <ImageCarousel
          images={[
            ...(article.external_image_urls || []),
            ...(article.photos || []),
          ].filter(Boolean)}
        />
      )}

      {/* Repost indicator */}
      {article.retweet && article.retweet_user && (
        <div className="flex items-center gap-1 fs-caption text-gray-400 mb-2 mt-2">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46L18.5 16.45V8c0-1.1-.896-2-2-2z"/>
          </svg>
          <span>Reposté de <span className="font-medium">@{article.retweet_user}</span></span>
        </div>
      )}

      {/* Title (NewsAPI only) */}
      {article.title && (
        <p className="fs-body font-bold mt-2 leading-snug line-clamp-3">{article.title}</p>
      )}

      {/* Description / tweet text — hide if identical to title */}
      {article.description && article.description !== article.title && (
        <p className="fs-body mt-1 text-gray-600 line-clamp-4">{article.description}</p>
      )}

      {/* Source footer */}
      <div className="flex items-center justify-between mt-3 fs-caption text-gray-400">
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

      {/* Theme badge */}
      {article.theme && (
        <div className="mt-2">
          <span className="fs-caption px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 capitalize">
            {article.theme.replace("_", " ")}
          </span>
        </div>
      )}
    </a>
  )
}
