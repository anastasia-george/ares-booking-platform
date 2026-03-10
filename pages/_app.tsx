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

  const navLink = (path: string, label: string) => (
    <Link href={path}
      className={`text-sm font-semibold transition-all duration-150 hover:text-[#0D9488] ${isActive(path) ? 'text-[#0D9488]' : 'text-[#64748B]'}`}>
      {label}
    </Link>
  );

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo — text + teal dot */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className="w-2 h-2 rounded-full bg-[#0D9488] shrink-0" />
          <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">Model Call</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-7">
          {navLink('/#browse',      'Browse')}
          {navLink('/for-businesses','For Businesses')}
          {navLink('/#how-it-works', 'How it Works')}
          {(session?.user?.role === 'BUSINESS_OWNER' || session?.user?.role === 'ADMIN') &&
            navLink('/dashboard', 'Dashboard')}
          {session && navLink('/my-bookings', 'My Bookings')}
        </div>

        {/* Right: auth */}
        <div className="flex items-center gap-2.5">
          {status !== 'loading' && (
            !session ? (
              <>
                <button onClick={() => signIn()}
                  className="hidden sm:inline-flex items-center px-5 py-2 rounded-full text-sm font-semibold border-2 border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all duration-200">
                  Log In
                </button>
                <button onClick={() => signIn()}
                  className="bg-[#0D9488] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-700 transition-all duration-200 shadow-sm">
                  Sign Up
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {session?.user?.role !== 'BUSINESS_OWNER' && session?.user?.role !== 'ADMIN' && (
                  <Link href="/onboard"
                    className="hidden sm:inline-flex px-5 py-2 rounded-full text-sm font-semibold border-2 border-[#0D9488] text-[#0D9488] hover:bg-[#0D9488] hover:text-white transition-all duration-200">
                    List a Service
                  </Link>
                )}
                <button onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm font-medium text-[#94A3B8] hover:text-[#64748B] transition-colors">
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
  const col = 'text-sm text-[#64748B] hover:text-white transition-colors duration-150';
  return (
    <footer className="bg-[#0F172A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#0D9488]" />
              <span className="text-lg font-extrabold text-white tracking-tight">Model Call</span>
            </div>
            <p className="text-sm text-[#4B5563] leading-relaxed">
              Australia&rsquo;s marketplace for free and discounted beauty model calls.
            </p>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#64748B] mb-4">Platform</p>
              <ul className="space-y-3">
                <li><Link href="/#browse"        className={col}>Browse Treatments</Link></li>
                <li><Link href="/for-models"     className={col}>For Models</Link></li>
                <li><Link href="/for-businesses" className={col}>For Businesses</Link></li>
                <li><Link href="/onboard"        className={col}>List a Service</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#64748B] mb-4">Company</p>
              <ul className="space-y-3">
                <li><Link href="/about"                    className={col}>About Us</Link></li>
                <li><Link href="/faq"                      className={col}>FAQ</Link></li>
                <li><Link href="mailto:hello@modelcall.app" className={col}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#64748B] mb-4">Legal</p>
              <ul className="space-y-3">
                <li><Link href="/legal/privacy" className={col}>Privacy Policy</Link></li>
                <li><Link href="/legal/terms"   className={col}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#1E293B] text-xs text-center text-[#374151]">
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
      <main className={`min-h-screen${!hideShell ? ' pt-16' : ''}`}>
        <Component {...rest} />
      </main>
      {!hideShell && <Footer />}
    </SessionProvider>
  );
}
