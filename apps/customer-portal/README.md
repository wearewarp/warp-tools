# 🌐 Customer / Shipper Portal

> Free, open-source customer-facing shipment tracking portal. Give your shippers real-time visibility into their freight — no phone calls needed.

## Features

### Customer Portal (shipper-facing)
- ✅ Token-based authentication (no passwords needed — share a link)
- ✅ Shipment list with status badges, search, and filtering
- ✅ Shipment detail with visual status timeline
- ✅ Check call / event updates (broker-controlled visibility)
- ✅ Document downloads (BOL, POD, Rate Con — broker-controlled visibility)
- ✅ In-app messaging between shipper and broker
- ✅ Clean, professional design (not the internal admin theme)
- ✅ Mobile responsive

### Admin / Broker Interface
- ✅ Customer management with auto-generated access tokens
- ✅ One-click portal link sharing
- ✅ Shipment CRUD with full lifecycle management
- ✅ Event/update management with customer visibility toggle
- ✅ Document upload with customer visibility toggle
- ✅ Message inbox with unread tracking
- ✅ Dashboard with aggregate stats
- ✅ Settings (company info, branding)

### Security
- ✅ Customers see ONLY their own shipments
- ✅ No carrier names, rates, or margins exposed to customers
- ✅ Event and document visibility controlled per-item
- ✅ Token can be regenerated or revoked at any time

## Quick Start

```bash
cd apps/customer-portal && npm install && npm run db:migrate && npm run db:seed && npm run dev
```

- **Admin:** http://localhost:3010
- **Portal:** http://localhost:3010/portal/login
- **Test access code:** `acme-tok-2024-xK9mP3nQ`

## Docker

```bash
docker build -t customer-portal .
docker run -p 3010:3010 customer-portal
```

## Tech Stack

- **Next.js 16** — App Router, Server Components
- **Drizzle ORM + SQLite** — lightweight, file-based persistence
- **Tailwind CSS** — utility-first styling
- **Lucide Icons** — clean icon set
- **Zod** — runtime validation
- **TypeScript** — end-to-end type safety

## Data Model

5 tables: `portalCustomers`, `portalShipments`, `shipmentEvents`, `shipmentDocuments`, `shipmentMessages`

## Ideas & Next Steps

### 🟢 Easy
- Email notification when shipment status changes
- PDF export of shipment details
- Custom portal branding (logo, colors)
- Shipment ETA countdown display

### 🟡 Medium
- SMS notifications for status updates (Twilio)
- Customer self-registration (with broker approval)
- Multi-shipment tracking dashboard for high-volume shippers
- Webhook notifications for integrations

### 🔴 Hard
- Integration with Load Dispatch (auto-sync shipment data)
- Integration with Invoice Tracker (show invoice status in portal)
- Integration with Document Vault (share docs through portal)
- White-label portal (custom domain per broker)
- Real-time tracking map (ELD/GPS integration)

## License

MIT
