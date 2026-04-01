import { StoredFileMeta, SummaryFlowState } from '@/types'

// Keys

const SUMMARY_FLOW_KEY = 'quizme:summary-flow'

// Generic helpers

function getItem(key: string): unknown {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function setItem(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota exceeded or SSR — fail silently
  }
}

function removeItem(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

// File → base64
export function fileToStoredMeta(file: File): Promise<StoredFileMeta> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: reader.result as string,
      })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function filesToStoredMeta(files: File[]): Promise<StoredFileMeta[]> {
  return Promise.all(files.map(fileToStoredMeta))
}

// Summary flow state

export const DEFAULT_SUMMARY_FLOW: SummaryFlowState = {
  files: [],
  length: null,
  style: null,
  step: 0,
}

export function getSummaryFlow(): SummaryFlowState {
  return (getItem(SUMMARY_FLOW_KEY) as SummaryFlowState) ?? DEFAULT_SUMMARY_FLOW
}

export function setSummaryFlow(state: Partial<SummaryFlowState>): void {
  const current = getSummaryFlow()
  setItem(SUMMARY_FLOW_KEY, { ...current, ...state })
}

export function clearSummaryFlow(): void {
  removeItem(SUMMARY_FLOW_KEY)
}

// Utility

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function fileExtension(name: string): string {
  return name.split('.').pop()?.toUpperCase() ?? 'FILE'
}

export function extColourClass(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf')  return 'text-orange-400'
  if (ext === 'docx') return 'text-blue-400'
  return 'text-green-400'
}
