# 🚛 Warp Tools

**Free, open-source tools for the logistics industry.**

Built by [Warp](https://wearewarp.com) — because shippers shouldn't pay $500/mo for basic tools.

## Tools

| Tool | Description | Status |
|------|-------------|--------|
| **BOL Generator** | Generate professional Bills of Lading as PDF | 🔨 Building |
| **Freight Class Calculator** | NMFC class lookup + density calculator | 📋 Planned |
| **Rate Estimator** | Estimate freight costs across LTL/FTL/Parcel | 📋 Planned |
| **Pallet Calculator** | Visual trailer loading optimizer | 📋 Planned |
| **Appointment Scheduler** | Dock door / delivery scheduling | 📋 Planned |

[View full roadmap →](https://github.com/dasokolovsky/warp-tools/issues)

## Use It

### Hosted (Free)

Visit **[tools.wearewarp.com](https://tools.wearewarp.com)** — no setup, no install, just use it.

### Self-Host

```bash
git clone https://github.com/dasokolovsky/warp-tools.git
cd warp-tools
npm install
npm run dev
```

Each tool in `apps/` is independently deployable. See individual READMEs for details.

## Tech Stack

- **Next.js 15** — React framework with App Router
- **Tailwind CSS** — Utility-first styling
- **Turborepo** — Monorepo build system
- **Supabase** — Auth + database (hosted version)

## Project Structure

```
warp-tools/
├── apps/                    # Individual tools
│   ├── bol-generator/       # Bill of Lading generator
│   └── ...
├── packages/
│   ├── ui/                  # Shared design system
│   ├── freight-core/        # Logistics calculations
│   └── config/              # Shared configs
└── turbo.json
```

## Contributing

PRs welcome! Each tool has its own spec in the project wiki. Pick one and build.

## License

MIT — do whatever you want with it.

---

**Built with ❤️ by [Warp](https://wearewarp.com)** — Modern freight, simplified.
