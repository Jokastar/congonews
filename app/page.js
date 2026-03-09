"use client"

import ImportXFeedButton from "./components/ImportXFeedButton"
import ClearFeedButton from "./components/ClearFeedButton"
import ImportNewsApiButton from "./components/ImportNewsApiButton"
import FeedGrid from "./components/FeedGrid"
import SourcesManager from "./components/SourcesManager"
import ThemeFilterBar from "./components/ThemeFilterBar"
import EnrichMissingButton from "./components/EnrichMissingButton"
import { FeedProvider } from "./context/FeedContext"

export default function Home() {
  return (
    <FeedProvider>
      <main>
        <h1>Congo News</h1>
        <div className="mb-4 space-y-2">
          <ImportXFeedButton />
          <ImportNewsApiButton />
          <ClearFeedButton />
          <SourcesManager />
          <EnrichMissingButton />
        </div>
        <ThemeFilterBar />
        <FeedGrid />
      </main>
    </FeedProvider>
  )
}


