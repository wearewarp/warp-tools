# 🌐 Customer / Shipper Portal

> Free, open-source customer-facing shipment tracking portal. Give your shippers real-time visibility into their freight — no phone calls needed.

![Shipments List](screenshots/portal-admin-shipments.png)

**Replaces:** "Where's my freight?" phone calls, emailed spreadsheet updates, and clunky TMS portals that shippers hate using.

## Features

### Customer Portal (shipper-facing)
- ✅ **Token-based authentication** — No passwords needed — share a link with an access code
- ✅ **Shipment list** — Status badges, search, and filtering by status
- ✅ **Shipment detail** — Visual status timeline showing every milestone
- ✅ **Check call / event updates** — Broker-controlled visibility per event
- ✅ **Document downloads** — BOL, POD, Rate Con — broker controls what customers see
- ✅ **In-app messaging** — Threaded conversation between shipper and broker per shipment
- ✅ **Clean, professional design** — Light theme portal, not the internal admin theme
- ✅ **Mobile responsive** — Card layout on mobile, works on any phone

### Admin / Broker Interface
- ✅ **Customer management** — Auto-generated access tokens, one-click portal link sharing
- ✅ **Shipment CRUD** — Full lifecycle: quote → booked → in transit → delivered → invoiced → closed
- ✅ **Event/update management** — Add check calls, status changes, notes with customer visibility toggle
- ✅ **Document upload** — Attach BOL, POD, rate con, customs docs with visibility toggle
- ✅ **Message inbox** — See all customer messages with unread tracking
- ✅ **Dashboard** — Aggregate stats (customers, shipments, active, in transit)
- ✅ **Settings** — Company info, portal branding, welcome message, footer text

### Security
- ✅ Customers see ONLY their own shipments
- ✅ No carrier names, rates, or margins exposed to customers
- ✅ Event and document visibility controlled per-item by the broker
- ✅ Access tokens can be regenerated or revoked at any time

## Screenshots

### Admin Interface

| Dashboard | Shipments | Shipment Detail |
|:---------:|:---------:|:---------------:|
| ![Dashboard](screenshots/portal-admin-dashboard.png) | ![Shipments](screenshots/portal-admin-shipments.png) | ![Detail](screenshots/portal-admin-shipment-detail.png) |

| Customers | Settings |
|:---------:|:--------:|
| ![Customers](screenshots/portal-admin-customers.png) | ![Settings](screenshots/portal-admin-settings.png) |

### Customer Portal

| Login | Shipment List | Shipment Detail | Mobile |
|:-----:|:-------------:|:---------------:|:------:|
| ![Login](screenshots/portal-login.png) | ![Shipments](screenshots/portal-shipments.png) | ![Detail](screenshots/portal-shipment-detail.png) | ![Mobile](screenshots/portal-mobile.png) |

## Quick Start

```bash
# From the monorepo root
git clone https://github.com/wearewarp/warp-tools.git
cd warp-tools
npm install

# Set up the database
cd apps/customer-portal
npm run db:migrate
npm run db:seed        # Creates 3 demo customers + 10 shipments

# Start the dev server
npm run dev
```

- **Admin Interface:** http://localhost:3010
- **Customer Portal:** http://localhost:3010/portal/login
- **Test access code:** `acme-tok-2024-xK9mP3nQ`

### Or from the monorepo root:

```bash
npm run dev -- --filter=@warp-tools/customer-portal
```

## Project Structure

