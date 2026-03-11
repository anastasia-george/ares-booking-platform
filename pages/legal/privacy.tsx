// pages/legal/privacy.tsx
import Head from 'next/head';
import Link from 'next/link';

const LAST_UPDATED = 'March 2026';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — Model Call</title>
        <meta name="description" content="Model Call privacy policy — how we collect, use, and protect your personal information in accordance with Australian Privacy Act 1988." />
        <link rel="canonical" href="https://modelcall.app/legal/privacy" />
        <meta property="og:title" content="Privacy Policy — Model Call" />
        <meta property="og:url" content="https://modelcall.app/legal/privacy" />
      </Head>

      <section style={{ backgroundColor: '#0F172A' }} className="py-16 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="mt-3 text-sm" style={{ color: '#64748B' }}>Last updated: {LAST_UPDATED}</p>
      </section>

      <section className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-3xl mx-auto px-4 space-y-10 text-sm leading-relaxed" style={{ color: '#64748B' }}>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>1. About this policy</h2>
            <p>Model Call Pty Ltd (&ldquo;Model Call&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website and platform at modelcall.app. This Privacy Policy explains how we collect, use, disclose, and protect personal information we receive from users of our platform, in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>2. Information we collect</h2>
            <p className="mb-2">We collect information you provide directly, including:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Name and email address (when you create an account)</li>
              <li>Business details including name, address, and ABN (for business owners)</li>
              <li>Payment information (processed and stored securely by Stripe — we do not store raw card numbers)</li>
              <li>Profile information such as Instagram handle, bio, and service details</li>
              <li>Booking history and reviews</li>
            </ul>
            <p className="mt-2">We also collect usage data automatically, including IP address, device type, browser, pages visited, and referral source. We use cookies and similar technologies for authentication, analytics, and fraud prevention.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>3. How we use your information</h2>
            <p className="mb-2">We use your personal information to:</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Provide, operate, and improve the Model Call platform</li>
              <li>Facilitate bookings and process payments</li>
              <li>Send booking confirmations, reminders, and review requests via email</li>
              <li>Detect and prevent fraud, disputes, and no-show abuse</li>
              <li>Comply with legal obligations</li>
              <li>Send product updates and marketing communications (you may opt out at any time)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>4. Disclosure of your information</h2>
            <p>We share your information only as necessary to operate the platform. This includes sharing booking details with the business you book with, and payment data with Stripe (our payment processor). We do not sell your personal information to third parties. We may disclose information to law enforcement or regulatory bodies when required by law.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>5. Data storage and security</h2>
            <p>Your data is stored on servers managed by Supabase and Vercel, which operate infrastructure in Australia and/or the United States. We implement industry-standard security measures including HTTPS, encrypted databases, and access controls. Despite these measures, no system is completely secure and we cannot guarantee absolute security.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>6. Your rights</h2>
            <p>Under the Australian Privacy Act, you have the right to access the personal information we hold about you, request corrections, and lodge a complaint if you believe we have breached the APPs. To exercise these rights, email us at{' '}
              <a href="mailto:privacy@modelcall.app" className="underline" style={{ color: '#0D9488' }}>privacy@modelcall.app</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>7. Cookies</h2>
            <p>We use session cookies for authentication and analytics cookies (e.g. via Vercel Analytics) to understand how the platform is used. You can disable cookies in your browser settings, but this may affect your ability to log in and use the platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>8. Children</h2>
            <p>Model Call is not directed at children under 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us information, contact us and we will delete it.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>9. Changes to this policy</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated by email or via a notice on the platform. Continued use of Model Call after changes take effect constitutes acceptance of the updated policy.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>10. Contact us</h2>
            <p>For privacy enquiries, contact us at{' '}
              <a href="mailto:privacy@modelcall.app" className="underline" style={{ color: '#0D9488' }}>privacy@modelcall.app</a>{' '}
              or write to Model Call Pty Ltd, Sydney NSW Australia.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link href="/legal/terms" className="text-sm font-medium hover:underline" style={{ color: '#0D9488' }}>
              Read our Terms of Service →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
