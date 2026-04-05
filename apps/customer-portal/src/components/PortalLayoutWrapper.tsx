'use client';

import { usePathname } from 'next/navigation';
import { PortalHeader } from './PortalHeader';

interface PortalLayoutWrapperProps {
  children: React.ReactNode;
  customerName?: string | null;
}

export function PortalLayoutWrapper({ children, customerName }: PortalLayoutWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader customerName={customerName} />
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        {children}
      </main>
    </div>
  );
}
