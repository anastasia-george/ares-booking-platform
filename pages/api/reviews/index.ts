// pages/api/reviews/index.ts — POST to submit a review for a COMPLETED booking
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  }

  const { bookingId, rating, comment } = req.body;
  if (!bookingId || !rating) {
    return res.status(400).json({ error: 'bookingId and rating are required' });
  }
  const ratingNum = Number(rating);
  if (ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be between 1 and 5' });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { review: true },
  });
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  if (booking.userId !== session.user.id) return res.status(403).json({ error: 'FORBIDDEN' });
  if (booking.status !== 'COMPLETED') {
    return res.status(400).json({ error: 'Only COMPLETED bookings can be reviewed' });
  }
  if (booking.review) {
    return res.status(409).json({ error: 'Review already submitted for this booking' });
  }

  const review = await prisma.review.create({
    data: {
      bookingId,
      userId: session.user.id,
      rating: ratingNum,
      comment: comment?.trim() || null,
    },
  });

  // Recalculate and denormalise avgRating on the business
  const allReviews = await prisma.review.findMany({
    where: { booking: { businessId: booking.businessId } },
    select: { rating: true },
  });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await prisma.business.update({
    where: { id: booking.businessId },
    data: { avgRating },
  });

  return res.status(201).json(review);
}
