// pages/business/setup.tsx
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authOptions } from '../../lib/auth';
import prisma from '../../lib/prisma';

type Tab = 'services' | 'availability' | 'policy';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMin: number;
  bufferMin: number;
  isActive: boolean;
}

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Policy {
  cancellationWindowHours: number;
  lateCancellationRefundPercent: number;
  noShowFeePercent: number;
  approvalMode: string;
  minLeadTimeHours: number;
  maxLeadTimeDays: number;
  depositRequired: boolean;
  depositPercent: number;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Props {
  businessId: string;
  businessName: string;
}

export default function BusinessSetup({ businessId, businessName }: Props) {
  const [tab, setTab] = useState<Tab>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setMessage(null);
    if (tab === 'services') loadServices();
    else if (tab === 'availability') loadAvailability();
    else if (tab === 'policy') loadPolicy();
  }, [tab]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/services`);
      const data = await res.json();
      setServices(Array.isArray(data) ? data : data.services ?? []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailability = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/availability`);
      const data = await res.json();
      setAvailability(data.schedule ?? []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load availability' });
    } finally {
      setLoading(false);
    }
  };

  const loadPolicy = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/business/${businessId}/policy`);
      const data = await res.json();
      setPolicy(data);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load policy' });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = async (serviceId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/business/${businessId}/services`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, isActive: !isActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setServices((prev) =>
        prev.map((s) => (s.id === serviceId ? { ...s, isActive: !isActive } : s))
      );
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Update failed' });
    }
  };

  const saveAvailability = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/business/${businessId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: availability }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Save failed');
      setMessage({ type: 'success', text: 'Availability saved!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const savePolicy = async () => {
    if (!policy) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/business/${businessId}/policy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? 'Save failed');
      setMessage({ type: 'success', text: 'Policy saved!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  if (!businessId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">No business found for your account. Contact support.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Setup | {businessName}</title>
      </Head>

      <nav className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl">{businessName} &mdash; Setup</div>
            <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['services', 'availability', 'policy'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition -mb-px ${
                tab === t
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading&hellip;</p>
        ) : (
          <>
            {/* ---- Services ---- */}
            {tab === 'services' && (
              <div className="bg-white rounded-lg shadow divide-y">
                {services.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 text-sm">
                    No services yet. Use the API to create services.
                  </p>
                ) : (
                  services.map((svc) => (
                    <div key={svc.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-gray-900">{svc.name}</p>
                        <p className="text-sm text-gray-500">
                          {svc.durationMin} min &middot; ${(svc.price / 100).toFixed(2)} &middot;{' '}
                          {svc.bufferMin}m buffer
                        </p>
                        {svc.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{svc.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleService(svc.id, svc.isActive)}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition ${
                          svc.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700'
                        }`}
                      >
                        {svc.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ---- Availability ---- */}
            {tab === 'availability' && (
              <div>
                <div className="bg-white rounded-lg shadow divide-y mb-4">
                  {DAY_NAMES.map((day, idx) => {
                    const slot = availability.find((a) => a.dayOfWeek === idx);
                    return (
                      <div key={day} className="flex items-center gap-4 p-4">
                        <span className="w-10 text-sm font-medium text-gray-700">{day}</span>
                        {slot ? (
                          <>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                setAvailability((prev) =>
                                  prev.map((a) =>
                                    a.dayOfWeek === idx ? { ...a, startTime: e.target.value } : a
                                  )
                                )
                              }
                              className="p-1 border rounded text-sm"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                setAvailability((prev) =>
                                  prev.map((a) =>
                                    a.dayOfWeek === idx ? { ...a, endTime: e.target.value } : a
                                  )
                                )
                              }
                              className="p-1 border rounded text-sm"
                            />
                            <button
                              onClick={() =>
                                setAvailability((prev) => prev.filter((a) => a.dayOfWeek !== idx))
                              }
                              className="text-xs text-red-500 hover:underline"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              setAvailability((prev) => [
                                ...prev,
                                {
                                  id: `new-${idx}`,
                                  dayOfWeek: idx,
                                  startTime: '09:00',
                                  endTime: '17:00',
                                },
                              ])
                            }
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            + Add hours
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={saveAvailability}
                  disabled={saving}
                  className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving\u2026' : 'Save Availability'}
                </button>
              </div>
            )}

            {/* ---- Policy ---- */}
            {tab === 'policy' && policy && (
              <div>
                <div className="bg-white rounded-lg shadow p-6 space-y-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">
                        Free Cancellation Window (hours)
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={policy.cancellationWindowHours}
                        onChange={(e) =>
                          setPolicy((p) => p && { ...p, cancellationWindowHours: Number(e.target.value) })
                        }
                        className="mt-1 block w-full border rounded p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Late Cancel Refund %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={policy.lateCancellationRefundPercent}
                        onChange={(e) =>
                          setPolicy((p) =>
                            p && { ...p, lateCancellationRefundPercent: Number(e.target.value) }
                          )
                        }
                        className="mt-1 block w-full border rounded p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">No-Show Fee %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={policy.noShowFeePercent}
                        onChange={(e) =>
                          setPolicy((p) => p && { ...p, noShowFeePercent: Number(e.target.value) })
                        }
                        className="mt-1 block w-full border rounded p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Min Lead Time (hours)</span>
                      <input
                        type="number"
                        min={0}
                        value={policy.minLeadTimeHours}
                        onChange={(e) =>
                          setPolicy((p) => p && { ...p, minLeadTimeHours: Number(e.target.value) })
                        }
                        className="mt-1 block w-full border rounded p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Max Lead Time (days)</span>
                      <input
                        type="number"
                        min={1}
                        value={policy.maxLeadTimeDays}
                        onChange={(e) =>
                          setPolicy((p) => p && { ...p, maxLeadTimeDays: Number(e.target.value) })
                        }
                        className="mt-1 block w-full border rounded p-2 text-sm"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700">Deposit %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={policy.depositPercent}
                        onChange={(e) =>
                          setPolicy((p) => p && { ...p, depositPercent: Number(e.target.value) })
                        }
                        className="mt-1 block w-full border rounded p-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={policy.depositRequired}
                        onChange={(e) =>
                          setPolicy((p) => p && { ...p, depositRequired: e.target.checked })
                        }
                      />
                      Require deposit
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={policy.approvalMode === 'MANUAL'}
                        onChange={(e) =>
                          setPolicy((p) =>
                            p && {
                              ...p,
                              approvalMode: e.target.checked ? 'MANUAL' : 'AUTO_CONFIRM',
                            }
                          )
                        }
                      />
                      Manual approval required
                    </label>
                  </div>
                </div>
                <button
                  onClick={savePolicy}
                  disabled={saving}
                  className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? 'Saving\u2026' : 'Save Policy'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/api/auth/signin?callbackUrl=/business/setup',
        permanent: false,
      },
    };
  }

  const role = session.user.role;
  if (role !== 'BUSINESS_OWNER' && role !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } };
  }

  const business = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  });

  return {
    props: {
      businessId: business?.id ?? '',
      businessName: business?.name ?? 'My Business',
    },
  };
};
