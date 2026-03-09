// pages/onboard.tsx — 3-step business onboarding wizard
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { authOptions } from '../lib/auth';

const CATEGORIES = ['Lashes', 'Nails', 'Facials', 'Hair', 'Brows', 'Makeup', 'Waxing', 'Massage', 'Other'];
const AUS_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

interface Step1State {
  name: string;
  suburb: string;
  city: string;
  state: string;
  bio: string;
  instagramHandle: string;
}

interface Step2State {
  serviceName: string;
  category: string;
  originalPrice: string;
  modelPrice: string;
  durationMin: string;
  description: string;
}

const inputCls =
  'mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400';
const labelCls = 'block text-sm font-medium text-gray-700';

export default function OnboardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdBizId, setCreatedBizId] = useState('');

  const [step1, setStep1] = useState<Step1State>({
    name: '',
    suburb: '',
    city: '',
    state: 'NSW',
    bio: '',
    instagramHandle: '',
  });

  const [step2, setStep2] = useState<Step2State>({
    serviceName: '',
    category: 'Lashes',
    originalPrice: '',
    modelPrice: '0',
    durationMin: '60',
    description: '',
  });

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step1.name.trim()) {
      setError('Business name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(step1),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create business');
        return;
      }
      setCreatedBizId(data.id);
      setStep(2);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!step2.serviceName.trim()) {
      setError('Service name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/business/${createdBizId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: step2.serviceName.trim(),
          category: step2.category,
          originalPrice: step2.originalPrice
            ? Math.round(parseFloat(step2.originalPrice) * 100)
            : null,
          price: Math.round(parseFloat(step2.modelPrice || '0') * 100),
          durationMin: parseInt(step2.durationMin, 10) || 60,
          description: step2.description.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to create service');
        return;
      }
      setStep(3);
    } catch {
      setError('Network error — please try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Head>
        <title>List Your Business | ModelCall</title>
      </Head>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-lg">
          {/* Progress bar */}
          <div className="flex items-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition ${
                    step >= s ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`flex-1 h-1 mx-1 rounded transition ${
                      step > s ? 'bg-pink-400' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border p-8">
            {error && (
              <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
            )}

            {/* ---- Step 1: Business basics ---- */}
            {step === 1 && (
              <form onSubmit={handleStep1} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900">About your business</h2>
                  <p className="text-sm text-gray-500 mt-1">Tell models where to find you.</p>
                </div>

                <label className={labelCls}>
                  Business name *
                  <input
                    required
                    value={step1.name}
                    onChange={(e) => setStep1((p) => ({ ...p, name: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. Glow Lash Studio"
                  />
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className={labelCls}>
                    Suburb
                    <input
                      value={step1.suburb}
                      onChange={(e) => setStep1((p) => ({ ...p, suburb: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g. Surry Hills"
                    />
                  </label>
                  <label className={labelCls}>
                    City
                    <input
                      value={step1.city}
                      onChange={(e) => setStep1((p) => ({ ...p, city: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g. Sydney"
                    />
                  </label>
                </div>

                <label className={labelCls}>
                  State
                  <select
                    value={step1.state}
                    onChange={(e) => setStep1((p) => ({ ...p, state: e.target.value }))}
                    className={inputCls}
                  >
                    {AUS_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className={labelCls}>
                  Bio
                  <textarea
                    value={step1.bio}
                    onChange={(e) => setStep1((p) => ({ ...p, bio: e.target.value }))}
                    rows={3}
                    className={inputCls}
                    placeholder="Tell models what makes your practice special…"
                  />
                </label>

                <label className={labelCls}>
                  Instagram handle
                  <div className="mt-1 flex rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-pink-400">
                    <span className="px-3 py-2.5 bg-gray-50 text-gray-500 text-sm border-r">@</span>
                    <input
                      value={step1.instagramHandle}
                      onChange={(e) => setStep1((p) => ({ ...p, instagramHandle: e.target.value }))}
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                      placeholder="yourstudio"
                    />
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl font-semibold transition"
                >
                  {saving ? 'Saving…' : 'Next: Add your first service →'}
                </button>
              </form>
            )}

            {/* ---- Step 2: First model-call service ---- */}
            {step === 2 && (
              <form onSubmit={handleStep2} className="space-y-4">
                <div className="mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Your first model call</h2>
                  <p className="text-sm text-gray-500 mt-1">Set your treatment details and model call price.</p>
                </div>

                <label className={labelCls}>
                  Treatment name *
                  <input
                    required
                    value={step2.serviceName}
                    onChange={(e) => setStep2((p) => ({ ...p, serviceName: e.target.value }))}
                    className={inputCls}
                    placeholder="e.g. Classic Full Set Lashes"
                  />
                </label>

                <label className={labelCls}>
                  Category
                  <select
                    value={step2.category}
                    onChange={(e) => setStep2((p) => ({ ...p, category: e.target.value }))}
                    className={inputCls}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-4">
                  <label className={labelCls}>
                    Full retail price ($)
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={step2.originalPrice}
                      onChange={(e) => setStep2((p) => ({ ...p, originalPrice: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g. 120"
                    />
                  </label>
                  <label className={labelCls}>
                    Model call price ($)
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={step2.modelPrice}
                      onChange={(e) => setStep2((p) => ({ ...p, modelPrice: e.target.value }))}
                      className={inputCls}
                      placeholder="0 = FREE"
                    />
                  </label>
                </div>

                <label className={labelCls}>
                  Duration (minutes)
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={step2.durationMin}
                    onChange={(e) => setStep2((p) => ({ ...p, durationMin: e.target.value }))}
                    className={inputCls}
                  />
                </label>

                <label className={labelCls}>
                  Description
                  <textarea
                    value={step2.description}
                    onChange={(e) => setStep2((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                    className={inputCls}
                    placeholder="What's included?"
                  />
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-xl font-semibold transition"
                  >
                    {saving ? 'Saving…' : 'Next →'}
                  </button>
                </div>
              </form>
            )}

            {/* ---- Step 3: Done ---- */}
            {step === 3 && (
              <div className="text-center space-y-5 py-4">
                <div className="text-5xl">🎉</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">You&apos;re listed!</h2>
                  <p className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">
                    Set your availability and booking policy in your dashboard to start receiving models.
                  </p>
                </div>
                <button
                  onClick={() => (window.location.href = '/dashboard')}
                  className="w-full py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-semibold transition"
                >
                  Go to Dashboard →
                </button>
              </div>
            )}
          </div>
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
