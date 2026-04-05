import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portalShipments, portalDocuments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPortalCustomer } from '@/lib/portal-auth';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const customer = await getPortalCustomer(request);
  if (!customer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, docId } = await params;

  // Verify shipment belongs to customer
  const [shipment] = await db
    .select({ id: portalShipments.id })
    .from(portalShipments)
    .where(
      and(
        eq(portalShipments.id, id),
        eq(portalShipments.customerId, customer.id)
      )
    );

  if (!shipment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify document is visible to customer
  const [doc] = await db
    .select()
    .from(portalDocuments)
    .where(
      and(
        eq(portalDocuments.id, docId),
        eq(portalDocuments.shipmentId, id),
        eq(portalDocuments.isVisibleToCustomer, true)
      )
    );

  if (!doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), doc.filePath);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.originalName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
