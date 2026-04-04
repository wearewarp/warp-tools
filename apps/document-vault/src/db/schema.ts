import { sql } from 'drizzle-orm';
import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

// ─── Documents ───────────────────────────────────────────────────────────────

export const documents = sqliteTable('documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

  // File metadata
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  filePath: text('file_path').notNull(),
  thumbnailPath: text('thumbnail_path'),

  // Document classification
  docType: text('doc_type', {
    enum: [
      'bol',
      'pod',
      'rate_confirmation',
      'invoice',
      'insurance_cert',
      'authority_letter',
      'customs_declaration',
      'weight_certificate',
      'lumper_receipt',
      'other',
    ],
  }).notNull(),

  // Linkage
  loadRef: text('load_ref'),
  carrierId: text('carrier_id'),
  carrierName: text('carrier_name'),
  customerId: text('customer_id'),
  customerName: text('customer_name'),

  // Document info
  documentDate: text('document_date'),
  expiryDate: text('expiry_date'),
  notes: text('notes'),
  tags: text('tags').default('[]'), // JSON array stored as text
  uploadedBy: text('uploaded_by'),

  // Status
  status: text('status', { enum: ['active', 'archived'] }).default('active').notNull(),

  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Document Requirements ────────────────────────────────────────────────────

export const documentRequirements = sqliteTable('document_requirements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  loadRef: text('load_ref').notNull(),
  loadStatus: text('load_status', {
    enum: ['booked', 'in_transit', 'delivered', 'invoiced', 'closed'],
  }).notNull(),
  requiredType: text('required_type', {
    enum: [
      'bol',
      'pod',
      'rate_confirmation',
      'invoice',
      'insurance_cert',
      'authority_letter',
      'customs_declaration',
      'weight_certificate',
      'lumper_receipt',
      'other',
    ],
  }).notNull(),
  fulfilled: integer('fulfilled', { mode: 'boolean' }).default(false).notNull(),
  documentId: text('document_id').references(() => documents.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

// ─── Types ───────────────────────────────────────────────────────────────────

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentRequirement = typeof documentRequirements.$inferSelect;
export type NewDocumentRequirement = typeof documentRequirements.$inferInsert;

export type DocType = Document['docType'];
export type DocumentStatus = Document['status'];
