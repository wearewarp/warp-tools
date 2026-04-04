import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { documents } from '@/db/schema';
import { eq, and, or, like, gte, lte, asc, desc, sql, not } from 'drizzle-orm';
import { saveFile, UploadError } from '@/lib/upload';
import { generateThumbnail } from '@/lib/thumbnail';
import type { DocType } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const search = searchParams.get('search') || '';
  const docTypes = searchParams.getAll('doc_type').filter(Boolean);
  const carrier = searchParams.get('carrier') || '';
  const customer = searchParams.get('customer') || '';
  const dateFrom = searchParams.get('date_from') || '';
  const dateTo = searchParams.get('date_to') || '';
  const status = searchParams.get('status') || '';
  const expiring = searchParams.get('expiring') === 'true';
  const sortBy = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, parseInt(searchParams.get('per_page') || '24', 10));

  const conditions = [];

  if (status && status !== 'all') {
    conditions.push(eq(documents.status, status as 'active' | 'archived'));
  }

  if (search) {
    const q = `%${search}%`;
    conditions.push(
      or(
        like(documents.filename, q),
        like(documents.originalName, q),
        like(documents.loadRef, q),
        like(documents.carrierName, q),
        like(documents.customerName, q),
        like(documents.notes, q),
        like(documents.tags, q),
      )!
    );
  }

  if (docTypes.length > 0) {
    if (docTypes.length === 1) {
      conditions.push(eq(documents.docType, docTypes[0] as DocType));
    } else {
      conditions.push(or(...docTypes.map((t) => eq(documents.docType, t as DocType)))!);
    }
  }

  if (carrier) {
    conditions.push(like(documents.carrierName, `%${carrier}%`));
  }

  if (customer) {
    conditions.push(like(documents.customerName, `%${customer}%`));
  }

  if (dateFrom) {
    conditions.push(gte(documents.documentDate, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(documents.documentDate, dateTo));
  }

  if (expiring) {
    const today = new Date().toISOString().split('T')[0];
    const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    conditions.push(
      and(
        not(eq(documents.expiryDate, '')),
        gte(documents.expiryDate, today),
        lte(documents.expiryDate, in30),
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortCol = (() => {
    switch (sortBy) {
      case 'document_date': return documents.documentDate;
      case 'doc_type': return documents.docType;
      case 'file_size': return documents.fileSize;
      case 'filename': return documents.filename;
      default: return documents.createdAt;
    }
  })();

  const orderFn = order === 'asc' ? asc : desc;
  const offset = (page - 1) * perPage;

  const [rows, countResult] = await Promise.all([
    db.select().from(documents).where(where).orderBy(orderFn(sortCol)).limit(perPage).offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(documents).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return NextResponse.json({
    documents: rows,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uploadResult = await saveFile(file);
    const thumbnailPath = await generateThumbnail(uploadResult.filePath, uploadResult.mimeType);

    const docType = (formData.get('doc_type') as string) || 'other';
    const loadRef = (formData.get('load_ref') as string) || null;
    const carrierName = (formData.get('carrier_name') as string) || null;
    const customerName = (formData.get('customer_name') as string) || null;
    const documentDate = (formData.get('document_date') as string) || null;
    const expiryDate = (formData.get('expiry_date') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    const tagsRaw = (formData.get('tags') as string) || '[]';
    const uploadedBy = (formData.get('uploaded_by') as string) || null;

    const [doc] = await db
      .insert(documents)
      .values({
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.fileSize,
        filePath: uploadResult.filePath,
        thumbnailPath: thumbnailPath ?? undefined,
        docType: docType as DocType,
        loadRef: loadRef ?? undefined,
        carrierName: carrierName ?? undefined,
        customerName: customerName ?? undefined,
        documentDate: documentDate ?? undefined,
        expiryDate: expiryDate ?? undefined,
        notes: notes ?? undefined,
        tags: tagsRaw,
        uploadedBy: uploadedBy ?? undefined,
      })
      .returning();

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error('Upload error:', err);
    const message = err instanceof UploadError ? err.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
