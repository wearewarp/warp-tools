'use client';

import { ToastContainer } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
