# Driver Settlements — Warp Tools

Free, open-source driver pay tracking, settlement processing, and payroll management for trucking companies.

## Features

- **Driver profiles** — CDL info, pay type, hire date, emergency contacts
- **Multiple pay types** — Per mile, percentage of revenue, flat rate, hourly, per stop
- **Trip tracking** — Log trips with miles, revenue, stops, and auto-calculated pay
- **Settlement processing** — Weekly/bi-weekly settlement workflows with status tracking
- **Deductions & reimbursements** — Recurring templates + one-time items per settlement
- **Advances** — Track cash advances and deduct from future settlements
- **Reports** — Pay period summaries and driver earnings analytics

## Screenshots

![Dashboard](screenshots/driver-dashboard.png)
![Driver List](screenshots/driver-list.png)
![Driver Detail](screenshots/driver-detail.png)
![Settlement List](screenshots/settlement-list.png)
![Settlement Detail](screenshots/settlement-detail.png)
![Create Settlement](screenshots/settlement-create.png)
![Reports](screenshots/driver-reports.png)
![Mobile View](screenshots/driver-mobile.png)

## Quick Start

```bash
cd apps/driver-settlements
npm install
npm run db:migrate
npm run db:seed
npm run dev
# → http://localhost:3007
```

## Pay Types

| Type | How it works |
|------|-------------|
| Per Mile | `rate × miles` |
| Percentage | `(rate / 100) × revenue` |
| Flat | `rate` (fixed per load) |
| Hourly | `rate × hours` |
| Per Stop | `rate × stops` |

## Database

SQLite via Drizzle ORM. Tables: `drivers`, `trips`, `settlements`, `settlement_deductions`, `settlement_reimbursements`, `advances`, `deduction_templates`.

## Settlement Math

```
net_pay = gross_earnings - total_deductions - total_advances + total_reimbursements
```

## Stack

- Next.js 16 (App Router)
- Drizzle ORM + SQLite (@libsql/client)
- Tailwind CSS + Radix UI
- TypeScript

## Ideas

- [ ] Driver portal — drivers view their own settlements
- [ ] PDF settlement export
- [ ] ACH/check payment integration
- [ ] Multi-company support
- [ ] IFTA mileage reports
- [ ] ELD data import (CSV)
- [ ] Recurring deduction auto-apply
- [ ] Settlement email notifications

## License

MIT
