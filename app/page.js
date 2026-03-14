"use client"

import { useInView } from "react-intersection-observer"
import FeedToolbar from "./components/FeedToolbar"
import FeedGrid from "./components/FeedGrid"
import ThemeFilterBar, { FixedFilterBar } from "./components/ThemeFilterBar"
import { FeedProvider } from "./context/FeedContext"

function Page() {
  const { ref, inView } = useInView({ threshold: 0 })

  return (
    <>
      <header ref={ref}>
        <div className="flex justify-center gap-10 flex-col items-center sm:mb-20">
          <h1 className="uppercase fs-hero leading-tight-minus font-silk text-center font-medium text-blue-gradient mt-[60px] sm:mt-0 mb-0 block"> Le Cercle</h1>
          <p className="fs-subtitle font-medium text-center">Toute l'actualité congolaise, à portée de main</p>
        </div>
        <ThemeFilterBar />
      </header>

      {!inView && <FixedFilterBar />}

      <main>
        <FeedGrid />
      </main>
      <footer className="fixed bottom-20 left-0 w-full flex justify-center max-[425px]:bottom-[40px]">
        <FeedToolbar />
      </footer>
    </>
  )
}

export default function Home() {
  return (
    <FeedProvider>
      <Page />
    </FeedProvider>
  )
}
