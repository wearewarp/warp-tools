import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './Providers';

export const metadata: Metadata = {
  title: 'Customer Portal — Warp Tools',
  description: 'Free, open-source shipper-facing portal for tracking shipments, documents, and communication.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040810] text-slate-200 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
