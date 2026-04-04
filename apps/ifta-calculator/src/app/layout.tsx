import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IFTA Mileage Calculator — Warp Tools',
  description:
    'Free IFTA fuel tax calculator. Enter miles and fuel per state, get your quarterly tax report instantly. No account needed.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
