'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
    const isDarkMode = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    const htmlElement = document.documentElement;
    if (newIsDark) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  if (!mounted) return null;

  return (
    <div className='flex items-center gap-3 md:gap-4 ml-auto'>
      <div className='relative w-5 h-5 md:w-6 md:h-6 text-app-text-secondary dark:text-dark-text-secondary'>
        <Image
          src={
            isDark
              ? '/assets/images/icon-sun-light.svg'
              : '/assets/images/icon-sun-dark.svg'
          }
          alt='Theme icon'
          fill
          className='object-contain'
        />
      </div>
      <button
        onClick={toggleTheme}
        className='relative w-12 h-6 md:w-14 md:h-7 bg-primary rounded-full transition-all duration-300 flex items-center'
        aria-label='Toggle theme'
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <div
          className={`absolute w-5 h-5 md:w-6 md:h-6 bg-white rounded-full transition-transform duration-300 ${isDark ? 'translate-x-6 md:translate-x-7' : 'translate-x-1'}`}
        />
      </button>
      <div className='relative w-5 h-5 md:w-6 md:h-6 text-app-text-secondary dark:text-dark-text-secondary'>
        <Image
          src={
            isDark
              ? '/assets/images/icon-moon-light.svg'
              : '/assets/images/icon-moon-dark.svg'
          }
          alt='Theme icon'
          fill
          className='object-contain'
        />
      </div>
    </div>
  );
}
