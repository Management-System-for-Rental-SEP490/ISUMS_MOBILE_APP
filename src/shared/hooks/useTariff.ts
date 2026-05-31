import { useQuery } from "@tanstack/react-query";
import {
  fetchElectricityTariff,
  fetchWaterTariff,
  type TariffConfigDto,
} from "../services/tariffApi";
import {
  FALLBACK_ELECTRIC_TARIFF,
  FALLBACK_WATER_TARIFF,
} from "../utils/evnTariff";

const TARIFF_QUERY_KEY = ["tariff"] as const;

const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export type UseTariffResult = {
  config: TariffConfigDto;
  isFallback: boolean;
  loading: boolean;
  error: unknown;
};

export function useElectricTariff(): UseTariffResult {
  const query = useQuery({
    queryKey: [...TARIFF_QUERY_KEY, "electricity"],
    queryFn: fetchElectricityTariff,
    staleTime: ONE_HOUR,
    gcTime: ONE_DAY,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    config: query.data ?? FALLBACK_ELECTRIC_TARIFF,
    isFallback: !query.data,
    loading: query.isLoading,
    error: query.error,
  };
}

export function useWaterTariff(region: string = "HCM"): UseTariffResult {
  const query = useQuery({
    queryKey: [...TARIFF_QUERY_KEY, "water", region],
    queryFn: () => fetchWaterTariff(region),
    staleTime: ONE_HOUR,
    gcTime: ONE_DAY,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    config: query.data ?? FALLBACK_WATER_TARIFF,
    isFallback: !query.data,
    loading: query.isLoading,
    error: query.error,
  };
}
