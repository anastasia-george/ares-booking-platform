// pages/blog/index.tsx
import Head from 'next/head';
import Link from 'next/link';

const POSTS = [
  {
    slug: 'what-is-a-model-call',
    title: 'What Is a Model Call in the Beauty Industry?',
    excerpt: 'A model call is when a beauty clinic, academy, or student practitioner offers treatments at free or heavily discounted rates in exchange for practice, assessment, or portfolio work. Here\u2019s how it works.',
    date: '11 Mar 2026',
    category: 'Guides',
    readMin: 5,
  },
  {
    slug: 'free-beauty-treatments-sydney',
    title: 'How to Find Free Beauty Treatments in Sydney (2026)',
    excerpt: 'Sydney has dozens of clinics and academies offering free lashes, facials, injectables and more through model calls. We cover the best ways to find them \u2014 and how to book safely.',
    date: '11 Mar 2026',
    category: 'City Guides',
    readMin: 6,
  },
  {
    slug: 'how-to-become-a-beauty-model-australia',
    title: 'How to Become a Beauty Model in Australia',
    excerpt: 'You don\u2019t need professional experience or an agency to be a beauty model. Learn what beauty modelling actually involves, how to get started, and where to find opportunities across Australia.',
    date: '11 Mar 2026',
    category: 'Guides',
    readMin: 7,
  },
];

export default function BlogIndex() {
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Model Call Blog',
    url: 'https://modelcall.app/blog',
    description: 'Tips, guides, and city-by-city coverage of free and discounted beauty treatments across Australia.',
    publisher: {
      '@type': 'Organization',
      name: 'Model Call',
      url: 'https://modelcall.app',
    },
  };

  return (
    <>
      <Head>
        <title>Blog — Model Call | Free Beauty Treatment Tips & Guides</title>
        <meta name="description" content="Tips, guides, and city-by-city coverage of free and discounted beauty treatments across Australia. Learn about model calls, beauty modelling, and more." />
        <link rel="canonical" href="https://modelcall.app/blog" />
        <meta property="og:title" content="Blog — Model Call" />
        <meta property="og:description" content="Tips, guides, and city-by-city coverage of free beauty treatments in Australia." />
        <meta property="og:url" content="https://modelcall.app/blog" />
        <meta name="twitter:title" content="Blog — Model Call" />
        <meta name="twitter:description" content="Free beauty treatment tips, guides, and city coverage." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
        />
      </Head>

      {/* Hero */}
      <section style={{ backgroundColor: '#0F172A' }} className="py-20 text-center px-4">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#0D9488', borderColor: '#0D9488' }}>
          Blog
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
          Tips, guides &amp; <span style={{ color: '#0D9488' }}>beauty intel</span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
          Everything you need to know about model calls, free treatments, and the Australian beauty scene.
        </p>
      </section>

      {/* Posts */}
      <section className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-8">
            {POSTS.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: '#F0FDFA', color: '#0D9488' }}>
                      {post.category}
                    </span>
                    <span className="text-xs" style={{ color: '#94A3B8' }}>{post.date}</span>
                    <span className="text-xs" style={{ color: '#94A3B8' }}>&middot; {post.readMin} min read</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2 group-hover:text-teal-700 transition-colors"
                    style={{ color: '#0F172A' }}>
                    {post.title}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                    {post.excerpt}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white text-center px-4">
        <h2 className="text-2xl font-extrabold mb-3" style={{ color: '#0F172A' }}>Ready to book?</h2>
        <p className="text-base mb-6" style={{ color: '#64748B' }}>Browse free and discounted treatments right now.</p>
        <Link href="/#browse"
          className="inline-block px-8 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
          style={{ backgroundColor: '#0D9488' }}>
          Browse Treatments
        </Link>
      </section>
    </>
  );
}
