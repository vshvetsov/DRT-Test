import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { PrototypeBanner } from '@/components/PrototypeBanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NexTrade AI Reporting Assistant (Prototype)',
  description: 'Prototype · Seed data · Do not share externally',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <PrototypeBanner />
        {children}
      </body>
    </html>
  );
}
