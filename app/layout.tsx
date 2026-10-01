import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Manrope } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EchoRun — Ask out loud. Watch it work.',
    template: '%s · EchoRun',
  },
  description:
    'A voice assistant with real tools and persistent memory, built with Agno and LiveKit.',
  twitter: {
    card: 'summary',
  },
  openGraph: {
    siteName: 'EchoRun',
    title: 'EchoRun — Ask out loud. Watch it work.',
    description: 'A voice assistant with real tools and persistent memory.',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0d0c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${mono.variable}`}>
      <body data-lk-theme="default">{children}</body>
    </html>
  );
}
