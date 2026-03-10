// pages/onboard.tsx — Airbnb-style full-screen onboarding
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { useState } from 'react';
import { authOptions } from '../lib/auth';

const CATEGORIES = ['Lashes', 'Nails', 'Facials', 'Hair', 'Brows', 'Makeup', 'Waxing', 'Massage', 'Other'];
const AUS_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const DURATIONS = [30, 45, 60, 75, 90, 105, 120, 150, 180];
const TOTAL_STEPS = 8;

interface Form {
  name: string; suburb: string; city: string; state: string;
  bio: string; instagramHandle: string;
  serviceName: string; category: string;
  originalPrice: string; modelPrice: string;
  durationMin: number;
}

function fmtDuration(m: number) {
  return m < 60 ? `${m}m` : m % 60 === 0 ? `${m / 60}h` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdBizId, setCreatedBizId] = useState('');
  const [form, setForm] = useState<Form>({
    name: '', suburb: '', city: '', state: 'NSW',
    bio: '', instagramHandle: '',
    serviceName: '', category: '',
    originalPrice: '', modelPrice: '0',
    durationMin: 60,
  });

  const set = (k: keyof Form, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 1) return form.name.trim().length > 0;
    if (step === 5) return form.serviceName.trim().length > 0;
    if (step === 6) return form.category.length > 0;
    return true;
  };

  const handleNext = async () => {
    setError('');
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    // Final step — submit everything
    setSaving(true);
    try {
      let bizId = createdBizId;
      if (!bizId) {
        const r = await fetch('/api/business', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name, suburb: form.suburb || null, city: form.city || null,
            state: form.state || null, bio: form.bio || null,
            instagramHandle: form.instagramHandle || null,
          }),
        });
        const d = await r.json();
        if (!r.ok) { setError(d.error ?? 'Failed to create business'); return; }
        bizId = d.id; setCreatedBizId(bizId);
      }
      const sr = await fetch(`/api/business/${bizId}/services`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.serviceName, category: form.category,
          originalPrice: form.originalPrice ? Math.round(parseFloat(form.originalPrice) * 100) : null,
          price: Math.round(parseFloat(form.modelPrice || '0') * 100),
          durationMin: form.durationMin,
        }),
      });
      if (!sr.ok) { const d = await sr.json(); setError(d.error ?? 'Failed'); return; }
      setStep(TOTAL_STEPS + 1);
    } catch { setError('Network error — please try again'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full text-2xl border-b-2 border-gray-200 focus:border-teal-600 outline-none pt-2 pb-3 bg-transparent placeholder-gray-300 transition-colors';

  // ── Done screen ──
  if (step > TOTAL_STEPS) {
    return (
      <>
        <Head><title>You're listed! | ModelCall</title></Head>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#0F172A' }}>
          {/* Glow */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: '#0D9488' }} />
          </div>
          <div className="relative">
            <div className="text-7xl mb-6">🎉</div>
            <h1 className="text-4xl font-extrabold text-white mb-3">You&rsquo;re listed!</h1>
            <p className="text-lg max-w-sm mb-10" style={{ color: '#94A3B8' }}>
              Head to your dashboard to set your availability and start receiving models.
            </p>
            <button onClick={() => (window.location.href = '/dashboard')}
              className="px-10 py-4 rounded-full font-bold text-lg text-white shadow-lg transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#0D9488,#065F46)' }}>
              Go to Dashboard →
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>List Your Business | ModelCall</title></Head>
      <div className="min-h-screen flex flex-col bg-white">

        {/* Progress bar */}
        <div className="h-1" style={{ backgroundColor: '#F1F5F9' }}>
          <div className="h-full transition-all duration-500"
            style={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%`, background: 'linear-gradient(to right,#0D9488,#06B6D4)' }} />
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg">

            {error && (
              <div className="mb-6 text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{error}</div>
            )}

            {/* Step 1 — Business name */}
            {step === 1 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">What's your business called?</h2>
                <p className="text-gray-400 mb-10">This is what models will see on the marketplace.</p>
                <input autoFocus value={form.name} onChange={e => set('name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                  className={inputCls} placeholder="e.g. Glow Lash Studio" />
              </div>
            )}

            {/* Step 2 — Location */}
            {step === 2 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">Where are you based?</h2>
                <p className="text-gray-400 mb-10">Models search by suburb and city.</p>
                <div className="space-y-8">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Suburb</p>
                    <input autoFocus value={form.suburb} onChange={e => set('suburb', e.target.value)}
                      className={inputCls} placeholder="e.g. Surry Hills" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">City</p>
                    <input value={form.city} onChange={e => set('city', e.target.value)}
                      className={inputCls} placeholder="e.g. Sydney" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">State</p>
                  <select value={form.state} onChange={e => set('state', e.target.value)}
                      className="w-full text-xl border-b-2 border-gray-200 focus:border-teal-600 outline-none py-3 bg-transparent transition-colors">
                      {AUS_STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Bio */}
            {step === 3 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">Tell models about yourself</h2>
                <p className="text-gray-400 mb-10">What makes your practice special?</p>
                <textarea autoFocus value={form.bio} onChange={e => set('bio', e.target.value)}
                  rows={4} placeholder="I'm specialising in volume lashes and love working with new models…"
                  className="w-full text-xl border-b-2 border-gray-200 focus:border-teal-600 outline-none pt-2 pb-3 bg-transparent placeholder-gray-300 transition-colors resize-none" />
                <p className="text-xs text-gray-300 mt-3">Optional</p>
              </div>
            )}

            {/* Step 4 — Instagram */}
            {step === 4 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">Your Instagram handle</h2>
                <p className="text-gray-400 mb-10">Models love to browse your work before booking.</p>
                <div className="flex items-baseline border-b-2 border-gray-200 focus-within:border-teal-600 transition-colors">
                  <span className="text-2xl text-gray-300 mr-1">@</span>
                  <input autoFocus value={form.instagramHandle} onChange={e => set('instagramHandle', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleNext()}
                    className="flex-1 text-2xl outline-none py-3 bg-transparent placeholder-gray-300"
                    placeholder="yourstudio" />
                </div>
                <p className="text-xs text-gray-300 mt-3">Optional</p>
              </div>
            )}

            {/* Step 5 — Treatment name */}
            {step === 5 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">Name your first model call</h2>
                <p className="text-gray-400 mb-10">What treatment are you offering?</p>
                <input autoFocus value={form.serviceName} onChange={e => set('serviceName', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canNext() && handleNext()}
                  className={inputCls} placeholder="e.g. Classic Full Set Lashes" />
              </div>
            )}

            {/* Step 6 — Category */}
            {step === 6 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">What category?</h2>
                <p className="text-gray-400 mb-10">Helps models filter by treatment type.</p>
                <div className="flex flex-wrap gap-3">
                  {CATEGORIES.map(cat => (
                    <button key={cat}
                      onClick={() => { setForm(p => ({ ...p, category: cat })); setStep(s => s + 1); }}
                      className="px-5 py-2.5 rounded-full border-2 font-semibold transition text-sm"
                      style={form.category === cat
                        ? { borderColor: '#0D9488', backgroundColor: '#0D9488', color: '#fff' }
                        : { borderColor: '#E2E8F0', color: '#64748B' }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7 — Pricing */}
            {step === 7 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">Set your pricing</h2>
                <p className="text-gray-400 mb-10">Show models exactly how much they're saving.</p>
                <div className="space-y-10">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Full retail price</p>
                    <div className="flex items-baseline border-b-2 border-gray-200 focus-within:border-teal-600 transition-colors">
                      <span className="text-2xl text-gray-300 mr-2">$</span>
                      <input autoFocus type="number" min={0} value={form.originalPrice}
                        onChange={e => set('originalPrice', e.target.value)}
                        className="flex-1 text-2xl outline-none py-3 bg-transparent placeholder-gray-300"
                        placeholder="120" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Model call price — enter 0 for FREE</p>
                    <div className="flex items-baseline border-b-2 border-gray-200 focus-within:border-teal-600 transition-colors">
                      <span className="text-2xl text-gray-300 mr-2">$</span>
                      <input type="number" min={0} value={form.modelPrice}
                        onChange={e => set('modelPrice', e.target.value)}
                        className="flex-1 text-2xl outline-none py-3 bg-transparent placeholder-gray-300"
                        placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 8 — Duration */}
            {step === 8 && (
              <div>
                <p className="font-semibold text-sm mb-3" style={{ color: '#0D9488' }}>{step} / {TOTAL_STEPS}</p>
                <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-2">How long does it take?</h2>
                <p className="text-gray-400 mb-10">Tap to select, then hit &ldquo;List my business&rdquo;.</p>
                <div className="flex flex-wrap gap-3">
                  {DURATIONS.map(d => (
                    <button key={d}
                      onClick={() => setForm(p => ({ ...p, durationMin: d }))}
                      className="px-5 py-3 rounded-xl border-2 font-semibold transition text-sm"
                      style={form.durationMin === d
                        ? { borderColor: '#0D9488', backgroundColor: '#0D9488', color: '#fff' }
                        : { borderColor: '#E2E8F0', color: '#64748B' }}>
                      {fmtDuration(d)}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Sticky footer nav */}
        <div className="border-t bg-white px-6 py-5 flex justify-between items-center">
          {step > 1 ? (
            <button onClick={() => { setError(''); setStep(s => s - 1); }}
              className="text-sm font-semibold text-gray-500 hover:text-gray-900 underline underline-offset-2 transition">
              Back
            </button>
          ) : <div />}
          <button
            onClick={handleNext}
            disabled={!canNext() || saving}
            className="px-8 py-3 rounded-full font-bold text-sm transition"
            style={canNext() && !saving
              ? { background: 'linear-gradient(135deg,#0D9488,#065F46)', color: '#fff' }
              : { backgroundColor: '#F1F5F9', color: '#CBD5E1', cursor: 'not-allowed' }}>
            {saving ? 'Saving…' : step === TOTAL_STEPS ? '🚀 List my business' : 'Next →'}
          </button>
        </div>

      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/api/auth/signin?callbackUrl=/onboard',
        permanent: false,
      },
    };
  }
  if (session.user.role === 'BUSINESS_OWNER' || session.user.role === 'ADMIN') {
    return { redirect: { destination: '/dashboard', permanent: false } };
  }
  return { props: {} };
};
