// pages/dashboard.tsx
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Head from 'next/head';
import BusinessDashboard from '../components/BusinessDashboard';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  // Hardcoded for MVP (Use seeded Business ID)
  const businessId = "e2a2f459-8f8d-41b4-8839-810a31434c9a";

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn();
    }
  }, [status]);

  if (status === "loading" || !session) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Business Dashboard | Ares</title>
      </Head>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center font-bold text-xl">
              Ares Demo Salon
            </div>
            <div className="flex items-center text-sm text-gray-500">
              Admin: {session.user?.email}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <BusinessDashboard businessId={businessId} />
      </main>
    </div>
  );
}
