# Freight PDF Parser

Free, open-source freight document parser. Extract structured data from rate confirmations, bills of lading, and freight invoices.

**Port:** 3017

---

## What It Does

Upload a freight document (PDF or image) or paste raw text → the parser scans for common freight fields and returns structured, editable data.

### Extracted Fields

| Field | Pattern |
|-------|---------|
| MC# | `MC-XXXXXX` format |
| DOT# | `DOT XXXXXXXX` format |
| BOL# | Bill of Lading number |
| PO# | Purchase Order number |
| PRO# | PRO tracking number |
| Load# | Load number |
| Carrier Name | Label-based heuristic |
| Shipper | Label-based heuristic |
| Consignee | Label-based heuristic |
| Weight | `XX,XXX lbs` pattern |
| Rate | Dollar amounts (`$X,XXX.XX`) |
| Dates | MM/DD/YYYY, YYYY-MM-DD, Month DD YYYY |
| Origin / Destination | City, ST pairs |
| Phone | Standard US phone formats |
| Email | RFC-style email addresses |

---

## Screenshot

![Freight Parser](screenshots/freight-parser.png)

## ⚠️ v1 — Pattern Matching Only

**This is v1.** It uses regex-based pattern matching — no AI, no LLM, no external APIs.

**Pros:** Fast, free, private (data never leaves your machine), works offline.

**Cons:** Won't handle unusual formatting, handwritten text, or documents with non-standard layouts.

**v2 (planned):** AI-powered parsing using OpenAI/Anthropic APIs for dramatically higher accuracy, support for scanned documents via OCR, and smarter context-aware extraction.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# → http://localhost:3017

# Build for production
npm run build
npm start
```

## Docker

```bash
docker build -t freight-parser .
docker run -p 3017:3017 freight-parser
```

---

## API

### `POST /api/parse`

**Upload a file:**
```bash
curl -X POST http://localhost:3017/api/parse \
  -F "file=@rate_confirmation.pdf"
```

**Paste text:**
```bash
curl -X POST http://localhost:3017/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text": "Carrier: ACME Trucking\nMC-123456\n..."}'
```

**Response:**
```json
{
  "fields": [
    {
      "label": "MC#",
      "key": "mc",
      "value": "MC-123456",
      "confidence": "high",
      "pattern": "MC Number (MC-XXXXXX)"
    }
  ],
  "rawText": "..."
}
```

### Confidence Levels

- **High** — Very specific pattern (MC#, DOT#, phone, email, weight, dates)
- **Medium** — Reasonable match but could have false positives (city/state pairs, label heuristics, dollar amounts)
- **Low** — Fuzzy match

---

## Tech Stack

- **Next.js 16** (App Router)
- **pdf-parse** for PDF text extraction
- **Tailwind CSS** for styling
- **TypeScript** throughout

---

## Ideas for v2

- AI parsing (GPT-4, Claude) for higher accuracy
- OCR for scanned images (Tesseract.js or cloud API)
- Export to Excel
- Batch processing (upload multiple documents)
- Template learning — remember your document formats
- Shipper/carrier lookup via FMCSA API (validate MC# / DOT#)
- Integration with Carrier Management system

---

## License

MIT — free forever.