```
apps/customer-portal/
├── src/
│   ├── app/
│   │   ├── (admin)/               # Admin route group
│   │   │   ├── admin/
│   │   │   │   ├── customers/     # Customer CRUD (list, detail, new, edit)
│   │   │   │   ├── shipments/     # Shipment CRUD (list, detail, new, edit)
│   │   │   │   ├── messages/      # Message inbox
│   │   │   │   └── settings/      # Company & portal settings
│   │   │   └── page.tsx           # Admin dashboard
│   │   ├── portal/                # Customer-facing portal
│   │   │   ├── login/             # Access code login
│   │   │   ├── shipments/[id]/    # Shipment detail (customer view)
│   │   │   └── page.tsx           # Shipment list (customer view)
│   │   └── api/
│   │       ├── admin/             # Admin API routes
│   │       │   ├── customers/     # CRUD + token regeneration
│   │       │   ├── shipments/     # CRUD + events + documents + messages + status
│   │       │   ├── messages/      # Message inbox
│   │       │   └── settings/      # Company settings
│   │       └── portal/            # Customer-facing API routes
│   │           ├── auth/          # Token-based login
│   │           ├── logout/        # Session logout
│   │           ├── shipments/     # Customer's shipments + document download
│   │           └── messages/      # Customer messaging
│   ├── components/
│   │   ├── portal/                # Customer-facing components
│   │   │   ├── DocumentGrid.tsx   # Document download cards
│   │   │   ├── EventList.tsx      # Visible event timeline
│   │   │   ├── MessageThread.tsx  # Conversation UI
│   │   │   ├── ShipmentCard.tsx   # Shipment card for list view
│   │   │   └── StatusTimeline.tsx # Visual status progression
│   │   ├── AdminSidebar.tsx       # Navigation sidebar
│   │   ├── ConfirmDialog.tsx      # Delete/action confirmations
│   │   ├── EventTimeline.tsx      # Admin event timeline
│   │   ├── PortalHeader.tsx       # Customer portal header
│   │   ├── StatusTimeline.tsx     # Status visualization
│   │   ├── Toast.tsx              # Notifications
│   │   ├── UpdateStatusModal.tsx  # Shipment status change modal
│   │   └── UploadDocumentModal.tsx # Document upload with visibility toggle
│   └── db/
│       ├── schema.ts              # 6 tables (customers, shipments, events, documents, messages, settings)
│       ├── seed.ts                # Demo data: 3 customers, 10 shipments, events, documents
│       ├── migrate.ts             # Migration runner
│       └── index.ts               # Database connection
├── Dockerfile
├── .env.example
└── package.json
```

## API Reference

### Admin API

#### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/customers` | List all customers |
| `POST` | `/api/admin/customers` | Create customer (auto-generates access token) |
| `GET` | `/api/admin/customers/:id` | Get customer details |
| `PATCH` | `/api/admin/customers/:id` | Update customer |
| `DELETE` | `/api/admin/customers/:id` | Delete customer and all their data |
| `POST` | `/api/admin/customers/:id/regenerate-token` | Generate a new access token |

#### Shipments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/shipments` | List shipments (search, filter by status) |
| `POST` | `/api/admin/shipments` | Create a shipment |
| `GET` | `/api/admin/shipments/:id` | Get shipment with events, docs, messages |
| `PATCH` | `/api/admin/shipments/:id` | Update shipment details |
| `DELETE` | `/api/admin/shipments/:id` | Delete a shipment |
| `PATCH` | `/api/admin/shipments/:id/status` | Update shipment status |

#### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/shipments/:id/events` | List events for a shipment |
| `POST` | `/api/admin/shipments/:id/events` | Add event (with `isVisibleToCustomer` toggle) |
| `PATCH` | `/api/admin/shipments/:id/events/:eventId` | Update event |
| `DELETE` | `/api/admin/shipments/:id/events/:eventId` | Delete event |

#### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/shipments/:id/documents` | List documents |
| `POST` | `/api/admin/shipments/:id/documents` | Upload document (with visibility toggle) |
| `DELETE` | `/api/admin/shipments/:id/documents/:docId` | Delete document |
| `GET` | `/api/admin/shipments/:id/documents/:docId/download` | Download document file |

#### Messages & Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/messages` | All messages (inbox) |
| `POST` | `/api/admin/shipments/:id/messages` | Send message to customer |
| `GET` | `/api/admin/settings` | Get company/portal settings |
| `PATCH` | `/api/admin/settings` | Update settings |

