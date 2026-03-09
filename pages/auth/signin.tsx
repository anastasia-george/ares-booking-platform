// pages/auth/signin.tsx
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const callbackUrl = (router.query.callbackUrl as string) || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    const res = await signIn('email', { email, callbackUrl, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError('Something went wrong. Please try again.');
    } else {
      setSubmitted(true);
    }
  }

  return (
    <>
      <Head>
        <title>Sign In | ModelCall</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-gray-900">ModelCall</h1>
            <p className="mt-2 text-sm text-gray-500">Sign in to book your appointment</p>
          </div>

          <div className="bg-white py-8 px-6 shadow rounded-lg">
            {submitted ? (
              <div className="text-center space-y-3">
                <div className="text-4xl">📬</div>
                <h2 className="text-lg font-semibold text-gray-800">Check your email</h2>
                <p className="text-sm text-gray-500">
                  We sent a magic link to <strong>{email}</strong>.<br />
                  Click the link to sign in — no password needed.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-xs text-indigo-600 hover:underline mt-4"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Sending link…' : 'Send magic link'}
                </button>

                <p className="text-xs text-center text-gray-400">
                  We&apos;ll email you a secure sign-in link. No password required.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
