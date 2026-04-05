import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalShipments } from '@/db/schema';
import { eq, like, or, sql, and } from 'drizzle-orm';
import { getPortalCustomer } from '@/lib/portal-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const customer = await getPortalCustomer(request);
  if (!customer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const conditions = [eq(portalShipments.customerId, customer.id)];

  if (search) {
    conditions.push(
      or(
        like(portalShipments.shipmentNumber, `%${search}%`),
        like(portalShipments.poNumber, `%${search}%`)
      )!
    );
  }
  if (status) {
    conditions.push(eq(portalShipments.status, status));
  }

  const shipments = await db
    .select({
      id: portalShipments.id,
      shipmentNumber: portalShipments.shipmentNumber,
      status: portalShipments.status,
      originCity: portalShipments.originCity,
      originState: portalShipments.originState,
      destCity: portalShipments.destCity,
      destState: portalShipments.destState,
      pickupDate: portalShipments.pickupDate,
      deliveryDate: portalShipments.deliveryDate,
      poNumber: portalShipments.poNumber,
      equipmentType: portalShipments.equipmentType,
      commodity: portalShipments.commodity,
      currentEta: portalShipments.currentEta,
      createdAt: portalShipments.createdAt,
    })
    .from(portalShipments)
    .where(and(...conditions))
    .orderBy(sql`${portalShipments.createdAt} DESC`);

  return NextResponse.json({ shipments });
}
