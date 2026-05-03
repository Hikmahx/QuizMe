'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { StoredFileMeta, SummaryLength, SummaryStyle } from '@/types'
import { getSummaryFlow, setSummaryFlow, clearSummaryFlow, MAX_FILE_SIZE, MAX_FILES } from '@/lib/storage'
import { generateSummaryApi, SummaryApiResponse } from '@/lib/api'


export interface ValidationError {
  type: 'size' | 'type' | 'count'
  message: string
  files?: string[]
}

// A stable cache key for the current generation so we never re-generate
// the same (files + length + style) combination within a session.
// Format: "<file1name>|<file2name>__<length>__<style>"
//
// Builds like a unique "fingerprint" string for the current settings. If the fingerprint hasn't changed, we already have the result — don't fetch again.
function makeCacheKey(
  files: StoredFileMeta[],
  length: SummaryLength | null,
  style: SummaryStyle | null,
): string {
  const filesPart = files.map((f) => f.name).sort().join('|')
  return `${filesPart}__${length ?? ''}__${style ?? ''}`
}

let store = {
  files: [] as StoredFileMeta[],
  length: 'medium' as SummaryLength | null,   // default: medium
  style: 'combined' as SummaryStyle | null,   // default: combined
  hydrated: false,
  validationErrors: [] as ValidationError[],
  summary: null as SummaryApiResponse | null,
  summaryLoading: false,
  summaryError: null as string | null,
  // Key of the last generation we dispatched — prevents double-fetching
  //
  // Acts like a lock. If this matches the current fingerprint, a fetch is already in progress — don't start another one.
  _generatingKey: null as string | null,
  listeners: new Set<() => void>(),
}

// Tells every subscribed component "something changed, re-render now."
const notifyListeners = () => {
  store.listeners.forEach((listener) => listener())
}

