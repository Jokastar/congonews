"use client"

import NewsFetcher from "./components/NewsFetcher"
import EmbeddingAllTweetsButton from "./components/EmbeddingAllTweetsButton"
import DeleteAllDataButton from "./components/DeleteAllDataButton"
import ThemeColumns from "./components/ThemeColumns"

export default function Home() {
  return (
    <main>
      <h1>Congo News</h1>
     <NewsFetcher />
     <EmbeddingAllTweetsButton />
     <DeleteAllDataButton />
      <ThemeColumns />
    </main>
  )
}
