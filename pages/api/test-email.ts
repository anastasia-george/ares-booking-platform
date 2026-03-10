// TEMPORARY DEBUG ENDPOINT — delete after fixing sign-in
import { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = (req.query.to as string) || 'its.anastasia.george@gmail.com';

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'onboarding@resend.dev',
    to,
    subject: 'ModelCall test email',
    html: '<p>Test email from ModelCall debug endpoint.</p>',
  });

  return res.status(200).json({
    RESEND_API_KEY_set: !!process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    to,
    data,
    error,
  });
}
