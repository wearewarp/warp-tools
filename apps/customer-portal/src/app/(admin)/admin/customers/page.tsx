import { db } from '@/db';
import { portalCustomers, portalShipments } from '@/db/schema';
import { eq, count } from 'drizzle-orm';
import { CustomerListClient } from './CustomerListClient';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const customers = await db
    .select({
      id: portalCustomers.id,
      name: portalCustomers.name,
      contactName: portalCustomers.contactName,
      contactEmail: portalCustomers.contactEmail,
      contactPhone: portalCustomers.contactPhone,
      accessToken: portalCustomers.accessToken,
      isActive: portalCustomers.isActive,
      lastLoginAt: portalCustomers.lastLoginAt,
      notes: portalCustomers.notes,
      createdAt: portalCustomers.createdAt,
      updatedAt: portalCustomers.updatedAt,
      shipmentCount: count(portalShipments.id),
    })
    .from(portalCustomers)
    .leftJoin(portalShipments, eq(portalShipments.customerId, portalCustomers.id))
    .groupBy(portalCustomers.id);

  return <CustomerListClient customers={customers} />;
}
