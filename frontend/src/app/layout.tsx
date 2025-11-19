import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AgeGate from '@/components/AgeGate';
import Providers from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AnimeShorts - Adult Anime Video Platform',
  description: 'Short-form adult anime content platform',
  keywords: ['anime', 'shorts', 'adult', 'hentai', 'ecchi'],
  robots: 'noindex, nofollow', // Important for adult content
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-black`}>
        <Providers>
          <AgeGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
