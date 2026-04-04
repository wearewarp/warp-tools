import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { lanes, carrier_rates, customer_tariffs, rfqs, rfq_responses } from './schema';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'rate-management.db');
const MIGRATIONS_PATH = path.join(process.cwd(), 'src/db/migrations');

async function main() {
  const client = createClient({ url: `file:${DB_PATH}` });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: MIGRATIONS_PATH });

  // Clear tables
  await db.delete(rfq_responses);
  await db.delete(rfqs);
  await db.delete(customer_tariffs);
  await db.delete(carrier_rates);
  await db.delete(lanes);

  console.log('Seeding lanes...');

  // 12 lanes: popular freight lanes
  const laneRows = await db.insert(lanes).values([
    {
      origin_city: 'Dallas', origin_state: 'TX', origin_zip: '75201',
      dest_city: 'Los Angeles', dest_state: 'CA', dest_zip: '90012',
      equipment_type: 'dry_van', estimated_miles: 1435,
      tags: JSON.stringify(['high-volume', 'e-commerce']),
      status: 'active', notes: 'High volume lane, 3-4 loads/week',
    },
    {
      origin_city: 'Chicago', origin_state: 'IL', origin_zip: '60601',
      dest_city: 'Atlanta', dest_state: 'GA', dest_zip: '30301',
      equipment_type: 'dry_van', estimated_miles: 716,
      tags: JSON.stringify(['retail', 'steady']),
      status: 'active', notes: 'Steady retail freight, contract preferred',
    },
    {
      origin_city: 'Miami', origin_state: 'FL', origin_zip: '33101',
      dest_city: 'New York', dest_state: 'NY', dest_zip: '10001',
      equipment_type: 'reefer', estimated_miles: 1280,
      tags: JSON.stringify(['temperature-controlled', 'produce']),
      status: 'active', notes: 'Produce and perishables, temp-sensitive',
    },
    {
      origin_city: 'Houston', origin_state: 'TX', origin_zip: '77001',
      dest_city: 'Phoenix', dest_state: 'AZ', dest_zip: '85001',
      equipment_type: 'flatbed', estimated_miles: 1178,
      tags: JSON.stringify(['construction', 'oversized']),
      status: 'active', notes: 'Construction materials, often oversized',
    },
    {
      origin_city: 'Los Angeles', origin_state: 'CA', origin_zip: '90012',
      dest_city: 'Seattle', dest_state: 'WA', dest_zip: '98101',
      equipment_type: 'dry_van', estimated_miles: 1135,
      tags: JSON.stringify(['tech', 'high-value']),
      status: 'active', notes: 'Consumer electronics, high-security preferred',
    },
    {
      origin_city: 'Charlotte', origin_state: 'NC', origin_zip: '28201',
      dest_city: 'Chicago', dest_state: 'IL', dest_zip: '60601',
      equipment_type: 'step_deck', estimated_miles: 762,
      tags: JSON.stringify(['manufacturing', 'machinery']),
      status: 'active', notes: 'Industrial equipment, step deck required',
    },
    {
      origin_city: 'Kansas City', origin_state: 'MO', origin_zip: '64101',
      dest_city: 'Denver', dest_state: 'CO', dest_zip: '80201',
      equipment_type: 'reefer', estimated_miles: 600,
      tags: JSON.stringify(['food', 'beverage']),
      status: 'active', notes: 'Beverage distribution, weekly frequency',
    },
    {
      origin_city: 'Memphis', origin_state: 'TN', origin_zip: '38101',
      dest_city: 'Dallas', dest_state: 'TX', dest_zip: '75201',
      equipment_type: 'dry_van', estimated_miles: 452,
      tags: JSON.stringify(['distribution', 'short-haul']),
      status: 'active', notes: 'Distribution center replenishment',
    },
    {
      origin_city: 'Detroit', origin_state: 'MI', origin_zip: '48201',
      dest_city: 'Nashville', dest_state: 'TN', dest_zip: '37201',
      equipment_type: 'flatbed', estimated_miles: 531,
      tags: JSON.stringify(['automotive', 'parts']),
      status: 'active', notes: 'Auto parts, OEM supplier',
    },
    {
      origin_city: 'Atlanta', origin_state: 'GA', origin_zip: '30301',
      dest_city: 'Miami', dest_state: 'FL', dest_zip: '33101',
      equipment_type: 'cargo_van', estimated_miles: 662,
      tags: JSON.stringify(['expedite', 'urgent']),
      status: 'active', notes: 'Expedited cargo van freight',
    },
    {
      origin_city: 'Seattle', origin_state: 'WA', origin_zip: '98101',
      dest_city: 'Portland', dest_state: 'OR', dest_zip: '97201',
      equipment_type: 'sprinter_van', estimated_miles: 178,
      tags: JSON.stringify(['local', 'same-day']),
      status: 'active', notes: 'Short haul sprinter van, high frequency',
    },
    {
      origin_city: 'New York', origin_state: 'NY', origin_zip: '10001',
      dest_city: 'Boston', dest_state: 'MA', dest_zip: '02101',
      equipment_type: 'power_only', estimated_miles: 215,
      tags: JSON.stringify(['power-only', 'drop-hook']),
      status: 'inactive', notes: 'Drop-hook power only, currently inactive',
    },
  ]).returning();

  console.log(`Inserted ${laneRows.length} lanes`);

  // Lane IDs for easy reference
  const [lDalLax, lChiAtl, lMiaNyc, lHouPhx, lLaxSea, lCltChi, lKcDen, lMemDal, lDetNas, lAtlMia, lSeaPdx, lNycBos] = laneRows.map(l => l.id);

  console.log('Seeding carrier rates...');

  // 25 carrier rates across lanes
  // Carrier names from carrier-management seed
  await db.insert(carrier_rates).values([
    // DAL→LAX (lane 1) — 3 carriers, mix spot/contract
    {
      lane_id: lDalLax, carrier_id: 'c1', carrier_name: 'Apex Freight Solutions',
      rate_amount: 2.15, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2025-01-01', expiry_date: '2025-12-31',
      contact_name: 'Mike Rodriguez', contact_email: 'mike.r@apexfreight.com',
      notes: 'Annual contract, priority capacity', source: 'rfq',
    },
    {
      lane_id: lDalLax, carrier_id: 'c5', carrier_name: 'Lone Star Trucking Co.',
      rate_amount: 2.45, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-03-15', expiry_date: '2026-04-15',
      contact_name: 'Bobby Hernandez', contact_email: 'bobby@lonestartucking.com',
      notes: 'Spot rate, good for overflow', source: 'phone',
    },
    {
      lane_id: lDalLax, carrier_id: 'c8', carrier_name: 'Mountain West Carriers',
      rate_amount: 2.30, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-30',
      contact_name: 'Rachel Green', contact_email: 'rachel@mwcarriers.com',
      notes: 'Available for dedicated lane', source: 'email',
    },
    // CHI→ATL (lane 2) — 4 carriers
    {
      lane_id: lChiAtl, carrier_id: 'c2', carrier_name: 'Midwest Express Logistics',
      rate_amount: 1850, rate_basis: 'flat', rate_type: 'contract',
      effective_date: '2025-07-01', expiry_date: '2026-06-30',
      contact_name: 'Tom Kowalski', contact_email: 'tom.k@midwestexpress.com',
      notes: 'Flat rate contract, 2 loads/week', source: 'rfq',
    },
    {
      lane_id: lChiAtl, carrier_id: 'c6', carrier_name: 'Great Lakes Freight',
      rate_amount: 2050, rate_basis: 'flat', rate_type: 'spot',
      effective_date: '2026-03-20', expiry_date: '2026-04-10',
      contact_name: 'Dan Kowalczyk', contact_email: 'dan.k@greatlakesfreight.com',
      notes: 'Expiring soon — renew or replace', source: 'phone',
    },
    {
      lane_id: lChiAtl, carrier_id: 'c7', carrier_name: 'Sunrise Expedited Services',
      rate_amount: 1950, rate_basis: 'flat', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-30',
      contact_name: 'Priya Patel', contact_email: 'priya@sunriseexpedited.com',
      notes: 'Competitive spot', source: 'email',
    },
    {
      lane_id: lChiAtl, carrier_id: 'c10', carrier_name: 'Swift River Logistics',
      rate_amount: 1920, rate_basis: 'flat', rate_type: 'contract',
      effective_date: '2026-01-01', expiry_date: '2026-12-31',
      contact_name: 'Frank Williams', contact_email: 'frank@swiftriverlogistics.com',
      notes: 'New contract, reliable service', source: 'rfq',
    },
    // MIA→NYC (lane 3) — reefer, 3 carriers
    {
      lane_id: lMiaNyc, carrier_id: 'c9', carrier_name: 'Coastal Refrigerated Transport',
      rate_amount: 3.10, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2025-04-01', expiry_date: '2026-03-31',
      contact_name: 'Luis Fernandez', contact_email: 'luis@coastalref.com',
      notes: 'Reefer specialist, reliable temp control', source: 'rfq',
    },
    {
      lane_id: lMiaNyc, carrier_id: 'c3', carrier_name: 'Pacific Coast Carriers',
      rate_amount: 3.45, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-20',
      contact_name: 'Carlos Vega', contact_email: 'carlos@pacificcoastcarriers.com',
      notes: 'Higher than market but available now', source: 'phone',
    },
    {
      lane_id: lMiaNyc, carrier_id: 'c9', carrier_name: 'Coastal Refrigerated Transport',
      rate_amount: 3.25, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-04-05', expiry_date: '2026-05-05',
      contact_name: 'Kim Thompson', contact_email: 'billing@coastalref.com',
      notes: 'Spot supplement to contract', source: 'email',
    },
    // HOU→PHX (lane 4) — flatbed, 3 carriers
    {
      lane_id: lHouPhx, carrier_id: 'c4', carrier_name: 'Blue Ridge Transport',
      rate_amount: 2.80, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2026-01-01', expiry_date: '2026-12-31',
      contact_name: 'James Wilson', contact_email: 'james@blueridgetransport.com',
      notes: 'Flatbed specialist, handles oversized', source: 'rfq',
    },
    {
      lane_id: lHouPhx, carrier_id: 'c5', carrier_name: 'Lone Star Trucking Co.',
      rate_amount: 3050, rate_basis: 'flat', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-15',
      contact_name: 'Maria Santos', contact_email: 'dispatch@lonestartucking.com',
      notes: 'Flat spot for this trip only', source: 'phone',
    },
    {
      lane_id: lHouPhx, carrier_id: 'c8', carrier_name: 'Mountain West Carriers',
      rate_amount: 2.65, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2025-10-01', expiry_date: '2026-09-30',
      contact_name: 'Rachel Green', contact_email: 'rachel@mwcarriers.com',
      notes: 'Annual contract, best market rate', source: 'rfq',
    },
    // LAX→SEA (lane 5)
    {
      lane_id: lLaxSea, carrier_id: 'c3', carrier_name: 'Pacific Coast Carriers',
      rate_amount: 2.55, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2025-06-01', expiry_date: '2026-05-31',
      contact_name: 'Jenny Wu', contact_email: 'dispatch@pacificcoastcarriers.com',
      notes: 'West Coast specialist', source: 'rfq',
    },
    {
      lane_id: lLaxSea, carrier_id: 'c8', carrier_name: 'Mountain West Carriers',
      rate_amount: 2.75, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-30',
      contact_name: 'Rachel Green', contact_email: 'rachel@mwcarriers.com',
      notes: 'Spot availability', source: 'email',
    },
    // CLT→CHI (lane 6) — step deck
    {
      lane_id: lCltChi, carrier_id: 'c4', carrier_name: 'Blue Ridge Transport',
      rate_amount: 2.20, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2026-01-01', expiry_date: '2026-12-31',
      contact_name: 'James Wilson', contact_email: 'james@blueridgetransport.com',
      notes: 'Step deck contract', source: 'rfq',
    },
    // KC→DEN (lane 7) — reefer
    {
      lane_id: lKcDen, carrier_id: 'c9', carrier_name: 'Coastal Refrigerated Transport',
      rate_amount: 1800, rate_basis: 'flat', rate_type: 'contract',
      effective_date: '2025-09-01', expiry_date: '2026-08-31',
      contact_name: 'Luis Fernandez', contact_email: 'luis@coastalref.com',
      notes: 'Weekly dedicated reefer', source: 'rfq',
    },
    {
      lane_id: lKcDen, carrier_id: 'c2', carrier_name: 'Midwest Express Logistics',
      rate_amount: 1950, rate_basis: 'flat', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-30',
      contact_name: 'Angela Davis', contact_email: 'angela@midwestexpress.com',
      notes: 'Spot supplement', source: 'phone',
    },
    // MEM→DAL (lane 8)
    {
      lane_id: lMemDal, carrier_id: 'c1', carrier_name: 'Apex Freight Solutions',
      rate_amount: 1.95, rate_basis: 'per_mile', rate_type: 'contract',
      effective_date: '2025-03-01', expiry_date: '2026-02-28',
      contact_name: 'Sarah Chen', contact_email: 'billing@apexfreight.com',
      notes: 'Short haul contract, expiring — needs renewal', source: 'rfq',
    },
    {
      lane_id: lMemDal, carrier_id: 'c10', carrier_name: 'Swift River Logistics',
      rate_amount: 2.10, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-30',
      contact_name: 'Frank Williams', contact_email: 'frank@swiftriverlogistics.com',
      notes: 'Spot backup', source: 'email',
    },
    // DET→NAS (lane 9)
    {
      lane_id: lDetNas, carrier_id: 'c6', carrier_name: 'Great Lakes Freight',
      rate_amount: 1650, rate_basis: 'flat', rate_type: 'contract',
      effective_date: '2026-02-01', expiry_date: '2027-01-31',
      contact_name: 'Dan Kowalczyk', contact_email: 'dan.k@greatlakesfreight.com',
      notes: 'Auto parts, flatbed contract', source: 'rfq',
    },
    // ATL→MIA (lane 10) — cargo van
    {
      lane_id: lAtlMia, carrier_id: 'c7', carrier_name: 'Sunrise Expedited Services',
      rate_amount: 1200, rate_basis: 'flat', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-15',
      contact_name: 'Marcus Johnson', contact_email: 'dispatch@sunriseexpedited.com',
      notes: 'Cargo van expedite', source: 'phone',
    },
    // SEA→PDX (lane 11) — sprinter
    {
      lane_id: lSeaPdx, carrier_id: 'c3', carrier_name: 'Pacific Coast Carriers',
      rate_amount: 450, rate_basis: 'flat', rate_type: 'contract',
      effective_date: '2025-11-01', expiry_date: '2026-10-31',
      contact_name: 'Carlos Vega', contact_email: 'carlos@pacificcoastcarriers.com',
      notes: 'Short haul sprinter contract', source: 'rfq',
    },
    // Extra spot on DAL→LAX for variety
    {
      lane_id: lDalLax, carrier_id: 'c2', carrier_name: 'Midwest Express Logistics',
      rate_amount: 2.60, rate_basis: 'per_mile', rate_type: 'spot',
      effective_date: '2026-04-01', expiry_date: '2026-04-20',
      contact_name: 'Tom Kowalski', contact_email: 'tom.k@midwestexpress.com',
      notes: 'One-time availability', source: 'website',
    },
    // CHI→ATL extra
    {
      lane_id: lChiAtl, carrier_id: 'c4', carrier_name: 'Blue Ridge Transport',
      rate_amount: 2100, rate_basis: 'flat', rate_type: 'spot',
      effective_date: '2026-04-05', expiry_date: '2026-04-25',
      contact_name: 'James Wilson', contact_email: 'james@blueridgetransport.com',
      notes: 'Spot availability heading south', source: 'website',
    },
  ]);

  console.log('Inserted 25 carrier rates');

  console.log('Seeding customer tariffs...');

  // 10 customer tariffs — use customer names from invoice-tracker
  // Margins: some 20%+, some 10-15%, some <10% (alert territory)
  await db.insert(customer_tariffs).values([
    // DAL→LAX — 20%+ margin (carrier: $2.15/mi, tariff: $2.65/mi = 23% margin)
    {
      lane_id: lDalLax, customer_id: 'cust1', customer_name: 'Dallas Distribution Co',
      rate_amount: 2.65, rate_basis: 'per_mile', contract_ref: 'DDC-2025-001',
      effective_date: '2025-01-01', expiry_date: '2025-12-31',
      status: 'active', notes: 'Annual contract, good margin',
    },
    // CHI→ATL — 15% margin (carrier: $1850 flat, tariff: $2130 flat)
    {
      lane_id: lChiAtl, customer_id: 'cust2', customer_name: 'Great Lakes Auto Parts',
      rate_amount: 2130, rate_basis: 'flat', contract_ref: 'GLAP-2025-007',
      effective_date: '2025-07-01', expiry_date: '2026-06-30',
      status: 'active', notes: '15% margin target',
    },
    // MIA→NYC — reefer, 20%+ margin (carrier: $3.10, tariff: $3.85)
    {
      lane_id: lMiaNyc, customer_id: 'cust3', customer_name: 'Sunrise Agricultural LLC',
      rate_amount: 3.85, rate_basis: 'per_mile', contract_ref: 'SAL-2025-003',
      effective_date: '2025-04-01', expiry_date: '2026-03-31',
      status: 'active', notes: 'Produce client, strong margin',
    },
    // HOU→PHX — tight margin <10% (carrier: $2.65/mi contract, tariff: $2.90)
    {
      lane_id: lHouPhx, customer_id: 'cust4', customer_name: 'Lone Star Retail Group',
      rate_amount: 2.90, rate_basis: 'per_mile', contract_ref: 'LSR-2025-012',
      effective_date: '2026-01-01', expiry_date: '2026-12-31',
      status: 'active', notes: 'Tight margin — 9.4%, watch closely',
    },
    // LAX→SEA — 12% margin (carrier: $2.55, tariff: $2.85)
    {
      lane_id: lLaxSea, customer_id: 'cust5', customer_name: 'Pacific Foods Inc',
      rate_amount: 2.85, rate_basis: 'per_mile', contract_ref: 'PFI-2025-004',
      effective_date: '2025-06-01', expiry_date: '2026-05-31',
      status: 'active', notes: 'West coast consumer goods',
    },
    // CLT→CHI — 25% margin (carrier: $2.20, tariff: $2.75)
    {
      lane_id: lCltChi, customer_id: 'cust6', customer_name: 'Midwest Building Supply',
      rate_amount: 2.75, rate_basis: 'per_mile', contract_ref: 'MBS-2026-001',
      effective_date: '2026-01-01', expiry_date: '2026-12-31',
      status: 'active', notes: 'High margin industrial',
    },
    // KC→DEN — tight <10% (carrier: $1800, tariff: $1950)
    {
      lane_id: lKcDen, customer_id: 'cust7', customer_name: 'Rocky Mountain Beverages',
      rate_amount: 1950, rate_basis: 'flat', contract_ref: 'RMB-2025-009',
      effective_date: '2025-09-01', expiry_date: '2026-08-31',
      status: 'active', notes: 'Beverage weekly — margin only 8.3%',
    },
    // MEM→DAL — 18% margin (carrier: $1.95, tariff: $2.30)
    {
      lane_id: lMemDal, customer_id: 'cust1', customer_name: 'Dallas Distribution Co',
      rate_amount: 2.30, rate_basis: 'per_mile', contract_ref: 'DDC-2025-002',
      effective_date: '2025-03-01', expiry_date: '2026-02-28',
      status: 'expired', notes: 'Contract expired — renewal pending',
    },
    // DET→NAS — pending new contract
    {
      lane_id: lDetNas, customer_id: 'cust8', customer_name: 'Atlantic Health Systems',
      rate_amount: 1980, rate_basis: 'flat', contract_ref: 'AHS-2026-002',
      effective_date: '2026-02-01', expiry_date: '2027-01-31',
      status: 'pending', notes: 'New contract pending final approval',
    },
    // ATL→MIA — expedite premium (carrier: $1200, tariff: $1500)
    {
      lane_id: lAtlMia, customer_id: 'cust3', customer_name: 'Sunrise Agricultural LLC',
      rate_amount: 1500, rate_basis: 'flat', contract_ref: 'SAL-2025-015',
      effective_date: '2026-01-01', expiry_date: '2026-12-31',
      status: 'active', notes: 'Expedite premium, 25% margin',
    },
  ]);

  console.log('Inserted 10 customer tariffs');

  console.log('Seeding RFQs...');

  const rfqRows = await db.insert(rfqs).values([
    // 1: Draft
    {
      rfq_number: 'RFQ-2026-001',
      lane_id: lNycBos,
      equipment_type: 'power_only',
      pickup_date: '2026-04-20',
      desired_rate: 600,
      notes: 'Looking for power only options on this lane, draft in progress',
      status: 'draft',
      created_by: 'Daniel S.',
    },
    // 2: Sent
    {
      rfq_number: 'RFQ-2026-002',
      lane_id: lSeaPdx,
      equipment_type: 'sprinter_van',
      pickup_date: '2026-04-15',
      desired_rate: 400,
      notes: 'Sent to 4 carriers, awaiting responses. Need by EOD Friday.',
      status: 'sent',
      created_by: 'Daniel S.',
    },
    // 3: Has responses
    {
      rfq_number: 'RFQ-2026-003',
      lane_id: lDalLax,
      equipment_type: 'dry_van',
      pickup_date: '2026-04-12',
      desired_rate: 3000,
      notes: 'High priority load, 3 responses received. Evaluating now.',
      status: 'responses',
      created_by: 'Daniel S.',
    },
    // 4: Awarded
    {
      rfq_number: 'RFQ-2026-004',
      lane_id: lMiaNyc,
      equipment_type: 'reefer',
      pickup_date: '2026-04-05',
      desired_rate: 4000,
      notes: 'Awarded to Coastal Refrigerated at best rate',
      status: 'awarded',
      awarded_carrier: 'Coastal Refrigerated Transport',
      awarded_rate: 3968,
      awarded_at: '2026-04-02T14:30:00',
      created_by: 'Daniel S.',
    },
  ]).returning();

  console.log(`Inserted ${rfqRows.length} RFQs`);

  const rfqWithResponses = rfqRows.find(r => r.rfq_number === 'RFQ-2026-003')!;
  const rfqAwarded = rfqRows.find(r => r.rfq_number === 'RFQ-2026-004')!;

  console.log('Seeding RFQ responses...');

  await db.insert(rfq_responses).values([
    // 3 responses for RFQ-2026-003 (DAL→LAX)
    {
      rfq_id: rfqWithResponses.id,
      carrier_id: 'c1', carrier_name: 'Apex Freight Solutions',
      rate_amount: 3085, rate_basis: 'flat',
      valid_until: '2026-04-10',
      contact_name: 'Mike Rodriguez', contact_email: 'mike.r@apexfreight.com',
      notes: 'Can pickup Thursday, guaranteed service',
      is_winner: false,
      responded_at: '2026-04-03T09:15:00',
    },
    {
      rfq_id: rfqWithResponses.id,
      carrier_id: 'c5', carrier_name: 'Lone Star Trucking Co.',
      rate_amount: 3250, rate_basis: 'flat',
      valid_until: '2026-04-08',
      contact_name: 'Bobby Hernandez', contact_email: 'bobby@lonestartucking.com',
      notes: 'Need 48h notice for pickup',
      is_winner: false,
      responded_at: '2026-04-03T11:40:00',
    },
    {
      rfq_id: rfqWithResponses.id,
      carrier_id: 'c8', carrier_name: 'Mountain West Carriers',
      rate_amount: 2990, rate_basis: 'flat',
      valid_until: '2026-04-12',
      contact_name: 'Rachel Green', contact_email: 'rachel@mwcarriers.com',
      notes: 'Best rate, available flexible pickup window',
      is_winner: false,
      responded_at: '2026-04-04T08:00:00',
    },
    // 5 responses for RFQ-2026-004 (MIA→NYC reefer) — awarded
    {
      rfq_id: rfqAwarded.id,
      carrier_id: 'c9', carrier_name: 'Coastal Refrigerated Transport',
      rate_amount: 3968, rate_basis: 'flat',
      valid_until: '2026-04-06',
      contact_name: 'Luis Fernandez', contact_email: 'luis@coastalref.com',
      notes: 'Best rate, reefer specialist',
      is_winner: true,
      responded_at: '2026-04-01T10:00:00',
    },
    {
      rfq_id: rfqAwarded.id,
      carrier_id: 'c3', carrier_name: 'Pacific Coast Carriers',
      rate_amount: 4150, rate_basis: 'flat',
      valid_until: '2026-04-05',
      contact_name: 'Carlos Vega', contact_email: 'carlos@pacificcoastcarriers.com',
      notes: 'Can meet temp requirements',
      is_winner: false,
      responded_at: '2026-04-01T13:20:00',
    },
    {
      rfq_id: rfqAwarded.id,
      carrier_id: 'c2', carrier_name: 'Midwest Express Logistics',
      rate_amount: 4400, rate_basis: 'flat',
      valid_until: '2026-04-04',
      contact_name: 'Tom Kowalski', contact_email: 'tom.k@midwestexpress.com',
      notes: 'Higher rate, strong track record',
      is_winner: false,
      responded_at: '2026-04-01T15:00:00',
    },
    {
      rfq_id: rfqAwarded.id,
      carrier_id: 'c7', carrier_name: 'Sunrise Expedited Services',
      rate_amount: 4250, rate_basis: 'flat',
      valid_until: '2026-04-05',
      contact_name: 'Priya Patel', contact_email: 'priya@sunriseexpedited.com',
      notes: 'Available but pricier',
      is_winner: false,
      responded_at: '2026-04-02T09:00:00',
    },
    {
      rfq_id: rfqAwarded.id,
      carrier_id: 'c4', carrier_name: 'Blue Ridge Transport',
      rate_amount: 4100, rate_basis: 'flat',
      valid_until: '2026-04-05',
      contact_name: 'James Wilson', contact_email: 'james@blueridgetransport.com',
      notes: 'Has reefer capacity',
      is_winner: false,
      responded_at: '2026-04-02T11:30:00',
    },
  ]);

  console.log('Inserted 8 RFQ responses');

  console.log('\n✅ Seed complete!');
  client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
