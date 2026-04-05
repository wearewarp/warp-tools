'use client';

import { usePathname } from 'next/navigation';
import { PortalHeader } from './PortalHeader';

interface PortalLayoutWrapperProps {
  children: React.ReactNode;
  customerName?: string | null;
  portalName?: string;
  footerText?: string | null;
}

export function PortalLayoutWrapper({ children, customerName, portalName, footerText }: PortalLayoutWrapperProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/portal/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PortalHeader customerName={customerName} portalName={portalName} />
      <main className="flex-1 max-w-5xl mx-auto w-full p-6">
        {children}
      </main>
      {footerText && (
        <footer className="border-t border-[#1A2235] py-4 px-6 text-center">
          <p className="text-xs text-[#8B95A5]">{footerText}</p>
        </footer>
      )}
    </div>
  );
}
