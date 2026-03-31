import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';

const rubik = Rubik({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuizMe — AI-Powered Document Learning',
  description:
    'Transform your documents into interactive learning experiences with AI-generated summaries, Q&A, and quizzes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className='dark'>
      <head>
        <script />
      </head>
      <body
        className={`${rubik.className} bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300`}
      >
        <div className="bg-[url('/assets/images/pattern-background-mobile-light.svg')] dark:bg-[url('/assets/images/pattern-background-mobile-dark.svg')] md:bg-[url('/assets/images/pattern-background-tablet-light.svg')] md:dark:bg-[url('/assets/images/pattern-background-tablet-dark.svg')] lg:bg-[url('/assets/images/pattern-background-tablet-light.svg')] lg:dark:bg-[url('/assets/images/pattern-background-desktop-dark.svg')] bg-no-repeat bg-cover absolute inset-0 z-[1]"></div>
        <div className='relative max-w-screen-xl mx-auto px-4 lg:px-12 xl:px-[60px]'>
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  );
}
