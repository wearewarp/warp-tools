import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { carrierPayments } from '@/db/schema';
import { z } from 'zod';

const CreateCarrierPaymentSchema = z.object({
  carrierId: z.string().optional().nullable(),
  carrierName: z.string().min(1, 'Carrier name is required'),
  loadRef: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  payType: z.enum(['standard', 'quick_pay', 'hold']).default('standard'),
  quickPayDiscount: z.number().min(0).max(100).optional().nullable(),
  netAmount: z.number().positive('Net amount must be positive'),
  scheduledDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const payType = searchParams.get('payType');
  const carrier = searchParams.get('carrier');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortDir = searchParams.get('sortDir') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  let results = await db.select().from(carrierPayments);

  // Filter
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (p) =>
        p.carrierName.toLowerCase().includes(q) ||
        (p.loadRef ?? '').toLowerCase().includes(q) ||
        (p.referenceNumber ?? '').toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    results = results.filter((p) => p.status === status);
  }

  if (payType && payType !== 'all') {
    results = results.filter((p) => p.payType === payType);
  }

  if (carrier) {
    const q = carrier.toLowerCase();
    results = results.filter((p) => p.carrierName.toLowerCase().includes(q));
  }

  if (dateFrom) {
    results = results.filter((p) => p.scheduledDate && p.scheduledDate >= dateFrom);
  }

  if (dateTo) {
    results = results.filter((p) => p.scheduledDate && p.scheduledDate <= dateTo);
  }

  // Sort
  const mult = sortDir === 'desc' ? -1 : 1;
  results.sort((a, b) => {
    switch (sortBy) {
      case 'carrierName': return mult * a.carrierName.localeCompare(b.carrierName);
      case 'loadRef': return mult * (a.loadRef ?? '').localeCompare(b.loadRef ?? '');
      case 'amount': return mult * (a.amount - b.amount);
      case 'netAmount': return mult * (a.netAmount - b.netAmount);
      case 'payType': return mult * a.payType.localeCompare(b.payType);
      case 'status': return mult * a.status.localeCompare(b.status);
      case 'scheduledDate': return mult * (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? '');
      case 'paidDate': return mult * (a.paidDate ?? '').localeCompare(b.paidDate ?? '');
      default: return mult * a.createdAt.localeCompare(b.createdAt);
    }
  });

  const total = results.length;
  const paginated = results.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({ data: paginated, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateCarrierPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const [payment] = await db
    .insert(carrierPayments)
    .values({
      carrierId: data.carrierId ?? null,
      carrierName: data.carrierName,
      loadRef: data.loadRef ?? null,
      amount: data.amount,
      payType: data.payType,
      quickPayDiscount: data.quickPayDiscount ?? null,
      netAmount: data.netAmount,
      status: 'pending',
      scheduledDate: data.scheduledDate ?? null,
      notes: data.notes ?? null,
    })
    .returning();

  return NextResponse.json(payment, { status: 201 });
}
