"use client"

import NewsFetcher from "./components/NewsFetcher"
import DeleteAllDataButton from "./components/DeleteAllDataButton"
import GenerateCentroidsButton from "./components/GenerateCentroidsButton"
import { ArticleProvider } from "./context/ArticleContext"

export default function Home() {
  return (
    <ArticleProvider>
      <main>
        <h1>Congo News</h1>
        <div className="mb-4 space-y-2">
          <NewsFetcher />
          <GenerateCentroidsButton />
          <DeleteAllDataButton />
        </div>
      </main>
    </ArticleProvider>
  )
}
