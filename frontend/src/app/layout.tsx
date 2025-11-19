import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AgeGate from '@/components/AgeGate';
import Providers from './providers';
import SkipNavigation from '@/components/SkipNavigation';
import { generateMetadata as genMetadata } from '@/lib/metadata';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = genMetadata({
  noIndex: true, // Adult content - don't index
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#DC2626',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black`}>
        <SkipNavigation />
        <Providers>
          <AgeGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
