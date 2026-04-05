import { getPortalCustomerFromCookies } from '@/lib/portal-auth';
import { PortalLayoutWrapper } from '@/components/PortalLayoutWrapper';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const customer = await getPortalCustomerFromCookies();
  return (
    <PortalLayoutWrapper customerName={customer?.name ?? null}>
      {children}
    </PortalLayoutWrapper>
  );
}
