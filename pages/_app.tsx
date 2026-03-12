// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

const CURRENT_YEAR = new Date().getFullYear();

// ── Brand logo mark — M silhouette + teal dot ──────────────────────────────
function LogoMark({ size = 28, dark = true }: { size?: number; dark?: boolean }) {
  const stroke = dark ? '#0F172A' : '#FFFFFF';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="5.5" r="3.5" fill="#0D9488" />
      <path
        d="M2 28 L10.5 13 L16 21 L21.5 13 L30 28"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
    <nav className="fixed w-full z-50 bg-white border-b border-[#E2E8F0] md:bg-white/80 md:backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Model Call home">
          <LogoMark size={28} dark={true} />
          <span className="text-xl font-extrabold text-[#0F172A] tracking-tight">Model Call</span>
        </Link>

        {/* Center links */}
        <div className="hidden md:flex items-center gap-7">
          {navLink('/#browse',      'Browse')}
          {navLink('/for-businesses','For Businesses')}
          {navLink('/#how-it-works', 'How it Works')}
          {navLink('/blog',          'Blog')}
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
                  className="bg-[#0F766E] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-800 transition-all duration-200 shadow-sm">
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
  const col = 'text-sm text-[#94A3B8] hover:text-white transition-colors duration-150';
  return (
    <footer className="bg-[#0F172A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex flex-col md:flex-row justify-between gap-10">

          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <LogoMark size={26} dark={false} />
              <span className="text-lg font-extrabold text-white tracking-tight">Model Call</span>
            </div>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Australia&rsquo;s marketplace for free and discounted beauty model calls.
            </p>
          </div>

          {/* Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#94A3B8] mb-4">Platform</p>
              <ul className="space-y-3">
                <li><Link href="/#browse"        className={col}>Browse Treatments</Link></li>
                <li><Link href="/for-models"     className={col}>For Models</Link></li>
                <li><Link href="/for-businesses" className={col}>For Businesses</Link></li>
                <li><Link href="/onboard"        className={col}>List a Service</Link></li>
                <li><Link href="/blog"           className={col}>Blog</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#94A3B8] mb-4">Company</p>
              <ul className="space-y-3">
                <li><Link href="/about"                    className={col}>About Us</Link></li>
                <li><Link href="/faq"                      className={col}>FAQ</Link></li>
                <li><Link href="mailto:hello@modelcall.app" className={col}>Contact</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#94A3B8] mb-4">Legal</p>
              <ul className="space-y-3">
                <li><Link href="/legal/privacy" className={col}>Privacy Policy</Link></li>
                <li><Link href="/legal/terms"   className={col}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#1E293B] text-xs text-center text-[#94A3B8]">
          &copy; {CURRENT_YEAR} Model Call. All rights reserved.
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
      <div className={jakarta.variable}>
        {!hideShell && <NavBar />}
        <main className={`min-h-screen${!hideShell ? ' pt-16' : ''}`}>
          <Component {...rest} />
        </main>
        {!hideShell && <Footer />}
      </div>
    </SessionProvider>
  );
}
