import type { Metadata } from 'next';

export const SITE_URL = 'https://quizme-hikmahx.vercel.app';
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

export const jsonLd = {
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
