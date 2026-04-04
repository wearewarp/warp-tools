import type { Metadata } from 'next';
import './globals.css';
import { SidebarLayout } from '@/components/SidebarLayout';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Invoice Tracker — Warp Tools',
  description: 'Free, open-source invoice and payment tracking for freight brokers and shippers.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#040810] text-slate-200 antialiased">
        <ToastProvider>
          <SidebarLayout>
            {children}
          </SidebarLayout>
        </ToastProvider>
      </body>
    </html>
  );
}
