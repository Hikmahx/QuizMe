'use client'

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { StoredFileMeta, SummaryLength, SummaryStyle } from '@/types'
import {
  getSummaryFlow,
  setSummaryFlow,
  clearSummaryFlow,
} from '@/lib/storage'

// Constants for validation
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_FILES = 10

// Validation error types
export interface ValidationError {
  type: 'size' | 'type' | 'count'
  message: string
  files?: string[]
}

// Create a store outside the hook for better state management
let store = {
  files: [] as StoredFileMeta[],
  length: null as SummaryLength | null,
  style: null as SummaryStyle | null,
  hydrated: false,
  validationErrors: [] as ValidationError[],
  listeners: new Set<() => void>(),
}

const notifyListeners = () => {
  store.listeners.forEach(listener => listener())
}

export function useSummaryFlow() {
  // Use useSyncExternalStore to ensure all components get updates
  const files = useSyncExternalStore(
    (callback) => {
      store.listeners.add(callback)
      return () => store.listeners.delete(callback)
    },
    () => store.files,
    () => store.files
  )

  const length = useSyncExternalStore(
    (callback) => {
      store.listeners.add(callback)
      return () => store.listeners.delete(callback)
    },
    () => store.length,
    () => store.length
  )

  const style = useSyncExternalStore(
    (callback) => {
      store.listeners.add(callback)
      return () => store.listeners.delete(callback)
    },
    () => store.style,
    () => store.style
  )

  const hydrated = useSyncExternalStore(
    (callback) => {
      store.listeners.add(callback)
      return () => store.listeners.delete(callback)
    },
    () => store.hydrated,
    () => store.hydrated
  )

  const validationErrors = useSyncExternalStore(
    (callback) => {
      store.listeners.add(callback)
      return () => store.listeners.delete(callback)
    },
    () => store.validationErrors,
    () => store.validationErrors
  )

  // Hydrate from localStorage on mount
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

  // Persist whenever state changes
  useEffect(() => {
    if (store.hydrated) {
      setSummaryFlow({ files: store.files, length: store.length, style: store.style })
    }
  }, [files, length, style])

  // Validate a single file
  const validateFile = useCallback((file: StoredFileMeta): ValidationError | null => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        type: 'size',
        message: `${file.name} exceeds the 20MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        files: [file.name]
      }
    }
    return null
  }, [])

  // Validate all files
  const validateFiles = useCallback((fileList: StoredFileMeta[]): ValidationError[] => {
    const errors: ValidationError[] = []
    const sizeErrors: string[] = []

    if (fileList.length > MAX_FILES) {
      errors.push({
        type: 'count',
        message: `You can only upload up to ${MAX_FILES} files at once.`,
        files: fileList.slice(MAX_FILES).map(f => f.name)
      })
    }

    for (const file of fileList) {
      const error = validateFile(file)
      if (error && error.type === 'size') {
        sizeErrors.push(file.name)
      }
    }

    if (sizeErrors.length > 0) {
      errors.push({
        type: 'size',
        message: `${sizeErrors.length} file(s) exceed the 20MB limit: ${sizeErrors.join(', ')}`,
        files: sizeErrors
      })
    }

    return errors
  }, [validateFile])

  const addFiles = useCallback((incoming: StoredFileMeta[]): ValidationError[] => {
    console.log('Adding files:', incoming.length)
    
    const errors = validateFiles(incoming)
    
    if (errors.length > 0) {
      store.validationErrors = [...store.validationErrors, ...errors]
      const errorFileNames = new Set(errors.flatMap(e => e.files || []))
      const validFiles = incoming.filter(f => !errorFileNames.has(f.name))
      
      if (validFiles.length > 0) {
        store.files = [...store.files, ...validFiles].slice(0, MAX_FILES)
      }
    } else {
      store.files = [...store.files, ...incoming].slice(0, MAX_FILES)
      store.validationErrors = []
    }
    
    notifyListeners()
    return errors
  }, [validateFiles])

  const removeFile = useCallback((index: number) => {
    console.log('Removing file at index:', index)
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

  const clearFlow = useCallback(() => {
    clearSummaryFlow()
    store.files = []
    store.length = null
    store.style = null
    store.validationErrors = []
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
    addFiles,
    removeFile,
    selectLength,
    selectStyle,
    clearFlow,
    clearValidationErrors,
    validateCurrentFiles,
    isMultiDoc: store.files.length > 1,
  }
}
