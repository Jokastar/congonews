"use client"

import FeedToolbar from "./components/FeedToolbar"
import FeedGrid from "./components/FeedGrid"
import ThemeFilterBar from "./components/ThemeFilterBar"
import { FeedProvider } from "./context/FeedContext"

export default function Home() {
  return (
    <FeedProvider>
      <header className="sticky">
        <div className="flex justify-center  gap-10 flex-col items-center mb-20">
          <h1 className="uppercase text-[200px] leading-tight-minus font-silk text-center font-medium text-blue-gradient m-0 block"> Le Cercle</h1>
          <p className="text-2xl font-medium">Toute l'actualité congolaise, à portée de main</p>
        </div>
         <ThemeFilterBar />
      </header>
      <main>
        <FeedGrid />
      </main>
      <footer className="fixed bottom-20 w-full flex justify-center">
        <FeedToolbar />
      </footer>
    </FeedProvider>
  )
}



