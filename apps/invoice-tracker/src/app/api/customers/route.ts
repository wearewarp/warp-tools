import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { like, or, eq, asc, desc } from 'drizzle-orm';
import { z } from 'zod';

const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  billingContact: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  paymentTerms: z.enum(['net_15', 'net_30', 'net_45', 'net_60', 'quick_pay', 'factored']).default('net_30'),
  creditLimit: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'on_hold']).default('active'),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const paymentTerms = searchParams.get('paymentTerms');
  const sortBy = searchParams.get('sortBy') ?? 'name';
  const sortDir = searchParams.get('sortDir') ?? 'asc';

  let results = await db.select().from(customers);

  // Filter in JS (same pattern as carrier-management)
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.billingContact?.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'all') {
    results = results.filter((c) => c.status === status);
  }

  if (paymentTerms && paymentTerms !== 'all') {
    results = results.filter((c) => c.paymentTerms === paymentTerms);
  }

  // Sort
  const mult = sortDir === 'desc' ? -1 : 1;
  results.sort((a, b) => {
    switch (sortBy) {
      case 'name': return mult * a.name.localeCompare(b.name);
      case 'paymentTerms': return mult * a.paymentTerms.localeCompare(b.paymentTerms);
      case 'status': return mult * a.status.localeCompare(b.status);
      case 'createdAt': return mult * a.createdAt.localeCompare(b.createdAt);
      default: return 0;
    }
  });

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Normalize empty email to null
  if (body.email === '') body.email = null;

  const parsed = CreateCustomerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const [customer] = await db
    .insert(customers)
    .values({
      name: data.name,
      billingContact: data.billingContact ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      paymentTerms: data.paymentTerms,
      creditLimit: data.creditLimit ?? null,
      notes: data.notes ?? null,
      status: data.status,
    })
    .returning();

  return NextResponse.json(customer, { status: 201 });
}
