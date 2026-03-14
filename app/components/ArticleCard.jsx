"use client"

const THEME_COLORS = {
  politique:   "#6923b0",
  economie:    "#c0392b",
  art:         "#ec4067",
  culture:     "#ef5d60",
  sport:       "#1a7a45",
  fait_divers: "#311847",
}

export default function ArticleCard({ article }) {
  const pillStyle = { backgroundColor: THEME_COLORS[article.theme] ?? "#311847" }
  const domain = article.url ? new URL(article.url).hostname.replace("www.", "") : null

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-[#F0F0F0] text-black flex flex-col cursor-pointer hover:shadow-lg transition-shadow rounded p-5 h-[480px] overflow-y-auto"
    >
      {/* Cover image + theme pill */}
      {article.external_image_urls?.[0] ? (
        <div className="relative mb-3">
          <img
            src={article.external_image_urls[0]}
            alt={article.title}
            className="w-full aspect-video object-cover object-top rounded"
          />
          {article.theme && (
            <span style={pillStyle} className="absolute top-2 left-2 fs-caption px-2 py-0.5 rounded-full text-white capitalize font-medium">
              {article.theme.replace("_", " ")}
            </span>
          )}
        </div>
      ) : article.theme && (
        <div className="mb-3">
          <span style={pillStyle} className="fs-caption px-2 py-0.5 rounded-full text-white capitalize">
            {article.theme.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Title */}
      {article.title && (
        <p className="fs-heading font-bold leading-snug line-clamp-3">{article.title}</p>
      )}

      {/* Description */}
      {article.description && article.description !== article.title && (
        <p className="fs-body mt-2 text-gray-600 line-clamp-4">{article.description}</p>
      )}

      <div className="flex-1" />

      {/* Source footer */}
      <div className="flex items-center justify-between mt-3 fs-caption text-gray-400">
        <div className="flex items-center gap-1.5">
          {domain && (
            <img
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=16`}
              alt={domain}
              className="w-5 h-5 rounded-full"
            />
          )}
          <span className="font-medium text-black">{article.name || domain}</span>
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
