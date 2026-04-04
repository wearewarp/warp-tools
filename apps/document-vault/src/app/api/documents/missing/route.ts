import { NextResponse } from 'next/server';
import { db } from '@/db';
import { documentRequirements, documents } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [allReqs, allDocs] = await Promise.all([
      db.select().from(documentRequirements),
      db.select().from(documents),
    ]);

    // Group requirements by loadRef
    const reqsByLoad: Record<string, typeof allReqs> = {};
    for (const req of allReqs) {
      if (!reqsByLoad[req.loadRef]) reqsByLoad[req.loadRef] = [];
      reqsByLoad[req.loadRef].push(req);
    }

    // Build a map of loadRef -> docType -> document (fulfilled)
    const docsByLoad: Record<string, Record<string, (typeof allDocs)[0]>> = {};
    for (const doc of allDocs) {
      if (doc.loadRef) {
        if (!docsByLoad[doc.loadRef]) docsByLoad[doc.loadRef] = {};
        docsByLoad[doc.loadRef][doc.docType] = doc;
      }
    }

    const result = Object.entries(reqsByLoad)
      .map(([loadRef, reqs]) => {
        // Get the most recent load status from requirements
        const loadStatus = reqs[reqs.length - 1].loadStatus;
        const missingReqs = reqs.filter((r) => !r.fulfilled);
        const existingReqs = reqs.filter((r) => r.fulfilled);

        return {
          loadRef,
          loadStatus,
          missingTypes: missingReqs.map((r) => r.requiredType),
          existingTypes: existingReqs.map((r) => r.requiredType),
          totalRequired: reqs.length,
          totalFulfilled: existingReqs.length,
        };
      })
      .filter((l) => l.missingTypes.length > 0)
      .sort((a, b) => b.missingTypes.length - a.missingTypes.length);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Missing docs error:', err);
    return NextResponse.json({ error: 'Failed to load missing documents' }, { status: 500 });
  }
}
