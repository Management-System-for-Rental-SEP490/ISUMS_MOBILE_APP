import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";

export type TariffMetric = "electricity" | "water";

export type TariffTierDto = {
  index: number;
  label: string;
  fromUnit: number;
  toUnit: number | null;
  pricePerUnitVnd: number;
};

export type TariffConfigDto = {
  metric: string;
  plan: string;
  region: string;
  currency: string;
  unit: string;
  tiers: TariffTierDto[];
  vatRate: number;
  surchargeRate: number;
  surchargeLabel: string | null;
  source: string;
  effectiveFrom: string;
  version: string;
  notes: string | null;
};

type ApiResponse<T> = {
  data: T;
  message?: string;
  statusCode?: number;
};

export async function fetchElectricityTariff(): Promise<TariffConfigDto> {
  const res = await axiosClient.get<ApiResponse<TariffConfigDto>>(
    `${BACKEND_API_BASE}/payments/tariffs/electricity/residential`,
  );
  return res.data.data;
}

export async function fetchWaterTariff(region: string = "HCM"): Promise<TariffConfigDto> {
  const res = await axiosClient.get<ApiResponse<TariffConfigDto>>(
    `${BACKEND_API_BASE}/payments/tariffs/water/residential`,
    { params: { region } },
  );
  return res.data.data;
}
