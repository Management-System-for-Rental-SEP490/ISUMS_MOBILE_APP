import { useQuery } from "@tanstack/react-query";
import {
  fetchIotSafetyConfig,
  type IotSafetyConfigDto,
} from "../services/iotSafetyApi";
import { FALLBACK_SAFETY_CONFIG } from "../utils/iotSafety";

const SAFETY_CONFIG_KEY = ["iot", "safety-config"] as const;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export type UseIotSafetyConfigResult = {
  config: IotSafetyConfigDto;
  isFallback: boolean;
  loading: boolean;
  error: unknown;
};

export function useIotSafetyConfig(): UseIotSafetyConfigResult {
  const query = useQuery({
    queryKey: SAFETY_CONFIG_KEY,
    queryFn: fetchIotSafetyConfig,
    staleTime: ONE_HOUR,
    gcTime: ONE_DAY,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    config: query.data ?? FALLBACK_SAFETY_CONFIG,
    isFallback: !query.data,
    loading: query.isLoading,
    error: query.error,
  };
}
