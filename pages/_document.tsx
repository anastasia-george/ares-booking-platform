// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />

        {/* Viewport — required for mobile responsiveness */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

        {/* Brand / theme */}
        <meta name="theme-color" content="#0F172A" />
        <meta name="application-name" content="ModelCall" />
        <meta name="description" content="Australia's beauty model call platform. Book free or discounted treatments at top clinics." />

        {/* Favicon — SVG for modern browsers, ICO fallback for legacy */}
        <link rel="icon" type="image/svg+xml" href="/brand/app-icon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple */}
        <link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ModelCall" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ModelCall" />
        <meta property="og:title" content="ModelCall — Free & discounted beauty treatments" />
        <meta property="og:description" content="Australia's beauty model call platform. Book free or discounted treatments at top clinics." />
        <meta property="og:image" content="https://modelcall.app/brand/icon-512.png" />
        <meta property="og:url" content="https://modelcall.app" />

        {/* Twitter / X card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ModelCall" />
        <meta name="twitter:description" content="Australia's beauty model call platform." />
        <meta name="twitter:image" content="https://modelcall.app/brand/icon-512.png" />

        {/* Font preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
