// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="font-extrabold text-lg text-pink-500 tracking-tight">
          ModelCall
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link
            href="/"
            className={`font-medium ${
              router.pathname === '/' ? 'text-pink-500' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Browse
          </Link>
          {session?.user?.role !== 'BUSINESS_OWNER' && session?.user?.role !== 'ADMIN' && (
            <Link href="/onboard" className="font-medium text-gray-600 hover:text-gray-900">
              List Your Business
            </Link>
          )}
          {(session?.user?.role === 'BUSINESS_OWNER' || session?.user?.role === 'ADMIN') && (
            <Link href="/dashboard" className="font-medium text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
          )}
          {session && (
            <Link href="/my-bookings" className="font-medium text-gray-600 hover:text-gray-900">
              My Bookings
            </Link>
          )}
          {status !== 'loading' && (
            !session ? (
              <button
                onClick={() => signIn()}
                className="px-4 py-1.5 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-gray-500 hover:text-gray-800 text-sm"
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

export default function App({ Component, pageProps }: AppProps) {
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session}>
      <NavBar />
      <Component {...rest} />
    </SessionProvider>
  );
}
