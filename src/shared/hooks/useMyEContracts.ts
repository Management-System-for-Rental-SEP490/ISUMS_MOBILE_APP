import { useQuery } from "@tanstack/react-query";
import { getMyEContracts } from "../services/econtractApi";
import { useAuthStore } from "../../store/useAuthStore";

export const ECONTRACTS_QUERY_KEYS = {
  my: ["econtracts", "my"] as const,
};

/**
 * Hợp đồng điện tử của tenant (GET /api/econtracts/my).
 */
export const useMyEContracts = () => {
  const role = useAuthStore((s) => s.role);

  return useQuery({
    queryKey: ECONTRACTS_QUERY_KEYS.my,
    queryFn: getMyEContracts,
    enabled: role === "tenant",
  });
};
