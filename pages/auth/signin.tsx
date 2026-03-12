// pages/auth/signin.tsx
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { Mail, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

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

export default function SignIn() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState(false);
  const router   = useRouter();
  const callbackUrl = (router.query.callbackUrl as string) || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
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
        <title>Sign In | Model Call</title>
      </Head>

      {/* Full-screen split layout — overrides the pt-16 from _app.tsx */}
      <div className="fixed inset-0 flex" style={{ zIndex: 100, background: '#F8FAFC' }}>

        {/* ══════════════════════════════════════════
            LEFT — full-bleed photo
        ══════════════════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col justify-between w-1/2 relative overflow-hidden"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1600&auto=format&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/70 via-[#0F172A]/40 to-[#0F172A]/80" />

          {/* Logo */}
          <div className="relative z-10 p-10">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoMark size={30} dark={false} />
              <span className="text-xl font-extrabold text-white tracking-tight">Model Call</span>
            </Link>
          </div>

          {/* Bottom quote */}
          <div className="relative z-10 p-10">
            <blockquote className="text-white/90 text-lg font-medium leading-relaxed mb-4">
              &ldquo;I got a full balayage for free at a top Sydney salon. The results were incredible and I&rsquo;ve been going back as a paying client ever since.&rdquo;
            </blockquote>
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/48?img=47" alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" />
              <div>
                <p className="text-white font-semibold text-sm">Chloe M.</p>
                <p className="text-white/50 text-xs">Sydney, NSW</p>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            RIGHT — form
        ══════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
              <LogoMark size={26} dark={true} />
              <span className="text-lg font-extrabold text-[#0F172A] tracking-tight">Model Call</span>
            </Link>

            {submitted ? (
              /* ── Success state ── */
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#F0FDFA] flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-[#0D9488]" strokeWidth={1.75} />
                </div>
                <h2 className="text-2xl font-black text-[#0F172A] mb-2">Check your inbox</h2>
                <p className="text-[14px] text-[#64748B] leading-relaxed mb-1">
                  We sent a magic link to
                </p>
                <p className="text-[14px] font-bold text-[#0F172A] mb-8">{email}</p>
                <p className="text-[13px] text-[#94A3B8] mb-8 leading-relaxed">
                  Click the link in the email to sign in. No password needed. Check your spam folder if it doesn&rsquo;t arrive within a minute.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-[13px] font-semibold text-[#0D9488] hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#0D9488]" strokeWidth={2} />
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#0D9488]">Free to join</span>
                  </div>
                  <h1 className="text-3xl font-black text-[#0F172A] leading-tight mb-2">
                    Welcome to<br />Model Call
                  </h1>
                  <p className="text-[14px] text-[#64748B] leading-relaxed">
                    Enter your email to book free and discounted beauty treatments.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Floating label email input */}
                  <div className="relative">
                    <div
                      className={`
                        relative rounded-2xl border-2 bg-white transition-all duration-150
                        ${focused || email
                          ? 'border-[#0D9488] shadow-[0_0_0_4px_rgba(13,148,136,0.08)]'
                          : 'border-[#E2E8F0]'
                        }
                      `}
                    >
                      <div className="absolute left-4 top-3.5 pointer-events-none">
                        <Mail className={`w-4 h-4 transition-colors ${focused || email ? 'text-[#0D9488]' : 'text-[#CBD5E1]'}`} strokeWidth={2} />
                      </div>
                      <div className="pl-11 pr-4 pt-5 pb-2">
                        <label
                          htmlFor="email"
                          className={`
                            absolute transition-all duration-150 pointer-events-none font-medium
                            ${focused || email
                              ? 'top-2.5 text-[10px] text-[#0D9488] tracking-wide uppercase'
                              : 'top-4 text-[14px] text-[#CBD5E1]'
                            }
                          `}
                          style={{ left: '2.75rem' }}
                        >
                          Email address
                        </label>
                        <input
                          id="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          className="w-full text-[15px] text-[#0F172A] bg-transparent focus:outline-none font-medium pt-1 pb-0.5"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <p className="text-[13px] text-rose-500 font-medium px-1">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] bg-[#0D9488] text-white hover:bg-teal-600 active:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-teal-900/15"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending link…
                      </>
                    ) : (
                      <>
                        Continue with email
                        <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                      </>
                    )}
                  </button>

                  <p className="text-[12px] text-center text-[#94A3B8] leading-relaxed px-2">
                    We&rsquo;ll email you a secure, one-click sign-in link.<br />
                    No password. No spam.
                  </p>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-7">
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                  <span className="text-[12px] text-[#CBD5E1] font-medium">or</span>
                  <div className="flex-1 h-px bg-[#E2E8F0]" />
                </div>

                {/* Google (visual only — wire up separately) */}
                <button
                  type="button"
                  onClick={() => signIn('google', { callbackUrl })}
                  className="w-full py-3.5 rounded-2xl font-semibold text-[14px] text-[#0F172A] bg-white border-2 border-[#E2E8F0] hover:border-[#CBD5E1] hover:shadow-sm transition-all duration-150 flex items-center justify-center gap-3"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <p className="text-center text-[12px] text-[#CBD5E1] mt-6 leading-relaxed">
                  By continuing, you agree to our{' '}
                  <Link href="/legal/terms" className="text-[#94A3B8] hover:underline">Terms</Link>
                  {' '}and{' '}
                  <Link href="/legal/privacy" className="text-[#94A3B8] hover:underline">Privacy Policy</Link>.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
