// lib/auth.ts
// Single source of truth for NextAuth configuration.
// Import authOptions from here everywhere (API routes, getServerSession calls).
import NextAuth, { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { Resend } from 'resend';
import prisma from './prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'ModelCall <no-reply@modelcall.app>';

const providers: NextAuthOptions['providers'] = [
  EmailProvider({
    from: FROM,
    sendVerificationRequest: async ({ identifier: email, url }) => {
      const { error } = await resend.emails.send({
        from: FROM,
        to: email,
        subject: 'Sign in to ModelCall',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="color:#ec4899;margin-bottom:8px">ModelCall</h2>
            <p style="color:#374151;font-size:16px">Click the button below to sign in. This link expires in 24 hours.</p>
            <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#ec4899;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Sign in to ModelCall</a>
            <p style="color:#9ca3af;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      if (error) {
        console.error('[Resend] send error:', JSON.stringify(error));
        throw new Error(`Resend error: ${error.message}`);
      }
      console.log('[Resend] email sent to', email);
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  // debug MUST be false in production — it logs sensitive token data to stdout
  debug: process.env.NODE_ENV === 'development',
};

export default NextAuth(authOptions);
