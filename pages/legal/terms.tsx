// pages/legal/terms.tsx
import Head from 'next/head';
import Link from 'next/link';

const LAST_UPDATED = 'March 2026';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — Model Call</title>
        <meta name="description" content="Model Call terms of service — the rules governing use of Australia's beauty model call platform." />
        <link rel="canonical" href="https://modelcall.app/legal/terms" />
        <meta property="og:title" content="Terms of Service — Model Call" />
        <meta property="og:url" content="https://modelcall.app/legal/terms" />
      </Head>

      <section style={{ backgroundColor: '#0F172A' }} className="py-16 text-center px-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Terms of Service</h1>
        <p className="mt-3 text-sm" style={{ color: '#64748B' }}>Last updated: {LAST_UPDATED}</p>
      </section>

      <section className="py-16" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-3xl mx-auto px-4 space-y-10 text-sm leading-relaxed" style={{ color: '#64748B' }}>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>1. Acceptance of terms</h2>
            <p>By accessing or using the Model Call platform (&ldquo;Platform&rdquo;) operated by Model Call Pty Ltd (&ldquo;Model Call&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>2. The platform</h2>
            <p>Model Call is a two-sided marketplace that connects beauty businesses, clinics, and academies (&ldquo;Businesses&rdquo;) with individuals seeking free or discounted beauty treatments (&ldquo;Models&rdquo;). Model Call is not a party to the service agreement between a Business and a Model. We provide the technology that enables them to connect and transact.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>3. Eligibility</h2>
            <p>You must be at least 18 years of age to create an account or make a booking. By using the Platform you represent that you meet this requirement. Businesses must be legally operating entities in Australia and must hold any licences required by law to provide the services they list.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>4. Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately at{' '}
              <a href="mailto:hello@modelcall.app" className="underline" style={{ color: '#0D9488' }}>hello@modelcall.app</a>{' '}
              if you suspect unauthorised access. We reserve the right to suspend or terminate accounts that violate these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>5. Bookings and payments</h2>
            <p className="mb-2">When a Model books a session:</p>
            <ul className="list-disc ml-5 space-y-1 mb-2">
              <li>For paid sessions, a deposit or full amount is charged at the time of booking via Stripe.</li>
              <li>For free sessions, a card is placed on file via Stripe. No charge is made unless a no-show fee is triggered.</li>
            </ul>
            <p>Model Call does not guarantee the quality of any treatment. Disputes regarding service quality must be resolved directly with the Business. Model Call may, at its sole discretion, mediate disputes and issue refunds where it determines a significant service failure occurred.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>6. Cancellation and no-show policy</h2>
            <p>Each Business sets its own cancellation policy, which is displayed before you confirm a booking. Cancellations made within 24 hours of an appointment may result in a no-show fee being charged to the card on file, up to the maximum specified in the Business&rsquo;s policy. Repeated no-shows may result in account suspension.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>7. Business obligations</h2>
            <p>Businesses must: (a) accurately represent the services they list; (b) be appropriately qualified or supervised to deliver listed services; (c) comply with all applicable health, safety, and consumer protection laws; and (d) not charge Models more than the price listed on the Platform.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>8. Model obligations</h2>
            <p>Models must: (a) arrive at confirmed bookings on time or cancel in accordance with the Business&rsquo;s policy; (b) not resell or commercially exploit treatments received through the Platform; (c) leave honest, accurate reviews; and (d) not harass or intimidate Business staff.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>9. Prohibited conduct</h2>
            <p>You must not: use the Platform for any unlawful purpose; attempt to circumvent booking fees or the Platform&rsquo;s payment system; submit false or misleading reviews; scrape or copy Platform content without permission; or attempt to gain unauthorised access to any part of the Platform or its infrastructure.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>10. Intellectual property</h2>
            <p>All content, trademarks, logos, and technology on the Platform are owned by Model Call Pty Ltd or its licensors. You may not reproduce, distribute, or create derivative works without our express written permission.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>11. Limitation of liability</h2>
            <p>To the maximum extent permitted by Australian law, Model Call is not liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform. Our total liability for any claim shall not exceed the amount paid by you to Model Call in the 12 months preceding the claim.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>12. Australian Consumer Law</h2>
            <p>Nothing in these Terms limits any rights you may have under the Australian Consumer Law (Schedule 2 of the Competition and Consumer Act 2010 (Cth)).</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>13. Governing law</h2>
            <p>These Terms are governed by the laws of New South Wales, Australia. You submit to the exclusive jurisdiction of the courts of New South Wales for any disputes arising under these Terms.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>14. Changes to these terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by email or via a notice on the Platform. Continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#0F172A' }}>15. Contact</h2>
            <p>For questions about these Terms, contact us at{' '}
              <a href="mailto:hello@modelcall.app" className="underline" style={{ color: '#0D9488' }}>hello@modelcall.app</a>.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link href="/legal/privacy" className="text-sm font-medium hover:underline" style={{ color: '#0D9488' }}>
              Read our Privacy Policy →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
