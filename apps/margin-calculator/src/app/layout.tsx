import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freight Margin Calculator — Warp Tools',
  description:
    'Free freight broker margin calculator. Calculate margin %, load profitability, compare carrier rates, and batch-analyze multiple loads. No account needed.',
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
