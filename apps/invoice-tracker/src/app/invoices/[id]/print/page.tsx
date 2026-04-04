export const dynamic = 'force-dynamic';

import { db } from '@/db';
import { invoices, invoiceLineItems, paymentsReceived, customers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InvoicePrintView } from './InvoicePrintView';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePrintPage({ params }: PageProps) {
  const { id } = await params;

  const [row] = await db
    .select({
      invoice: invoices,
      customerName: customers.name,
      customerEmail: customers.email,
      customerPhone: customers.phone,
      customerAddressStreet: customers.addressStreet,
      customerAddressCity: customers.addressCity,
      customerAddressState: customers.addressState,
      customerAddressZip: customers.addressZip,
      customerPaymentTerms: customers.paymentTerms,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id))
    .where(eq(invoices.id, id));

  if (!row) notFound();

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id));

  const payments = await db
    .select()
    .from(paymentsReceived)
    .where(eq(paymentsReceived.invoiceId, id));

  const balanceDue = row.invoice.total - row.invoice.amountPaid;

  const addrParts = [
    row.customerAddressStreet,
    row.customerAddressCity,
    [row.customerAddressState, row.customerAddressZip].filter(Boolean).join(' '),
  ].filter(Boolean);
  const customerAddress = addrParts.length > 0 ? addrParts.join(', ') : null;

  return (
    <InvoicePrintView
      invoice={row.invoice}
      customerName={row.customerName}
      customerEmail={row.customerEmail}
      customerPhone={row.customerPhone}
      customerAddress={customerAddress}
      customerPaymentTerms={row.customerPaymentTerms}
      lineItems={lineItems}
      payments={payments}
      balanceDue={balanceDue}
    />
  );
}
