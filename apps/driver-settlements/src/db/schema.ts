import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Enums (as string unions) ─────────────────────────────────────────────────

export type PayType = 'per_mile' | 'percentage' | 'flat' | 'hourly' | 'per_stop';
export type DriverStatus = 'active' | 'inactive' | 'terminated';
export type SettlementStatus = 'open' | 'submitted' | 'approved' | 'paid' | 'disputed';
export type DeductionType = 'recurring' | 'one_time';
export type DeductionCategory = 'insurance' | 'lease' | 'eld' | 'fuel_advance' | 'toll' | 'ticket' | 'repair' | 'other';
export type ReimbursementCategory = 'fuel' | 'toll' | 'maintenance' | 'supplies' | 'other';
export type AdvanceStatus = 'outstanding' | 'deducted' | 'forgiven';
export type DeductionFrequency = 'per_settlement' | 'monthly';

// ─── Drivers ──────────────────────────────────────────────────────────────────

export const drivers = sqliteTable('drivers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone'),
  address_street: text('address_street'),
  address_city: text('address_city'),
  address_state: text('address_state'),
  address_zip: text('address_zip'),
  license_number: text('license_number'),
  license_state: text('license_state'),
  license_expiry: text('license_expiry'), // ISO date string
  pay_type: text('pay_type').$type<PayType>().notNull(),
  pay_rate: real('pay_rate').notNull(),
  hire_date: text('hire_date'), // ISO date string
  termination_date: text('termination_date'), // ISO date string
  emergency_contact_name: text('emergency_contact_name'),
  emergency_contact_phone: text('emergency_contact_phone'),
  status: text('status').$type<DriverStatus>().notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;

// ─── Settlements ──────────────────────────────────────────────────────────────

export const settlements = sqliteTable('settlements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  settlement_number: text('settlement_number').notNull().unique(),
  driver_id: integer('driver_id').notNull().references(() => drivers.id),
  period_start: text('period_start').notNull(), // ISO date
  period_end: text('period_end').notNull(), // ISO date
  status: text('status').$type<SettlementStatus>().notNull().default('open'),
  gross_earnings: real('gross_earnings').notNull().default(0),
  total_deductions: real('total_deductions').notNull().default(0),
  total_reimbursements: real('total_reimbursements').notNull().default(0),
  total_advances: real('total_advances').notNull().default(0),
  net_pay: real('net_pay').notNull().default(0),
  paid_date: text('paid_date'), // ISO date
  payment_method: text('payment_method'), // check/ach/wire
  payment_reference: text('payment_reference'),
  approved_by: text('approved_by'),
  approved_at: text('approved_at'), // ISO datetime
  disputed_reason: text('disputed_reason'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

// ─── Trips ────────────────────────────────────────────────────────────────────

export const trips = sqliteTable('trips', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  driver_id: integer('driver_id').notNull().references(() => drivers.id),
  settlement_id: integer('settlement_id').references(() => settlements.id),
  load_ref: text('load_ref'),
  origin_city: text('origin_city').notNull(),
  origin_state: text('origin_state').notNull(),
  dest_city: text('dest_city').notNull(),
  dest_state: text('dest_state').notNull(),
  miles: real('miles'),
  revenue: real('revenue'),
  stops: integer('stops'),
  hours: real('hours'),
  trip_date: text('trip_date').notNull(), // ISO date
  pay_amount: real('pay_amount').notNull().default(0),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type Trip = typeof trips.$inferSelect;
export type NewTrip = typeof trips.$inferInsert;

// ─── Settlement Deductions ────────────────────────────────────────────────────

export const settlementDeductions = sqliteTable('settlement_deductions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  settlement_id: integer('settlement_id').notNull().references(() => settlements.id),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  deduction_type: text('deduction_type').$type<DeductionType>().notNull().default('one_time'),
  category: text('category').$type<DeductionCategory>().notNull().default('other'),
});

export type SettlementDeduction = typeof settlementDeductions.$inferSelect;
export type NewSettlementDeduction = typeof settlementDeductions.$inferInsert;

// ─── Settlement Reimbursements ─────────────────────────────────────────────────

export const settlementReimbursements = sqliteTable('settlement_reimbursements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  settlement_id: integer('settlement_id').notNull().references(() => settlements.id),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  category: text('category').$type<ReimbursementCategory>().notNull().default('other'),
  receipt_ref: text('receipt_ref'),
});

export type SettlementReimbursement = typeof settlementReimbursements.$inferSelect;
export type NewSettlementReimbursement = typeof settlementReimbursements.$inferInsert;

// ─── Advances ─────────────────────────────────────────────────────────────────

export const advances = sqliteTable('advances', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  driver_id: integer('driver_id').notNull().references(() => drivers.id),
  settlement_id: integer('settlement_id').references(() => settlements.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(), // ISO date
  reason: text('reason'),
  status: text('status').$type<AdvanceStatus>().notNull().default('outstanding'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type Advance = typeof advances.$inferSelect;
export type NewAdvance = typeof advances.$inferInsert;

// ─── Deduction Templates ──────────────────────────────────────────────────────

export const deductionTemplates = sqliteTable('deduction_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  amount: real('amount').notNull(),
  is_percentage: integer('is_percentage', { mode: 'boolean' }).notNull().default(false),
  category: text('category').$type<DeductionCategory>().notNull().default('other'),
  frequency: text('frequency').$type<DeductionFrequency>().notNull().default('per_settlement'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type DeductionTemplate = typeof deductionTemplates.$inferSelect;
export type NewDeductionTemplate = typeof deductionTemplates.$inferInsert;
