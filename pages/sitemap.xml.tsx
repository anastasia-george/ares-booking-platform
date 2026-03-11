// pages/sitemap.xml.tsx — Dynamic sitemap for SEO
import { GetServerSideProps } from 'next';
import { PrismaClient } from '@prisma/client';

const SITE = 'https://modelcall.app';

const STATIC_PAGES = [
  { path: '/',               priority: '1.0', changefreq: 'daily' },
  { path: '/for-models',     priority: '0.8', changefreq: 'weekly' },
  { path: '/for-businesses', priority: '0.8', changefreq: 'weekly' },
  { path: '/about',          priority: '0.6', changefreq: 'monthly' },
  { path: '/faq',            priority: '0.7', changefreq: 'monthly' },
  { path: '/blog',                                       priority: '0.8', changefreq: 'weekly' },
  { path: '/blog/what-is-a-model-call',                   priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/free-beauty-treatments-sydney',           priority: '0.7', changefreq: 'monthly' },
  { path: '/blog/how-to-become-a-beauty-model-australia',  priority: '0.7', changefreq: 'monthly' },
  { path: '/legal/privacy',  priority: '0.3', changefreq: 'yearly' },
  { path: '/legal/terms',    priority: '0.3', changefreq: 'yearly' },
];

function toXml(pages: { loc: string; lastmod?: string; priority: string; changefreq: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>${p.lastmod ? `\n    <lastmod>${p.lastmod}</lastmod>` : ''}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const prisma = new PrismaClient();
  try {
    const businesses = await prisma.business.findMany({
      where: { services: { some: { isActive: true } } },
      select: { slug: true, updatedAt: true },
    });

    const staticEntries = STATIC_PAGES.map((p) => ({
      loc: `${SITE}${p.path}`,
      priority: p.priority,
      changefreq: p.changefreq,
    }));

    const dynamicEntries = businesses.map((b) => ({
      loc: `${SITE}/businesses/${b.slug}`,
      lastmod: b.updatedAt.toISOString().split('T')[0],
      priority: '0.7',
      changefreq: 'weekly' as const,
    }));

    const xml = toXml([...staticEntries, ...dynamicEntries]);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=600');
    res.write(xml);
    res.end();
  } catch (err) {
    console.error('Sitemap error:', err);
    res.statusCode = 500;
    res.end();
  } finally {
    await prisma.$disconnect();
  }

  return { props: {} };
};

export default function Sitemap() {
  return null;
}
