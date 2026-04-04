// IFTA Fuel Tax Rates — Last updated: Q1 2026
// Rates are in dollars per gallon (USD) / liter (CAD converted to per-gallon equivalent)
// Note: IFTA rates change quarterly. Update this file each quarter.
// Source: IFTA Inc. (www.iftach.org) quarterly rate updates

export interface IFTARate {
  jurisdiction: string;
  code: string;
  dieselRate: number;
  gasolineRate: number;
  country: 'US' | 'CA';
}

// Last updated: Q1 2026
export const LAST_UPDATED = 'Q1 2026';

export const IFTA_RATES: IFTARate[] = [
  // ─── United States (48 contiguous + DC) ───────────────────────────
  { jurisdiction: 'Alabama',          code: 'AL', dieselRate: 0.2900, gasolineRate: 0.2900, country: 'US' },
  { jurisdiction: 'Arizona',          code: 'AZ', dieselRate: 0.2600, gasolineRate: 0.1900, country: 'US' },
  { jurisdiction: 'Arkansas',         code: 'AR', dieselRate: 0.2850, gasolineRate: 0.2450, country: 'US' },
  { jurisdiction: 'California',       code: 'CA', dieselRate: 0.9280, gasolineRate: 0.6960, country: 'US' },
  { jurisdiction: 'Colorado',         code: 'CO', dieselRate: 0.2050, gasolineRate: 0.2280, country: 'US' },
  { jurisdiction: 'Connecticut',      code: 'CT', dieselRate: 0.4020, gasolineRate: 0.3710, country: 'US' },
  { jurisdiction: 'Delaware',         code: 'DE', dieselRate: 0.2200, gasolineRate: 0.2300, country: 'US' },
  { jurisdiction: 'District of Columbia', code: 'DC', dieselRate: 0.2350, gasolineRate: 0.2350, country: 'US' },
  { jurisdiction: 'Florida',          code: 'FL', dieselRate: 0.3490, gasolineRate: 0.3870, country: 'US' },
  { jurisdiction: 'Georgia',          code: 'GA', dieselRate: 0.3260, gasolineRate: 0.3260, country: 'US' },
  { jurisdiction: 'Idaho',            code: 'ID', dieselRate: 0.3200, gasolineRate: 0.3200, country: 'US' },
  { jurisdiction: 'Illinois',         code: 'IL', dieselRate: 0.4690, gasolineRate: 0.4660, country: 'US' },
  { jurisdiction: 'Indiana',          code: 'IN', dieselRate: 0.5700, gasolineRate: 0.5500, country: 'US' },
  { jurisdiction: 'Iowa',             code: 'IA', dieselRate: 0.3250, gasolineRate: 0.3250, country: 'US' },
  { jurisdiction: 'Kansas',           code: 'KS', dieselRate: 0.2600, gasolineRate: 0.2400, country: 'US' },
  { jurisdiction: 'Kentucky',         code: 'KY', dieselRate: 0.4570, gasolineRate: 0.4570, country: 'US' },
  { jurisdiction: 'Louisiana',        code: 'LA', dieselRate: 0.2000, gasolineRate: 0.2000, country: 'US' },
  { jurisdiction: 'Maine',            code: 'ME', dieselRate: 0.3120, gasolineRate: 0.3120, country: 'US' },
  { jurisdiction: 'Maryland',         code: 'MD', dieselRate: 0.4265, gasolineRate: 0.4265, country: 'US' },
  { jurisdiction: 'Massachusetts',    code: 'MA', dieselRate: 0.2400, gasolineRate: 0.2400, country: 'US' },
  { jurisdiction: 'Michigan',         code: 'MI', dieselRate: 0.3150, gasolineRate: 0.3150, country: 'US' },
  { jurisdiction: 'Minnesota',        code: 'MN', dieselRate: 0.2850, gasolineRate: 0.2850, country: 'US' },
  { jurisdiction: 'Mississippi',      code: 'MS', dieselRate: 0.1800, gasolineRate: 0.1800, country: 'US' },
  { jurisdiction: 'Missouri',         code: 'MO', dieselRate: 0.1950, gasolineRate: 0.1950, country: 'US' },
  { jurisdiction: 'Montana',          code: 'MT', dieselRate: 0.2950, gasolineRate: 0.2950, country: 'US' },
  { jurisdiction: 'Nebraska',         code: 'NE', dieselRate: 0.2890, gasolineRate: 0.2890, country: 'US' },
  { jurisdiction: 'Nevada',           code: 'NV', dieselRate: 0.2790, gasolineRate: 0.2380, country: 'US' },
  { jurisdiction: 'New Hampshire',    code: 'NH', dieselRate: 0.2220, gasolineRate: 0.2220, country: 'US' },
  { jurisdiction: 'New Jersey',       code: 'NJ', dieselRate: 0.4620, gasolineRate: 0.4620, country: 'US' },
  { jurisdiction: 'New Mexico',       code: 'NM', dieselRate: 0.2100, gasolineRate: 0.1700, country: 'US' },
  { jurisdiction: 'New York',         code: 'NY', dieselRate: 0.5440, gasolineRate: 0.5440, country: 'US' },
  { jurisdiction: 'North Carolina',   code: 'NC', dieselRate: 0.4060, gasolineRate: 0.4060, country: 'US' },
  { jurisdiction: 'North Dakota',     code: 'ND', dieselRate: 0.2300, gasolineRate: 0.2300, country: 'US' },
  { jurisdiction: 'Ohio',             code: 'OH', dieselRate: 0.4750, gasolineRate: 0.4750, country: 'US' },
  { jurisdiction: 'Oklahoma',         code: 'OK', dieselRate: 0.1900, gasolineRate: 0.1900, country: 'US' },
  { jurisdiction: 'Oregon',           code: 'OR', dieselRate: 0.3800, gasolineRate: 0.3800, country: 'US' },
  { jurisdiction: 'Pennsylvania',     code: 'PA', dieselRate: 0.7410, gasolineRate: 0.5870, country: 'US' },
  { jurisdiction: 'Rhode Island',     code: 'RI', dieselRate: 0.3700, gasolineRate: 0.3700, country: 'US' },
  { jurisdiction: 'South Carolina',   code: 'SC', dieselRate: 0.2500, gasolineRate: 0.2500, country: 'US' },
  { jurisdiction: 'South Dakota',     code: 'SD', dieselRate: 0.2800, gasolineRate: 0.2800, country: 'US' },
  { jurisdiction: 'Tennessee',        code: 'TN', dieselRate: 0.2700, gasolineRate: 0.2700, country: 'US' },
  { jurisdiction: 'Texas',            code: 'TX', dieselRate: 0.2000, gasolineRate: 0.2000, country: 'US' },
  { jurisdiction: 'Utah',             code: 'UT', dieselRate: 0.3680, gasolineRate: 0.3680, country: 'US' },
  { jurisdiction: 'Vermont',          code: 'VT', dieselRate: 0.3200, gasolineRate: 0.3200, country: 'US' },
  { jurisdiction: 'Virginia',         code: 'VA', dieselRate: 0.3760, gasolineRate: 0.3760, country: 'US' },
  { jurisdiction: 'Washington',       code: 'WA', dieselRate: 0.4940, gasolineRate: 0.4940, country: 'US' },
  { jurisdiction: 'West Virginia',    code: 'WV', dieselRate: 0.3570, gasolineRate: 0.3570, country: 'US' },
  { jurisdiction: 'Wisconsin',        code: 'WI', dieselRate: 0.3290, gasolineRate: 0.3290, country: 'US' },
  { jurisdiction: 'Wyoming',          code: 'WY', dieselRate: 0.2400, gasolineRate: 0.2400, country: 'US' },

  // ─── Canadian Provinces (rates in USD per gallon equivalent) ──────
  // Note: Canadian provinces report in liters (CAD). Rates below are approximate
  // USD-per-gallon equivalents based on Q1 2026 exchange rates. File IFTA in
  // native currency for Canadian operations.
  { jurisdiction: 'Alberta',                  code: 'AB', dieselRate: 0.1120, gasolineRate: 0.1120, country: 'CA' },
  { jurisdiction: 'British Columbia',         code: 'BC', dieselRate: 0.2780, gasolineRate: 0.2780, country: 'CA' },
  { jurisdiction: 'Manitoba',                 code: 'MB', dieselRate: 0.1430, gasolineRate: 0.1430, country: 'CA' },
  { jurisdiction: 'New Brunswick',            code: 'NB', dieselRate: 0.2170, gasolineRate: 0.2170, country: 'CA' },
  { jurisdiction: 'Newfoundland & Labrador',  code: 'NL', dieselRate: 0.2410, gasolineRate: 0.2410, country: 'CA' },
  { jurisdiction: 'Nova Scotia',              code: 'NS', dieselRate: 0.1880, gasolineRate: 0.1880, country: 'CA' },
  { jurisdiction: 'Ontario',                  code: 'ON', dieselRate: 0.1770, gasolineRate: 0.1770, country: 'CA' },
  { jurisdiction: 'Prince Edward Island',     code: 'PE', dieselRate: 0.2240, gasolineRate: 0.2240, country: 'CA' },
  { jurisdiction: 'Quebec',                   code: 'QC', dieselRate: 0.2060, gasolineRate: 0.2060, country: 'CA' },
  { jurisdiction: 'Saskatchewan',             code: 'SK', dieselRate: 0.1510, gasolineRate: 0.1510, country: 'CA' },
];

export function getRateByCode(code: string): IFTARate | undefined {
  return IFTA_RATES.find((r) => r.code === code);
}

export const US_JURISDICTIONS = IFTA_RATES.filter((r) => r.country === 'US');
export const CA_JURISDICTIONS = IFTA_RATES.filter((r) => r.country === 'CA');
