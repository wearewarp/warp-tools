import { NextResponse } from 'next/server';
import { db } from '@/db';
import { documents, documentRequirements } from '@/db/schema';

export const dynamic = 'force-dynamic';

const REQUIRED_BY_STATUS: Record<string, string[]> = {
  booked: ['rate_confirmation'],
  in_transit: ['bol', 'rate_confirmation'],
  delivered: ['bol', 'pod', 'rate_confirmation'],
  invoiced: ['bol', 'pod', 'rate_confirmation', 'invoice'],
  closed: ['bol', 'pod', 'rate_confirmation', 'invoice'],
};

export async function GET() {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [allDocs, allReqs] = await Promise.all([
      db.select().from(documents),
      db.select().from(documentRequirements),
    ]);

    // Basic counts
    const totalDocuments = allDocs.length;
    const documentsThisMonth = allDocs.filter((d) => d.createdAt >= firstOfMonth).length;
    const totalStorageBytes = allDocs.reduce((sum, d) => sum + d.fileSize, 0);

    // Missing docs — from document_requirements where fulfilled = false
    const missingReqs = allReqs.filter((r) => !r.fulfilled);
    const missingByType: Record<string, number> = { bol: 0, pod: 0, rate_confirmation: 0, invoice: 0 };
    for (const req of missingReqs) {
      if (req.requiredType in missingByType) {
        missingByType[req.requiredType]++;
      }
    }
    // Count unique loads with missing docs
    const loadsWithMissing = new Set(missingReqs.map((r) => r.loadRef)).size;

    // Expiring / expired docs
    const docsWithExpiry = allDocs.filter((d) => d.expiryDate != null);
    const expiringDocs = docsWithExpiry
      .filter((d) => d.expiryDate! >= today && d.expiryDate! <= in30Days)
      .map((d) => ({
        id: d.id,
        filename: d.originalName,
        docType: d.docType,
        carrierName: d.carrierName,
        expiryDate: d.expiryDate,
      }));
    const expiredDocs = docsWithExpiry
      .filter((d) => d.expiryDate! < today)
      .map((d) => ({
        id: d.id,
        filename: d.originalName,
        docType: d.docType,
        carrierName: d.carrierName,
        expiryDate: d.expiryDate,
      }));

    // Recent uploads — last 12 by createdAt
    const recentUploads = [...allDocs]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 12)
      .map((d) => ({
        id: d.id,
        filename: d.originalName,
        docType: d.docType,
        loadRef: d.loadRef,
        carrierName: d.carrierName,
        fileSize: d.fileSize,
        createdAt: d.createdAt,
        thumbnailPath: d.thumbnailPath,
      }));

    return NextResponse.json({
      totalDocuments,
      documentsThisMonth,
      totalStorageBytes,
      missingDocs: {
        total: loadsWithMissing,
        byType: missingByType,
      },
      expiringDocs,
      expiredDocs,
      recentUploads,
    });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
