import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PulseNews — Real-Time AI News & Market Intelligence',
  description:
    'Stay ahead with 24/7 continuous news monitoring, Yahoo Finance market feeds, AI executive morning briefings, and distraction-free reader mode.',
  keywords: ['news', 'finance', 'ai', 'yahoo finance', 'stock ticker', 'briefing', 'markets'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
