import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { invoices, customers, invoiceLineItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const LineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive().default(1),
  unitPrice: z.number().min(0),
  lineType: z.enum(['freight', 'fuel_surcharge', 'detention', 'accessorial', 'lumper', 'other']).default('freight'),
});

const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().optional().nullable(),
  customerId: z.string().min(1, 'Customer required'),
  loadRef: z.string().optional().nullable(),
  invoiceDate: z.string().min(1, 'Invoice date required'),
  dueDate: z.string().min(1, 'Due date required'),
  taxAmount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void']).default('draft'),
  lineItems: z.array(LineItemSchema).min(1, 'At least one line item required'),
});

// Auto-generate next invoice number
async function getNextInvoiceNumber(): Promise<string> {
  const allInvoices = await db.select({ invoiceNumber: invoices.invoiceNumber }).from(invoices);
  let max = 0;
  for (const inv of allInvoices) {
    const match = inv.invoiceNumber.match(/INV-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
    // Also handle INV-YYYY-NNNN pattern
    const match2 = inv.invoiceNumber.match(/INV-\d{4}-(\d+)$/);
    if (match2) {
      const n = parseInt(match2[1], 10);
      if (n > max) max = n;
    }
  }
  const next = max + 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  const customerId = searchParams.get('customerId');
  const agingBucket = searchParams.get('agingBucket');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const sortBy = searchParams.get('sortBy') ?? 'invoiceDate';
  const sortDir = searchParams.get('sortDir') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  // Join invoices with customers
  const rows = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      customerEmail: customers.email,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute effective status (overdue detection)
  type Row = (typeof rows)[0] & { effectiveStatus: string; balanceDue: number; daysOverdue: number };
  let results: Row[] = rows.map((row) => {
    const inv = row.invoice;
    let effectiveStatus = inv.status;
    if (inv.status === 'sent') {
      const due = new Date(inv.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) effectiveStatus = 'overdue';
    }
    const balanceDue = inv.total - inv.amountPaid;
    const due = new Date(inv.dueDate);
    due.setHours(0, 0, 0, 0);
    const daysOverdue = due < today ? Math.floor((today.getTime() - due.getTime()) / 86400000) : 0;
    return { ...row, effectiveStatus, balanceDue, daysOverdue };
  });

  // Search
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (r) =>
        r.invoice.invoiceNumber.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.invoice.loadRef?.toLowerCase().includes(q)
    );
  }

  // Filter by status (use effectiveStatus)
  if (status && status !== 'all') {
    results = results.filter((r) => r.effectiveStatus === status);
  }

  // Filter by customer
  if (customerId && customerId !== 'all') {
    results = results.filter((r) => r.invoice.customerId === customerId);
  }

  // Filter by date range
  if (dateFrom) {
    results = results.filter((r) => r.invoice.invoiceDate >= dateFrom);
  }
  if (dateTo) {
    results = results.filter((r) => r.invoice.invoiceDate <= dateTo);
  }

  // Filter by aging bucket
  if (agingBucket && agingBucket !== 'all') {
    results = results.filter((r) => {
      const days = r.daysOverdue;
      switch (agingBucket) {
        case 'current': return days === 0;
        case '1-30': return days >= 1 && days <= 30;
        case '31-60': return days >= 31 && days <= 60;
        case '61-90': return days >= 61 && days <= 90;
        case '90+': return days > 90;
        default: return true;
      }
    });
  }

  // Sort
  const mult = sortDir === 'desc' ? -1 : 1;
  results.sort((a, b) => {
    switch (sortBy) {
      case 'invoiceNumber': return mult * a.invoice.invoiceNumber.localeCompare(b.invoice.invoiceNumber);
      case 'customerName': return mult * (a.customerName ?? '').localeCompare(b.customerName ?? '');
      case 'invoiceDate': return mult * a.invoice.invoiceDate.localeCompare(b.invoice.invoiceDate);
      case 'dueDate': return mult * a.invoice.dueDate.localeCompare(b.invoice.dueDate);
      case 'total': return mult * (a.invoice.total - b.invoice.total);
      case 'balanceDue': return mult * (a.balanceDue - b.balanceDue);
      case 'status': return mult * a.effectiveStatus.localeCompare(b.effectiveStatus);
      default: return 0;
    }
  });

  const total = results.length;
  const paginated = results.slice((page - 1) * pageSize, page * pageSize);

  return NextResponse.json({
    data: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateInvoiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Auto-generate invoice number if not provided
  const invoiceNumber = data.invoiceNumber?.trim() || await getNextInvoiceNumber();

  // Compute subtotal and total from line items
  const subtotal = data.lineItems.reduce((sum, li) => sum + li.quantity * li.unitPrice, 0);
  const total = subtotal + (data.taxAmount ?? 0);

  // Insert invoice
  const [invoice] = await db
    .insert(invoices)
    .values({
      invoiceNumber,
      customerId: data.customerId,
      loadRef: data.loadRef ?? null,
      invoiceDate: data.invoiceDate,
      dueDate: data.dueDate,
      status: data.status,
      subtotal,
      taxAmount: data.taxAmount ?? 0,
      total,
      amountPaid: 0,
      notes: data.notes ?? null,
    })
    .returning();

  // Insert line items
  if (data.lineItems.length > 0) {
    await db.insert(invoiceLineItems).values(
      data.lineItems.map((li) => ({
        invoiceId: invoice.id,
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        amount: li.quantity * li.unitPrice,
        lineType: li.lineType,
      }))
    );
  }

  return NextResponse.json(invoice, { status: 201 });
}
