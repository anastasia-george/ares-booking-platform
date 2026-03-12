// components/StripeCheckout.tsx
// Stripe payment form — handles both paid (PaymentIntent) and free (SetupIntent) flows.
// Must NOT be rendered server-side. Import via `next/dynamic` with `{ ssr: false }`.
import React, { useState } from 'react';
import type { Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Lazy-load Stripe SDK — the ~40 KB bundle is only fetched when StripeCheckout renders.
let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  if (!stripePromise) {
    stripePromise = import('@stripe/stripe-js').then((m) =>
      m.loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')
    );
  }
  return stripePromise;
}

function CheckoutForm({
  isFree,
  onSuccess,
  onCancel,
}: {
  isFree: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    if (isFree) {
      // SetupIntent — collect card without charging
      const { error: stripeError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/my-bookings?setup=success`,
        },
        redirect: 'if_required',
      });
      if (stripeError) {
        setError(stripeError.message ?? 'Card setup failed. Please try again.');
        setProcessing(false);
      } else {
        onSuccess();
      }
    } else {
      // PaymentIntent — charge deposit
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/my-bookings?payment=success`,
        },
        redirect: 'if_required',
      });
      if (stripeError) {
        setError(stripeError.message ?? 'Payment failed. Please try again.');
        setProcessing(false);
      } else {
        onSuccess();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isFree && (
        <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          <strong>Free appointment</strong> — your card won&apos;t be charged today.
          We collect it only to protect the business against no-shows.
        </div>
      )}
      <PaymentElement />
      {error && (
        <p className="text-red-500 text-sm rounded bg-red-50 p-2">{error}</p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {processing ? 'Processing…' : isFree ? 'Confirm — Save Card' : 'Confirm & Pay Deposit'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-md font-medium hover:bg-gray-50 disabled:opacity-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function StripeCheckout({
  clientSecret,
  isFree = false,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  isFree?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance: { theme: 'stripe' } }}
    >
      <CheckoutForm isFree={isFree} onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
