export const VN_GRID_CO2_KG_PER_KWH = 0.6612;

export const TREE_KG_CO2_PER_YEAR = 21;

export type CarbonImpact = {
  kgCo2: number;
  treesEquivalent: number;
  kmCarEquivalent: number;
};

export const CAR_GASOLINE_KG_CO2_PER_KM = 0.192;

export function carbonImpactFromKwh(kwh: number): CarbonImpact {
  const safe = Math.max(0, kwh || 0);
  const kgCo2 = safe * VN_GRID_CO2_KG_PER_KWH;
  return {
    kgCo2,
    treesEquivalent: kgCo2 / TREE_KG_CO2_PER_YEAR,
    kmCarEquivalent: kgCo2 / CAR_GASOLINE_KG_CO2_PER_KM,
  };
}

export const WATER_KG_CO2_PER_M3 = 0.41;

export function carbonImpactFromWaterM3(m3: number): CarbonImpact {
  const safe = Math.max(0, m3 || 0);
  const kgCo2 = safe * WATER_KG_CO2_PER_M3;
  return {
    kgCo2,
    treesEquivalent: kgCo2 / TREE_KG_CO2_PER_YEAR,
    kmCarEquivalent: kgCo2 / CAR_GASOLINE_KG_CO2_PER_KM,
  };
}
