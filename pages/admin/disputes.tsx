// pages/admin/disputes.tsx
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { authOptions } from '../../lib/auth';

interface Dispute {
  id: string;
  status: string;
  reason: string;
  resolution: string | null;
  createdAt: string;
  booking: {
    id: string;
    startTime: string;
    user: { email: string };
    business: { name: string };
  };
  reporter: { name: string | null; email: string };
}

const STATUS_OPTIONS = [
  'OPEN',
  'UNDER_REVIEW',
  'RESOLVED_FOR_CUSTOMER',
  'RESOLVED_FOR_BUSINESS',
  'CLOSED',
];

export default function AdminDisputes() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [resolving, setResolving] = useState<Record<string, boolean>>({});

  const loadDisputes = async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disputes?status=${status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDisputes(Array.isArray(data) ? data : data.disputes ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes(statusFilter);
  }, [statusFilter]);

  const resolveDispute = async (
    disputeId: string,
    resolution: 'RESOLVED_FOR_CUSTOMER' | 'RESOLVED_FOR_BUSINESS',
    refund: boolean
  ) => {
    const label = resolution === 'RESOLVED_FOR_CUSTOMER' ? 'customer' : 'business';
    const note = window.prompt(`Resolve for ${label} — enter a resolution note:`);
    if (note === null) return; // cancelled

    setResolving((prev) => ({ ...prev, [disputeId]: true }));
    try {
      const res = await fetch('/api/admin/disputes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disputeId,
          status: resolution,
          resolution: note,
          refund,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? 'Failed to resolve');
      }
      setDisputes((prev) => prev.filter((d) => d.id !== disputeId));
    } catch (err: any) {
      alert(err.message ?? 'Failed to resolve dispute');
    } finally {
      setResolving((prev) => ({ ...prev, [disputeId]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Disputes | Ares Admin</title>
      </Head>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/admin" className="font-bold text-xl text-red-600">
              &larr; Ares Admin
            </Link>
            <span className="text-sm text-gray-500">Dispute Management</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Status filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                statusFilter === s
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && <p className="text-gray-500 py-8 text-center">Loading&hellip;</p>}
        {error && <p className="text-red-500 bg-red-50 p-4 rounded">{error}</p>}

        {!loading && !error && (
          <div className="bg-white shadow rounded-lg overflow-x-auto">
            {disputes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No {statusFilter} disputes.</p>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{d.reporter.email}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">{d.booking.business.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(d.booking.startTime).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-xs">
                        <p className="truncate">{d.reason}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                          resolving[d.id] ? (
                            <span className="text-gray-400 text-xs">Resolving&hellip;</span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => resolveDispute(d.id, 'RESOLVED_FOR_CUSTOMER', true)}
                                className="text-xs text-blue-600 hover:underline text-left"
                              >
                                &rarr; Customer wins (refund)
                              </button>
                              <button
                                onClick={() => resolveDispute(d.id, 'RESOLVED_FOR_BUSINESS', false)}
                                className="text-xs text-orange-600 hover:underline text-left"
                              >
                                &rarr; Business wins
                              </button>
                            </div>
                          )
                        )}
                        {d.resolution && (
                          <p className="text-xs text-gray-400 mt-1 italic">{d.resolution}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
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
        destination: '/api/auth/signin?callbackUrl=/admin/disputes',
        permanent: false,
      },
    };
  }

  if (session.user.role !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: {} };
};
