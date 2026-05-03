import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type {
  ApiResponse,
  ContractRelocationRequestFromApi,
  HouseFromApi,
  TenantEContractFromApi,
} from "../types/api";

/**
 * Danh sách hợp đồng điện tử của tenant đang đăng nhập (GET /api/econtracts/my, JWT bắt buộc).
 */
export const getMyEContracts = async (): Promise<TenantEContractFromApi[]> => {
  const url = `${BACKEND_API_BASE}/econtracts/my`;
  const response = await axiosClient.get<ApiResponse<TenantEContractFromApi[]>>(url);
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * URL ký sẵn S3 để xem PDF (GET /api/econtracts/:id/pdf). JWT bắt buộc; link thường hết hạn sau ~30 phút.
 */
export const getEContractPresignedPdfUrl = async (contractId: string): Promise<string> => {
  const id = String(contractId ?? "").trim();
  if (!id) {
    throw new Error("MISSING_CONTRACT_ID");
  }
  const url = `${BACKEND_API_BASE}/econtracts/${encodeURIComponent(id)}/pdf`;
  const response = await axiosClient.get<ApiResponse<string>>(url);
  if (response.data?.success && typeof response.data.data === "string") {
    const u = response.data.data.trim();
    if (u.length > 0) return u;
  }
  const msg =
    typeof response.data?.message === "string" && response.data.message.trim()
      ? response.data.message.trim()
      : "PDF_URL_EMPTY";
  throw new Error(msg);
};

export const createContractRelocationRequest = async (
  contractId: string,
  payload: {
    requestedHouseId: string;
    reason: string;
    activeLease?: boolean;
    desiredMoveDate?: string | null;
    occupantCount?: number | null;
  }
): Promise<ContractRelocationRequestFromApi> => {
  const id = String(contractId ?? "").trim();
  if (!id) throw new Error("MISSING_CONTRACT_ID");
  const url = `${BACKEND_API_BASE}/econtracts/${encodeURIComponent(id)}/relocation-requests`;
  const response = await axiosClient.post<ApiResponse<ContractRelocationRequestFromApi>>(url, {
    requestedHouseId: payload.requestedHouseId.trim(),
    reason: payload.reason.trim(),
    activeLease: payload.activeLease === true,
    desiredMoveDate: payload.desiredMoveDate ?? null,
    occupantCount: payload.occupantCount ?? null,
  });
  if (response.data?.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data?.message || "RELOCATION_REQUEST_FAILED");
};

export const getContractRelocationLink = async (
  contractId: string,
): Promise<ContractRelocationRequestFromApi | null> => {
  const id = String(contractId ?? "").trim();
  if (!id) return null;
  try {
    const response = await axiosClient.get<ApiResponse<ContractRelocationRequestFromApi | null>>(
      `${BACKEND_API_BASE}/econtracts/${encodeURIComponent(id)}/relocation-link`,
    );
    if (response.data?.success && response.data.data) {
      return response.data.data;
    }
    return null;
  } catch {
    return null;
  }
};

export const getMyContractRelocationRequests = async (): Promise<ContractRelocationRequestFromApi[]> => {
  const response = await axiosClient.get<ApiResponse<ContractRelocationRequestFromApi[]>>(
    `${BACKEND_API_BASE}/econtracts/relocation-requests/my`
  );
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

export const acceptContractRelocationQuote = async (
  requestId: string
): Promise<ContractRelocationRequestFromApi> => {
  const id = String(requestId ?? "").trim();
  if (!id) throw new Error("MISSING_RELOCATION_REQUEST_ID");
  const response = await axiosClient.post<ApiResponse<ContractRelocationRequestFromApi>>(
    `${BACKEND_API_BASE}/econtracts/relocation-requests/${encodeURIComponent(id)}/accept-quote`
  );
  if (response.data?.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data?.message || "RELOCATION_QUOTE_ACCEPT_FAILED");
};

/**
 * Tenant cancels their own relocation request. Allowed only when the request
 * is still REQUESTED or QUOTED (BE-enforced). Once the manager creates the
 * replacement contract, cancellation must go through manager-side flow.
 */
export const cancelContractRelocationRequest = async (
  requestId: string
): Promise<ContractRelocationRequestFromApi> => {
  const id = String(requestId ?? "").trim();
  if (!id) throw new Error("MISSING_RELOCATION_REQUEST_ID");
  const response = await axiosClient.post<ApiResponse<ContractRelocationRequestFromApi>>(
    `${BACKEND_API_BASE}/econtracts/relocation-requests/${encodeURIComponent(id)}/cancel`
  );
  if (response.data?.success && response.data.data) {
    return response.data.data;
  }
  throw new Error(response.data?.message || "RELOCATION_CANCEL_FAILED");
};

export const getRelocationCandidateHouses = async (): Promise<HouseFromApi[]> => {
  const response = await axiosClient.get<ApiResponse<HouseFromApi[]>>(
    `${BACKEND_API_BASE}/houses`,
    {
      params: {
        page: 1,
        size: 100,
        status: "AVAILABLE",
      },
    }
  );
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * Houses currently rented but eligible for deposit-booking: active contract
 * ending within 30 days, tenant didn't renew, no relocation in flight.
 * The new tenant deposits early and waits for the current tenant to vacate.
 *
 * BE: GET /api/econtracts/marketplace/deposit-bookable-houses (Tenant/Manager/Landlord).
 */
export interface DepositBookableHouseFromApi {
  houseId: string;
  houseName: string;
  houseAddress: string;
  city?: string;
  commune?: string;
  ward?: string;
  /** Earliest physical handover date (= contract endAt + handover buffer). */
  availableFrom: string;
  /** Current contract end date. */
  currentContractEndAt: string;
}

export const getDepositBookableHouses = async (): Promise<DepositBookableHouseFromApi[]> => {
  const response = await axiosClient.get<ApiResponse<DepositBookableHouseFromApi[]>>(
    `${BACKEND_API_BASE}/econtracts/marketplace/deposit-bookable-houses`,
  );
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};

/**
 * Full marketplace listing for relocation: AVAILABLE houses (immediate
 * handover) + DEPOSIT_BOOKABLE houses (reserve now, wait for current tenant
 * to vacate). Each row carries an {@code availability} flag so the UI can
 * differentiate the two with a badge and auto-fill {@code desiredMoveDate}
 * for deposit-booked entries.
 */
export const getMarketplaceHouses = async (): Promise<HouseFromApi[]> => {
  const [availableRows, bookableRows] = await Promise.all([
    getRelocationCandidateHouses(),
    getDepositBookableHouses(),
  ]);

  const merged: HouseFromApi[] = availableRows.map((h) => ({
    ...h,
    availability: "AVAILABLE",
    availableFrom: null,
    currentContractEndAt: null,
  }));

  const seenIds = new Set(merged.map((h) => String(h.id ?? "")));
  for (const b of bookableRows) {
    if (seenIds.has(b.houseId)) continue;
    merged.push({
      id: b.houseId,
      userRentalId: null,
      name: b.houseName,
      address: b.houseAddress,
      ward: b.ward,
      commune: b.commune,
      city: b.city,
      availability: "DEPOSIT_BOOKABLE",
      availableFrom: b.availableFrom,
      currentContractEndAt: b.currentContractEndAt,
    });
    seenIds.add(b.houseId);
  }

  return merged;
};
