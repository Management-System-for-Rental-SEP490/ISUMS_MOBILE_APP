import type { TariffConfigDto, TariffTierDto } from "../services/tariffApi";

export type Tier = TariffTierDto;

export type TariffBreakdown = {
  tier: Tier;
  unitsInTier: number;
  costVnd: number;
};

export type CostResult = {
  totalUnits: number;
  preTaxVnd: number;
  vatVnd: number;
  surchargeVnd: number;
  surchargeLabel: string | null;
  totalVnd: number;
  breakdown: TariffBreakdown[];
  currentTierIndex: number;
  unitsUntilNextTier: number | null;
  source: string;
  effectiveFrom: string;
  version: string;
  notes: string | null;
};

export function calculateCostFromTariff(
  totalUnits: number,
  config: TariffConfigDto,
): CostResult {
  const safe = Math.max(0, totalUnits || 0);
  const breakdown: TariffBreakdown[] = [];
  let preTax = 0;
  let currentTierIndex = config.tiers[0]?.index ?? 1;
  let unitsUntilNextTier: number | null = null;

  for (const tier of config.tiers) {
    const upper = tier.toUnit ?? Number.POSITIVE_INFINITY;
    if (safe <= tier.fromUnit) {
      breakdown.push({ tier, unitsInTier: 0, costVnd: 0 });
      continue;
    }
    const unitsInTier = Math.min(safe, upper) - tier.fromUnit;
    const costVnd = unitsInTier * tier.pricePerUnitVnd;
    breakdown.push({ tier, unitsInTier, costVnd });
    preTax += costVnd;
    currentTierIndex = tier.index;
    if (tier.toUnit != null && safe < tier.toUnit) {
      unitsUntilNextTier = tier.toUnit - safe;
    }
  }

  const vatVnd = Math.round(preTax * (config.vatRate || 0));
  const surchargeVnd = Math.round(preTax * (config.surchargeRate || 0));
  return {
    totalUnits: safe,
    preTaxVnd: Math.round(preTax),
    vatVnd,
    surchargeVnd,
    surchargeLabel: config.surchargeLabel,
    totalVnd: Math.round(preTax + vatVnd + surchargeVnd),
    breakdown,
    currentTierIndex,
    unitsUntilNextTier,
    source: config.source,
    effectiveFrom: config.effectiveFrom,
    version: config.version,
    notes: config.notes,
  };
}

export function findUpcomingTier(
  config: TariffConfigDto,
  currentTierIndex: number,
): Tier | null {
  return config.tiers.find((t) => t.index === currentTierIndex + 1) ?? null;
}

export const FALLBACK_ELECTRIC_TARIFF: TariffConfigDto = {
  metric: "electricity",
  plan: "residential",
  region: "VN",
  currency: "VND",
  unit: "kWh",
  tiers: [
    { index: 1, label: "Bậc 1 (0–50 kWh)", fromUnit: 0, toUnit: 50, pricePerUnitVnd: 1984 },
    { index: 2, label: "Bậc 2 (51–100 kWh)", fromUnit: 50, toUnit: 100, pricePerUnitVnd: 2050 },
    { index: 3, label: "Bậc 3 (101–200 kWh)", fromUnit: 100, toUnit: 200, pricePerUnitVnd: 2380 },
    { index: 4, label: "Bậc 4 (201–300 kWh)", fromUnit: 200, toUnit: 300, pricePerUnitVnd: 2998 },
    { index: 5, label: "Bậc 5 (301–400 kWh)", fromUnit: 300, toUnit: 400, pricePerUnitVnd: 3350 },
    { index: 6, label: "Bậc 6 (>400 kWh)", fromUnit: 400, toUnit: null, pricePerUnitVnd: 3460 },
  ],
  vatRate: 0.08,
  surchargeRate: 0,
  surchargeLabel: null,
  source: "Quyết định 2699/QĐ-BCT 2024 (offline fallback — không có kết nối BE)",
  effectiveFrom: "2024-10-11",
  version: "evn-residential-2024-10-fallback",
  notes: "Đang dùng giá offline. Khôi phục mạng để cập nhật giá mới nhất từ máy chủ.",
};

export const FALLBACK_WATER_TARIFF: TariffConfigDto = {
  metric: "water",
  plan: "residential",
  region: "HCM",
  currency: "VND",
  unit: "m3",
  tiers: [
    { index: 1, label: "Bậc 1 (0–4 m³)", fromUnit: 0, toUnit: 4, pricePerUnitVnd: 6300 },
    { index: 2, label: "Bậc 2 (5–6 m³)", fromUnit: 4, toUnit: 6, pricePerUnitVnd: 12200 },
    { index: 3, label: "Bậc 3 (7–10 m³)", fromUnit: 6, toUnit: 10, pricePerUnitVnd: 14400 },
    { index: 4, label: "Bậc 4 (>10 m³)", fromUnit: 10, toUnit: null, pricePerUnitVnd: 16500 },
  ],
  vatRate: 0.05,
  surchargeRate: 0.1,
  surchargeLabel: "Phí bảo vệ môi trường",
  source: "QĐ 25/2019/QĐ-UBND HCM — SAWACO (offline fallback)",
  effectiveFrom: "2022-01-01",
  version: "sawaco-residential-2022-fallback",
  notes: "Đang dùng giá offline. Khôi phục mạng để cập nhật giá mới nhất từ máy chủ.",
};
