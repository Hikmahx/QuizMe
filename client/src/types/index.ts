// Feature types

export type FeatureKey = 'view-summary' | 'ask-questions' | 'quiz-time'

export interface FeatureMeta {
  key: FeatureKey
  label: string
  icon: string
  bgClass: string
  iconClass: string
  destinationPath: string
  description: string
}

// Upload / file

/** Serialisable file metadata stored in localStorage (File objects can't be serialised) */
export interface StoredFileMeta {
  name: string
  size: number
  type: string
  dataUrl: string // base64 data URL — stored so the content survives a refresh
}

// View Summary

export type SummaryLength = 'short' | 'medium' | 'long'
export type SummaryStyle  = 'combined' | 'doc-by-doc'

export interface SummaryLengthOption {
  value: SummaryLength
  label: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
}

export interface SummaryStyleOption {
  value: SummaryStyle
  label: string
  description: string
  icon: string
  iconBg: string
  iconColor: string
}

// View Summary flow state (persisted to localStorage)
export interface SummaryFlowState {
  files: StoredFileMeta[]
  length: SummaryLength | null
  style: SummaryStyle | null
  step: number  // current step index within the upload→options flow (0 = upload, 1 = length, 2 = style)
}

// Breadcrumb
export interface BreadcrumbCrumb {
  label: string
  href?: string  // If provided, the crumb is a link
}

// Doc navigator
export interface DocSummary {
  name: string
  title: string
  body: string[]
}
