// pages/_app.tsx
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from "next-auth/react";

export default function App({ Component, pageProps }: AppProps) {
  // 1. Session Provider is crucial for useSession()
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session}>
      <Component {...rest} />
    </SessionProvider>
  );
}
