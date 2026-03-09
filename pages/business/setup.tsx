// pages/business/setup.tsx
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authOptions } from '../../lib/auth';
import prisma from '../../lib/prisma';

type Tab = 'services' | 'availability' | 'policy';

const SERVICE_CATEGORIES = ['Lashes', 'Nails', 'Facials', 'Hair', 'Brows', 'Makeup', 'Waxing', 'Massage', 'Other'];

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string | null;
  durationMin: number;
  bufferMin: number;
  isActive: boolean;
}

interface NewServiceForm {
  name: string;
  category: string;
  originalPrice: string;
  price: string;
  durationMin: string;
  bufferMin: string;
  description: string;
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
  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [newService, setNewService] = useState<NewServiceForm>({
    name: '', category: 'Lashes', originalPrice: '', price: '0',
    durationMin: '60', bufferMin: '15', description: '',
  });
  const [creatingService, setCreatingService] = useState(false);

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

  const createService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name.trim()) return;
    setCreatingService(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/business/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newService.name.trim(),
          category: newService.category,
          originalPrice: newService.originalPrice ? Math.round(parseFloat(newService.originalPrice) * 100) : null,
          price: Math.round(parseFloat(newService.price || '0') * 100),
          durationMin: parseInt(newService.durationMin, 10) || 60,
          bufferMin: parseInt(newService.bufferMin, 10) || 15,
          description: newService.description.trim() || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      setMessage({ type: 'success', text: 'Service created!' });
      setShowNewServiceForm(false);
      setNewService({ name: '', category: 'Lashes', originalPrice: '', price: '0', durationMin: '60', bufferMin: '15', description: '' });
      await loadServices();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message ?? 'Failed to create service' });
    } finally {
      setCreatingService(false);
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

      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-gray-400 mb-0.5">Managing</p>
          <h1 className="text-lg font-bold text-gray-900">{businessName}</h1>
        </div>
      </div>

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
              <div>
                <div className="bg-white rounded-lg shadow divide-y mb-4">
                  {services.length === 0 ? (
                    <p className="text-gray-500 text-center py-8 text-sm">No services yet. Add one below.</p>
                  ) : (
                    services.map((svc) => (
                      <div key={svc.id} className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-medium text-gray-900">{svc.name}</p>
                          <p className="text-sm text-gray-500">
                            {svc.durationMin} min &middot;{' '}
                            <span className={svc.price === 0 ? 'text-green-600 font-medium' : ''}>
                              {svc.price === 0 ? 'FREE' : `$${(svc.price / 100).toFixed(2)}`}
                            </span>
                            {svc.originalPrice && svc.originalPrice > svc.price && (
                              <span className="text-gray-400 line-through ml-1">
                                ${(svc.originalPrice / 100).toFixed(2)}
                              </span>
                            )}
                            {svc.category && (
                              <span className="ml-2 text-pink-500">{svc.category}</span>
                            )}
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

                {/* New service form */}
                {!showNewServiceForm ? (
                  <button
                    onClick={() => setShowNewServiceForm(true)}
                    className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 hover:border-pink-400 hover:text-pink-500 rounded-lg text-sm font-medium transition"
                  >
                    + Add Service
                  </button>
                ) : (
                  <form onSubmit={createService} className="bg-white rounded-lg shadow p-5 space-y-4">
                    <h3 className="font-semibold text-gray-900">New Service</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="block col-span-full">
                        <span className="text-sm font-medium text-gray-700">Name *</span>
                        <input required value={newService.name}
                          onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm" placeholder="e.g. Classic Full Set" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Category</span>
                        <select value={newService.category}
                          onChange={(e) => setNewService((p) => ({ ...p, category: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm">
                          {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Full retail price ($)</span>
                        <input type="number" min={0} step={0.01} value={newService.originalPrice}
                          onChange={(e) => setNewService((p) => ({ ...p, originalPrice: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm" placeholder="e.g. 120" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Model price ($)</span>
                        <input type="number" min={0} step={0.01} value={newService.price}
                          onChange={(e) => setNewService((p) => ({ ...p, price: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm" placeholder="0 = FREE" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Duration (min)</span>
                        <input type="number" min={15} step={15} value={newService.durationMin}
                          onChange={(e) => setNewService((p) => ({ ...p, durationMin: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm" />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Buffer (min)</span>
                        <input type="number" min={0} step={5} value={newService.bufferMin}
                          onChange={(e) => setNewService((p) => ({ ...p, bufferMin: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm" />
                      </label>
                      <label className="block col-span-full">
                        <span className="text-sm font-medium text-gray-700">Description</span>
                        <textarea value={newService.description} rows={2}
                          onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                          className="mt-1 w-full border rounded p-2 text-sm" placeholder="What's included?" />
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" disabled={creatingService}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-sm font-medium">
                        {creatingService ? 'Saving\u2026' : 'Save Service'}
                      </button>
                      <button type="button" onClick={() => setShowNewServiceForm(false)}
                        className="px-5 py-2 border text-gray-600 rounded text-sm hover:bg-gray-50">
                        Cancel
                      </button>
                    </div>
                  </form>
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
