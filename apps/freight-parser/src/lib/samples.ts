export interface SampleDocument {
  id: string;
  label: string;
  text: string;
}

export const SAMPLE_DOCUMENTS: SampleDocument[] = [
  {
    id: 'rate-confirmation',
    label: 'Sample Rate Confirmation',
    text: `RATE CONFIRMATION
Load# RC-2024-00482

Broker: Warp Logistics Inc.
Carrier: Swift Transport LLC
MC-482910 | DOT 1234567
Phone: (555) 234-5678
Email: dispatch@swifttransport.com

Pickup:
  Shipper: ABC Manufacturing
  123 Industrial Blvd
  Dallas, TX 75201
  Date: 04/15/2024
  Time: 08:00 AM

Delivery:
  Consignee: XYZ Distribution Center
  456 Warehouse Rd
  Houston, TX 77001
  Date: 04/16/2024
  Time: 14:00 PM

Commodity: General Freight
Weight: 22,500 lbs
Equipment: Dry Van 53'

Rate: $1,850.00
Fuel Surcharge: $185.00
Total: $2,035.00

PO# 78432-A
BOL# SWIFT-20240415-001

By signing this rate confirmation, carrier agrees to all terms and conditions.`,
  },
  {
    id: 'bill-of-lading',
    label: 'Sample Bill of Lading',
    text: `BILL OF LADING
BOL# WRP-BOL-2024-00341
Date: 2024-03-22

SHIPPER:
  Global Parts Co.
  789 Commerce St
  Chicago, IL 60601
  Contact: John Smith
  Phone: 312-555-0100
  Email: jsmith@globalparts.com

CONSIGNEE:
  Regional Auto Parts
  321 Distribution Ave
  Detroit, MI 48201
  Phone: (313) 555-0200

CARRIER: Midwest Freight Lines
MC-673421
DOT 9876543

PRO# MFL-20240322-0892

DESCRIPTION OF ARTICLES:
  Auto Parts - Assorted
  Weight: 18,750 lbs
  Pieces: 42 pallets
  Class: 70
  NMFC: 01920

Special Instructions: Keep dry, do not stack

DECLARED VALUE: $45,000.00

Pickup Date: 03/22/2024
Delivery Date: 03/24/2024

Chicago, IL to Detroit, MI`,
  },
  {
    id: 'freight-invoice',
    label: 'Sample Freight Invoice',
    text: `FREIGHT INVOICE
Invoice #: INV-2024-08821
Invoice Date: April 1, 2024
Due Date: May 1, 2024

FROM:
  Eagle Freight Carriers
  MC-284756 | DOT 4567891
  1000 Trucker Way
  Atlanta, GA 30301
  Phone: (404) 555-0300
  Email: billing@eaglefreight.com

TO:
  Summit Logistics Corp
  200 Broker Plaza
  Nashville, TN 37201
  Phone: (615) 555-0400
  Email: ap@summitlogistics.com

LOAD DETAILS:
  Load# EFC-24-00183
  PO# SLC-PO-44892
  BOL# EFC-BOL-0183
  Pickup Date: March 28, 2024
  Delivery Date: March 29, 2024

  Origin: Atlanta, GA
  Destination: Nashville, TN

  Commodity: Packaged Goods
  Weight: 14,200 lbs
  Miles: 249

CHARGES:
  Linehaul Rate:      $1,100.00
  Fuel Surcharge:     $110.00
  Liftgate:           $75.00
  ─────────────────────────────
  TOTAL DUE:         $1,285.00

Payment Terms: Net 30
Please remit to: billing@eaglefreight.com`,
  },
];
