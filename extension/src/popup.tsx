import { useEffect, useRef, useState } from "react"

import { applyStoredTheme } from "~components/ThemeToggle"
import { summarizePage } from "~lib/api"
import type { SummaryLength } from "~lib/options"
import { readActivePage, type PageInfo } from "~lib/page"
import IdleView from "~views/IdleView"
import LoadingView from "~views/LoadingView"
import ResultView from "~views/ResultView"

import "~style.css"

type Stage = "idle" | "loading" | "done"

const LENGTH_KEY = "quizme-length"

function IndexPopup() {
  const [stage, setStage] = useState<Stage>("idle")
  const [page, setPage] = useState<PageInfo | null>(null)
  const [pageError, setPageError] = useState("")
  const [error, setError] = useState("")
  const [summary, setSummary] = useState("")
  const [length, setLength] = useState<SummaryLength>("short")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    applyStoredTheme()
    const saved = localStorage.getItem(LENGTH_KEY) as SummaryLength | null
    if (saved) setLength(saved)

    readActivePage()
      .then(setPage)
      .catch((e) => setPageError(e.message))
  }, [])

  const changeLength = (v: SummaryLength) => {
    setLength(v)
    localStorage.setItem(LENGTH_KEY, v)
  }

  const summarize = async () => {
    if (!page) return
    const controller = new AbortController()
    abortRef.current = controller
    setError("")
    setStage("loading")

    try {
      const result = await summarizePage(page.title, page.text, length, controller.signal)
      setSummary(result)
      setStage("done")
    } catch (e: any) {
      if (e.name === "AbortError") {
        setStage("idle")
        return
      }
      setError(e.message || "Something went wrong. Try again.")
      setStage("idle")
    }
  }

  const cancel = () => abortRef.current?.abort()

  if (stage === "loading" && page) {
    return <LoadingView words={page.words} length={length} onCancel={cancel} />
  }

  if (stage === "done" && page) {
    return (
      <ResultView
        page={page}
        summary={summary}
        length={length}
        onLength={changeLength}
        onSummarize={summarize}
      />
    )
  }

  return (
    <IdleView
      page={page}
      pageError={pageError}
      error={error}
      length={length}
      onLength={changeLength}
      onSummarize={summarize}
    />
  )
}

export default IndexPopup
