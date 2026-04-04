import { sql } from 'drizzle-orm';
import {
  text,
  integer,
  real,
  sqliteTable,
} from 'drizzle-orm/sqlite-core';

// ─── Customers ───────────────────────────────────────────────────────────────

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  billingContact: text('billing_contact'),
  email: text('email'),
  phone: text('phone'),
  addressStreet: text('address_street'),
  addressCity: text('address_city'),
  addressState: text('address_state'),
  addressZip: text('address_zip'),
  paymentTerms: text('payment_terms', {
    enum: ['net_15', 'net_30', 'net_45', 'net_60', 'quick_pay', 'factored'],
  }).default('net_30').notNull(),
  creditLimit: real('credit_limit'),
  notes: text('notes'),
  status: text('status', { enum: ['active', 'inactive', 'on_hold'] }).default('active').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Invoices ────────────────────────────────────────────────────────────────

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: text('invoice_number').notNull().unique(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  loadRef: text('load_ref'),
  status: text('status', {
    enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void'],
  }).default('draft').notNull(),
  invoiceDate: text('invoice_date').notNull(),
  dueDate: text('due_date').notNull(),
  subtotal: real('subtotal').notNull().default(0),
  taxAmount: real('tax_amount').notNull().default(0),
  total: real('total').notNull().default(0),
  amountPaid: real('amount_paid').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Invoice Line Items ───────────────────────────────────────────────────────

export const invoiceLineItems = sqliteTable('invoice_line_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
  lineType: text('line_type', {
    enum: ['freight', 'fuel_surcharge', 'detention', 'accessorial', 'lumper', 'other'],
  }).default('freight').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Carrier Payments ─────────────────────────────────────────────────────────

export const carrierPayments = sqliteTable('carrier_payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  carrierId: text('carrier_id'),
  carrierName: text('carrier_name').notNull(),
  loadRef: text('load_ref'),
  amount: real('amount').notNull(),
  payType: text('pay_type', { enum: ['standard', 'quick_pay', 'hold'] }).default('standard').notNull(),
  quickPayDiscount: real('quick_pay_discount'),
  netAmount: real('net_amount').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'paid', 'disputed'] }).default('pending').notNull(),
  scheduledDate: text('scheduled_date'),
  paidDate: text('paid_date'),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Payments Received ────────────────────────────────────────────────────────

export const paymentsReceived = sqliteTable('payments_received', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  paymentDate: text('payment_date').notNull(),
  paymentMethod: text('payment_method', {
    enum: ['ach', 'wire', 'check', 'credit_card', 'factoring', 'other'],
  }).default('ach').notNull(),
  referenceNumber: text('reference_number'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Loads ────────────────────────────────────────────────────────────────────

export const loads = sqliteTable('loads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loadRef: text('load_ref').notNull().unique(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  carrierId: text('carrier_id'),
  carrierName: text('carrier_name'),
  revenue: real('revenue').notNull().default(0),
  cost: real('cost').notNull().default(0),
  invoiceId: text('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  carrierPaymentId: text('carrier_payment_id').references(() => carrierPayments.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['booked', 'in_transit', 'delivered', 'invoiced', 'closed'],
  }).default('booked').notNull(),
  pickupDate: text('pickup_date'),
  deliveryDate: text('delivery_date'),
  origin: text('origin'),
  destination: text('destination'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type NewInvoiceLineItem = typeof invoiceLineItems.$inferInsert;
export type CarrierPayment = typeof carrierPayments.$inferSelect;
export type NewCarrierPayment = typeof carrierPayments.$inferInsert;
export type PaymentReceived = typeof paymentsReceived.$inferSelect;
export type NewPaymentReceived = typeof paymentsReceived.$inferInsert;
export type Load = typeof loads.$inferSelect;
export type NewLoad = typeof loads.$inferInsert;
