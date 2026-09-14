import type { Metadata } from 'next';
import { Rubik } from 'next/font/google';
import './theme.css';
import ThemeProvider from '@/components/ThemeProvider';
import Script from 'next/script';

const rubik = Rubik({ subsets: ['latin'] });

const SITE_URL = 'https://quizme-hikmahx.vercel.app';
const TITLE = 'QuizMe — AI-Powered Document Learning';
const DESCRIPTION =
  'Transform your documents into interactive learning experiences with AI-generated summaries, Q&A, and quizzes.';
// Absolute path — resolved against metadataBase for OG, and given directly
// to Twitter (X's crawler doesn't always resolve relative twitter:image
// paths reliably, so it gets the full URL explicitly below too).
const OG_IMAGE = '/readme/quizme.png';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'QuizMe',
    type: 'website',
    images: [
      {
        url: OG_IMAGE,
        width: 2877,
        height: 1572,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    // Without an explicit twitter card type, X's crawler won't render a
    // large-image preview even if openGraph tags are present.
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}${OG_IMAGE}`],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'QuizMe',
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Any',
  image: `${SITE_URL}${OG_IMAGE}`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
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
