'use client'

import { useState, useEffect, useCallback } from 'react'
import { StoredFileMeta, SummaryLength, SummaryStyle } from '@/types'
import {
  getSummaryFlow,
  setSummaryFlow,
  clearSummaryFlow,
  filesToStoredMeta,
  DEFAULT_SUMMARY_FLOW,
} from '@/lib/storage'

/**
 * useSummaryFlow
 *
 * Manages all state for the multi-step View Summary flow and keeps it in sync
 * with localStorage so that a page refresh restores the user's progress.
 *
 * Persistence strategy:
 *   - File metadata (name, size, type, base64 dataUrl) is stored so files
 *     survive a refresh.  The dataUrl means the actual content is available
 *     to the API without re-uploading.
 *   - Length + style selections are also stored.
 *   - Calling clearFlow() wipes everything — used when the user clicks
 *     "Upload different files".
 */
export function useSummaryFlow() {
  const [files, setFiles]   = useState<StoredFileMeta[]>([])
  const [length, setLength] = useState<SummaryLength | null>(null)
  const [style, setStyle]   = useState<SummaryStyle | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = getSummaryFlow()
    setFiles(saved.files)
    setLength(saved.length)
    setStyle(saved.style)
    setHydrated(true)
  }, [])

  // Persist whenever state changes (only after hydration)
  useEffect(() => {
    if (!hydrated) return
    setSummaryFlow({ files, length, style })
  }, [files, length, style, hydrated])

  // Actions

  const addFiles = useCallback((incoming: StoredFileMeta[]) => {
    setFiles((prev) => {
      const combined = [...prev, ...incoming]
      return combined.slice(0, 10) // cap at MAX_FILES
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const selectLength = useCallback((l: SummaryLength) => setLength(l), [])
  const selectStyle  = useCallback((s: SummaryStyle)  => setStyle(s), [])

  const clearFlow = useCallback(() => {
    clearSummaryFlow()
    setFiles([])
    setLength(null)
    setStyle(null)
  }, [])

  return {
    files,
    length,
    style,
    hydrated,
    addFiles,
    removeFile,
    selectLength,
    selectStyle,
    clearFlow,
    isMultiDoc: files.length > 1,
  }
}
