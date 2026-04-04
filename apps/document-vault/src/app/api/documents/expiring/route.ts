import { NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const allDocs = await db.select().from(documents);

    const expiring = allDocs
      .filter((d) => d.expiryDate != null && d.expiryDate >= today && d.expiryDate <= future)
      .map((d) => ({
        id: d.id,
        filename: d.originalName,
        docType: d.docType,
        carrierName: d.carrierName,
        expiryDate: d.expiryDate,
        daysUntilExpiry: Math.ceil(
          (new Date(d.expiryDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      }))
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return NextResponse.json(expiring);
  } catch (err) {
    console.error('Expiring docs error:', err);
    return NextResponse.json({ error: 'Failed to load expiring documents' }, { status: 500 });
  }
}
