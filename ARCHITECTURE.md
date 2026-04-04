# Architecture

This document explains how Warp Tools is structured, how systems connect, and where to put code.

## Overview

Warp Tools is a Turborepo monorepo containing multiple standalone logistics systems. Each system is a complete Next.js application that can run independently. Systems share design tokens, configuration, and domain logic through internal packages.

```
┌─────────────────────────────────────────────────────────────┐
│                        warp-tools/                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                     apps/                            │    │
│  │  ┌─────────────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │ carrier-mgmt    │  │ invoice  │  │ doc-vault│   │    │
│  │  │ (Next.js)       │  │ tracker  │  │ (planned)│   │    │
│  │  │ Port 3001       │  │ (planned)│  │          │   │    │
│  │  │ SQLite DB       │  │          │  │          │   │    │
│  │  └────────┬────────┘  └──────────┘  └──────────┘   │    │
│  └───────────┼─────────────────────────────────────────┘    │
│              │ imports                                       │
│  ┌───────────┼─────────────────────────────────────────┐    │
│  │           ▼          packages/                       │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │    │
│  │  │ ui/      │  │ config/  │  │ freight-core/    │  │    │
│  │  │ Colors   │  │ Tailwind │  │ Freight classes  │  │    │
│  │  │ Tokens   │  │ TSConfig │  │ Density calc     │  │    │
│  │  │          │  │ ESLint   │  │ Package types    │  │    │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Monorepo Structure

```
warp-tools/
├── apps/                          # Standalone systems
│   └── carrier-management/        # ← First system (available now)
│       ├── src/app/               # Next.js App Router pages + API routes
│       ├── src/components/        # App-specific UI components
│       ├── src/db/                # Drizzle schema, migrations, seed
│       └── src/lib/               # Utilities
├── packages/                      # Shared internal packages
│   ├── ui/                        # @warp-tools/ui — Design tokens, colors
│   ├── config/                    # @warp-tools/config — Tailwind + TS config
│   └── freight-core/              # @warp-tools/freight-core — Logistics domain logic
├── screenshots/                   # Shared screenshot assets for READMEs
├── docker-compose.yml             # One-command self-hosting
├── ARCHITECTURE.md                # ← You are here
├── CONTRIBUTING.md                # How to contribute
└── turbo.json                     # Turborepo build configuration
```

## How Systems Work

### Each System is Independent

Every app in `apps/` is a complete Next.js application with its own:
- **Database** — SQLite file (e.g., `carrier-management.db`), zero external dependencies
- **API routes** — REST API under `/api/` for integrations
- **UI** — Full web interface with sidebar navigation
- **Schema** — Drizzle ORM schema in `src/db/schema.ts`
- **Migrations** — `npm run db:migrate` to set up tables
- **Seed data** — `npm run db:seed` for demo data

You can run any system by itself without needing any other system.

### Systems Are Designed to Connect

While independent, systems share a common data model philosophy. The `carriers` table in Carrier Management is designed so that future systems can reference it:

```
Carrier Management:  carriers, carrier_contacts, carrier_insurance, carrier_rates
Invoice Tracker:     invoices, payments → references carriers
Document Vault:      documents → references carriers, invoices
Dispatch:            loads, assignments → references carriers
Mini TMS:            shipments → ties everything together
```

When systems are deployed together, they share a database and foreign-key relationships connect them. When deployed standalone, each works with its own tables.

## Package Details

### `@warp-tools/ui`

Design tokens and colors shared across all systems. Ensures visual consistency.

```typescript
import { colors, statusColors } from '@warp-tools/ui';
// colors.background = '#040810'
// colors.accent = '#00C650'
// statusColors.expiringSoon = '#FFAA00'
```

### `@warp-tools/config`

Shared Tailwind CSS configuration with Warp design tokens (custom colors, fonts, shadows, border radius). Apps extend this config in their own `tailwind.config.ts`.

### `@warp-tools/freight-core`

Logistics domain logic that multiple systems need:
- Freight class definitions (NMFC classes 50–500)
- Density calculation (PCF — pounds per cubic foot)
- Package type definitions
- _(Planned: accessorial fees, dim weight, mileage calculations)_

## Design Principles

1. **Dark theme, anti-enterprise** — Background `#040810`, accent `#00C650`. Feels like Linear, not SAP.
2. **SQLite-first** — No Postgres required for self-hosting. Just clone and run.
3. **Server Components** — Data fetching happens on the server. Client Components only for interactivity.
4. **Type-safe end-to-end** — Drizzle schema → TypeScript types → Zod validation → API responses.

5. **Progressive disclosure** — Works simply out of the box, power features reveal as needed.
6. **Mobile responsive** — Card layouts on small screens, tables on large screens, collapsible sidebar.

For detailed visual specifications (colors, typography, spacing, component patterns, interaction patterns, responsive rules), see [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).

## Where to Put Code

| You want to... | Put it in... |
|----------------|-------------|
| Add a feature to Carrier Management | `apps/carrier-management/src/` |
| Add a new page | `apps/carrier-management/src/app/{route}/page.tsx` |
| Add a new API endpoint | `apps/carrier-management/src/app/api/{route}/route.ts` |
| Add a reusable component for one app | `apps/{app}/src/components/` |
| Add a component shared across apps | `packages/ui/src/` |
| Add logistics domain logic | `packages/freight-core/src/` |
| Change Tailwind theme/config | `packages/config/tailwind.config.ts` |
| Add a new system | `apps/{system-name}/` (use carrier-management as template) |
| Add database tables | `apps/{app}/src/db/schema.ts` |
| Add screenshots | `screenshots/` (root) or `apps/{app}/screenshots/` |

## Adding a New System

1. Copy `apps/carrier-management/` as a template
2. Rename package in `package.json` to `@warp-tools/{system-name}`
3. Update the port in `dev` and `start` scripts (3001, 3002, 3003...)
4. Replace the schema in `src/db/schema.ts` with your system's tables
5. Update `src/db/seed.ts` with sample data
6. Update the sidebar navigation in `src/components/Sidebar.tsx`
7. Add to `docker-compose.yml` as a new service
8. Add to the root README systems table
9. Create `apps/{system-name}/README.md` with features, setup, and Ideas & Next Steps

## Database

### Schema Convention

- Table names: `snake_case` plural (e.g., `carriers`, `carrier_contacts`)
- Column names: `snake_case` (e.g., `mc_number`, `created_at`)
- IDs: UUID text primary keys with `crypto.randomUUID()` default
- Timestamps: ISO 8601 text with `datetime('now')` default
- JSON data: Stored as text, parsed in application code
- Enums: SQLite text columns with TypeScript enum constraints

### Running Migrations

```bash
cd apps/{system-name}
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply migrations to database
npm run db:seed       # Populate with sample data
npm run db:studio     # Open Drizzle Studio to browse data
```

## API Convention

All API routes follow REST conventions:

```
GET    /api/{resource}           → List (supports query params for filtering)
POST   /api/{resource}           → Create
GET    /api/{resource}/:id       → Get one
PATCH  /api/{resource}/:id       → Update
DELETE /api/{resource}/:id       → Delete

# Nested resources
GET    /api/{parent}/:id/{child}           → List children
POST   /api/{parent}/:id/{child}           → Create child
PATCH  /api/{parent}/:id/{child}/:childId  → Update child
DELETE /api/{parent}/:id/{child}/:childId  → Delete child
```

All endpoints accept and return JSON. Errors return `{ error: string }` with appropriate HTTP status codes.
