import { db } from '@/db';
import { portalCustomers } from '@/db/schema';
import { ShipmentFormClient } from '../ShipmentFormClient';

export const dynamic = 'force-dynamic';

export default async function NewShipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const customers = await db.select({
    id: portalCustomers.id,
    name: portalCustomers.name,
  }).from(portalCustomers);

  return <ShipmentFormClient mode="create" customers={customers} preselectedCustomerId={customerId} />;
}
