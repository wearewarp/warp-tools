// @warp-tools/freight-core — Shared logistics logic
// Will include: NMFC classes, dim weight calc, accessorial fees, etc.

export const FREIGHT_CLASSES = [
  50, 55, 60, 65, 70, 77.5, 85, 92.5, 100, 110, 125, 150, 175, 200, 250, 300, 400, 500,
] as const;

export type FreightClass = (typeof FREIGHT_CLASSES)[number];

export const PACKAGE_TYPES = [
  'Pallets',
  'Cases',
  'Cartons',
  'Bundles',
  'Drums',
  'Rolls',
  'Crates',
  'Bags',
  'Pieces',
  'Skids',
] as const;

export type PackageType = (typeof PACKAGE_TYPES)[number];

/**
 * Calculate density (PCF — pounds per cubic foot)
 */
export function calculateDensity(
  weightLbs: number,
  lengthIn: number,
  widthIn: number,
  heightIn: number
): number {
  const cubicFeet = (lengthIn * widthIn * heightIn) / 1728;
  if (cubicFeet === 0) return 0;
  return weightLbs / cubicFeet;
}

/**
 * Estimate freight class from density (simplified — real NMFC is more complex)
 */
export function estimateFreightClass(densityPCF: number): FreightClass {
  if (densityPCF >= 50) return 50;
  if (densityPCF >= 35) return 55;
  if (densityPCF >= 30) return 60;
  if (densityPCF >= 22.5) return 65;
  if (densityPCF >= 15) return 70;
  if (densityPCF >= 13.5) return 77.5;
  if (densityPCF >= 12) return 85;
  if (densityPCF >= 10.5) return 92.5;
  if (densityPCF >= 9) return 100;
  if (densityPCF >= 8) return 110;
  if (densityPCF >= 7) return 125;
  if (densityPCF >= 6) return 150;
  if (densityPCF >= 5) return 175;
  if (densityPCF >= 4) return 200;
  if (densityPCF >= 3) return 250;
  if (densityPCF >= 2) return 300;
  if (densityPCF >= 1) return 400;
  return 500;
}
