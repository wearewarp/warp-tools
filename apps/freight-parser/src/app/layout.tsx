import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Freight PDF Parser — Warp Tools',
  description:
    'Free, open-source freight document parser. Extract structured data from rate confirmations, BOLs, and invoices using pattern matching.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040810] text-slate-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
