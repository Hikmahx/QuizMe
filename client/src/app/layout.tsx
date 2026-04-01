import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './theme.css';
import ThemeProvider from '@/components/ThemeProvider';

const rubik = Rubik({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuizMe — AI-Powered Document Learning',
  description:
    'Transform your documents into interactive learning experiences with AI-generated summaries, Q&A, and quizzes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning className='dark'>
      <body
        className={`${rubik.className} bg-app-bg text-app-text transition-colors duration-300 min-h-screen relative`}
      >
        <div className='page-pattern absolute inset-0 z-0 pointer-events-none' />

        <div className='relative z-10 max-w-screen-xl mx-auto px-4 lg:px-12 xl:px-[60px]'>
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  );
}
