export type Confidence = 'high' | 'medium' | 'low';

export interface ExtractedField {
  label: string;
  key: string;
  value: string;
  confidence: Confidence;
  pattern: string;
}

// ─── Pattern Definitions ──────────────────────────────────────────────────────

const PATTERNS = {
  mc: {
    label: 'MC#',
    key: 'mc',
    regex: /\bMC[#\-\s]?(\d{5,7})\b/gi,
    confidence: 'high' as Confidence,
    name: 'MC Number (MC-XXXXXX)',
  },
  dot: {
    label: 'DOT#',
    key: 'dot',
    regex: /\bDOT[#\-\s]?(\d{5,8})\b/gi,
    confidence: 'high' as Confidence,
    name: 'DOT Number',
  },
  bol: {
    label: 'BOL#',
    key: 'bol',
    regex: /\bB(?:OL|ill\s+of\s+Lading)[#\-\s#:]?([A-Z0-9\-]{4,20})\b/gi,
    confidence: 'high' as Confidence,
    name: 'Bill of Lading Number',
  },
  po: {
    label: 'PO#',
    key: 'po',
    regex: /\bP\.?O\.?[#\-\s#:]?([A-Z0-9\-]{3,20})\b/gi,
    confidence: 'high' as Confidence,
    name: 'Purchase Order Number',
  },
  pro: {
    label: 'PRO#',
    key: 'pro',
    regex: /\bPRO[#\-\s#:]?([A-Z0-9\-]{4,20})\b/gi,
    confidence: 'high' as Confidence,
    name: 'PRO Number',
  },
  load: {
    label: 'Load#',
    key: 'load',
    regex: /\bLoad[#\-\s#:]?([A-Z0-9\-]{3,20})\b/gi,
    confidence: 'medium' as Confidence,
    name: 'Load Number',
  },
  rate: {
    label: 'Rate',
    key: 'rate',
    regex: /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
    confidence: 'medium' as Confidence,
    name: 'Dollar Amount',
  },
  weight: {
    label: 'Weight',
    key: 'weight',
    regex: /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:lbs?|pounds?|LBS?)/gi,
    confidence: 'high' as Confidence,
    name: 'Weight (lbs)',
  },
  phone: {
    label: 'Phone',
    key: 'phone',
    regex: /(?:\+1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,
    confidence: 'high' as Confidence,
    name: 'Phone Number',
  },
  email: {
    label: 'Email',
    key: 'email',
    regex: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    confidence: 'high' as Confidence,
    name: 'Email Address',
  },
};

// City, State pattern — separate handling since it's multi-value
const CITY_STATE_REGEX = /([A-Z][a-zA-Z\s]{2,25}),\s*([A-Z]{2})\b/g;

// Date patterns
const DATE_PATTERNS = [
  /\b(\d{1,2}\/\d{1,2}\/\d{4})\b/g,        // MM/DD/YYYY
  /\b(\d{4}-\d{2}-\d{2})\b/g,               // YYYY-MM-DD
  /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi, // Month DD, YYYY
];

// Carrier name heuristics
const CARRIER_PATTERNS = [
  /Carrier(?:\s+Name)?[:\s]+([A-Z][^\n,]{3,50})/i,
  /Trucking\s+Company[:\s]+([A-Z][^\n,]{3,50})/i,
  /(?:Carried by|Transported by)[:\s]+([A-Z][^\n,]{3,50})/i,
];

// Shipper/consignee heuristics
const SHIPPER_PATTERNS = [
  /Shipper[:\s]+([A-Z][^\n,]{3,50})/i,
  /Ship\s+From[:\s]+([A-Z][^\n,]{3,50})/i,
];

const CONSIGNEE_PATTERNS = [
  /Consignee[:\s]+([A-Z][^\n,]{3,50})/i,
  /Ship\s+To[:\s]+([A-Z][^\n,]{3,50})/i,
  /Deliver\s+To[:\s]+([A-Z][^\n,]{3,50})/i,
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function firstMatch(text: string, regex: RegExp, groupIndex = 1): string | null {
  regex.lastIndex = 0;
  const m = regex.exec(text);
  return m ? m[groupIndex]?.trim() ?? null : null;
}

function allMatches(text: string, regex: RegExp, groupIndex = 0): string[] {
  regex.lastIndex = 0;
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const val = (groupIndex === 0 ? m[0] : m[groupIndex])?.trim();
    if (val && !results.includes(val)) results.push(val);
  }
  return results;
}

function matchPattern(text: string, patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const r = firstMatch(text, p, 1);
    if (r) return r;
  }
  return null;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function extractFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];

  // Carrier name
  const carrierName = matchPattern(text, CARRIER_PATTERNS);
  if (carrierName) {
    fields.push({
      label: 'Carrier Name',
      key: 'carrierName',
      value: carrierName,
      confidence: 'medium',
      pattern: 'Carrier label heuristic',
    });
  }

  // Shipper
  const shipper = matchPattern(text, SHIPPER_PATTERNS);
  if (shipper) {
    fields.push({
      label: 'Shipper',
      key: 'shipper',
      value: shipper,
      confidence: 'medium',
      pattern: 'Shipper label heuristic',
    });
  }

  // Consignee
  const consignee = matchPattern(text, CONSIGNEE_PATTERNS);
  if (consignee) {
    fields.push({
      label: 'Consignee',
      key: 'consignee',
      value: consignee,
      confidence: 'medium',
      pattern: 'Consignee label heuristic',
    });
  }

  // MC#
  const mc = firstMatch(text, PATTERNS.mc.regex, 1);
  if (mc) {
    fields.push({
      label: PATTERNS.mc.label,
      key: PATTERNS.mc.key,
      value: `MC-${mc}`,
      confidence: PATTERNS.mc.confidence,
      pattern: PATTERNS.mc.name,
    });
  }

  // DOT#
  const dot = firstMatch(text, PATTERNS.dot.regex, 1);
  if (dot) {
    fields.push({
      label: PATTERNS.dot.label,
      key: PATTERNS.dot.key,
      value: `DOT ${dot}`,
      confidence: PATTERNS.dot.confidence,
      pattern: PATTERNS.dot.name,
    });
  }

  // BOL#
  const bol = firstMatch(text, PATTERNS.bol.regex, 1);
  if (bol) {
    fields.push({
      label: PATTERNS.bol.label,
      key: PATTERNS.bol.key,
      value: bol,
      confidence: PATTERNS.bol.confidence,
      pattern: PATTERNS.bol.name,
    });
  }

  // PO#
  const po = firstMatch(text, PATTERNS.po.regex, 1);
  if (po) {
    fields.push({
      label: PATTERNS.po.label,
      key: PATTERNS.po.key,
      value: po,
      confidence: PATTERNS.po.confidence,
      pattern: PATTERNS.po.name,
    });
  }

  // PRO#
  const pro = firstMatch(text, PATTERNS.pro.regex, 1);
  if (pro) {
    fields.push({
      label: PATTERNS.pro.label,
      key: PATTERNS.pro.key,
      value: pro,
      confidence: PATTERNS.pro.confidence,
      pattern: PATTERNS.pro.name,
    });
  }

  // Load#
  const load = firstMatch(text, PATTERNS.load.regex, 1);
  if (load) {
    fields.push({
      label: PATTERNS.load.label,
      key: PATTERNS.load.key,
      value: load,
      confidence: PATTERNS.load.confidence,
      pattern: PATTERNS.load.name,
    });
  }

  // Weight
  const weight = firstMatch(text, PATTERNS.weight.regex, 1);
  if (weight) {
    fields.push({
      label: PATTERNS.weight.label,
      key: PATTERNS.weight.key,
      value: `${weight} lbs`,
      confidence: PATTERNS.weight.confidence,
      pattern: PATTERNS.weight.name,
    });
  }

  // Rates (dollar amounts) — collect up to 5
  const rates = allMatches(text, PATTERNS.rate.regex, 0).slice(0, 5);
  if (rates.length > 0) {
    fields.push({
      label: PATTERNS.rate.label,
      key: PATTERNS.rate.key,
      value: rates.join(', '),
      confidence: rates.length === 1 ? 'high' : PATTERNS.rate.confidence,
      pattern: PATTERNS.rate.name,
    });
  }

  // Dates
  const allDates: string[] = [];
  for (const dp of DATE_PATTERNS) {
    const found = allMatches(text, dp, 1);
    for (const d of found) {
      if (!allDates.includes(d)) allDates.push(d);
    }
  }
  if (allDates.length > 0) {
    fields.push({
      label: 'Date(s)',
      key: 'dates',
      value: allDates.slice(0, 5).join(', '),
      confidence: 'high',
      pattern: 'Date pattern (MM/DD/YYYY, YYYY-MM-DD, Month DD YYYY)',
    });
  }

  // City, State pairs
  const cityStates = allMatches(text, CITY_STATE_REGEX, 0).slice(0, 10);
  if (cityStates.length > 0) {
    const [origin, ...rest] = cityStates;
    fields.push({
      label: 'Origin',
      key: 'origin',
      value: origin,
      confidence: 'medium',
      pattern: 'City, State pattern',
    });
    if (rest.length > 0) {
      fields.push({
        label: 'Destination',
        key: 'destination',
        value: rest[rest.length - 1],
        confidence: 'medium',
        pattern: 'City, State pattern (last occurrence)',
      });
    }
  }

  // Phone numbers
  const phones = allMatches(text, PATTERNS.phone.regex, 0).slice(0, 3);
  if (phones.length > 0) {
    fields.push({
      label: PATTERNS.phone.label,
      key: PATTERNS.phone.key,
      value: phones.join(', '),
      confidence: PATTERNS.phone.confidence,
      pattern: PATTERNS.phone.name,
    });
  }

  // Emails
  const emails = allMatches(text, PATTERNS.email.regex, 0).slice(0, 3);
  if (emails.length > 0) {
    fields.push({
      label: PATTERNS.email.label,
      key: PATTERNS.email.key,
      value: emails.join(', '),
      confidence: PATTERNS.email.confidence,
      pattern: PATTERNS.email.name,
    });
  }

  return fields;
}
