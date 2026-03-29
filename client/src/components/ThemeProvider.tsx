'use client'

import { useEffect, useState } from 'react'

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme')
    // Default to dark mode if no preference is saved
    const shouldBeDark = savedTheme ? savedTheme === 'dark' : true

    setIsDark(shouldBeDark)
    applyTheme(shouldBeDark)
  }, [])

  const applyTheme = (dark: boolean) => {
    const htmlElement = document.documentElement
    if (dark) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    applyTheme(newIsDark)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <div data-theme={isDark ? 'dark' : 'light'}>
      {children}
    </div>
  )
}
