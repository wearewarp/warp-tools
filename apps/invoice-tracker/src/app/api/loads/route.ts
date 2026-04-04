import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const CreateLoadSchema = z.object({
  loadRef: z.string().min(1, 'Load ref is required'),
  customerId: z.string().min(1, 'Customer is required'),
  carrierName: z.string().optional().nullable(),
  carrierId: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  destination: z.string().optional().nullable(),
  revenue: z.number().min(0).default(0),
  cost: z.number().min(0).default(0),
  status: z.enum(['booked', 'in_transit', 'delivered', 'invoiced', 'closed']).default('booked'),
  pickupDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  carrierPaymentId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search');
  const customerFilter = searchParams.get('customer');
  const carrierFilter = searchParams.get('carrier');
  const statusFilter = searchParams.get('status');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const sortBy = searchParams.get('sortBy') ?? 'createdAt';
  const sortDir = searchParams.get('sortDir') ?? 'desc';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const pageSize = parseInt(searchParams.get('pageSize') ?? '25', 10);

  // Fetch all loads and customers
  const [allLoads, allCustomers] = await Promise.all([
    db.select().from(loads),
    db.select().from(customers),
  ]);

  const customerMap = new Map(allCustomers.map((c) => [c.id, c]));

  // Enrich with customer name
  type EnrichedLoad = (typeof allLoads)[0] & { customerName: string };
  let enriched: EnrichedLoad[] = allLoads.map((l) => ({
    ...l,
    customerName: customerMap.get(l.customerId)?.name ?? '—',
  }));

  // Filter
  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter(
      (l) =>
        l.loadRef.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        (l.carrierName ?? '').toLowerCase().includes(q)
    );
  }

  if (customerFilter && customerFilter !== 'all') {
    enriched = enriched.filter((l) => l.customerId === customerFilter);
  }

  if (carrierFilter) {
    const q = carrierFilter.toLowerCase();
    enriched = enriched.filter((l) => (l.carrierName ?? '').toLowerCase().includes(q));
  }

  if (statusFilter && statusFilter !== 'all') {
    enriched = enriched.filter((l) => l.status === statusFilter);
  }

  if (dateFrom) {
    enriched = enriched.filter((l) => l.pickupDate && l.pickupDate >= dateFrom);
  }

  if (dateTo) {
    enriched = enriched.filter((l) => l.pickupDate && l.pickupDate <= dateTo);
  }

  // Sort
  const mult = sortDir === 'asc' ? 1 : -1;
  enriched.sort((a, b) => {
    switch (sortBy) {
      case 'loadRef':
        return mult * a.loadRef.localeCompare(b.loadRef);
      case 'customerName':
        return mult * a.customerName.localeCompare(b.customerName);
      case 'carrierName':
        return mult * (a.carrierName ?? '').localeCompare(b.carrierName ?? '');
      case 'origin':
        return mult * (a.origin ?? '').localeCompare(b.origin ?? '');
      case 'destination':
        return mult * (a.destination ?? '').localeCompare(b.destination ?? '');
      case 'revenue':
        return mult * (a.revenue - b.revenue);
      case 'cost':
        return mult * (a.cost - b.cost);
      case 'margin': {
        const mA = a.revenue - a.cost;
        const mB = b.revenue - b.cost;
        return mult * (mA - mB);
      }
      case 'marginPct': {
        const pA = a.revenue > 0 ? (a.revenue - a.cost) / a.revenue : 0;
        const pB = b.revenue > 0 ? (b.revenue - b.cost) / b.revenue : 0;
        return mult * (pA - pB);
      }
      case 'status':
        return mult * a.status.localeCompare(b.status);
      case 'pickupDate':
        return mult * (a.pickupDate ?? '').localeCompare(b.pickupDate ?? '');
      default:
        return mult * (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
    }
  });

  const total = enriched.length;
  const paginated = enriched.slice((page - 1) * pageSize, page * pageSize);

  // Totals (over filtered set)
  const totalRevenue = enriched.reduce((s, l) => s + l.revenue, 0);
  const totalCost = enriched.reduce((s, l) => s + l.cost, 0);
  const totalMargin = totalRevenue - totalCost;
  const avgMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  return NextResponse.json({
    loads: paginated,
    total,
    page,
    pageSize,
    totals: { totalRevenue, totalCost, totalMargin, avgMarginPct },
    customers: allCustomers.map((c) => ({ id: c.id, name: c.name })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateLoadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify customer exists
  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, parsed.data.customerId))
    .limit(1);

  if (!customer.length) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  const load = await db.insert(loads).values(parsed.data).returning();

  return NextResponse.json(load[0], { status: 201 });
}
