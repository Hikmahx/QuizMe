'use client';

import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className='flex items-center justify-between px-6 md:px-12 py-6'>
      <Link href='/' className='flex items-center gap-3 group'>
        {/* <div className="w-11 h-11 bg-purple-100/20 rounded-xl flex items-center justify-center text-xl">
          <ion-icon name="brain-outline" style={{ fontSize: '20px' }} />
        </div> */}
        <span className='text-app-text text-lg font-medium group-hover:text-purple-300 transition-colors'>
          QuizMe
        </span>
      </Link>
      <ThemeToggle />
    </header>
  );
}
