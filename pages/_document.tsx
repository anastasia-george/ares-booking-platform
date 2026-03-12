// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />

        {/* Brand / theme */}
        <meta name="theme-color" content="#0F172A" />
        <meta name="application-name" content="ModelCall" />

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

        {/* Open Graph defaults (overridden per-page) */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Model Call" />
        <meta property="og:image" content="https://modelcall.app/brand/og-default.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_AU" />

        {/* Twitter / X card defaults (overridden per-page) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://modelcall.app/brand/og-default.png" />

        {/* hreflang — AU-targeted site */}
        <link rel="alternate" hrefLang="en-AU" href="https://modelcall.app" />

        {/* Preconnect to image CDN */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />

        {/* Preload LCP hero image */}
        <link rel="preload" as="image" type="image/webp" href="/images/hero.webp" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
