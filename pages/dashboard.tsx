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
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>Business Dashboard | Ares</title>
      </Head>

      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="font-bold text-xl">{businessName}</div>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/business/setup" className="text-indigo-600 hover:underline">
                Setup
              </Link>
              <span className="text-gray-500">{ownerEmail}</span>
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

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
