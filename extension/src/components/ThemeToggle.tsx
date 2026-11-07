import { useEffect, useState } from "react"

import { MoonIcon, SunIcon } from "~components/Icons"

// Same behaviour as the site: 'theme' key, dark by default.
export const applyStoredTheme = () => {
  const dark = localStorage.getItem("theme") !== "light"
  document.documentElement.classList.toggle("dark", dark)
  return dark
}

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => setIsDark(applyStoredTheme()), [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-3 text-app-text-secondary">
      <SunIcon size={18} />
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="relative h-7 w-14 rounded-full bg-primary">
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
            isDark ? "translate-x-7" : "translate-x-0"
          }`}
        />
      </button>
      <MoonIcon size={18} />
    </div>
  )
}
