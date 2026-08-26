import type { Metadata, Viewport } from 'next';
import './globals.css';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Financial Pulse — FT & WSJ Market Intelligence Terminal',
  description:
    'Financial Times and Wall Street Journal style real-time market intelligence, portfolio tracking, and AI daily briefings.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Financial Pulse',
  },
  keywords: ['financial times', 'wall street journal', 'stocks', 'portfolio', 'yahoo finance', 'market intelligence'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0e17',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}

        {/* Global ChunkLoadError Auto-Recovery Handler */}
        <Script id="chunk-error-recovery" strategy="beforeInteractive">
          {`
            window.addEventListener('error', function(e) {
              if (e && e.message && (e.message.indexOf('ChunkLoadError') !== -1 || e.message.indexOf('Loading chunk') !== -1)) {
                if (!sessionStorage.getItem('chunk_reloaded')) {
                  sessionStorage.setItem('chunk_reloaded', '1');
                  window.location.reload();
                }
              }
            });
            window.addEventListener('load', function() {
              sessionStorage.removeItem('chunk_reloaded');
            });
          `}
        </Script>

        {/* PWA Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('PWA Service Worker active with scope: ', registration.scope);
                  },
                  function(err) {
                    console.warn('PWA Service Worker registration skipped: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
