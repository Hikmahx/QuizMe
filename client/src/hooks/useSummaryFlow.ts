'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { StoredFileMeta, SummaryLength, SummaryStyle } from '@/types'
import { getSummaryFlow, setSummaryFlow, clearSummaryFlow } from '@/lib/storage'
import { generateSummaryApi, SummaryApiResponse } from '@/lib/api'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const MAX_FILES = 10

export interface ValidationError {
  type: 'size' | 'type' | 'count'
  message: string
  files?: string[]
}

let store = {
  files: [] as StoredFileMeta[],
  length: null as SummaryLength | null,
  style: null as SummaryStyle | null,
  hydrated: false,
  validationErrors: [] as ValidationError[],
  summary: null as SummaryApiResponse | null,
  summaryLoading: false,
  summaryError: null as string | null,
  listeners: new Set<() => void>(),
}

const notifyListeners = () => {
  store.listeners.forEach((listener) => listener())
}

export function useSummaryFlow() {
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
  }, [])

  useEffect(() => {
    if (store.hydrated) {
      setSummaryFlow({ files: store.files, length: store.length, style: store.style })
    }
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
    notifyListeners()
  }, [])

  const selectLength = useCallback((l: SummaryLength) => {
    store.length = l
    notifyListeners()
  }, [])

  const selectStyle = useCallback((s: SummaryStyle) => {
    store.style = s
    notifyListeners()
  }, [])

  const generateSummary = useCallback(async () => {
    if (!store.files.length || !store.length) return

    store.summaryLoading = true
    store.summaryError = null
    store.summary = null
    notifyListeners()

    // Map frontend style values to what the backend expects.
    // Single-doc flows always use "default" — regardless of any stale style
    // persisted in the store from a previous multi-doc session.
    // Multi-doc flows use whatever the user selected (combined / doc-by-doc).
    const isSingleDoc = store.files.length === 1
    const apiStyle = isSingleDoc
      ? 'default'
      : store.style === 'combined'
        ? 'combined'
        : store.style === 'doc-by-doc'
          ? 'doc-by-doc'
          : 'default'

    try {
      const result = await generateSummaryApi(store.files, store.length, apiStyle)
      store.summary = result
      store.summaryLoading = false
      notifyListeners()
    } catch (err) {
      store.summaryLoading = false
      store.summaryError = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      notifyListeners()
    }
  }, [])

  const clearSummary = useCallback(() => {
    store.summary = null
    store.summaryLoading = false
    store.summaryError = null
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
