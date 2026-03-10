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
  const isActive = (path: string) => router.pathname === path || (path === '/' && router.pathname === '/');
  const linkStyle = (path: string) => isActive(path) ? { color: '#0D9488' } : { color: '#64748B' };

  return (
    <nav className="bg-white sticky top-0 z-50" style={{ borderBottom: '1px solid #E2E8F0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/brand/lockup-light.svg" alt="Model Call" width={148} height={36} priority />
        </Link>

        {/* Center nav links */}
        <div className="hidden md:flex items-center gap-7">
          <Link href="/#browse"
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: '#64748B' }}>
            Browse Treatments
          </Link>
          <Link href="/for-businesses"
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={linkStyle('/for-businesses')}>
            For Businesses
          </Link>
          <Link href="/#how-it-works"
            className="text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: '#64748B' }}>
            How it Works
          </Link>
          {/* Authenticated extras */}
          {(session?.user?.role === 'BUSINESS_OWNER' || session?.user?.role === 'ADMIN') && (
            <Link href="/dashboard"
              className="text-sm font-semibold transition-colors hover:opacity-80"
              style={linkStyle('/dashboard')}>
              Dashboard
            </Link>
          )}
          {session && (
            <Link href="/my-bookings"
              className="text-sm font-semibold transition-colors hover:opacity-80"
              style={linkStyle('/my-bookings')}>
              My Bookings
            </Link>
          )}
        </div>

        {/* Right: auth buttons */}
        <div className="flex items-center gap-2.5">
          {status !== 'loading' && (
            !session ? (
              <>
                <button
                  onClick={() => signIn()}
                  className="hidden sm:inline-flex px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all hover:bg-gray-50"
                  style={{ borderColor: '#0F172A', color: '#0F172A' }}>
                  Log In
                </button>
                <button
                  onClick={() => signIn()}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#0D9488' }}>
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {session?.user?.role !== 'BUSINESS_OWNER' && session?.user?.role !== 'ADMIN' && (
                  <Link href="/onboard"
                    className="hidden sm:inline-flex px-4 py-2 border-2 rounded-xl text-sm font-bold transition-all hover:bg-gray-50"
                    style={{ borderColor: '#0D9488', color: '#0D9488' }}>
                    List a Service
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium transition hover:opacity-70"
                  style={{ color: '#94A3B8' }}>
                  Sign Out
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  const linkCls = 'text-sm transition-colors hover:opacity-80';
  const linkStyle = { color: '#64748B' };

  return (
    <footer style={{ backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand */}
          <div className="max-w-xs">
            <Image src="/brand/lockup-light.svg" alt="Model Call" width={140} height={36} />
            <p className="mt-3 text-sm leading-relaxed" style={{ color: '#94A3B8' }}>
              Australia&rsquo;s marketplace for free and discounted beauty model calls.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0F172A' }}>Platform</p>
              <ul className="space-y-3">
                <li><Link href="/#browse" className={linkCls} style={linkStyle}>Browse Treatments</Link></li>
                <li><Link href="/for-models" className={linkCls} style={linkStyle}>For Models</Link></li>
                <li><Link href="/for-businesses" className={linkCls} style={linkStyle}>For Businesses</Link></li>
                <li><Link href="/onboard" className={linkCls} style={linkStyle}>List a Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0F172A' }}>Company</p>
              <ul className="space-y-3">
                <li><Link href="/about" className={linkCls} style={linkStyle}>About Us</Link></li>
                <li><Link href="/faq" className={linkCls} style={linkStyle}>FAQ</Link></li>
                <li><Link href="mailto:hello@modelcall.app" className={linkCls} style={linkStyle}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: '#0F172A' }}>Legal</p>
              <ul className="space-y-3">
                <li><Link href="/legal/privacy" className={linkCls} style={linkStyle}>Privacy Policy</Link></li>
                <li><Link href="/legal/terms" className={linkCls} style={linkStyle}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 text-xs text-center" style={{ borderTop: '1px solid #E2E8F0', color: '#94A3B8' }}>
          &copy; {new Date().getFullYear()} Model Call. All rights reserved.
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
