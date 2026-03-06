// notification-manager.ts
// Email notifications via Resend (https://resend.com).
// FALLBACK BEHAVIOUR: If RESEND_API_KEY is not set, emails are logged to stdout
// and a NotificationLog entry is created with status "failed" and error "NO_API_KEY".
// This means the app runs without crashing; missing emails are visible in the DB.
//
// SMS NOTIFICATIONS: LAUNCH-APPROVED NON-GOAL FOR V1.
// Twilio integration is not active. Phone numbers are stored in the User model
// ready for a future SMS pass. All SMS calls log to stdout only.
//
// REMINDERS (24h before appointment): LAUNCH-APPROVED NON-GOAL FOR V1.
// Requires a cron job (Vercel Cron or external scheduler).
// The sendReminder() method is implemented; invocation is the missing piece.
// See docs/ARCHITECTURE.md for the planned cron setup.

import prisma from './lib/prisma';

const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@yourdomain.com';

// Lazily instantiate Resend to avoid import errors when key is absent.
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Resend } = require('resend');
  return new Resend(key);
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  // For NotificationLog
  type: string;
  userId?: string;
  bookingId?: string;
}

async function sendEmail(params: SendEmailParams): Promise<void> {
  const resend = getResend();
  let status: 'sent' | 'failed' = 'sent';
  let error: string | undefined;

  if (!resend) {
    console.warn(
      `[NOTIFICATION SKIPPED — no RESEND_API_KEY] type=${params.type} to=${params.to} subject="${params.subject}"`
    );
    status = 'failed';
    error = 'NO_API_KEY';
  } else {
    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      console.log(`[NOTIFICATION SENT] type=${params.type} to=${params.to}`);
    } catch (err: any) {
      console.error(`[NOTIFICATION FAILED] type=${params.type} to=${params.to}`, err);
      status = 'failed';
      error = err?.message ?? String(err);
    }
  }

  // Always log to DB for observability
  try {
    await prisma.notificationLog.create({
      data: {
        userId: params.userId ?? null,
        bookingId: params.bookingId ?? null,
        type: params.type,
        channel: 'email',
        to: params.to,
        status,
        error: error ?? null,
      },
    });
  } catch (logErr) {
    // Never let a logging failure bring down the main request
    console.error('[NOTIFICATION LOG FAILED]', logErr);
  }
}

// --- Public API ---

export async function sendBookingConfirmation(opts: {
  userEmail: string;
  businessEmail: string;
  userId: string;
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
  businessName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.userEmail,
    subject: `Booking Confirmed — ${opts.serviceName}`,
    html: `
      <h2>Your booking is confirmed!</h2>
      <p>Hi there,</p>
      <p>Your appointment for <strong>${opts.serviceName}</strong> at <strong>${opts.businessName}</strong>
      is confirmed for <strong>${opts.date} at ${opts.time}</strong>.</p>
      <p>If you need to cancel, please do so at least 24 hours before your appointment.</p>
    `,
    type: 'BOOKING_CONFIRMATION',
    userId: opts.userId,
    bookingId: opts.bookingId,
  });

  await sendEmail({
    to: opts.businessEmail,
    subject: `New Booking — ${opts.serviceName} on ${opts.date}`,
    html: `
      <h2>New Booking Received</h2>
      <p>A new booking has been made for <strong>${opts.serviceName}</strong>
      on <strong>${opts.date} at ${opts.time}</strong>.</p>
    `,
    type: 'BOOKING_CONFIRMATION_BUSINESS',
    bookingId: opts.bookingId,
  });
}

export async function sendCancellationNotice(opts: {
  toEmail: string;
  userId?: string;
  bookingId: string;
  serviceName: string;
  date: string;
  cancelledBy: 'user' | 'business';
  refundAmount?: number; // cents
}): Promise<void> {
  const subject =
    opts.cancelledBy === 'business'
      ? `Booking Cancelled by Business — ${opts.serviceName}`
      : `Your Booking Has Been Cancelled — ${opts.serviceName}`;

  const refundNote =
    opts.refundAmount !== undefined
      ? `<p>A refund of <strong>$${(opts.refundAmount / 100).toFixed(2)}</strong> has been issued to your payment method.</p>`
      : '<p>No deposit was charged, so no refund is required.</p>';

  await sendEmail({
    to: opts.toEmail,
    subject,
    html: `
      <h2>Booking Cancelled</h2>
      <p>Your appointment for <strong>${opts.serviceName}</strong> on <strong>${opts.date}</strong> has been cancelled.</p>
      ${refundNote}
    `,
    type: 'CANCELLATION',
    userId: opts.userId,
    bookingId: opts.bookingId,
  });
}

export async function sendNoShowNotice(opts: {
  userEmail: string;
  userId: string;
  bookingId: string;
  serviceName: string;
  date: string;
  feeChargedCents: number;
}): Promise<void> {
  await sendEmail({
    to: opts.userEmail,
    subject: `No-Show Fee Charged — ${opts.serviceName}`,
    html: `
      <h2>No-Show Recorded</h2>
      <p>You were marked as a no-show for your <strong>${opts.serviceName}</strong> appointment on <strong>${opts.date}</strong>.</p>
      <p>A no-show fee of <strong>$${(opts.feeChargedCents / 100).toFixed(2)}</strong> has been charged to your payment method.</p>
      <p>Repeated no-shows may affect your ability to book in future. Please contact support if you believe this is an error.</p>
    `,
    type: 'NO_SHOW',
    userId: opts.userId,
    bookingId: opts.bookingId,
  });
}

export async function sendDisputeOpenedNotice(opts: {
  adminEmail: string;
  bookingId: string;
  reason: string;
}): Promise<void> {
  await sendEmail({
    to: opts.adminEmail,
    subject: `Dispute Opened — Booking ${opts.bookingId}`,
    html: `
      <h2>A Dispute Has Been Opened</h2>
      <p>Booking ID: <strong>${opts.bookingId}</strong></p>
      <p>Reason: ${opts.reason}</p>
      <p>Please review this dispute in the admin panel.</p>
    `,
    type: 'DISPUTE',
    bookingId: opts.bookingId,
  });
}

export async function sendReminder(opts: {
  userEmail: string;
  userId: string;
  bookingId: string;
  serviceName: string;
  date: string;
  time: string;
  businessName: string;
}): Promise<void> {
  await sendEmail({
    to: opts.userEmail,
    subject: `Reminder: ${opts.serviceName} Tomorrow at ${opts.time}`,
    html: `
      <h2>Appointment Reminder</h2>
      <p>This is a reminder that you have a <strong>${opts.serviceName}</strong> appointment
      at <strong>${opts.businessName}</strong> tomorrow, <strong>${opts.date} at ${opts.time}</strong>.</p>
      <p>If you need to cancel, please do so before the cancellation window closes.</p>
    `,
    type: 'REMINDER',
    userId: opts.userId,
    bookingId: opts.bookingId,
  });
}

// SMS — LAUNCH-APPROVED NON-GOAL FOR V1
// Twilio credentials required: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
export async function sendSMS(to: string, body: string): Promise<void> {
  console.log(`[SMS NON-GOAL V1] Would send to ${to}: ${body}`);
  // Future implementation:
  // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await twilio.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body });
}

// Legacy class export for backward compatibility with existing callers
export class NotificationManager {
  sendBookingConfirmation = sendBookingConfirmation;
  sendCancellationNotice = sendCancellationNotice;
  sendNoShowNotice = sendNoShowNotice;
  sendDisputeOpenedNotice = sendDisputeOpenedNotice;
  sendReminder = sendReminder;
}
