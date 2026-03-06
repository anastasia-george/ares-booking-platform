// pages/api/auth/[...nextauth].ts
// Re-exports authOptions from lib/auth.ts and the NextAuth handler.
// All other files should import authOptions from 'lib/auth' directly.
export { authOptions } from '../../../lib/auth';
export { default } from '../../../lib/auth';
