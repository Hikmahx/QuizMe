import type { MetadataRoute } from 'next';

const SITE_URL = 'https://quizme-hikmahx.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // These are stateful, session-dependent screens (they only make
      // sense after a document's been uploaded) — nothing here is
      // meaningful standalone content for a crawler to index.
      disallow: [
        '/api/',
        '/q-and-a',
        '/view-summary',
        '/quiz',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
