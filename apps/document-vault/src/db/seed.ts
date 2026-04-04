import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { documents, documentRequirements } from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'document-vault.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  // Run migrations first
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  console.log('Seeding Document Vault...');

  // Clear existing data
  await db.delete(documentRequirements);
  await db.delete(documents);

  const now = new Date();
  const carriers = [
    { id: 'carrier-001', name: 'Apex Freight Solutions' },
    { id: 'carrier-002', name: 'Midwest Express Logistics' },
    { id: 'carrier-003', name: 'Blue Ridge Transport' },
    { id: 'carrier-004', name: 'Coastal Carriers Inc' },
  ];
  const customers = [
    { id: 'cust-001', name: 'Dallas Distribution Co' },
    { id: 'cust-002', name: 'Pacific Foods Inc' },
    { id: 'cust-003', name: 'Great Lakes Manufacturing' },
    { id: 'cust-004', name: 'Sunbelt Wholesale' },
  ];

  // Helper to create a date offset from today
  function daysAgo(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  }
  function daysFromNow(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  const docIds = {
    bol1: crypto.randomUUID(),
    bol2: crypto.randomUUID(),
    bol3: crypto.randomUUID(),
    bol4: crypto.randomUUID(),
    bol5: crypto.randomUUID(),
    pod1: crypto.randomUUID(),
    pod2: crypto.randomUUID(),
    pod3: crypto.randomUUID(),
    pod4: crypto.randomUUID(),
    ratecon1: crypto.randomUUID(),
    ratecon2: crypto.randomUUID(),
    ratecon3: crypto.randomUUID(),
    inv1: crypto.randomUUID(),
    inv2: crypto.randomUUID(),
    inv3: crypto.randomUUID(),
    ins1: crypto.randomUUID(),
    ins2: crypto.randomUUID(),
    ins3: crypto.randomUUID(),
    other1: crypto.randomUUID(),
    other2: crypto.randomUUID(),
  };

  // 20 documents
  const seedDocuments = [
    // 5 BOLs
    {
      id: docIds.bol1,
      filename: 'bol-ld10041-001.pdf',
      originalName: 'BOL-LD10041.pdf',
      mimeType: 'application/pdf',
      fileSize: 245678,
      filePath: 'uploads/2026/03/placeholder-bol-ld10041.pdf',
      docType: 'bol' as const,
      loadRef: 'LD-10041',
      carrierId: carriers[0].id,
      carrierName: carriers[0].name,
      customerId: customers[0].id,
      customerName: customers[0].name,
      documentDate: daysAgo(14),
      notes: 'Signed BOL for Dallas pickup',
      tags: JSON.stringify(['pickup', 'signed']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.bol2,
      filename: 'bol-ld10042-001.pdf',
      originalName: 'BOL-LD10042.pdf',
      mimeType: 'application/pdf',
      fileSize: 189432,
      filePath: 'uploads/2026/03/placeholder-bol-ld10042.pdf',
      docType: 'bol' as const,
      loadRef: 'LD-10042',
      carrierId: carriers[1].id,
      carrierName: carriers[1].name,
      customerId: customers[1].id,
      customerName: customers[1].name,
      documentDate: daysAgo(10),
      tags: JSON.stringify(['pickup']),
      uploadedBy: 'ops@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.bol3,
      filename: 'bol-ld10043-001.pdf',
      originalName: 'BOL-LD10043.pdf',
      mimeType: 'application/pdf',
      fileSize: 312000,
      filePath: 'uploads/2026/03/placeholder-bol-ld10043.pdf',
      docType: 'bol' as const,
      loadRef: 'LD-10043',
      carrierId: carriers[2].id,
      carrierName: carriers[2].name,
      customerId: customers[2].id,
      customerName: customers[2].name,
      documentDate: daysAgo(8),
      tags: JSON.stringify(['pickup', 'cross-border']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.bol4,
      filename: 'bol-ld10044-001.pdf',
      originalName: 'BOL-LD10044.pdf',
      mimeType: 'application/pdf',
      fileSize: 198000,
      filePath: 'uploads/2026/04/placeholder-bol-ld10044.pdf',
      docType: 'bol' as const,
      loadRef: 'LD-10044',
      carrierId: carriers[3].id,
      carrierName: carriers[3].name,
      customerId: customers[3].id,
      customerName: customers[3].name,
      documentDate: daysAgo(3),
      tags: JSON.stringify(['pickup']),
      uploadedBy: 'ops@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.bol5,
      filename: 'bol-ld10045-001.pdf',
      originalName: 'BOL-LD10045.pdf',
      mimeType: 'application/pdf',
      fileSize: 221000,
      filePath: 'uploads/2026/04/placeholder-bol-ld10045.pdf',
      docType: 'bol' as const,
      loadRef: 'LD-10045',
      carrierId: carriers[0].id,
      carrierName: carriers[0].name,
      customerId: customers[1].id,
      customerName: customers[1].name,
      documentDate: daysAgo(1),
      tags: JSON.stringify(['pickup']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },

    // 4 PODs
    {
      id: docIds.pod1,
      filename: 'pod-ld10041-001.pdf',
      originalName: 'POD-LD10041-signed.pdf',
      mimeType: 'application/pdf',
      fileSize: 156000,
      filePath: 'uploads/2026/03/placeholder-pod-ld10041.pdf',
      docType: 'pod' as const,
      loadRef: 'LD-10041',
      carrierId: carriers[0].id,
      carrierName: carriers[0].name,
      customerId: customers[0].id,
      customerName: customers[0].name,
      documentDate: daysAgo(12),
      notes: 'Signed by John Smith at dock 4',
      tags: JSON.stringify(['delivery', 'signed']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.pod2,
      filename: 'pod-ld10042-001.pdf',
      originalName: 'POD-LD10042.pdf',
      mimeType: 'application/pdf',
      fileSize: 134000,
      filePath: 'uploads/2026/03/placeholder-pod-ld10042.pdf',
      docType: 'pod' as const,
      loadRef: 'LD-10042',
      carrierId: carriers[1].id,
      carrierName: carriers[1].name,
      customerId: customers[1].id,
      customerName: customers[1].name,
      documentDate: daysAgo(9),
      tags: JSON.stringify(['delivery', 'signed']),
      uploadedBy: 'ops@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.pod3,
      filename: 'pod-ld10043-001.jpg',
      originalName: 'POD-LD10043-photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 892000,
      filePath: 'uploads/2026/03/placeholder-pod-ld10043.jpg',
      thumbnailPath: 'uploads/thumbnails/placeholder-thumb-pod.jpg',
      docType: 'pod' as const,
      loadRef: 'LD-10043',
      carrierId: carriers[2].id,
      carrierName: carriers[2].name,
      customerId: customers[2].id,
      customerName: customers[2].name,
      documentDate: daysAgo(7),
      notes: 'Photo POD from driver app',
      tags: JSON.stringify(['delivery', 'photo']),
      uploadedBy: 'driver@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.pod4,
      filename: 'pod-ld10044-001.pdf',
      originalName: 'POD-LD10044.pdf',
      mimeType: 'application/pdf',
      fileSize: 167000,
      filePath: 'uploads/2026/04/placeholder-pod-ld10044.pdf',
      docType: 'pod' as const,
      loadRef: 'LD-10044',
      carrierId: carriers[3].id,
      carrierName: carriers[3].name,
      customerId: customers[3].id,
      customerName: customers[3].name,
      documentDate: daysAgo(2),
      tags: JSON.stringify(['delivery', 'signed']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },

    // 3 Rate Confirmations
    {
      id: docIds.ratecon1,
      filename: 'ratecon-ld10041-001.pdf',
      originalName: 'RateCon-LD10041.pdf',
      mimeType: 'application/pdf',
      fileSize: 98000,
      filePath: 'uploads/2026/03/placeholder-ratecon-ld10041.pdf',
      docType: 'rate_confirmation' as const,
      loadRef: 'LD-10041',
      carrierId: carriers[0].id,
      carrierName: carriers[0].name,
      documentDate: daysAgo(15),
      tags: JSON.stringify(['carrier', 'rate']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.ratecon2,
      filename: 'ratecon-ld10042-001.pdf',
      originalName: 'RateCon-LD10042.pdf',
      mimeType: 'application/pdf',
      fileSize: 87000,
      filePath: 'uploads/2026/03/placeholder-ratecon-ld10042.pdf',
      docType: 'rate_confirmation' as const,
      loadRef: 'LD-10042',
      carrierId: carriers[1].id,
      carrierName: carriers[1].name,
      documentDate: daysAgo(11),
      tags: JSON.stringify(['carrier', 'rate']),
      uploadedBy: 'ops@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.ratecon3,
      filename: 'ratecon-ld10045-001.pdf',
      originalName: 'RateCon-LD10045.pdf',
      mimeType: 'application/pdf',
      fileSize: 92000,
      filePath: 'uploads/2026/04/placeholder-ratecon-ld10045.pdf',
      docType: 'rate_confirmation' as const,
      loadRef: 'LD-10045',
      carrierId: carriers[0].id,
      carrierName: carriers[0].name,
      documentDate: daysAgo(2),
      tags: JSON.stringify(['carrier', 'rate']),
      uploadedBy: 'dispatch@warp.com',
      status: 'active' as const,
    },

    // 3 Invoices
    {
      id: docIds.inv1,
      filename: 'inv-ld10041-001.pdf',
      originalName: 'Invoice-LD10041-CustCopy.pdf',
      mimeType: 'application/pdf',
      fileSize: 112000,
      filePath: 'uploads/2026/03/placeholder-invoice-ld10041.pdf',
      docType: 'invoice' as const,
      loadRef: 'LD-10041',
      customerId: customers[0].id,
      customerName: customers[0].name,
      documentDate: daysAgo(11),
      tags: JSON.stringify(['billing', 'customer']),
      uploadedBy: 'billing@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.inv2,
      filename: 'inv-ld10042-001.pdf',
      originalName: 'Invoice-LD10042-CustCopy.pdf',
      mimeType: 'application/pdf',
      fileSize: 108000,
      filePath: 'uploads/2026/03/placeholder-invoice-ld10042.pdf',
      docType: 'invoice' as const,
      loadRef: 'LD-10042',
      customerId: customers[1].id,
      customerName: customers[1].name,
      documentDate: daysAgo(8),
      tags: JSON.stringify(['billing', 'customer']),
      uploadedBy: 'billing@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.inv3,
      filename: 'inv-ld10043-001.pdf',
      originalName: 'Invoice-LD10043-CustCopy.pdf',
      mimeType: 'application/pdf',
      fileSize: 119000,
      filePath: 'uploads/2026/03/placeholder-invoice-ld10043.pdf',
      docType: 'invoice' as const,
      loadRef: 'LD-10043',
      customerId: customers[2].id,
      customerName: customers[2].name,
      documentDate: daysAgo(6),
      tags: JSON.stringify(['billing', 'customer']),
      uploadedBy: 'billing@warp.com',
      status: 'archived' as const,
    },

    // 3 Insurance Certs
    {
      id: docIds.ins1,
      filename: 'coi-apex-freight-2026.pdf',
      originalName: 'COI-ApexFreight-2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 445000,
      filePath: 'uploads/2026/01/placeholder-coi-apex.pdf',
      docType: 'insurance_cert' as const,
      carrierId: carriers[0].id,
      carrierName: carriers[0].name,
      expiryDate: daysFromNow(45), // expiring soon
      documentDate: daysAgo(320),
      notes: 'Annual renewal — expires soon',
      tags: JSON.stringify(['compliance', 'insurance', 'expiring-soon']),
      uploadedBy: 'compliance@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.ins2,
      filename: 'coi-midwest-express-2025.pdf',
      originalName: 'COI-MidwestExpress-2025.pdf',
      mimeType: 'application/pdf',
      fileSize: 398000,
      filePath: 'uploads/2025/06/placeholder-coi-midwest.pdf',
      docType: 'insurance_cert' as const,
      carrierId: carriers[1].id,
      carrierName: carriers[1].name,
      expiryDate: daysAgo(30), // already expired
      documentDate: daysAgo(395),
      notes: 'EXPIRED — renewal needed immediately',
      tags: JSON.stringify(['compliance', 'insurance', 'expired']),
      uploadedBy: 'compliance@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.ins3,
      filename: 'coi-blue-ridge-2026.pdf',
      originalName: 'COI-BlueRidge-2026.pdf',
      mimeType: 'application/pdf',
      fileSize: 421000,
      filePath: 'uploads/2026/02/placeholder-coi-blueridge.pdf',
      docType: 'insurance_cert' as const,
      carrierId: carriers[2].id,
      carrierName: carriers[2].name,
      expiryDate: daysFromNow(290),
      documentDate: daysAgo(75),
      tags: JSON.stringify(['compliance', 'insurance']),
      uploadedBy: 'compliance@warp.com',
      status: 'active' as const,
    },

    // 2 Other
    {
      id: docIds.other1,
      filename: 'weight-cert-ld10043-001.pdf',
      originalName: 'WeightCert-LD10043.pdf',
      mimeType: 'application/pdf',
      fileSize: 78000,
      filePath: 'uploads/2026/03/placeholder-weightcert-ld10043.pdf',
      docType: 'weight_certificate' as const,
      loadRef: 'LD-10043',
      carrierId: carriers[2].id,
      carrierName: carriers[2].name,
      documentDate: daysAgo(8),
      tags: JSON.stringify(['scale', 'weight']),
      uploadedBy: 'ops@warp.com',
      status: 'active' as const,
    },
    {
      id: docIds.other2,
      filename: 'lumper-ld10044-001.pdf',
      originalName: 'LumperReceipt-LD10044.pdf',
      mimeType: 'application/pdf',
      fileSize: 65000,
      filePath: 'uploads/2026/04/placeholder-lumper-ld10044.pdf',
      docType: 'lumper_receipt' as const,
      loadRef: 'LD-10044',
      carrierId: carriers[3].id,
      carrierName: carriers[3].name,
      customerId: customers[3].id,
      customerName: customers[3].name,
      documentDate: daysAgo(2),
      notes: '$325 lumper fee — paid by carrier',
      tags: JSON.stringify(['lumper', 'accessorial']),
      uploadedBy: 'ops@warp.com',
      status: 'active' as const,
    },
  ];

  await db.insert(documents).values(seedDocuments);
  console.log(`Inserted ${seedDocuments.length} documents`);

  // 10 document requirements for loads LD-10041, LD-10042, LD-10044, LD-10045
  const seedRequirements = [
    // LD-10041 — fully fulfilled (delivered + invoiced)
    {
      loadRef: 'LD-10041',
      loadStatus: 'invoiced' as const,
      requiredType: 'bol' as const,
      fulfilled: true,
      documentId: docIds.bol1,
    },
    {
      loadRef: 'LD-10041',
      loadStatus: 'invoiced' as const,
      requiredType: 'pod' as const,
      fulfilled: true,
      documentId: docIds.pod1,
    },
    {
      loadRef: 'LD-10041',
      loadStatus: 'invoiced' as const,
      requiredType: 'rate_confirmation' as const,
      fulfilled: true,
      documentId: docIds.ratecon1,
    },
    // LD-10042 — delivered, waiting on invoice upload
    {
      loadRef: 'LD-10042',
      loadStatus: 'delivered' as const,
      requiredType: 'bol' as const,
      fulfilled: true,
      documentId: docIds.bol2,
    },
    {
      loadRef: 'LD-10042',
      loadStatus: 'delivered' as const,
      requiredType: 'pod' as const,
      fulfilled: true,
      documentId: docIds.pod2,
    },
    {
      loadRef: 'LD-10042',
      loadStatus: 'delivered' as const,
      requiredType: 'rate_confirmation' as const,
      fulfilled: true,
      documentId: docIds.ratecon2,
    },
    // LD-10044 — delivered, POD uploaded, no invoice yet
    {
      loadRef: 'LD-10044',
      loadStatus: 'delivered' as const,
      requiredType: 'bol' as const,
      fulfilled: true,
      documentId: docIds.bol4,
    },
    {
      loadRef: 'LD-10044',
      loadStatus: 'delivered' as const,
      requiredType: 'pod' as const,
      fulfilled: true,
      documentId: docIds.pod4,
    },
    // LD-10045 — in transit, BOL uploaded, POD pending
    {
      loadRef: 'LD-10045',
      loadStatus: 'in_transit' as const,
      requiredType: 'bol' as const,
      fulfilled: true,
      documentId: docIds.bol5,
    },
    {
      loadRef: 'LD-10045',
      loadStatus: 'in_transit' as const,
      requiredType: 'rate_confirmation' as const,
      fulfilled: true,
      documentId: docIds.ratecon3,
    },
  ];

  await db.insert(documentRequirements).values(seedRequirements);
  console.log(`Inserted ${seedRequirements.length} document requirements`);

  console.log('Seed complete!');
  client.close();
}

main().catch(console.error);