export function useSummaryFlow() {
  // Each useSyncExternalStore call wires one piece of the store to React.
  // When notifyListeners() fires, React re-reads these values and re-renders.
  const files = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.files,
    () => store.files,
  )
  const length = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.length,
    () => store.length,
  )
  const style = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.style,
    () => store.style,
  )
  const hydrated = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.hydrated,
    () => store.hydrated,
  )
  const validationErrors = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.validationErrors,
    () => store.validationErrors,
  )
  const summary = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.summary,
    () => store.summary,
  )
  const summaryLoading = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.summaryLoading,
    () => store.summaryLoading,
  )
  const summaryError = useSyncExternalStore(
    (cb) => { store.listeners.add(cb); return () => store.listeners.delete(cb) },
    () => store.summaryError,
    () => store.summaryError,
  )

  useEffect(() => {
    if (!store.hydrated) {
      const saved = getSummaryFlow()
      store.files = saved.files
      store.length = saved.length
      store.style = saved.style
      store.hydrated = true
      notifyListeners()
    }
    // Runs once on first load. Reads whatever the user had last time from localStorage and puts it back into the store (files, length, style).
  }, [])

  useEffect(() => {
    if (store.hydrated) {
      setSummaryFlow({ files: store.files, length: store.length, style: store.style })
    }
    // Every time files/length/style change, save them to localStorage, so they survive a page refresh.
  }, [files, length, style])

  const validateFile = useCallback((file: StoredFileMeta): ValidationError | null => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        type: 'size',
        message: `${file.name} exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        files: [file.name],
      }
    }
    return null
  }, [])

  const validateFiles = useCallback(
    (fileList: StoredFileMeta[]): ValidationError[] => {
      const errors: ValidationError[] = []
      const sizeErrors: string[] = []

      if (fileList.length > MAX_FILES) {
        errors.push({
          type: 'count',
          message: `You can only upload up to ${MAX_FILES} files at once.`,
          files: fileList.slice(MAX_FILES).map((f) => f.name),
        })
      }

      for (const file of fileList) {
        const error = validateFile(file)
        if (error?.type === 'size') sizeErrors.push(file.name)
      }

      if (sizeErrors.length > 0) {
        errors.push({
          type: 'size',
          message: `${sizeErrors.length} file(s) exceed the 20MB limit: ${sizeErrors.join(', ')}`,
          files: sizeErrors,
        })
      }

      return errors
    },
    [validateFile],
  )

  const addFiles = useCallback(
    (incoming: StoredFileMeta[]): ValidationError[] => {
      const errors = validateFiles(incoming)

      // Reset any cached summary when files change
      // New files = old summary is no longer valid. Wipe it so a fresh generation happens when the user continues.
      store.summary = null
      store._generatingKey = null

      if (errors.length > 0) {
        store.validationErrors = [...store.validationErrors, ...errors]
        const errorFileNames = new Set(errors.flatMap((e) => e.files ?? []))
        const validFiles = incoming.filter((f) => !errorFileNames.has(f.name))
        if (validFiles.length > 0) {
          store.files = [...store.files, ...validFiles].slice(0, MAX_FILES)
        }
      } else {
        store.files = [...store.files, ...incoming].slice(0, MAX_FILES)
        store.validationErrors = []
      }

      notifyListeners()
      return errors
    },
    [validateFiles],
  )

  const removeFile = useCallback((index: number) => {
    store.files = store.files.filter((_, i) => i !== index)
    // Bust cache so a re-generate happens after file removal
    // Removing a file means the cached summary is stale, so clear it and the lock so it regenerates cleanly.
    store.summary = null
    store._generatingKey = null
    notifyListeners()
  }, [])

  const selectLength = useCallback((l: SummaryLength) => {
    if (store.length !== l) {
      store.length = l
      // Bust cache when length changes
      // User picked a different length (e.g. short → long). The old summary no longer matches, so clear it.
      store.summary = null
      store._generatingKey = null
      notifyListeners()
    }
  }, [])

  const selectStyle = useCallback((s: SummaryStyle) => {
    if (store.style !== s) {
      store.style = s
      // Bust cache when style changes
      // Combined vs doc-by-doc produces a different result, so the old summary is invalid.
      store.summary = null
      store._generatingKey = null
      notifyListeners()
    }
  }, [])

  /**
   * generateSummary — starts generation in the background immediately.
   *
   * Safe to call multiple times: if the same (files+length+style) is already
   * loading or already cached, it's a no-op. This lets the options pages call
   * it on "Continue" and then navigate away — the user can switch tabs or apps
   * and the summary will be ready when they come back to /view-summary.
   */
  const generateSummary = useCallback(async () => {
    if (!store.files.length || !store.length) return

    const isSingleDoc = store.files.length === 1
    const apiStyle = isSingleDoc
      ? 'default'
      : store.style === 'combined'
        ? 'combined'
        : store.style === 'doc-by-doc'
          ? 'doc-by-doc'
          : 'default'

    const cacheKey = makeCacheKey(store.files, store.length, apiStyle as SummaryStyle)

    // No-op if already generating or already have a result for this key
    // If this exact request has we already started or finished, do nothing. Prevents duplicate API calls if the user taps
    // Continue twice or navigates back and forward.
    if (store._generatingKey === cacheKey) return
    if (store.summary && !store.summaryError) {
      // Check if existing result matches current options
      const existingKey = makeCacheKey(
        store.files,
        store.length,
        (store.summary.style as SummaryStyle) ?? null,
      )
      if (existingKey === cacheKey) return
    }

    // Set the lock, flip the loading flag, clear any old result.
    // Components reading summaryLoading will now show a spinner.
    store._generatingKey = cacheKey
    store.summaryLoading = true
    store.summaryError = null
    store.summary = null
    notifyListeners()

    try {
      const result = await generateSummaryApi(store.files, store.length, apiStyle)

      // Only commit if this is still the active generation (user may have
      // changed options while it was in flight)
      // 
      // By the time the response comes back, the user might have changed files or length. 
      // If the lock key no longer matches, this result is stale — silently discard it instead of overwriting the correct in-progress request.
      if (store._generatingKey === cacheKey) {
        store.summary = result
        store.summaryLoading = false
        store._generatingKey = null

        if (result.collection_id) {
          setSummaryFlow({ collectionId: result.collection_id })
        }

        // Tell all subscribed components "the summary is ready, re-render." /view-summary will now display the content.
        notifyListeners()
      }
    } catch (err) {
      if (store._generatingKey === cacheKey) {
        store.summaryLoading = false
        store.summaryError =
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        store._generatingKey = null
        // Something went wrong — clear the lock and set the error message so the UI can show a retry button.
        notifyListeners()
      }
    }
  }, [])

  const clearSummary = useCallback(() => {
    store.summary = null
    store.summaryLoading = false
    store.summaryError = null
    store._generatingKey = null
    notifyListeners()
  }, [])

  const clearFlow = useCallback(() => {
    clearSummaryFlow()
    store.files = []
    store.length = null
    store.style = null
    store.validationErrors = []
    store.summary = null
    store.summaryLoading = false
    store.summaryError = null
    store._generatingKey = null
    notifyListeners()
  }, [])

  const clearValidationErrors = useCallback(() => {
    store.validationErrors = []
    notifyListeners()
  }, [])

  const validateCurrentFiles = useCallback((): ValidationError[] => {
    const errors = validateFiles(store.files)
    store.validationErrors = errors
    notifyListeners()
    return errors
  }, [validateFiles])

  return {
    files,
    length,
    style,
    hydrated,
    validationErrors,
    summary,
    summaryLoading,
    summaryError,
    addFiles,
    removeFile,
    selectLength,
    selectStyle,
    generateSummary,
    clearSummary,
    clearFlow,
    clearValidationErrors,
    validateCurrentFiles,
    isMultiDoc: store.files.length > 1,
  }
}
