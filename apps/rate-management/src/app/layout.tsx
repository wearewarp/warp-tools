import type { Metadata } from 'next';
import './globals.css';
import { SidebarLayout } from '@/components/SidebarLayout';

export const metadata: Metadata = {
  title: 'Rate Management — Warp Tools',
  description: 'Free, open-source freight rate tracking, carrier rate comparison, and RFQ management for logistics companies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040810] text-slate-200 antialiased">
        <SidebarLayout>
          {children}
        </SidebarLayout>
      </body>
    </html>
  );
}
