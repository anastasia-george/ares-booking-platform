// pages/about.tsx
import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <>
      <Head>
        <title>About Us | Model Call | Australia&apos;s Beauty Model Call Platform</title>
        <meta name="description" content="Learn about Model Call, Australia's marketplace connecting beauty students and clinics with models for free and discounted treatments. Our mission, values, and story." />
        <link rel="canonical" href="https://modelcall.app/about" />
        <meta property="og:title" content="About Model Call | Australia's Beauty Model Call Platform" />
        <meta property="og:description" content="Learn about Model Call, connecting beauty students and clinics with models for free and discounted treatments." />
        <meta property="og:url" content="https://modelcall.app/about" />
        <meta name="twitter:title" content="About Model Call" />
        <meta name="twitter:description" content="The story behind Australia's beauty model call platform." />
      </Head>

      {/* Hero */}
      <section style={{ backgroundColor: '#0F172A' }} className="py-24 text-center px-4">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase mb-4 px-3 py-1 rounded-full border"
          style={{ color: '#0D9488', borderColor: '#0D9488' }}>
          Our Story
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight max-w-3xl mx-auto">
          Built for the beauty community,<br /><span style={{ color: '#0D9488' }}>by someone in it.</span>
        </h1>
        <p className="mt-6 text-lg max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
          Model Call was born from a simple observation: beauty students need willing models, and everyday people want amazing treatments at prices they can actually afford. Why wasn&rsquo;t there an easy way to connect them?
        </p>
      </section>

      {/* Mission */}
      <section className="py-20" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>Our mission</span>
              <h2 className="text-3xl font-extrabold mt-2 mb-6" style={{ color: '#0F172A' }}>
                Make beauty accessible and talent unstoppable.
              </h2>
              <p className="text-base leading-relaxed mb-4" style={{ color: '#64748B' }}>
                Every week across Australia, beauty schools run training days that go unfilled. Clinics have quiet Tuesday afternoons. Students need practice hours before they can graduate. Meanwhile, people scroll Instagram wishing they could afford the treatment they keep seeing.
              </p>
              <p className="text-base leading-relaxed" style={{ color: '#64748B' }}>
                Model Call closes that gap. We give businesses and academies a frictionless way to fill their books, and give everyday Australians access to professional treatments for free or at a fraction of the retail price.
              </p>
            </div>
            <div className="rounded-2xl p-10 text-center" style={{ backgroundColor: '#0F172A' }}>
              <p className="text-5xl font-extrabold mb-3" style={{ color: '#0D9488' }}>2</p>
              <p className="text-sm text-white mb-8">sides of the market, one platform</p>
              <p className="text-5xl font-extrabold mb-3 text-white">🇦🇺</p>
              <p className="text-sm text-white mb-8">proudly Australian</p>
              <p className="text-5xl font-extrabold mb-3" style={{ color: '#0D9488' }}>∞</p>
              <p className="text-sm text-white">treatments waiting to be claimed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#0D9488' }}>What we stand for</span>
            <h2 className="text-3xl font-extrabold mt-2" style={{ color: '#0F172A' }}>Our values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🤝', title: 'Community first', desc: 'Every decision we make is in the interest of the models and businesses who trust us with their time and money.' },
              { icon: '🔒', title: 'Safety by design', desc: 'Verified businesses, card-on-file protection, and transparent policies keep both sides accountable.' },
              { icon: '📈', title: 'Grow together', desc: "When a student nails their assessment and a model walks out glowing, everyone wins. That's the only metric we care about." },
            ].map((v) => (
              <div key={v.title} className="rounded-2xl p-8 border border-gray-100 shadow-sm" style={{ backgroundColor: '#F8FAFC' }}>
                <div className="text-3xl mb-4">{v.icon}</div>
                <h3 className="text-base font-bold mb-2" style={{ color: '#0F172A' }}>{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center px-4" style={{ backgroundColor: '#F8FAFC' }}>
        <h2 className="text-3xl font-extrabold mb-4" style={{ color: '#0F172A' }}>Join the community</h2>
        <p className="text-base mb-8 max-w-md mx-auto" style={{ color: '#64748B' }}>
          Whether you&rsquo;re looking for your next glam session or want to fill your chairs, Model Call is the place to be.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/#browse"
            className="px-8 py-4 rounded-xl font-semibold text-white text-base transition hover:opacity-90"
            style={{ backgroundColor: '#0D9488' }}>
            Browse Treatments
          </Link>
          <Link href="/onboard"
            className="px-8 py-4 rounded-xl font-semibold text-base border-2 transition"
            style={{ borderColor: '#0D9488', color: '#0D9488' }}>
            List a Service
          </Link>
        </div>
      </section>
    </>
  );
}
