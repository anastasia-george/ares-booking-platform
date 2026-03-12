// pages/api/business/index.ts — POST to create a new business
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';
import { UserRole } from '@prisma/client';
import { geocodeAU } from '../../../lib/geocode';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const { name, suburb, city, state, bio, instagramHandle } = req.body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  // Check if user already owns a business
  const existing = await prisma.business.findFirst({
    where: { ownerId: session.user.id },
  });
  if (existing) {
    return res.status(409).json({ error: 'You already have a business. Visit your dashboard.' });
  }

  // Generate a unique slug
  let baseSlug = slugify(name);
  let slug = baseSlug;
  let attempt = 0;
  while (await prisma.business.findUnique({ where: { slug } })) {
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // Create business, update user role, create default policy
  const business = await prisma.business.create({
    data: {
      ownerId: session.user.id,
      name: name.trim(),
      slug,
      verified: false,
      isAcceptingModels: true,
      suburb: suburb?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      bio: bio?.trim() || null,
      instagramHandle: instagramHandle?.trim() || null,
    },
  });

  await Promise.all([
    prisma.user.update({
      where: { id: session.user.id },
      data: { role: UserRole.BUSINESS_OWNER },
    }),
    prisma.businessPolicy.create({
      data: {
        businessId: business.id,
        cancellationWindowHours: 24,
        lateCancellationRefundPct: 0,
        noShowFeePercent: 100,
        approvalMode: 'AUTO_CONFIRM',
        minLeadTimeHours: 2,
        maxLeadTimeDays: 60,
        depositRequired: false,
        depositPercent: 0,
      },
    }),
  ]);

  // Fire-and-forget geocoding — don't block the response
  if (business.suburb || business.city || business.state) {
    geocodeAU(business.suburb, business.city, business.state)
      .then((geo) => {
        if (geo) {
          return prisma.business.update({
            where: { id: business.id },
            data: { latitude: geo.lat, longitude: geo.lng },
          });
        }
      })
      .catch(() => { /* best-effort */ });
  }

  return res.status(201).json(business);
}
