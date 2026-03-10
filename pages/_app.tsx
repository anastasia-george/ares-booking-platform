// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const FULL_SCREEN_ROUTES = ['/onboard'];

function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/brand/lockup-light.svg" alt="Model Call" width={160} height={40} priority />
        </Link>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className={isActive('/') ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}
            style={isActive('/') ? { color: '#0D9488' } : {}}>
            Browse
          </Link>
          <Link href="/for-models"
            className={isActive('/for-models') ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}
            style={isActive('/for-models') ? { color: '#0D9488' } : {}}>
            For Models
          </Link>
          <Link href="/for-businesses"
            className={isActive('/for-businesses') ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}
            style={isActive('/for-businesses') ? { color: '#0D9488' } : {}}>
            For Businesses
          </Link>
          {(session?.user?.role === 'BUSINESS_OWNER' || session?.user?.role === 'ADMIN') && (
            <Link href="/dashboard"
              className={isActive('/dashboard') ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}
              style={isActive('/dashboard') ? { color: '#0D9488' } : {}}>
              Dashboard
            </Link>
          )}
          {session && (
            <Link href="/my-bookings"
              className={isActive('/my-bookings') ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}
              style={isActive('/my-bookings') ? { color: '#0D9488' } : {}}>
              My Bookings
            </Link>
          )}
        </div>

        {/* Auth + CTA */}
        <div className="flex items-center gap-3">
          {session?.user?.role !== 'BUSINESS_OWNER' && session?.user?.role !== 'ADMIN' && (
            <Link href="/onboard"
              className="hidden sm:inline-flex px-4 py-1.5 border rounded-lg text-sm font-medium transition"
              style={{ borderColor: '#0D9488', color: '#0D9488' }}>
              List a Service
            </Link>
          )}
          {status !== 'loading' && (
            !session ? (
              <button
                onClick={() => signIn()}
                className="px-4 py-1.5 text-white rounded-lg text-sm font-semibold transition"
                style={{ backgroundColor: '#0D9488' }}
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm font-medium"
                style={{ color: '#64748B' }}
              >
                Sign Out
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-200 mt-20" style={{ backgroundColor: '#0F172A' }}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          {/* Brand */}
          <div className="max-w-xs">
            <Image src="/brand/lockup-dark.svg" alt="Model Call" width={140} height={36} />
            <p className="mt-3 text-sm" style={{ color: '#64748B' }}>
              Australia&rsquo;s marketplace for free and discounted beauty model calls.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="font-semibold text-white mb-3">Platform</p>
              <ul className="space-y-2">
                <li><Link href="/" className="hover:text-white" style={{ color: '#64748B' }}>Browse Treatments</Link></li>
                <li><Link href="/for-models" className="hover:text-white" style={{ color: '#64748B' }}>For Models</Link></li>
                <li><Link href="/for-businesses" className="hover:text-white" style={{ color: '#64748B' }}>For Businesses</Link></li>
                <li><Link href="/onboard" className="hover:text-white" style={{ color: '#64748B' }}>List a Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Company</p>
              <ul className="space-y-2">
                <li><Link href="/about" className="hover:text-white" style={{ color: '#64748B' }}>About Us</Link></li>
                <li><Link href="/faq" className="hover:text-white" style={{ color: '#64748B' }}>FAQ</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Legal</p>
              <ul className="space-y-2">
                <li><Link href="/legal/privacy" className="hover:text-white" style={{ color: '#64748B' }}>Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className="hover:text-white" style={{ color: '#64748B' }}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 text-xs text-center" style={{ color: '#64748B' }}>
          &copy; {new Date().getFullYear()} Model Call Pty Ltd. All rights reserved. ABN pending.
        </div>
      </div>
    </footer>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...rest } = pageProps as { session: unknown } & Record<string, unknown>;
  const router = useRouter();
  const hideShell = FULL_SCREEN_ROUTES.includes(router.pathname);

  return (
    <SessionProvider session={session as never}>
      {!hideShell && <NavBar />}
      <main className="min-h-screen">
        <Component {...rest} />
      </main>
      {!hideShell && <Footer />}
    </SessionProvider>
  );
}
