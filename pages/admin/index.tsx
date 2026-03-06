// pages/admin/index.tsx
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { authOptions } from '../../lib/auth';

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  disputedBookings: number;
  totalRevenueCents: number;
  totalUsers: number;
  totalBusinesses: number;
}

interface Dispute {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  booking: { id: string; startTime: string };
  reporter: { name: string | null; email: string };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDisputes, setRecentDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, disputesRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/disputes?status=OPEN'),
        ]);

        if (!statsRes.ok) throw new Error(`Stats: HTTP ${statsRes.status}`);
        const statsData = await statsRes.json();
        const disputesData = disputesRes.ok ? await disputesRes.json() : [];

        setStats(statsData);
        setRecentDisputes(
          (Array.isArray(disputesData) ? disputesData : disputesData.disputes ?? []).slice(0, 5)
        );
      } catch (err: any) {
        setError(err.message ?? 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Admin Dashboard | Ares</title>
      </Head>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl text-red-600">Ares Admin</div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/admin/disputes" className="text-indigo-600 hover:underline">
                Disputes
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-red-600 hover:text-red-800 underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading && <p className="text-gray-500 text-center py-8">Loading&hellip;</p>}
        {error && (
          <div className="bg-red-50 text-red-700 rounded p-4 mb-6">{error}</div>
        )}

        {stats && (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Bookings', value: stats.totalBookings },
                { label: 'Confirmed', value: stats.confirmedBookings, color: 'text-green-600' },
                { label: 'Pending', value: stats.pendingBookings, color: 'text-yellow-600' },
                { label: 'No-Shows', value: stats.noShowBookings, color: 'text-red-600' },
                { label: 'Completed', value: stats.completedBookings, color: 'text-blue-600' },
                { label: 'Open Disputes', value: stats.disputedBookings, color: 'text-purple-600' },
                { label: 'Total Users', value: stats.totalUsers },
                {
                  label: 'Total Revenue',
                  value: `$${(stats.totalRevenueCents / 100).toFixed(2)}`,
                  color: 'text-green-700',
                },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-lg shadow p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{kpi.label}</p>
                  <p className={`text-2xl font-bold ${kpi.color ?? 'text-gray-900'}`}>
                    {kpi.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Recent Open Disputes */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Open Disputes</h2>
                <Link href="/admin/disputes" className="text-sm text-indigo-600 hover:underline">
                  View all &rarr;
                </Link>
              </div>
              {recentDisputes.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm">No open disputes.</p>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentDisputes.map((d) => (
                      <tr key={d.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{d.reporter.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{d.reason}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Link href="/admin/disputes" className="text-indigo-600 hover:underline text-sm">
                            Resolve
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
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
      redirect: { destination: '/api/auth/signin?callbackUrl=/admin', permanent: false },
    };
  }

  if (session.user.role !== 'ADMIN') {
    return { redirect: { destination: '/', permanent: false } };
  }

  return { props: {} };
};
