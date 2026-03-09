// stripe-payments.ts
import Stripe from 'stripe';
import prisma from './lib/prisma';

// Stripe client — single instance, API version pinned.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export class PaymentManager {
  /**
   * 1. CREATE DEPOSIT HOLD
   * Creates a Stripe PaymentIntent with capture_method: 'manual'.
   * The card is authorised (hold placed) but NOT charged until capture.
   * Returns the client_secret for the frontend to complete payment with Stripe.js.
   *
   * @param userId       - Customer userId
   * @param amountCents  - Deposit amount in cents
   * @param bookingId    - Booking to associate this intent with
   * @param currency     - ISO currency code (default 'aud')
   */
  async createPaymentHold(
    userId: string,
    amountCents: number,
    bookingId: string,
    currency = 'aud'
  ): Promise<string> {
    if (amountCents <= 0) throw new Error('INVALID_AMOUNT: Deposit must be greater than zero.');

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      payment_method_types: ['card'],
      capture_method: 'manual', // Auth-only — do not charge yet
      metadata: { bookingId, userId },
      description: `Deposit hold for booking ${bookingId}`,
    });

    // Record intent ID on booking immediately
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentId: paymentIntent.id,
        paymentStatus: 'authorized',
        depositAmount: amountCents,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_HOLD_CREATED',
        entityId: bookingId,
        actorId: userId,
        details: { paymentIntentId: paymentIntent.id, amountCents },
      },
    });

    return paymentIntent.client_secret!;
  }

  /**
   * 2. CAPTURE PAYMENT (Post-Service)
   * Captures the full authorised amount once the service is delivered.
   * Must be called after completeBooking() in the booking engine.
   */
  async capturePayment(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) throw new Error('MISSING_PAYMENT: No payment intent found.');

    await stripe.paymentIntents.capture(booking.paymentId);

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_CAPTURED',
        entityId: bookingId,
        actorId: 'SYSTEM',
        details: { paymentIntentId: booking.paymentId },
      },
    });
  }

  /**
   * 3. CHARGE NO-SHOW FEE
   * Captures a partial or full deposit as the no-show penalty.
   * feePercent comes from the business policy (noShowFeePercent).
   */
  async chargeNoShowFee(bookingId: string, feePercent: number): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) throw new Error('MISSING_PAYMENT: No payment intent found.');

    const deposit = booking.depositAmount ?? booking.price;
    const amountToCapture = Math.round(deposit * (feePercent / 100));

    if (amountToCapture > 0) {
      await stripe.paymentIntents.capture(booking.paymentId, {
        amount_to_capture: amountToCapture,
      });
    } else {
      // 0% fee — release hold entirely
      await stripe.paymentIntents.cancel(booking.paymentId);
    }

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_NO_SHOW_FEE',
        entityId: bookingId,
        actorId: 'SYSTEM',
        details: { feePercent, amountToCapture },
      },
    });
  }

  /**
   * 4. REFUND — full or partial
   * Refunds a captured charge or cancels an uncaptured hold.
   * @param refundAmountCents Pass undefined to refund the full captured amount.
   */
  async refundPayment(bookingId: string, refundAmountCents?: number): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) throw new Error('MISSING_PAYMENT: No payment intent found.');

    const intent = await stripe.paymentIntents.retrieve(booking.paymentId);

    if (intent.status === 'requires_capture') {
      // Not yet captured — cancel the hold (no charge to customer)
      await stripe.paymentIntents.cancel(booking.paymentId);
    } else if (intent.status === 'succeeded') {
      // Already captured — issue a refund
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: booking.paymentId,
      };
      if (refundAmountCents !== undefined) {
        refundParams.amount = refundAmountCents;
      }
      await stripe.refunds.create(refundParams);
    } else {
      throw new Error(`REFUND_NOT_POSSIBLE: PaymentIntent status is ${intent.status}.`);
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'refunded' },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_REFUNDED',
        entityId: bookingId,
        actorId: 'SYSTEM',
        details: { refundAmountCents: refundAmountCents ?? 'full' },
      },
    });
  }

  /**
   * 5a. CREATE SETUP INTENT (free model call — card on file)
   * Creates or retrieves a Stripe Customer for the user, then creates a
   * SetupIntent to collect card details without charging.
   * Returns { clientSecret, customerId }
   */
  async createSetupIntent(
    userId: string,
    bookingId: string,
    userEmail: string
  ): Promise<{ clientSecret: string; customerId: string }> {
    // Reuse existing Stripe customer if we have one
    let user = await prisma.user.findUnique({ where: { id: userId } });
    let customerId = user?.stripeCustomerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allows future charges for no-shows
      metadata: { bookingId, userId },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentId: setupIntent.id,
        paymentStatus: 'pending_card',
        depositAmount: 0,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'SETUP_INTENT_CREATED',
        entityId: bookingId,
        actorId: userId,
        details: { setupIntentId: setupIntent.id },
      },
    });

    return { clientSecret: setupIntent.client_secret!, customerId };
  }

  /**
   * 5b. CHARGE NO-SHOW FEE FROM SAVED PAYMENT METHOD (free bookings)
   * Used when a free model-call customer no-shows — charge them off-session.
   */
  async chargeNoShowFeeFromPaymentMethod(
    bookingId: string,
    feeAmountCents: number,
    currency = 'aud'
  ): Promise<void> {
    if (feeAmountCents <= 0) return;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking?.paymentMethodId) throw new Error('MISSING_PAYMENT_METHOD: No saved card found.');

    const user = await prisma.user.findUnique({ where: { id: booking.userId } });
    if (!user?.stripeCustomerId) throw new Error('MISSING_STRIPE_CUSTOMER');

    const intent = await stripe.paymentIntents.create({
      amount: feeAmountCents,
      currency,
      customer: user.stripeCustomerId,
      payment_method: booking.paymentMethodId,
      off_session: true,
      confirm: true,
      description: `No-show fee for booking ${bookingId}`,
      metadata: { bookingId, type: 'no_show_fee' },
    });

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'charged_no_show' },
    });

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_NO_SHOW_FEE',
        entityId: bookingId,
        actorId: 'SYSTEM',
        details: { paymentIntentId: intent.id, feeAmountCents },
      },
    });
  }

  /**
   * 5. CANCEL HOLD (zero-charge cancel)
   * Cancels an uncaptured PaymentIntent, releasing the authorisation.
   * Used when a booking is cancelled before the deposit was ever charged.
   */
  async cancelHold(bookingId: string): Promise<void> {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || !booking.paymentId) return; // No payment to release

    const intent = await stripe.paymentIntents.retrieve(booking.paymentId);
    if (intent.status === 'requires_capture') {
      await stripe.paymentIntents.cancel(booking.paymentId);
    }
    // If already cancelled or failed, nothing to do

    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: 'refunded' },
    });
  }
}
