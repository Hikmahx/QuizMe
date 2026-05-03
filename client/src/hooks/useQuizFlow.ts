'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  QuizDifficulty, QuizQuestionType, TheoryInputMode,
  QuizQuestionCount, QuizFlowOptions
} from '@/types/quiz'

const STORAGE_KEY = 'quizme:quiz-flow'

const DEFAULT: QuizFlowOptions = {
  // Pre-select the first option in each step
  difficulty:    'easy',
  questionCount: 10,
  questionType:  'mcq',
  inputMode:     'written',
}

function load(): QuizFlowOptions {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : DEFAULT
  } catch { return DEFAULT }
}

function save(s: QuizFlowOptions) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* quota */ }
}

export function useQuizFlow() {
  const [opts, setOpts] = useState<QuizFlowOptions>(DEFAULT)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setOpts(load())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) save(opts)
  }, [opts, hydrated])

  const setDifficulty    = useCallback((v: QuizDifficulty)      => setOpts(p => ({ ...p, difficulty: v })), [])
  const setQuestionCount = useCallback((v: QuizQuestionCount)   => setOpts(p => ({ ...p, questionCount: v })), [])
  const setQuestionType  = useCallback((v: QuizQuestionType)    => setOpts(p => ({ ...p, questionType: v, inputMode: null })), [])
  const setInputMode     = useCallback((v: TheoryInputMode)     => setOpts(p => ({ ...p, inputMode: v })), [])
  const clearFlow        = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY)
    setOpts(DEFAULT)
  }, [])

  // How many setup steps total (difficulty + count + type [+ inputMode if theory])
  const totalSteps = opts.questionType === 'theory' ? 4 : 3

  return { ...opts, hydrated, totalSteps, setDifficulty, setQuestionCount, setQuestionType, setInputMode, clearFlow }
}
