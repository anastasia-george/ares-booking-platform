// pages/api/webhooks/stripe.ts
// Stripe webhook endpoint.
// Handles: payment_intent.succeeded, payment_intent.payment_failed
//
// CRITICAL: This route must receive the raw request body (not parsed JSON) so
// Stripe can verify the signature. The config export below disables Next.js bodyParser.
//
// Setup:
//   1. Set STRIPE_WEBHOOK_SECRET in your .env (from `stripe listen --forward-to`)
//   2. In Stripe Dashboard → Webhooks, add endpoint: https://yourdomain/api/webhooks/stripe
//   3. Subscribe to: payment_intent.succeeded, payment_intent.payment_failed
import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../stripe-payments';
import { BookingEngine } from '../../../booking-engine';
import prisma from '../../../lib/prisma';
import { sendBookingConfirmation } from '../../../notification-manager';
import Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false, // REQUIRED: Stripe signature verification needs raw body
  },
};

const bookingEngine = new BookingEngine();

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set.');
    return res.status(500).json({ error: 'Webhook secret not configured.' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type} id=${event.id}`);

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) {
          console.warn('[Stripe Webhook] payment_intent.succeeded: no bookingId in metadata');
          break;
        }

        // Confirm the booking (PENDING_PAYMENT → CONFIRMED or PENDING based on policy)
        const updated = await bookingEngine.confirmAfterPayment(
          bookingId,
          intent.id,
          intent.amount
        );

        // Fetch full booking context for notification
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            user: { select: { id: true, email: true } },
            service: { select: { name: true } },
            business: { select: { name: true } },
          },
        });

        if (booking?.user.email) {
          // Get business owner email for notification
          const ownerBiz = await prisma.business.findUnique({
            where: { id: booking.businessId },
            include: { owner: { select: { email: true } } },
          });

          await sendBookingConfirmation({
            userEmail: booking.user.email,
            businessEmail: ownerBiz?.owner.email ?? '',
            userId: booking.user.id,
            bookingId,
            serviceName: booking.service.name,
            date: booking.startTime.toISOString().slice(0, 10),
            time: booking.startTime.toISOString().slice(11, 16),
            businessName: booking.business?.name ?? '',
          });
        }

        console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (status: ${updated.status})`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent;
        const bookingId = intent.metadata?.bookingId;
        if (!bookingId) break;

        // Mark payment as failed; booking stays PENDING_PAYMENT for retry or cleanup
        await prisma.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: 'failed' },
        });

        await prisma.auditLog.create({
          data: {
            action: 'PAYMENT_FAILED',
            entityId: bookingId,
            actorId: 'SYSTEM',
            details: {
              paymentIntentId: intent.id,
              error: intent.last_payment_error?.message,
            },
          },
        });

        console.log(`[Stripe Webhook] Payment failed for booking ${bookingId}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error('[Stripe Webhook] Handler error:', err);
    // Return 200 to prevent Stripe from retrying — we've logged the error
    // Change to 500 only if you want Stripe to retry
    return res.status(200).json({ received: true, warning: 'Handler error — check logs.' });
  }

  return res.status(200).json({ received: true });
}
