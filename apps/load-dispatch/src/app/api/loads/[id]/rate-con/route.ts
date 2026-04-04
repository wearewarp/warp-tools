import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { loads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { formatDate, formatTime, getEquipmentLabel } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const loadId = parseInt(id, 10);
  if (isNaN(loadId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const [load] = await db.select().from(loads).where(eq(loads.id, loadId)).limit(1);
  if (!load) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const pickupTime = load.pickup_time_from
    ? `${formatTime(load.pickup_time_from)}${load.pickup_time_to ? ` – ${formatTime(load.pickup_time_to)}` : ''}`
    : 'Open';

  const deliveryTime = load.delivery_time_from
    ? `${formatTime(load.delivery_time_from)}${load.delivery_time_to ? ` – ${formatTime(load.delivery_time_to)}` : ''}`
    : 'Open';

  const tempLine =
    load.temperature_min != null && load.temperature_max != null
      ? `\nTemperature: ${load.temperature_min}°F – ${load.temperature_max}°F`
      : '';

  const dimsLine =
    load.dims_length || load.dims_width || load.dims_height
      ? `\nDimensions: ${load.dims_length ?? '?'}L x ${load.dims_width ?? '?'}W x ${load.dims_height ?? '?'}H ft`
      : '';

  const specialLine = load.special_instructions
    ? `\n\nSPECIAL INSTRUCTIONS:\n${load.special_instructions}`
    : '';

  const refsLine = [
    load.bol_number ? `BOL: ${load.bol_number}` : '',
    load.pro_number ? `PRO: ${load.pro_number}` : '',
    load.customer_ref ? `Customer Ref: ${load.customer_ref}` : '',
  ]
    .filter(Boolean)
    .join(' | ');

  const text = `
══════════════════════════════════════
         RATE CONFIRMATION
══════════════════════════════════════
Load #: ${load.load_number}
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

CARRIER INFORMATION
Carrier: ${load.carrier_name ?? 'TBD'}
Contact: ${load.carrier_contact ?? '—'}
Phone: ${load.carrier_phone ?? '—'}
Email: ${load.carrier_email ?? '—'}

SHIPPER / CUSTOMER
Customer: ${load.customer_name}${refsLine ? `\n${refsLine}` : ''}

PICKUP
${load.origin_city}, ${load.origin_state}${load.origin_zip ? ` ${load.origin_zip}` : ''}${load.origin_address ? `\n${load.origin_address}` : ''}
Date: ${formatDate(load.pickup_date)}
Time: ${pickupTime}${load.origin_contact_name ? `\nContact: ${load.origin_contact_name}` : ''}${load.origin_contact_phone ? ` | ${load.origin_contact_phone}` : ''}${load.pickup_number ? `\nPickup #: ${load.pickup_number}` : ''}

DELIVERY
${load.dest_city}, ${load.dest_state}${load.dest_zip ? ` ${load.dest_zip}` : ''}${load.dest_address ? `\n${load.dest_address}` : ''}
Date: ${formatDate(load.delivery_date)}
Time: ${deliveryTime}${load.dest_contact_name ? `\nContact: ${load.dest_contact_name}` : ''}${load.dest_contact_phone ? ` | ${load.dest_contact_phone}` : ''}${load.delivery_number ? `\nDelivery #: ${load.delivery_number}` : ''}

FREIGHT DETAILS
Equipment: ${getEquipmentLabel(load.equipment_type)}${load.weight ? `\nWeight: ${load.weight.toLocaleString()} lbs` : ''}${load.commodity ? `\nCommodity: ${load.commodity}` : ''}${tempLine}${dimsLine}

RATE
Carrier Rate: $${(load.carrier_rate ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${load.rate_type === 'per_mile' ? ' per mile' : ' flat'}${load.miles ? `\nMiles: ${load.miles.toLocaleString()}` : ''}${specialLine}

══════════════════════════════════════
By accepting this load, carrier agrees to all terms and conditions 
including on-time pickup and delivery, proper handling of freight,
and maintaining all required insurance and operating authority.
══════════════════════════════════════
`.trim();

  return NextResponse.json({ text, load });
}
