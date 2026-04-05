import { redirect } from 'next/navigation';
import { getPortalCustomerFromCookies } from '@/lib/portal-auth';
import { ShipmentListClient } from './ShipmentListClient';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const customer = await getPortalCustomerFromCookies();

  if (!customer) {
    redirect('/portal/login');
  }

  return <ShipmentListClient customerName={customer.name} />;
}
