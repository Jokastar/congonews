"use client"

export default function Home() {
  // Removed automatic scraping on page load to avoid triggering downloads each visit.
  // To run scraping manually, call `/api/scrape` from the console or add a button that triggers it.

  return (
    <main>
      <h1>Congo News</h1>
      <div className="mt-8">
        {/* Embedding tool for testing Gemini embeddings */}
        <EmbeddingTool />
      </div>
    </main>
  )
}

import EmbeddingTool from "./embedding-tool";
