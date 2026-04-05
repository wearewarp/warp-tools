import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'customer-portal.db');

async function seed() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client, { schema });

  console.log('Seeding database...');

  // ─── Create tables directly (no migration files needed for seed) ─────────
  await client.execute(`
    CREATE TABLE IF NOT EXISTS portal_customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      access_token TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      last_login_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS portal_shipments (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES portal_customers(id) ON DELETE CASCADE,
      shipment_number TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'booked',
      equipment_type TEXT,
      commodity TEXT,
      weight INTEGER,
      pieces INTEGER,
      origin_city TEXT NOT NULL,
      origin_state TEXT NOT NULL,
      origin_zip TEXT,
      origin_address TEXT,
      origin_contact_name TEXT,
      origin_contact_phone TEXT,
      dest_city TEXT NOT NULL,
      dest_state TEXT NOT NULL,
      dest_zip TEXT,
      dest_address TEXT,
      dest_contact_name TEXT,
      dest_contact_phone TEXT,
      pickup_date TEXT,
      pickup_time_window TEXT,
      delivery_date TEXT,
      delivery_time_window TEXT,
      actual_pickup_at TEXT,
      actual_delivery_at TEXT,
      customer_rate REAL,
      invoice_ref TEXT,
      invoice_status TEXT DEFAULT 'pending',
      invoice_amount REAL,
      special_instructions TEXT,
      bol_number TEXT,
      po_number TEXT,
      pro_number TEXT,
      current_location_city TEXT,
      current_location_state TEXT,
      current_eta TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS portal_events (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES portal_shipments(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      description TEXT NOT NULL,
      location_city TEXT,
      location_state TEXT,
      is_visible_to_customer INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS portal_documents (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES portal_shipments(id) ON DELETE CASCADE,
      doc_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      is_visible_to_customer INTEGER DEFAULT 1,
      uploaded_at TEXT DEFAULT (datetime('now')),
      notes TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS portal_messages (
      id TEXT PRIMARY KEY,
      shipment_id TEXT REFERENCES portal_shipments(id) ON DELETE SET NULL,
      customer_id TEXT REFERENCES portal_customers(id) ON DELETE CASCADE,
      sender_type TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS portal_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      company_name TEXT DEFAULT 'My Brokerage',
      support_email TEXT,
      support_phone TEXT,
      welcome_message TEXT,
      footer_text TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // ─── Clear existing data ─────────────────────────────────────────────────
  await client.execute('DELETE FROM portal_messages');
  await client.execute('DELETE FROM portal_documents');
  await client.execute('DELETE FROM portal_events');
  await client.execute('DELETE FROM portal_shipments');
  await client.execute('DELETE FROM portal_customers');
  await client.execute('DELETE FROM portal_settings');

  // ─── Customers ───────────────────────────────────────────────────────────
  const customers = [
    {
      id: 'cust-001',
      name: 'Acme Foods Inc',
      contact_name: 'Sarah Chen',
      contact_email: 'sarah.chen@acmefoods.com',
      contact_phone: '(312) 555-0142',
      access_token: 'acme-tok-2024-xK9mP3nQ',
      is_active: 1,
      last_login_at: '2026-04-03T14:22:00Z',
      notes: 'Large frozen food distributor. Weekly shipments from Chicago area.',
    },
    {
      id: 'cust-002',
      name: 'GlobalTech Logistics',
      contact_name: 'Marcus Rivera',
      contact_email: 'mrivera@globaltech.io',
      contact_phone: '(408) 555-0298',
      access_token: 'gt-tok-2024-bR7wL4xY',
      is_active: 1,
      last_login_at: '2026-04-04T09:15:00Z',
      notes: 'Electronics and server equipment. Requires climate-controlled trailers.',
    },
    {
      id: 'cust-003',
      name: 'Pacific Distributors',
      contact_name: 'Jennifer Tanaka',
      contact_email: 'jtanaka@pacificdist.com',
      contact_phone: '(206) 555-0176',
      access_token: 'pd-tok-2024-hN2kF8vZ',
      is_active: 1,
      last_login_at: '2026-04-01T16:45:00Z',
      notes: 'Building materials and lumber. Flatbed and step deck loads mostly.',
    },
  ];

  for (const c of customers) {
    await client.execute({
      sql: `INSERT INTO portal_customers (id, name, contact_name, contact_email, contact_phone, access_token, is_active, last_login_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [c.id, c.name, c.contact_name, c.contact_email, c.contact_phone, c.access_token, c.is_active, c.last_login_at, c.notes],
    });
  }
  console.log(`  ✓ ${customers.length} customers`);

  // ─── Shipments ───────────────────────────────────────────────────────────
  const shipments = [
    // Acme Foods — 4 shipments
    {
      id: 'shp-001', customer_id: 'cust-001', shipment_number: 'WRP-2026-0412',
      status: 'in_transit', equipment_type: 'reefer', commodity: 'Frozen Chicken Products',
      weight: 42000, pieces: 24,
      origin_city: 'Chicago', origin_state: 'IL', origin_zip: '60632', origin_address: '4500 S Pulaski Rd',
      origin_contact_name: 'Mike at Acme Warehouse', origin_contact_phone: '(312) 555-0199',
      dest_city: 'Atlanta', dest_state: 'GA', dest_zip: '30318', dest_address: '1200 Howell Mill Rd NW',
      dest_contact_name: 'Receiving Dock B', dest_contact_phone: '(404) 555-0133',
      pickup_date: '2026-04-03', pickup_time_window: '08:00-12:00',
      delivery_date: '2026-04-05', delivery_time_window: '06:00-14:00',
      actual_pickup_at: '2026-04-03T09:30:00Z', actual_delivery_at: null,
      customer_rate: 2850.00, invoice_ref: null, invoice_status: 'pending', invoice_amount: null,
      special_instructions: 'Maintain 0°F. Driver must have temp recorder printout at delivery.',
      bol_number: 'BOL-ACM-8834', po_number: 'PO-ATL-2209', pro_number: null,
      current_location_city: 'Nashville', current_location_state: 'TN', current_eta: '2026-04-05T08:00:00Z',
    },
    {
      id: 'shp-002', customer_id: 'cust-001', shipment_number: 'WRP-2026-0398',
      status: 'delivered', equipment_type: 'reefer', commodity: 'Frozen Seafood',
      weight: 38000, pieces: 20,
      origin_city: 'Chicago', origin_state: 'IL', origin_zip: '60609', origin_address: '3100 S Ashland Ave',
      origin_contact_name: 'Acme Cold Storage', origin_contact_phone: '(312) 555-0188',
      dest_city: 'Dallas', dest_state: 'TX', dest_zip: '75247', dest_address: '8900 Ambassador Row',
      dest_contact_name: 'FreshMart DC', dest_contact_phone: '(214) 555-0277',
      pickup_date: '2026-03-30', pickup_time_window: '06:00-10:00',
      delivery_date: '2026-04-01', delivery_time_window: '08:00-16:00',
      actual_pickup_at: '2026-03-30T07:15:00Z', actual_delivery_at: '2026-04-01T11:20:00Z',
      customer_rate: 3200.00, invoice_ref: 'INV-2026-0398', invoice_status: 'sent', invoice_amount: 3200.00,
      special_instructions: 'Keep at -10°F. Call 30 min before arrival.',
      bol_number: 'BOL-ACM-8801', po_number: 'PO-DAL-1187', pro_number: 'PRO-44521',
      current_location_city: 'Dallas', current_location_state: 'TX', current_eta: null,
    },
    {
      id: 'shp-003', customer_id: 'cust-001', shipment_number: 'WRP-2026-0421',
      status: 'booked', equipment_type: 'reefer', commodity: 'Dairy Products',
      weight: 35000, pieces: 18,
      origin_city: 'Milwaukee', origin_state: 'WI', origin_zip: '53204', origin_address: '700 W Virginia St',
      origin_contact_name: 'Dairy Fresh Warehouse', origin_contact_phone: '(414) 555-0321',
      dest_city: 'Memphis', dest_state: 'TN', dest_zip: '38118', dest_address: '3500 Lamar Ave',
      dest_contact_name: 'Southern Foods DC', dest_contact_phone: '(901) 555-0244',
      pickup_date: '2026-04-07', pickup_time_window: '06:00-10:00',
      delivery_date: '2026-04-08', delivery_time_window: '08:00-16:00',
      actual_pickup_at: null, actual_delivery_at: null,
      customer_rate: 2100.00, invoice_ref: null, invoice_status: 'pending', invoice_amount: null,
      special_instructions: 'Temp must stay between 34-38°F.',
      bol_number: null, po_number: 'PO-MEM-0098', pro_number: null,
      current_location_city: null, current_location_state: null, current_eta: null,
    },
    {
      id: 'shp-004', customer_id: 'cust-001', shipment_number: 'WRP-2026-0350',
      status: 'invoiced', equipment_type: 'dry_van', commodity: 'Canned Goods',
      weight: 44000, pieces: 26,
      origin_city: 'Indianapolis', origin_state: 'IN', origin_zip: '46241', origin_address: '5200 W Washington St',
      origin_contact_name: 'Acme Dry Goods', origin_contact_phone: '(317) 555-0155',
      dest_city: 'Charlotte', dest_state: 'NC', dest_zip: '28208', dest_address: '4100 N Graham St',
      dest_contact_name: 'Southeast Grocery DC', dest_contact_phone: '(704) 555-0189',
      pickup_date: '2026-03-25', pickup_time_window: '08:00-12:00',
      delivery_date: '2026-03-27', delivery_time_window: '06:00-14:00',
      actual_pickup_at: '2026-03-25T09:00:00Z', actual_delivery_at: '2026-03-27T08:45:00Z',
      customer_rate: 1850.00, invoice_ref: 'INV-2026-0350', invoice_status: 'sent', invoice_amount: 1850.00,
      special_instructions: null,
      bol_number: 'BOL-ACM-8756', po_number: 'PO-CLT-3321', pro_number: 'PRO-44310',
      current_location_city: 'Charlotte', current_location_state: 'NC', current_eta: null,
    },

    // GlobalTech Logistics — 3 shipments
    {
      id: 'shp-005', customer_id: 'cust-002', shipment_number: 'WRP-2026-0415',
      status: 'at_pickup', equipment_type: 'dry_van', commodity: 'Server Rack Equipment',
      weight: 28000, pieces: 8,
      origin_city: 'San Jose', origin_state: 'CA', origin_zip: '95131', origin_address: '1800 N 1st St',
      origin_contact_name: 'GlobalTech Warehouse', origin_contact_phone: '(408) 555-0301',
      dest_city: 'Phoenix', dest_state: 'AZ', dest_zip: '85034', dest_address: '2400 E Buckeye Rd',
      dest_contact_name: 'AZ Data Center', dest_contact_phone: '(602) 555-0412',
      pickup_date: '2026-04-04', pickup_time_window: '10:00-14:00',
      delivery_date: '2026-04-06', delivery_time_window: '08:00-16:00',
      actual_pickup_at: null, actual_delivery_at: null,
      customer_rate: 2400.00, invoice_ref: null, invoice_status: 'pending', invoice_amount: null,
      special_instructions: 'Fragile electronics — no double stacking. Air ride required.',
      bol_number: 'BOL-GT-2290', po_number: 'PO-PHX-1102', pro_number: null,
      current_location_city: 'San Jose', current_location_state: 'CA', current_eta: '2026-04-06T10:00:00Z',
    },
    {
      id: 'shp-006', customer_id: 'cust-002', shipment_number: 'WRP-2026-0388',
      status: 'delivered', equipment_type: 'sprinter_van', commodity: 'Networking Equipment',
      weight: 4500, pieces: 12,
      origin_city: 'Fremont', origin_state: 'CA', origin_zip: '94538', origin_address: '44000 Osgood Rd',
      origin_contact_name: 'GT Assembly', origin_contact_phone: '(510) 555-0145',
      dest_city: 'Los Angeles', dest_state: 'CA', dest_zip: '90058', dest_address: '1600 E Olympic Blvd',
      dest_contact_name: 'LA Tech Hub', dest_contact_phone: '(213) 555-0233',
      pickup_date: '2026-03-28', pickup_time_window: '08:00-10:00',
      delivery_date: '2026-03-28', delivery_time_window: '16:00-20:00',
      actual_pickup_at: '2026-03-28T08:30:00Z', actual_delivery_at: '2026-03-28T17:15:00Z',
      customer_rate: 1650.00, invoice_ref: 'INV-2026-0388', invoice_status: 'paid', invoice_amount: 1650.00,
      special_instructions: 'Same-day delivery. Call recipient 1 hour before arrival.',
      bol_number: 'BOL-GT-2255', po_number: 'PO-LA-0887', pro_number: 'PRO-44498',
      current_location_city: 'Los Angeles', current_location_state: 'CA', current_eta: null,
    },
    {
      id: 'shp-007', customer_id: 'cust-002', shipment_number: 'WRP-2026-0425',
      status: 'quote', equipment_type: 'flatbed', commodity: 'Solar Panel Arrays',
      weight: 40000, pieces: 4,
      origin_city: 'Sacramento', origin_state: 'CA', origin_zip: '95828', origin_address: '8200 Elder Creek Rd',
      origin_contact_name: 'SolarTech Mfg', origin_contact_phone: '(916) 555-0199',
      dest_city: 'Las Vegas', dest_state: 'NV', dest_zip: '89115', dest_address: '4700 N Lamb Blvd',
      dest_contact_name: 'Desert Solar Install', dest_contact_phone: '(702) 555-0344',
      pickup_date: '2026-04-10', pickup_time_window: '06:00-10:00',
      delivery_date: '2026-04-11', delivery_time_window: '08:00-14:00',
      actual_pickup_at: null, actual_delivery_at: null,
      customer_rate: 3100.00, invoice_ref: null, invoice_status: 'pending', invoice_amount: null,
      special_instructions: 'Oversized load — requires tarps and edge protectors.',
      bol_number: null, po_number: null, pro_number: null,
      current_location_city: null, current_location_state: null, current_eta: null,
    },

    // Pacific Distributors — 3 shipments
    {
      id: 'shp-008', customer_id: 'cust-003', shipment_number: 'WRP-2026-0409',
      status: 'in_transit', equipment_type: 'flatbed', commodity: 'Structural Steel Beams',
      weight: 45000, pieces: 6,
      origin_city: 'Portland', origin_state: 'OR', origin_zip: '97217', origin_address: '9700 N Lombard St',
      origin_contact_name: 'Pacific Steel Yard', origin_contact_phone: '(503) 555-0288',
      dest_city: 'Boise', dest_state: 'ID', dest_zip: '83716', dest_address: '7200 E Gowen Rd',
      dest_contact_name: 'Mountain Construction', dest_contact_phone: '(208) 555-0177',
      pickup_date: '2026-04-03', pickup_time_window: '06:00-10:00',
      delivery_date: '2026-04-04', delivery_time_window: '08:00-16:00',
      actual_pickup_at: '2026-04-03T07:45:00Z', actual_delivery_at: null,
      customer_rate: 2200.00, invoice_ref: null, invoice_status: 'pending', invoice_amount: null,
      special_instructions: 'Chains and binders required. 4-point securement minimum.',
      bol_number: 'BOL-PD-1198', po_number: 'PO-BOI-4401', pro_number: null,
      current_location_city: 'Pendleton', current_location_state: 'OR', current_eta: '2026-04-04T12:00:00Z',
    },
    {
      id: 'shp-009', customer_id: 'cust-003', shipment_number: 'WRP-2026-0380',
      status: 'closed', equipment_type: 'step_deck', commodity: 'Lumber and Plywood',
      weight: 43000, pieces: 1,
      origin_city: 'Seattle', origin_state: 'WA', origin_zip: '98108', origin_address: '5800 1st Ave S',
      origin_contact_name: 'Pacific Lumber DC', origin_contact_phone: '(206) 555-0310',
      dest_city: 'San Francisco', dest_state: 'CA', dest_zip: '94124', dest_address: '1100 Evans Ave',
      dest_contact_name: 'Bay Area Builders', dest_contact_phone: '(415) 555-0221',
      pickup_date: '2026-03-22', pickup_time_window: '07:00-11:00',
      delivery_date: '2026-03-24', delivery_time_window: '08:00-16:00',
      actual_pickup_at: '2026-03-22T08:00:00Z', actual_delivery_at: '2026-03-24T10:30:00Z',
      customer_rate: 3800.00, invoice_ref: 'INV-2026-0380', invoice_status: 'paid', invoice_amount: 3800.00,
      special_instructions: 'Tarped load. Must have tarps in good condition.',
      bol_number: 'BOL-PD-1155', po_number: 'PO-SF-7720', pro_number: 'PRO-44289',
      current_location_city: 'San Francisco', current_location_state: 'CA', current_eta: null,
    },
    {
      id: 'shp-010', customer_id: 'cust-003', shipment_number: 'WRP-2026-0430',
      status: 'cancelled', equipment_type: 'flatbed', commodity: 'Concrete Forms',
      weight: 38000, pieces: 10,
      origin_city: 'Tacoma', origin_state: 'WA', origin_zip: '98421', origin_address: '1900 Milwaukee Way',
      origin_contact_name: 'Pacific Forms Dept', origin_contact_phone: '(253) 555-0199',
      dest_city: 'Eugene', dest_state: 'OR', dest_zip: '97402', dest_address: '2900 W 11th Ave',
      dest_contact_name: 'Lane County Contractors', dest_contact_phone: '(541) 555-0128',
      pickup_date: '2026-04-05', pickup_time_window: '08:00-12:00',
      delivery_date: '2026-04-06', delivery_time_window: '08:00-14:00',
      actual_pickup_at: null, actual_delivery_at: null,
      customer_rate: 1500.00, invoice_ref: null, invoice_status: 'pending', invoice_amount: null,
      special_instructions: 'CANCELLED — Customer postponed project.',
      bol_number: null, po_number: 'PO-EUG-0055', pro_number: null,
      current_location_city: null, current_location_state: null, current_eta: null,
    },
  ];

  for (const s of shipments) {
    await client.execute({
      sql: `INSERT INTO portal_shipments (id, customer_id, shipment_number, status, equipment_type, commodity, weight, pieces, origin_city, origin_state, origin_zip, origin_address, origin_contact_name, origin_contact_phone, dest_city, dest_state, dest_zip, dest_address, dest_contact_name, dest_contact_phone, pickup_date, pickup_time_window, delivery_date, delivery_time_window, actual_pickup_at, actual_delivery_at, customer_rate, invoice_ref, invoice_status, invoice_amount, special_instructions, bol_number, po_number, pro_number, current_location_city, current_location_state, current_eta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [s.id, s.customer_id, s.shipment_number, s.status, s.equipment_type, s.commodity, s.weight, s.pieces, s.origin_city, s.origin_state, s.origin_zip, s.origin_address, s.origin_contact_name, s.origin_contact_phone, s.dest_city, s.dest_state, s.dest_zip, s.dest_address, s.dest_contact_name, s.dest_contact_phone, s.pickup_date, s.pickup_time_window, s.delivery_date, s.delivery_time_window, s.actual_pickup_at, s.actual_delivery_at, s.customer_rate, s.invoice_ref, s.invoice_status, s.invoice_amount, s.special_instructions, s.bol_number, s.po_number, s.pro_number, s.current_location_city, s.current_location_state, s.current_eta],
    });
  }
  console.log(`  ✓ ${shipments.length} shipments`);

  // ─── Events ──────────────────────────────────────────────────────────────
  const events = [
    // shp-001 (in_transit) events
    { id: 'evt-001', shipment_id: 'shp-001', event_type: 'status_change', description: 'Shipment booked', location_city: 'Chicago', location_state: 'IL', is_visible: 1, created_at: '2026-04-02T15:00:00Z' },
    { id: 'evt-002', shipment_id: 'shp-001', event_type: 'status_change', description: 'Picked up — driver loaded 24 pallets', location_city: 'Chicago', location_state: 'IL', is_visible: 1, created_at: '2026-04-03T09:30:00Z' },
    { id: 'evt-003', shipment_id: 'shp-001', event_type: 'check_call', description: 'Driver checked in — making good time on I-65 S', location_city: 'Indianapolis', location_state: 'IN', is_visible: 1, created_at: '2026-04-03T14:00:00Z' },
    { id: 'evt-004', shipment_id: 'shp-001', event_type: 'check_call', description: 'Driver stopped for fuel and rest break', location_city: 'Louisville', location_state: 'KY', is_visible: 1, created_at: '2026-04-03T18:30:00Z' },
    { id: 'evt-005', shipment_id: 'shp-001', event_type: 'check_call', description: 'Back on road. ETA Atlanta tomorrow 8 AM', location_city: 'Nashville', location_state: 'TN', is_visible: 1, created_at: '2026-04-04T06:00:00Z' },
    { id: 'evt-006', shipment_id: 'shp-001', event_type: 'note', description: 'Internal: Carrier confirmed reefer unit running at 0°F', location_city: null, location_state: null, is_visible: 0, created_at: '2026-04-04T07:00:00Z' },

    // shp-002 (delivered) events
    { id: 'evt-007', shipment_id: 'shp-002', event_type: 'status_change', description: 'Shipment booked', location_city: 'Chicago', location_state: 'IL', is_visible: 1, created_at: '2026-03-28T10:00:00Z' },
    { id: 'evt-008', shipment_id: 'shp-002', event_type: 'status_change', description: 'Picked up at Acme Cold Storage', location_city: 'Chicago', location_state: 'IL', is_visible: 1, created_at: '2026-03-30T07:15:00Z' },
    { id: 'evt-009', shipment_id: 'shp-002', event_type: 'check_call', description: 'Driver on I-44 near Springfield MO', location_city: 'Springfield', location_state: 'MO', is_visible: 1, created_at: '2026-03-31T09:00:00Z' },
    { id: 'evt-010', shipment_id: 'shp-002', event_type: 'status_change', description: 'Delivered — signed by FreshMart receiving', location_city: 'Dallas', location_state: 'TX', is_visible: 1, created_at: '2026-04-01T11:20:00Z' },
    { id: 'evt-011', shipment_id: 'shp-002', event_type: 'invoice_update', description: 'Invoice INV-2026-0398 sent to customer', location_city: null, location_state: null, is_visible: 1, created_at: '2026-04-02T09:00:00Z' },

    // shp-005 (at_pickup) events
    { id: 'evt-012', shipment_id: 'shp-005', event_type: 'status_change', description: 'Shipment booked', location_city: 'San Jose', location_state: 'CA', is_visible: 1, created_at: '2026-04-02T16:00:00Z' },
    { id: 'evt-013', shipment_id: 'shp-005', event_type: 'status_change', description: 'Driver arrived at pickup facility', location_city: 'San Jose', location_state: 'CA', is_visible: 1, created_at: '2026-04-04T10:15:00Z' },

    // shp-006 (delivered) events
    { id: 'evt-014', shipment_id: 'shp-006', event_type: 'status_change', description: 'Picked up from GT Assembly', location_city: 'Fremont', location_state: 'CA', is_visible: 1, created_at: '2026-03-28T08:30:00Z' },
    { id: 'evt-015', shipment_id: 'shp-006', event_type: 'status_change', description: 'Delivered to LA Tech Hub', location_city: 'Los Angeles', location_state: 'CA', is_visible: 1, created_at: '2026-03-28T17:15:00Z' },
    { id: 'evt-016', shipment_id: 'shp-006', event_type: 'document_added', description: 'POD uploaded', location_city: null, location_state: null, is_visible: 1, created_at: '2026-03-29T09:00:00Z' },

    // shp-008 (in_transit) events
    { id: 'evt-017', shipment_id: 'shp-008', event_type: 'status_change', description: 'Picked up from Pacific Steel Yard', location_city: 'Portland', location_state: 'OR', is_visible: 1, created_at: '2026-04-03T07:45:00Z' },
    { id: 'evt-018', shipment_id: 'shp-008', event_type: 'check_call', description: 'Driver on I-84 E passing The Dalles', location_city: 'The Dalles', location_state: 'OR', is_visible: 1, created_at: '2026-04-03T11:00:00Z' },
    { id: 'evt-019', shipment_id: 'shp-008', event_type: 'check_call', description: 'Driver stopped in Pendleton for the night', location_city: 'Pendleton', location_state: 'OR', is_visible: 1, created_at: '2026-04-03T18:00:00Z' },

    // shp-009 (closed) events
    { id: 'evt-020', shipment_id: 'shp-009', event_type: 'status_change', description: 'Delivered to Bay Area Builders', location_city: 'San Francisco', location_state: 'CA', is_visible: 1, created_at: '2026-03-24T10:30:00Z' },
    { id: 'evt-021', shipment_id: 'shp-009', event_type: 'invoice_update', description: 'Invoice INV-2026-0380 paid in full', location_city: null, location_state: null, is_visible: 1, created_at: '2026-03-30T14:00:00Z' },

    // shp-010 (cancelled) events
    { id: 'evt-022', shipment_id: 'shp-010', event_type: 'status_change', description: 'Shipment cancelled by customer — project postponed', location_city: null, location_state: null, is_visible: 1, created_at: '2026-04-04T08:00:00Z' },
  ];

  for (const e of events) {
    await client.execute({
      sql: `INSERT INTO portal_events (id, shipment_id, event_type, description, location_city, location_state, is_visible_to_customer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [e.id, e.shipment_id, e.event_type, e.description, e.location_city, e.location_state, e.is_visible, e.created_at],
    });
  }
  console.log(`  ✓ ${events.length} events`);

  // ─── Documents ───────────────────────────────────────────────────────────
  const documents = [
    { id: 'doc-001', shipment_id: 'shp-001', doc_type: 'bol', filename: 'bol-acm-8834.pdf', original_name: 'BOL-ACM-8834.pdf', file_path: '/uploads/shp-001/bol-acm-8834.pdf', file_size: 245000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-002', shipment_id: 'shp-002', doc_type: 'bol', filename: 'bol-acm-8801.pdf', original_name: 'BOL-ACM-8801.pdf', file_path: '/uploads/shp-002/bol-acm-8801.pdf', file_size: 230000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-003', shipment_id: 'shp-002', doc_type: 'pod', filename: 'pod-wrp-0398.pdf', original_name: 'POD-WRP-2026-0398.pdf', file_path: '/uploads/shp-002/pod-wrp-0398.pdf', file_size: 180000, mime_type: 'application/pdf', is_visible: 1, notes: 'Signed by FreshMart receiving' },
    { id: 'doc-004', shipment_id: 'shp-002', doc_type: 'invoice', filename: 'inv-2026-0398.pdf', original_name: 'INV-2026-0398.pdf', file_path: '/uploads/shp-002/inv-2026-0398.pdf', file_size: 95000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-005', shipment_id: 'shp-006', doc_type: 'pod', filename: 'pod-wrp-0388.pdf', original_name: 'POD-WRP-2026-0388.pdf', file_path: '/uploads/shp-006/pod-wrp-0388.pdf', file_size: 165000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-006', shipment_id: 'shp-006', doc_type: 'invoice', filename: 'inv-2026-0388.pdf', original_name: 'INV-2026-0388.pdf', file_path: '/uploads/shp-006/inv-2026-0388.pdf', file_size: 88000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-007', shipment_id: 'shp-009', doc_type: 'bol', filename: 'bol-pd-1155.pdf', original_name: 'BOL-PD-1155.pdf', file_path: '/uploads/shp-009/bol-pd-1155.pdf', file_size: 210000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-008', shipment_id: 'shp-009', doc_type: 'pod', filename: 'pod-wrp-0380.pdf', original_name: 'POD-WRP-2026-0380.pdf', file_path: '/uploads/shp-009/pod-wrp-0380.pdf', file_size: 175000, mime_type: 'application/pdf', is_visible: 1, notes: null },
    { id: 'doc-009', shipment_id: 'shp-009', doc_type: 'rate_confirmation', filename: 'ratecon-0380.pdf', original_name: 'RateConfirmation-WRP-0380.pdf', file_path: '/uploads/shp-009/ratecon-0380.pdf', file_size: 120000, mime_type: 'application/pdf', is_visible: 0, notes: 'Internal — not visible to customer' },
    { id: 'doc-010', shipment_id: 'shp-004', doc_type: 'invoice', filename: 'inv-2026-0350.pdf', original_name: 'INV-2026-0350.pdf', file_path: '/uploads/shp-004/inv-2026-0350.pdf', file_size: 92000, mime_type: 'application/pdf', is_visible: 1, notes: null },
  ];

  for (const d of documents) {
    await client.execute({
      sql: `INSERT INTO portal_documents (id, shipment_id, doc_type, filename, original_name, file_path, file_size, mime_type, is_visible_to_customer, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [d.id, d.shipment_id, d.doc_type, d.filename, d.original_name, d.file_path, d.file_size, d.mime_type, d.is_visible, d.notes],
    });
  }
  console.log(`  ✓ ${documents.length} documents`);

  // ─── Messages ────────────────────────────────────────────────────────────
  const messages = [
    { id: 'msg-001', shipment_id: 'shp-001', customer_id: 'cust-001', sender_type: 'customer', message: 'Can you confirm the reefer temp is holding at 0°F? We had issues last time.', is_read: 1, created_at: '2026-04-03T11:00:00Z' },
    { id: 'msg-002', shipment_id: 'shp-001', customer_id: 'cust-001', sender_type: 'broker', message: 'Confirmed — carrier sent temp recorder screenshot, unit is holding at 0°F. All good.', is_read: 1, created_at: '2026-04-03T11:30:00Z' },
    { id: 'msg-003', shipment_id: 'shp-001', customer_id: 'cust-001', sender_type: 'customer', message: 'Great, thanks! Any update on ETA?', is_read: 1, created_at: '2026-04-04T08:00:00Z' },
    { id: 'msg-004', shipment_id: 'shp-001', customer_id: 'cust-001', sender_type: 'broker', message: 'Driver just left Nashville. ETA is tomorrow morning around 8 AM. Will update once he gets closer.', is_read: 0, created_at: '2026-04-04T08:15:00Z' },
    { id: 'msg-005', shipment_id: 'shp-003', customer_id: 'cust-001', sender_type: 'customer', message: 'For the Milwaukee pickup on the 7th — can we push the time window to 10:00-14:00 instead?', is_read: 0, created_at: '2026-04-04T10:00:00Z' },
    { id: 'msg-006', shipment_id: 'shp-005', customer_id: 'cust-002', sender_type: 'customer', message: 'Is the driver at the warehouse yet? Loading dock is only open until 2 PM.', is_read: 1, created_at: '2026-04-04T10:30:00Z' },
    { id: 'msg-007', shipment_id: 'shp-005', customer_id: 'cust-002', sender_type: 'broker', message: 'Yes, driver arrived at 10:15 AM and is currently being loaded. Should be done within the hour.', is_read: 1, created_at: '2026-04-04T10:45:00Z' },
    { id: 'msg-008', shipment_id: null, customer_id: 'cust-003', sender_type: 'customer', message: 'Hi, we need to cancel the Tacoma to Eugene shipment (WRP-2026-0430). Project got postponed.', is_read: 1, created_at: '2026-04-04T07:30:00Z' },
    { id: 'msg-009', shipment_id: null, customer_id: 'cust-003', sender_type: 'broker', message: 'No problem, Jennifer. I\'ve cancelled WRP-2026-0430. No charges since we hadn\'t dispatched yet. Let us know when the project is back on.', is_read: 1, created_at: '2026-04-04T07:45:00Z' },
  ];

  for (const m of messages) {
    await client.execute({
      sql: `INSERT INTO portal_messages (id, shipment_id, customer_id, sender_type, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [m.id, m.shipment_id, m.customer_id, m.sender_type, m.message, m.is_read, m.created_at],
    });
  }
  console.log(`  ✓ ${messages.length} messages`);

  // ─── Settings ────────────────────────────────────────────────────────────
  await client.execute({
    sql: `INSERT INTO portal_settings (id, company_name, support_email, support_phone, welcome_message, footer_text) VALUES (?, ?, ?, ?, ?, ?)`,
    args: ['default', 'Warp Freight Brokerage', 'support@warpfreight.com', '(800) 555-WARP', 'Welcome to the Warp Customer Portal. Track your shipments, view documents, and communicate with your logistics team.', '© 2026 Warp Freight Brokerage. All rights reserved.'],
  });
  console.log('  ✓ Settings');

  console.log('Seeding complete!');
  client.close();
}

seed().catch(console.error);
