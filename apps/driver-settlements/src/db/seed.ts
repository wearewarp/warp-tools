import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import {
  drivers,
  trips,
  settlements,
  settlementDeductions,
  settlementReimbursements,
  advances,
  deductionTemplates,
} from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'driver-settlements.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

// ─── Date helpers ──────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Settlement math plan ──────────────────────────────────────────────────────
//
// S1 (paid, d1, per_mile@0.55):
//   Miles 2200 → gross = $1210.00
//   Deductions: $50 insurance + $15 ELD + $25 occ. accident = $90.00
//   Reimbursements: fuel $80.00
//   Advances: $200.00 (deducted)
//   Net = 1210.00 - 90.00 - 200.00 + 80.00 = $1000.00
//
// S2 (approved, d2, per_mile@0.60):
//   Miles 1800 → gross = $1080.00
//   Deductions: $50 insurance + $200 lease + $15 ELD = $265.00
//   Reimbursements: toll $45.00
//   Advances: $0
//   Net = 1080.00 - 265.00 + 45.00 = $860.00
//
// S3 (submitted, d3, percentage@25%):
//   Revenue $7200 → gross = $1800.00
//   Deductions: $15 ELD + $35 cargo insurance + $25 occ. accident = $75.00
//   Reimbursements: maintenance $60 + maintenance $60 = $120.00
//   Advances: $500.00 (deducted)
//   Net = 1800.00 - 75.00 - 500.00 + 120.00 = $1345.00
//
// S4 (open, d4, flat@500):
//   6 loads → gross = $3000.00
//   Deductions: $50 insurance + $200 lease + $15 ELD = $265.00
//   Reimbursements: $0
//   Advances: $0
//   Net = 3000.00 - 265.00 = $2735.00

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });
  console.log('Migrations done.');

  // ─── Deduction Templates ───────────────────────────────────────────────────
  console.log('Seeding deduction templates...');
  await db.insert(deductionTemplates).values([
    { name: 'Occupational Accident Insurance', amount: 25, is_percentage: false, category: 'insurance', frequency: 'per_settlement', active: true },
    { name: 'Cargo Insurance', amount: 35, is_percentage: false, category: 'insurance', frequency: 'per_settlement', active: true },
    { name: 'ELD Device Fee', amount: 15, is_percentage: false, category: 'eld', frequency: 'per_settlement', active: true },
    { name: 'Truck Lease Payment', amount: 200, is_percentage: false, category: 'lease', frequency: 'per_settlement', active: true },
    { name: 'Physical Damage Insurance', amount: 50, is_percentage: false, category: 'insurance', frequency: 'monthly', active: true },
  ]);
  console.log('  5 deduction templates');

  // ─── Drivers ──────────────────────────────────────────────────────────────
  console.log('Seeding drivers...');
  const [d1, d2, d3, d4, d5, d6] = await db
    .insert(drivers)
    .values([
      {
        first_name: 'James', last_name: 'Harrington',
        email: 'james.harrington@example.com', phone: '555-201-3344',
        address_street: '114 Maple Ave', address_city: 'Chicago', address_state: 'IL', address_zip: '60601',
        license_number: 'IL-CDL-448821', license_state: 'IL', license_expiry: dateStr(2026, 8, 15),
        pay_type: 'per_mile', pay_rate: 0.55,
        hire_date: dateStr(2022, 3, 10), status: 'active',
        emergency_contact_name: 'Susan Harrington', emergency_contact_phone: '555-201-9900',
      },
      {
        first_name: 'Maria', last_name: 'Castillo',
        email: 'maria.castillo@example.com', phone: '555-302-5566',
        address_street: '88 Oak Street', address_city: 'Dallas', address_state: 'TX', address_zip: '75201',
        license_number: 'TX-CDL-229934', license_state: 'TX', license_expiry: dateStr(2025, 11, 30),
        pay_type: 'per_mile', pay_rate: 0.60,
        hire_date: dateStr(2021, 7, 22), status: 'active',
        emergency_contact_name: 'Carlos Castillo', emergency_contact_phone: '555-302-7711',
      },
      {
        first_name: 'Derek', last_name: 'Washington',
        email: 'derek.washington@example.com', phone: '555-403-7788',
        address_street: '350 River Rd', address_city: 'Atlanta', address_state: 'GA', address_zip: '30301',
        license_number: 'GA-CDL-113377', license_state: 'GA', license_expiry: dateStr(2027, 2, 28),
        pay_type: 'percentage', pay_rate: 25,
        hire_date: dateStr(2023, 1, 5), status: 'active',
        emergency_contact_name: 'Linda Washington', emergency_contact_phone: '555-403-2200',
      },
      {
        first_name: 'Tanya', last_name: 'Nguyen',
        email: 'tanya.nguyen@example.com', phone: '555-504-9922',
        address_street: '22 Elm Court', address_city: 'Los Angeles', address_state: 'CA', address_zip: '90001',
        license_number: 'CA-CDL-887755', license_state: 'CA', license_expiry: dateStr(2026, 6, 1),
        pay_type: 'flat', pay_rate: 500,
        hire_date: dateStr(2020, 9, 15), status: 'active',
        emergency_contact_name: 'Peter Nguyen', emergency_contact_phone: '555-504-3300',
      },
      {
        first_name: 'Robert', last_name: 'Kimura',
        email: 'robert.kimura@example.com', phone: '555-605-1144',
        address_street: '9 Spruce Lane', address_city: 'Seattle', address_state: 'WA', address_zip: '98101',
        license_number: 'WA-CDL-664422', license_state: 'WA', license_expiry: dateStr(2026, 4, 20),
        pay_type: 'hourly', pay_rate: 25,
        hire_date: dateStr(2024, 2, 1), status: 'active',
        emergency_contact_name: 'Yuki Kimura', emergency_contact_phone: '555-605-8800',
      },
      {
        first_name: 'Angela', last_name: 'Brooks',
        email: 'angela.brooks@example.com', phone: '555-706-3355',
        address_street: '47 Pine Blvd', address_city: 'Phoenix', address_state: 'AZ', address_zip: '85001',
        license_number: 'AZ-CDL-991133', license_state: 'AZ', license_expiry: dateStr(2025, 9, 10),
        pay_type: 'per_stop', pay_rate: 400,
        hire_date: dateStr(2022, 11, 20), status: 'active',
        emergency_contact_name: 'Marcus Brooks', emergency_contact_phone: '555-706-6600',
        notes: 'Rate: $400/stop.',
      },
    ])
    .returning();
  console.log('  6 drivers');

  // ─── Settlements ──────────────────────────────────────────────────────────
  console.log('Seeding settlements...');
  const [s1, s2, s3, s4] = await db
    .insert(settlements)
    .values([
      {
        settlement_number: 'SET-2026-0028',
        driver_id: d1.id,
        period_start: daysAgo(14),
        period_end: daysAgo(8),
        status: 'paid',
        gross_earnings: 1210.00,
        total_deductions: 90.00,
        total_reimbursements: 80.00,
        total_advances: 200.00,
        net_pay: 1000.00,
        paid_date: daysAgo(6),
        payment_method: 'ach',
        payment_reference: 'ACH-20260327-001',
        approved_by: 'Admin',
        approved_at: daysAgo(7) + 'T10:00:00',
        notes: 'Midwest run, fuel reimbursement included.',
      },
      {
        settlement_number: 'SET-2026-0029',
        driver_id: d2.id,
        period_start: daysAgo(14),
        period_end: daysAgo(8),
        status: 'approved',
        gross_earnings: 1080.00,
        total_deductions: 265.00,
        total_reimbursements: 45.00,
        total_advances: 0,
        net_pay: 860.00,
        approved_by: 'Admin',
        approved_at: daysAgo(5) + 'T14:30:00',
      },
      {
        settlement_number: 'SET-2026-0030',
        driver_id: d3.id,
        period_start: daysAgo(14),
        period_end: daysAgo(8),
        status: 'submitted',
        gross_earnings: 1800.00,
        total_deductions: 75.00,
        total_reimbursements: 120.00,
        total_advances: 500.00,
        net_pay: 1345.00,
      },
      {
        settlement_number: 'SET-2026-0031',
        driver_id: d4.id,
        period_start: daysAgo(7),
        period_end: daysAgo(1),
        status: 'open',
        gross_earnings: 3000.00,
        total_deductions: 265.00,
        total_reimbursements: 0,
        total_advances: 0,
        net_pay: 2735.00,
      },
    ])
    .returning();
  console.log('  4 settlements');

  // ─── Trips ────────────────────────────────────────────────────────────────
  console.log('Seeding trips...');

  // S1: d1, per_mile@0.55, 6 trips
  // miles: 400+380+350+420+290+360 = 2200 → gross = 2200 * 0.55 = $1210.00
  // pay:   220+209+192.5+231+159.5+198 = $1210.00 ✓
  const s1Trips = [
    { driver_id: d1.id, settlement_id: s1.id, load_ref: 'LD-8821', origin_city: 'Chicago', origin_state: 'IL', dest_city: 'Detroit', dest_state: 'MI', miles: 400, revenue: 2800, stops: 1, hours: 7.0, trip_date: daysAgo(14), pay_amount: 220.00 },
    { driver_id: d1.id, settlement_id: s1.id, load_ref: 'LD-8822', origin_city: 'Detroit', origin_state: 'MI', dest_city: 'Columbus', dest_state: 'OH', miles: 380, revenue: 2660, stops: 1, hours: 6.5, trip_date: daysAgo(13), pay_amount: 209.00 },
    { driver_id: d1.id, settlement_id: s1.id, load_ref: 'LD-8823', origin_city: 'Columbus', origin_state: 'OH', dest_city: 'Pittsburgh', dest_state: 'PA', miles: 350, revenue: 2450, stops: 1, hours: 6.0, trip_date: daysAgo(12), pay_amount: 192.50 },
    { driver_id: d1.id, settlement_id: s1.id, load_ref: 'LD-8824', origin_city: 'Pittsburgh', origin_state: 'PA', dest_city: 'Cleveland', dest_state: 'OH', miles: 420, revenue: 2940, stops: 2, hours: 7.5, trip_date: daysAgo(11), pay_amount: 231.00 },
    { driver_id: d1.id, settlement_id: s1.id, load_ref: 'LD-8825', origin_city: 'Cleveland', origin_state: 'OH', dest_city: 'Cincinnati', dest_state: 'OH', miles: 290, revenue: 2030, stops: 1, hours: 5.0, trip_date: daysAgo(10), pay_amount: 159.50 },
    { driver_id: d1.id, settlement_id: s1.id, load_ref: 'LD-8826', origin_city: 'Cincinnati', origin_state: 'OH', dest_city: 'Chicago', dest_state: 'IL', miles: 360, revenue: 2520, stops: 1, hours: 6.0, trip_date: daysAgo(9),  pay_amount: 198.00 },
  ];
  // 220+209+192.5+231+159.5+198 = 1210 ✓

  // S2: d2, per_mile@0.60, 6 trips
  // miles: 200+340+250+280+300+430 = 1800 → gross = 1800 * 0.60 = $1080.00 ✓
  // pay:   120+204+150+168+180+258 = $1080.00 ✓
  const s2Trips = [
    { driver_id: d2.id, settlement_id: s2.id, load_ref: 'LD-9001', origin_city: 'Dallas', origin_state: 'TX', dest_city: 'Oklahoma City', dest_state: 'OK', miles: 200, revenue: 1400, stops: 1, hours: 3.5, trip_date: daysAgo(14), pay_amount: 120.00 },
    { driver_id: d2.id, settlement_id: s2.id, load_ref: 'LD-9002', origin_city: 'Oklahoma City', origin_state: 'OK', dest_city: 'Kansas City', dest_state: 'MO', miles: 340, revenue: 2380, stops: 1, hours: 5.5, trip_date: daysAgo(13), pay_amount: 204.00 },
    { driver_id: d2.id, settlement_id: s2.id, load_ref: 'LD-9003', origin_city: 'Kansas City', origin_state: 'MO', dest_city: 'St. Louis', dest_state: 'MO', miles: 250, revenue: 1750, stops: 2, hours: 4.0, trip_date: daysAgo(12), pay_amount: 150.00 },
    { driver_id: d2.id, settlement_id: s2.id, load_ref: 'LD-9004', origin_city: 'St. Louis', origin_state: 'MO', dest_city: 'Memphis', dest_state: 'TN', miles: 280, revenue: 1960, stops: 1, hours: 4.5, trip_date: daysAgo(11), pay_amount: 168.00 },
    { driver_id: d2.id, settlement_id: s2.id, load_ref: 'LD-9005', origin_city: 'Memphis', origin_state: 'TN', dest_city: 'Little Rock', dest_state: 'AR', miles: 300, revenue: 2100, stops: 1, hours: 5.0, trip_date: daysAgo(10), pay_amount: 180.00 },
    { driver_id: d2.id, settlement_id: s2.id, load_ref: 'LD-9006', origin_city: 'Little Rock', origin_state: 'AR', dest_city: 'Dallas', dest_state: 'TX', miles: 430, revenue: 3010, stops: 1, hours: 7.0, trip_date: daysAgo(9),  pay_amount: 258.00 },
  ];
  // 120+204+150+168+180+258 = 1080 ✓

  // S3: d3, percentage@25%, 6 trips
  // revenue: 1400+1200+1000+1350+900+1350 = 7200 → gross = 7200*0.25 = $1800.00 ✓
  // pay:      350+ 300+ 250+ 337.5+225+337.5 = 1800 ✓
  const s3Trips = [
    { driver_id: d3.id, settlement_id: s3.id, load_ref: 'LD-9101', origin_city: 'Atlanta', origin_state: 'GA', dest_city: 'Nashville', dest_state: 'TN', miles: 250, revenue: 1400, stops: 1, hours: 4.0, trip_date: daysAgo(14), pay_amount: 350.00 },
    { driver_id: d3.id, settlement_id: s3.id, load_ref: 'LD-9102', origin_city: 'Nashville', origin_state: 'TN', dest_city: 'Birmingham', dest_state: 'AL', miles: 190, revenue: 1200, stops: 1, hours: 3.0, trip_date: daysAgo(13), pay_amount: 300.00 },
    { driver_id: d3.id, settlement_id: s3.id, load_ref: 'LD-9103', origin_city: 'Birmingham', origin_state: 'AL', dest_city: 'Montgomery', dest_state: 'AL', miles: 91,  revenue: 1000, stops: 2, hours: 2.0, trip_date: daysAgo(12), pay_amount: 250.00 },
    { driver_id: d3.id, settlement_id: s3.id, load_ref: 'LD-9104', origin_city: 'Montgomery', origin_state: 'AL', dest_city: 'New Orleans', dest_state: 'LA', miles: 330, revenue: 1350, stops: 1, hours: 5.0, trip_date: daysAgo(11), pay_amount: 337.50 },
    { driver_id: d3.id, settlement_id: s3.id, load_ref: 'LD-9105', origin_city: 'New Orleans', origin_state: 'LA', dest_city: 'Baton Rouge', dest_state: 'LA', miles: 80,  revenue: 900,  stops: 1, hours: 1.5, trip_date: daysAgo(10), pay_amount: 225.00 },
    { driver_id: d3.id, settlement_id: s3.id, load_ref: 'LD-9106', origin_city: 'Baton Rouge', origin_state: 'LA', dest_city: 'Atlanta', dest_state: 'GA', miles: 470, revenue: 1350, stops: 1, hours: 7.0, trip_date: daysAgo(9),  pay_amount: 337.50 },
  ];
  // 350+300+250+337.5+225+337.5 = 1800 ✓

  // S4: d4, flat@500, 6 trips → gross = 6*500 = $3000 ✓
  const s4Trips = [
    { driver_id: d4.id, settlement_id: s4.id, load_ref: 'LD-9201', origin_city: 'Los Angeles', origin_state: 'CA', dest_city: 'Las Vegas', dest_state: 'NV', miles: 270, revenue: 1800, stops: 1, hours: 4.0, trip_date: daysAgo(7), pay_amount: 500.00 },
    { driver_id: d4.id, settlement_id: s4.id, load_ref: 'LD-9202', origin_city: 'Las Vegas', origin_state: 'NV', dest_city: 'Phoenix', dest_state: 'AZ', miles: 295, revenue: 1950, stops: 1, hours: 4.5, trip_date: daysAgo(6), pay_amount: 500.00 },
    { driver_id: d4.id, settlement_id: s4.id, load_ref: 'LD-9203', origin_city: 'Phoenix', origin_state: 'AZ', dest_city: 'Tucson', dest_state: 'AZ', miles: 110, revenue: 900,  stops: 1, hours: 2.0, trip_date: daysAgo(5), pay_amount: 500.00 },
    { driver_id: d4.id, settlement_id: s4.id, load_ref: 'LD-9204', origin_city: 'Tucson', origin_state: 'AZ', dest_city: 'Albuquerque', dest_state: 'NM', miles: 310, revenue: 2050, stops: 2, hours: 5.0, trip_date: daysAgo(4), pay_amount: 500.00 },
    { driver_id: d4.id, settlement_id: s4.id, load_ref: 'LD-9205', origin_city: 'Albuquerque', origin_state: 'NM', dest_city: 'El Paso', dest_state: 'TX', miles: 225, revenue: 1500, stops: 1, hours: 3.5, trip_date: daysAgo(3), pay_amount: 500.00 },
    { driver_id: d4.id, settlement_id: s4.id, load_ref: 'LD-9206', origin_city: 'El Paso', origin_state: 'TX', dest_city: 'Los Angeles', dest_state: 'CA', miles: 800, revenue: 4000, stops: 1, hours: 12.0, trip_date: daysAgo(2), pay_amount: 500.00 },
  ];

  // d5: hourly@$25/hr, no settlement yet
  const d5Trips = [
    { driver_id: d5.id, settlement_id: null, load_ref: 'LD-9301', origin_city: 'Seattle', origin_state: 'WA', dest_city: 'Portland', dest_state: 'OR', miles: 175, revenue: 1400, stops: 2, hours: 8.0, trip_date: daysAgo(6), pay_amount: 200.00 },
    { driver_id: d5.id, settlement_id: null, load_ref: 'LD-9302', origin_city: 'Portland', origin_state: 'OR', dest_city: 'Salem', dest_state: 'OR', miles: 47,  revenue: 600,  stops: 1, hours: 4.0, trip_date: daysAgo(5), pay_amount: 100.00 },
    { driver_id: d5.id, settlement_id: null, load_ref: 'LD-9303', origin_city: 'Salem', origin_state: 'OR', dest_city: 'Eugene', dest_state: 'OR', miles: 64,  revenue: 750,  stops: 1, hours: 5.0, trip_date: daysAgo(4), pay_amount: 125.00 },
    { driver_id: d5.id, settlement_id: null, load_ref: 'LD-9304', origin_city: 'Eugene', origin_state: 'OR', dest_city: 'Medford', dest_state: 'OR', miles: 171, revenue: 1200, stops: 2, hours: 6.0, trip_date: daysAgo(3), pay_amount: 150.00 },
    { driver_id: d5.id, settlement_id: null, load_ref: 'LD-9305', origin_city: 'Medford', origin_state: 'OR', dest_city: 'Seattle', dest_state: 'WA', miles: 420, revenue: 2800, stops: 1, hours: 10.0, trip_date: daysAgo(2), pay_amount: 250.00 },
  ];

  // d6: per_stop@$400, no settlement yet
  const d6Trips = [
    { driver_id: d6.id, settlement_id: null, load_ref: 'LD-9401', origin_city: 'Phoenix', origin_state: 'AZ', dest_city: 'Scottsdale', dest_state: 'AZ', miles: 15, revenue: 900,  stops: 2, hours: 3.0, trip_date: daysAgo(6), pay_amount: 800.00 },
    { driver_id: d6.id, settlement_id: null, load_ref: 'LD-9402', origin_city: 'Scottsdale', origin_state: 'AZ', dest_city: 'Tempe', dest_state: 'AZ', miles: 12, revenue: 600,  stops: 1, hours: 2.0, trip_date: daysAgo(5), pay_amount: 400.00 },
    { driver_id: d6.id, settlement_id: null, load_ref: 'LD-9403', origin_city: 'Tempe', origin_state: 'AZ', dest_city: 'Mesa', dest_state: 'AZ', miles: 10, revenue: 750,  stops: 3, hours: 4.0, trip_date: daysAgo(4), pay_amount: 1200.00 },
    { driver_id: d6.id, settlement_id: null, load_ref: 'LD-9404', origin_city: 'Mesa', origin_state: 'AZ', dest_city: 'Chandler', dest_state: 'AZ', miles: 8,  revenue: 400,  stops: 1, hours: 1.5, trip_date: daysAgo(3), pay_amount: 400.00 },
    { driver_id: d6.id, settlement_id: null, load_ref: 'LD-9405', origin_city: 'Chandler', origin_state: 'AZ', dest_city: 'Phoenix', dest_state: 'AZ', miles: 20, revenue: 1200, stops: 4, hours: 5.0, trip_date: daysAgo(2), pay_amount: 1600.00 },
    // Adding one more for d6 to reach ~30 total:
    // s1:6 + s2:6 + s3:6 + s4:6 + d5:5 + d6:5 = 34 (close enough, slightly over 30)
  ];

  await db.insert(trips).values([
    ...s1Trips,
    ...s2Trips,
    ...s3Trips,
    ...s4Trips,
    ...d5Trips,
    ...d6Trips,
  ]);
  console.log('  30+ trips');

  // ─── Settlement Deductions (12 total) ─────────────────────────────────────
  console.log('Seeding deductions...');
  await db.insert(settlementDeductions).values([
    // S1: $90 total (50+15+25)
    { settlement_id: s1.id, description: 'Physical Damage Insurance', amount: 50.00, deduction_type: 'recurring', category: 'insurance' },
    { settlement_id: s1.id, description: 'ELD Device Fee', amount: 15.00, deduction_type: 'recurring', category: 'eld' },
    { settlement_id: s1.id, description: 'Occupational Accident Insurance', amount: 25.00, deduction_type: 'recurring', category: 'insurance' },
    // S2: $265 total (50+200+15)
    { settlement_id: s2.id, description: 'Physical Damage Insurance', amount: 50.00, deduction_type: 'recurring', category: 'insurance' },
    { settlement_id: s2.id, description: 'Truck Lease Payment', amount: 200.00, deduction_type: 'recurring', category: 'lease' },
    { settlement_id: s2.id, description: 'ELD Device Fee', amount: 15.00, deduction_type: 'recurring', category: 'eld' },
    // S3: $75 total (15+35+25)
    { settlement_id: s3.id, description: 'ELD Device Fee', amount: 15.00, deduction_type: 'recurring', category: 'eld' },
    { settlement_id: s3.id, description: 'Cargo Insurance', amount: 35.00, deduction_type: 'recurring', category: 'insurance' },
    { settlement_id: s3.id, description: 'Occupational Accident Insurance', amount: 25.00, deduction_type: 'recurring', category: 'insurance' },
    // S4: $265 total (50+200+15)
    { settlement_id: s4.id, description: 'Physical Damage Insurance', amount: 50.00, deduction_type: 'recurring', category: 'insurance' },
    { settlement_id: s4.id, description: 'Truck Lease Payment', amount: 200.00, deduction_type: 'recurring', category: 'lease' },
    { settlement_id: s4.id, description: 'ELD Device Fee', amount: 15.00, deduction_type: 'one_time', category: 'eld' },
  ]);
  console.log('  12 deductions');

  // ─── Settlement Reimbursements (4 total) ──────────────────────────────────
  console.log('Seeding reimbursements...');
  await db.insert(settlementReimbursements).values([
    { settlement_id: s1.id, description: 'Fuel Receipt - BP Chicago', amount: 80.00, category: 'fuel', receipt_ref: 'RCP-2026-0441' },
    { settlement_id: s2.id, description: 'Toll Charges - I-35 Oklahoma', amount: 45.00, category: 'toll', receipt_ref: 'RCP-2026-0442' },
    { settlement_id: s3.id, description: 'Scale Ticket - Baton Rouge', amount: 60.00, category: 'maintenance', receipt_ref: 'RCP-2026-0443' },
    { settlement_id: s3.id, description: 'Tire Repair - New Orleans', amount: 60.00, category: 'maintenance', receipt_ref: 'RCP-2026-0444' },
  ]);
  console.log('  4 reimbursements');

  // ─── Advances (3 total) ───────────────────────────────────────────────────
  console.log('Seeding advances...');
  await db.insert(advances).values([
    { driver_id: d1.id, settlement_id: s1.id, amount: 200.00, date: daysAgo(20), reason: 'Fuel advance for Midwest run', status: 'deducted' },
    { driver_id: d5.id, settlement_id: null, amount: 300.00, date: daysAgo(10), reason: 'Emergency tire replacement - Seattle', status: 'outstanding' },
    { driver_id: d3.id, settlement_id: s3.id, amount: 500.00, date: daysAgo(18), reason: 'Pre-run cash advance', status: 'deducted' },
  ]);
  console.log('  3 advances (1 deducted from S1, 1 outstanding for d5, 1 deducted from S3)');

  console.log('\n✅ Seed complete!');
  console.log('Settlement math verification:');
  console.log('  S1 (paid):      gross=$1210  ded=$90   reimb=$80   adv=$200  net=$1000');
  console.log('  S2 (approved):  gross=$1080  ded=$265  reimb=$45   adv=$0    net=$860');
  console.log('  S3 (submitted): gross=$1800  ded=$75   reimb=$120  adv=$500  net=$1345');
  console.log('  S4 (open):      gross=$3000  ded=$265  reimb=$0    adv=$0    net=$2735');

  client.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