### Portal (Customer-Facing) API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/portal/auth` | Login with access token |
| `POST` | `/api/portal/logout` | Logout |
| `GET` | `/api/portal/shipments` | List customer's shipments only |
| `GET` | `/api/portal/shipments/:id` | Shipment detail (visible events/docs only) |
| `GET` | `/api/portal/shipments/:id/documents/:docId/download` | Download visible document |
| `GET` | `/api/portal/messages` | Customer's messages |

## Tech Stack

- **Next.js 16** — App Router, Server Components, Route Groups
- **Drizzle ORM** — Type-safe database access
- **SQLite** (via `@libsql/client`) — Zero-config, file-based persistence
- **Tailwind CSS** — Utility-first styling with Warp design tokens
- **Lucide Icons** — Clean icon set
- **Zod** — Runtime validation
- **TypeScript** — End-to-end type safety

## Self-Hosting

This system runs completely standalone — no cloud services, no accounts needed.

```bash
# Clone and set up
git clone https://github.com/wearewarp/warp-tools.git
cd warp-tools
npm install

# Build for production
cd apps/customer-portal
npm run db:migrate
npm run build
npm start
# → Running on http://localhost:3010
```

The database is a local SQLite file (`customer-portal.db`). Share portal links with customers containing their access code.

### Docker

```bash
# From the monorepo root
docker compose up customer-portal
# → Running on http://localhost:3018
```

Or standalone:

```bash
docker build -t customer-portal .
docker run -p 3010:3010 customer-portal
```

## Data Model

```
portalCustomers ────── portalShipments (1:many)
                           │
                           ├── portalEvents (1:many)      ← check calls, status changes
                           │
                           ├── portalDocuments (1:many)    ← BOL, POD, rate con
                           │
                           └── portalMessages (1:many)     ← shipper ↔ broker chat

portalSettings ──── singleton (company info, branding)
```

**Key design decisions:**
- Customers authenticate with access tokens (no passwords) — broker shares a link
- Events and documents have per-item `isVisibleToCustomer` toggles
- Messages are scoped per shipment with sender type (customer/broker)
- No carrier data is exposed to the customer-facing portal
- Shipment rates shown to admin only, never to customers

## Ideas & Next Steps

### 🟢 Easy
- **Email notification** when shipment status changes
- **PDF export** of shipment details for customer records
- **Custom portal branding** — upload logo, set accent color per customer
- **Shipment ETA countdown** display on portal

### 🟡 Medium
- **SMS notifications** for status updates (Twilio integration)
- **Customer self-registration** with broker approval workflow
- **Multi-shipment dashboard** for high-volume shippers (charts, KPIs)
- **Webhook notifications** for external system integration
- **Bulk shipment import** from CSV/Excel
- **Rate confirmation PDF** auto-generation

### 🔴 Hard (High impact)
- **Integration with Load Dispatch** — auto-sync shipment data from dispatch system
- **Integration with Invoice Tracker** — show invoice status and payment history in portal
- **Integration with Document Vault** — share docs through portal automatically
- **White-label portal** — custom domain, logo, and colors per broker
- **Real-time tracking map** — ELD/GPS integration for live truck position
- **Multi-tenant** — support multiple brokerage organizations

### 🚀 Future Systems Integration
- **Load Dispatch** → Auto-create portal shipments when loads are dispatched
- **Invoice Tracker** → Show invoice/payment status to customers in portal
- **Document Vault** → Auto-share uploaded BOLs and PODs through portal
- **Carrier Management** → (Internal only) carrier data never exposed to customers

## Contributing

See the [Contributing Guide](../../CONTRIBUTING.md) for setup instructions, coding standards, and PR process.

## License

MIT — do whatever you want with it.

---

**Part of [Warp Tools](https://github.com/wearewarp/warp-tools)** — Free, open-source logistics systems built by [Warp](https://wearewarp.com).
