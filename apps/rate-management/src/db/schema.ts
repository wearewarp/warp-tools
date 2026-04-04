import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export type EquipmentType =
  | 'dry_van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'lowboy'
  | 'sprinter_van'
  | 'cargo_van'
  | 'power_only';

export type RateBasis = 'per_mile' | 'flat' | 'per_cwt' | 'per_pallet';

export type RateType = 'spot' | 'contract';

export type LaneStatus = 'active' | 'inactive';

export type TariffStatus = 'active' | 'pending' | 'expired';

export type RFQStatus =
  | 'draft'
  | 'sent'
  | 'responses'
  | 'awarded'
  | 'expired'
  | 'cancelled';

export type RateSource = 'email' | 'phone' | 'rfq' | 'website';

// ─── Lanes ────────────────────────────────────────────────────────────────────

export const lanes = sqliteTable('lanes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  origin_city: text('origin_city').notNull(),
  origin_state: text('origin_state').notNull(),
  origin_zip: text('origin_zip'),
  dest_city: text('dest_city').notNull(),
  dest_state: text('dest_state').notNull(),
  dest_zip: text('dest_zip'),
  equipment_type: text('equipment_type').$type<EquipmentType>().notNull(),
  estimated_miles: integer('estimated_miles'),
  tags: text('tags'), // JSON array
  status: text('status').$type<LaneStatus>().notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Lane = typeof lanes.$inferSelect;
export type NewLane = typeof lanes.$inferInsert;

// ─── Carrier Rates ────────────────────────────────────────────────────────────

export const carrier_rates = sqliteTable('carrier_rates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lane_id: integer('lane_id').notNull().references(() => lanes.id),
  carrier_id: text('carrier_id'),
  carrier_name: text('carrier_name').notNull(),
  rate_amount: real('rate_amount').notNull(),
  rate_basis: text('rate_basis').$type<RateBasis>().notNull(),
  rate_type: text('rate_type').$type<RateType>().notNull(),
  effective_date: text('effective_date'),
  expiry_date: text('expiry_date'),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  notes: text('notes'),
  source: text('source').$type<RateSource>(),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type CarrierRate = typeof carrier_rates.$inferSelect;
export type NewCarrierRate = typeof carrier_rates.$inferInsert;

// ─── Customer Tariffs ─────────────────────────────────────────────────────────

export const customer_tariffs = sqliteTable('customer_tariffs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lane_id: integer('lane_id').notNull().references(() => lanes.id),
  customer_id: text('customer_id'),
  customer_name: text('customer_name').notNull(),
  rate_amount: real('rate_amount').notNull(),
  rate_basis: text('rate_basis').$type<RateBasis>().notNull(),
  contract_ref: text('contract_ref'),
  effective_date: text('effective_date'),
  expiry_date: text('expiry_date'),
  status: text('status').$type<TariffStatus>().notNull().default('active'),
  notes: text('notes'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type CustomerTariff = typeof customer_tariffs.$inferSelect;
export type NewCustomerTariff = typeof customer_tariffs.$inferInsert;

// ─── RFQs ─────────────────────────────────────────────────────────────────────

export const rfqs = sqliteTable('rfqs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rfq_number: text('rfq_number').notNull().unique(),
  lane_id: integer('lane_id').references(() => lanes.id),
  equipment_type: text('equipment_type').$type<EquipmentType>(),
  pickup_date: text('pickup_date'),
  desired_rate: real('desired_rate'),
  notes: text('notes'),
  status: text('status').$type<RFQStatus>().notNull().default('draft'),
  awarded_carrier: text('awarded_carrier'),
  awarded_rate: real('awarded_rate'),
  awarded_at: text('awarded_at'),
  created_by: text('created_by'),
  created_at: text('created_at').notNull().default(sql`(datetime('now'))`),
  updated_at: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type RFQ = typeof rfqs.$inferSelect;
export type NewRFQ = typeof rfqs.$inferInsert;

// ─── RFQ Responses ────────────────────────────────────────────────────────────

export const rfq_responses = sqliteTable('rfq_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  rfq_id: integer('rfq_id').notNull().references(() => rfqs.id),
  carrier_id: text('carrier_id'),
  carrier_name: text('carrier_name').notNull(),
  rate_amount: real('rate_amount').notNull(),
  rate_basis: text('rate_basis').$type<RateBasis>().notNull(),
  valid_until: text('valid_until'),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  notes: text('notes'),
  is_winner: integer('is_winner', { mode: 'boolean' }).notNull().default(false),
  responded_at: text('responded_at').notNull().default(sql`(datetime('now'))`),
});

export type RFQResponse = typeof rfq_responses.$inferSelect;
export type NewRFQResponse = typeof rfq_responses.$inferInsert;
