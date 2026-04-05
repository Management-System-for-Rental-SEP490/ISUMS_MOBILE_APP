/**
 * Hook chứa ngữ cảnh tenant: nhà đang thuê, các khu vực chức năng, thingId IoT.
 * thingId được lấy động từ API controller theo houseId, không set cứng.
 */
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useTenantHouses } from "./useHouses";
import { getIotControllerByHouse } from "../services/iotControllerApi";
import type { FunctionalAreaFromApi, HouseFromApi } from "../types/api";

export interface TenantContextValue {
  house: HouseFromApi | null;
  houseId: string | null;
  functionalAreas: FunctionalAreaFromApi[];
  thingId: string;
  isLoading: boolean;
}

export function useTenantContext(): TenantContextValue {
  const { houseId: authHouseId } = useAuthStore();
  const { data: housesData, isLoading } = useTenantHouses();

  const [thingId, setThingId] = useState<string>("");
  const [controllerLoading, setControllerLoading] = useState(false);

  const rawData = housesData?.data;
  const tenantHouses: HouseFromApi[] = Array.isArray(rawData)
    ? rawData
    : rawData && typeof rawData === "object"
      ? [rawData as HouseFromApi]
      : [];

  const house = useMemo<HouseFromApi | null>(() => {
    if (!tenantHouses.length) return null;

    if (authHouseId) {
      return tenantHouses.find((h) => h.id === authHouseId) ?? null;
    }

    if (tenantHouses.length === 1) return tenantHouses[0]!;
    return null;
  }, [tenantHouses, authHouseId]);

  const functionalAreas = useMemo<FunctionalAreaFromApi[]>(() => {
    const list = house?.functionalAreas ?? [];
    return Array.isArray(list) ? list : [];
  }, [house?.functionalAreas]);

  useEffect(() => {
    let cancelled = false;

    async function resolveControllerThing() {
      const currentHouseId = house?.id ?? null;

      if (!currentHouseId) {
        setThingId("");
        return;
      }

      setControllerLoading(true);
      try {
        const controller = await getIotControllerByHouse(currentHouseId);
        if (cancelled) return;

        const resolvedThing = controller?.thingName ?? "";
        console.log("[TenantContext] resolve controller", {
          houseId: currentHouseId,
          thingId: resolvedThing,
        });

        setThingId(resolvedThing);
      } finally {
        if (!cancelled) {
          setControllerLoading(false);
        }
      }
    }

    resolveControllerThing();

    return () => {
      cancelled = true;
    };
  }, [house?.id]);

  return {
    house,
    houseId: house?.id ?? null,
    functionalAreas,
    thingId,
    isLoading: isLoading || controllerLoading,
  };
}