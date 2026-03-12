// pages/dashboard.tsx
import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth/next';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { authOptions } from '../lib/auth';
import prisma from '../lib/prisma';
import BusinessDashboard from '../components/BusinessDashboard';

interface Props {
  businessId: string;
  businessName: string;
  ownerEmail: string;
}

export default function Dashboard({ businessId, businessName, ownerEmail }: Props) {
  return (
      <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <Head>
        <title>{businessName} | Dashboard | Model Call</title>
      </Head>

      {/* Dashboard nav banner */}
      <div style={{ backgroundColor: '#0F172A' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-extrabold text-white"
                style={{ background: 'linear-gradient(135deg,#0D9488,#065F46)' }}>
                {businessName[0]}
              </div>
              <span className="font-bold text-white text-sm">{businessName}</span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: 'rgba(13,148,136,0.2)', color: '#0D9488' }}>Dashboard</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Link href="/business/setup"
                className="font-semibold hover:opacity-80 transition"
                style={{ color: '#0D9488' }}>Setup</Link>
              <span className="hidden sm:inline" style={{ color: '#64748B' }}>{ownerEmail}</span>
              <button onClick={() => signOut({ callbackUrl: '/' })}
                className="font-semibold hover:opacity-80 transition"
                style={{ color: '#94A3B8' }}>Sign Out</button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <BusinessDashboard businessId={businessId} />
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: {
        destination: '/api/auth/signin?callbackUrl=/dashboard',
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

  if (!business) {
    // Authenticated as BUSINESS_OWNER but no business created yet
    return { redirect: { destination: '/business/setup', permanent: false } };
  }

  return {
    props: {
      businessId: business.id,
      businessName: business.name,
      ownerEmail: session.user.email ?? '',
    },
  };
};
