import { sql } from 'drizzle-orm';
import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core';

// ─── Enums (as string union types) ─────────────────────────────────────────────

export type ShipmentStatus =
  | 'quote'
  | 'booked'
  | 'in_transit'
  | 'at_pickup'
  | 'at_delivery'
  | 'delivered'
  | 'invoiced'
  | 'closed'
  | 'cancelled';

export type EquipmentType =
  | 'dry_van'
  | 'reefer'
  | 'flatbed'
  | 'step_deck'
  | 'lowboy'
  | 'sprinter_van'
  | 'cargo_van'
  | 'power_only';

export type InvoiceStatus = 'pending' | 'sent' | 'paid';

export type EventType =
  | 'status_change'
  | 'check_call'
  | 'note'
  | 'document_added'
  | 'invoice_update';

export type DocType =
  | 'bol'
  | 'pod'
  | 'invoice'
  | 'rate_confirmation'
  | 'customs'
  | 'weight_cert'
  | 'other';

export type SenderType = 'customer' | 'broker';

// ─── Tables ────────────────────────────────────────────────────────────────────

export const portalCustomers = sqliteTable('portal_customers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  contactName: text('contact_name'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  accessToken: text('access_token').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastLoginAt: text('last_login_at'),
  notes: text('notes'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const portalShipments = sqliteTable('portal_shipments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerId: text('customer_id').references(() => portalCustomers.id, { onDelete: 'cascade' }),
  shipmentNumber: text('shipment_number').notNull().unique(),
  status: text('status').notNull().default('booked'),
  equipmentType: text('equipment_type'),
  commodity: text('commodity'),
  weight: integer('weight'),
  pieces: integer('pieces'),
  originCity: text('origin_city').notNull(),
  originState: text('origin_state').notNull(),
  originZip: text('origin_zip'),
  originAddress: text('origin_address'),
  originContactName: text('origin_contact_name'),
  originContactPhone: text('origin_contact_phone'),
  destCity: text('dest_city').notNull(),
  destState: text('dest_state').notNull(),
  destZip: text('dest_zip'),
  destAddress: text('dest_address'),
  destContactName: text('dest_contact_name'),
  destContactPhone: text('dest_contact_phone'),
  pickupDate: text('pickup_date'),
  pickupTimeWindow: text('pickup_time_window'),
  deliveryDate: text('delivery_date'),
  deliveryTimeWindow: text('delivery_time_window'),
  actualPickupAt: text('actual_pickup_at'),
  actualDeliveryAt: text('actual_delivery_at'),
  customerRate: real('customer_rate'),
  invoiceRef: text('invoice_ref'),
  invoiceStatus: text('invoice_status').default('pending'),
  invoiceAmount: real('invoice_amount'),
  specialInstructions: text('special_instructions'),
  bolNumber: text('bol_number'),
  poNumber: text('po_number'),
  proNumber: text('pro_number'),
  currentLocationCity: text('current_location_city'),
  currentLocationState: text('current_location_state'),
  currentEta: text('current_eta'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const portalEvents = sqliteTable('portal_events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text('shipment_id').references(() => portalShipments.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  description: text('description').notNull(),
  locationCity: text('location_city'),
  locationState: text('location_state'),
  isVisibleToCustomer: integer('is_visible_to_customer', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const portalDocuments = sqliteTable('portal_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text('shipment_id').references(() => portalShipments.id, { onDelete: 'cascade' }),
  docType: text('doc_type').notNull(),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  isVisibleToCustomer: integer('is_visible_to_customer', { mode: 'boolean' }).default(true),
  uploadedAt: text('uploaded_at').default(sql`(datetime('now'))`),
  notes: text('notes'),
});

export const portalMessages = sqliteTable('portal_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text('shipment_id').references(() => portalShipments.id, { onDelete: 'set null' }),
  customerId: text('customer_id').references(() => portalCustomers.id, { onDelete: 'cascade' }),
  senderType: text('sender_type').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
});

export const portalSettings = sqliteTable('portal_settings', {
  id: text('id').primaryKey().default('default'),
  companyName: text('company_name').default('My Brokerage'),
  supportEmail: text('support_email'),
  supportPhone: text('support_phone'),
  welcomeMessage: text('welcome_message'),
  footerText: text('footer_text'),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});
