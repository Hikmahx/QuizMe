import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './theme.css';
import ThemeProvider from '@/components/ThemeProvider';
import Script from 'next/script';
import { metadata as seoMetadata, jsonLd } from './seo';

const rubik = Rubik({ subsets: ['latin'] });

export const metadata: Metadata = seoMetadata;

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
        <script
          type='application/ld+json'
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className='page-pattern absolute inset-0 z-0 pointer-events-none' />

        <div className='relative z-10 max-w-screen-xl mx-auto px-4 lg:px-12 xl:px-[60px]'>
          <ThemeProvider>{children}</ThemeProvider>
        </div>
        <Script
          type='module'
          src='https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js'
        />
        <Script
          noModule
          src='https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js'
        />
      </body>
    </html>
  );
}
