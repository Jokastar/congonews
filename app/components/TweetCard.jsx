"use client"

export default function TweetCard({ article }) {
  const mediaUrl = article.videos?.[0]?.video_url
  const imageUrl = article.external_image_urls?.[0] || article.photos?.[0]

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#F0F0F0] text-black flex flex-col cursor-pointer hover:shadow-lg transition-shadow rounded p-5 h-[480px] overflow-y-auto"
    >
      {/* Cover media + theme pill */}
      {(mediaUrl || imageUrl) ? (
        <div className="relative mb-3">
          {mediaUrl ? (
            <video
              src={`/api/video-proxy?url=${encodeURIComponent(mediaUrl)}`}
              className="w-full aspect-video object-cover rounded"
              controls
              muted
              playsInline
              onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
              onMouseDown={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={imageUrl}
              alt={article.name}
              className="w-full aspect-video object-cover object-top rounded"
            />
          )}
          {article.theme && (
            <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-white/80 backdrop-blur-sm text-gray-700 capitalize font-medium">
              {article.theme.replace("_", " ")}
            </span>
          )}
        </div>
      ) : article.theme && (
        <div className="mb-3">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 capitalize">
            {article.theme.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Author row: name + avatar */}
      <div className="flex items-center gap-3">
        <p className="text-lg font-bold leading-snug line-clamp-1">{article.name}</p>
        {article.profile_image_link ? (
          <img
            src={article.profile_image_link}
            alt={article.name}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
        )}
      </div>

      {/* Tweet text */}
      {article.description && (
        <p className="text-sm mt-2 text-gray-600 line-clamp-4">{article.description}</p>
      )}

      <div className="flex-1" />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-1.5 bg-black text-white px-2 py-1 rounded-full">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.252 5.622 5.912-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="font-medium">Twitter</span>
        </div>
        {article.date_posted && (
          <span>
            {new Date(article.date_posted).toLocaleDateString("fr-FR", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        )}
      </div>
    </a>
  )
}

