/**
 * API thiết bị (asset items) cho app người thuê — chỉ đọc (GET).
 */
import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE, BACKEND_API_BASE} from "../api/config";
import { resolveLocalizedJsonStringFromI18n } from "../utils/resolveLocalizedJsonString";
import {
  isAssetItemDisposedStatus,
  normalizeAssetItemStatusFromApi,
  type ApiResponse,
  type AssetItemFromApi,
  type AssetItemImageFromApi,
  type AssetItemsApiResponse,
  type AssetItemsParams,
  type GetAssetByTagValueApiResponse,
  type IotControllerHouseDataFromApi,
  type IotDevicesByHouseApiResponse,
} from "../types/api";

export type { AssetItemImageFromApi };

/**
 * Chuẩn hóa tagValue trước khi gửi lên BE.
 * - Giữ nguyên cấu trúc có khoảng trắng giữa các byte (\"04 9C 59 A2 ...\")
 * - Chỉ trim hai đầu, KHÔNG xóa khoảng trắng, KHÔNG tự ý đổi format.
 * Lý do: BE chấp nhận ID thẻ NFC với hoặc không với khoảng trắng, và logic so khớp nằm phía BE.
 */
const normalizeTagValueForApi = (raw: string) => raw.trim();

/**
 * Chuẩn hóa tagValue để so sánh trên FE (fallback).
 * - Bỏ hết khoảng trắng và chuyển sang UPPERCASE.
 * - Dùng khi cần so sánh hai mã NFC bất kể đang được lưu dính liền hay có khoảng trắng.
 */
const normalizeTagValueForCompare = (raw: string) =>
  raw.replace(/\s+/g, "").toUpperCase();

function pickActiveTagValueFromTags(
  tags: AssetItemFromApi["tags"],
  tagType: "NFC" | "QR_CODE"
): string | null {
  if (!Array.isArray(tags) || tags.length === 0) return null;
  for (const t of tags) {
    if (t.tagType !== tagType) continue;
    if (t.isActive === false) continue;
    const v = t.tagValue;
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return null;
}

/**
 * Chuẩn hóa một item từ BE: đảm bảo nfcTag, qrTag có giá trị dù BE trả về camelCase hay snake_case.
 * API GET /api/assets/items/house/:houseId đã được cập nhật trả về đầy đủ nfcTag, qrTag;
 * nếu BE trả snake_case (nfc_tag, qr_tag) thì map sang camelCase để màn danh sách & chi tiết hiển thị đúng.
 */
function normalizeAssetItemFromResponse(
  raw: AssetItemFromApi & {
    nfc_tag?: string | null;
    qr_tag?: string | null;
    function_area_id?: string | null;
    functionalAreaId?: string | null;
    functional_area_id?: string | null;
  }
): AssetItemFromApi {
  const nfc = raw.nfcTag ?? raw.nfc_tag ?? null;
  const qr = raw.qrTag ?? raw.qr_tag ?? null;
  let nfcStr = nfc != null ? String(nfc).trim() : "";
  let qrStr = qr != null ? String(qr).trim() : "";
  const fromTagsNfc = pickActiveTagValueFromTags(raw.tags, "NFC");
  const fromTagsQr = pickActiveTagValueFromTags(raw.tags, "QR_CODE");
  if (!nfcStr && fromTagsNfc) nfcStr = fromTagsNfc;
  if (!qrStr && fromTagsQr) qrStr = fromTagsQr;
  const functionAreaId =
    raw.functionAreaId ??
    raw.functionalAreaId ??
    raw.function_area_id ??
    raw.functional_area_id ??
    null;
  return {
    ...raw,
    displayName: resolveLocalizedJsonStringFromI18n(raw.displayName),
    nfcTag: nfcStr !== "" ? nfcStr : null,
    qrTag: qrStr !== "" ? qrStr : null,
    status: normalizeAssetItemStatusFromApi(raw.status),
    functionAreaId:
      functionAreaId != null && String(functionAreaId).trim() !== ""
        ? String(functionAreaId).trim()
        : null,
  };
}

function filterOutDisposedItems(items: AssetItemFromApi[]): AssetItemFromApi[] {
  return items.filter((i) => !isAssetItemDisposedStatus(i.status));
}

/**
 * BE có thể trả `data` là mảng hoặc gói paginated / lồng nhau.
 * Chuẩn hóa về mảng để hook/UI không gọi `.filter` trên non-array
 * (object truthy làm `?? []` không chạy → lỗi "filter is not a function").
 */
function coerceAssetItemsArray(raw: unknown): AssetItemFromApi[] {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) return raw as AssetItemFromApi[];
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const pick = (v: unknown) => (Array.isArray(v) ? (v as AssetItemFromApi[]) : null);
    for (const k of ["items", "results", "data", "content", "assetItems", "records", "value"] as const) {
      const arr = pick(o[k]);
      if (arr) return arr;
    }
    if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
      return coerceAssetItemsArray(o.data);
    }
    for (const v of Object.values(o)) {
      if (Array.isArray(v)) return v as AssetItemFromApi[];
    }
  }
  return [];
}

/**
 * Dùng tại màn/hook khi đọc `itemsData?.data` từ cache — luôn được mảng (có thể rỗng).
 */
export function asAssetItemArray(raw: unknown): AssetItemFromApi[] {
  return coerceAssetItemsArray(raw);
}

function assetItemsFromAxiosBody(
  body: unknown,
  finalize: (items: AssetItemFromApi[]) => AssetItemFromApi[]
): AssetItemsApiResponse {
  if (Array.isArray(body)) {
    const rawList = coerceAssetItemsArray(body);
    return { data: finalize(rawList as AssetItemFromApi[]) };
  }
  if (body && typeof body === "object" && "data" in body) {
    const envelope = body as AssetItemsApiResponse;
    const rawList = coerceAssetItemsArray(envelope.data);
    return {
      ...envelope,
      data: finalize(rawList as AssetItemFromApi[]),
    };
  }
  return { data: finalize([]) };
}

function normalizeIotControllerHouseData(
  data: IotControllerHouseDataFromApi
): IotControllerHouseDataFromApi {
  return {
    ...data,
    houseName: resolveLocalizedJsonStringFromI18n(data.houseName),
    areaName: data.areaName != null ? resolveLocalizedJsonStringFromI18n(data.areaName) : null,
    devices: (data.devices ?? []).map((d) => ({
      ...d,
      displayName: resolveLocalizedJsonStringFromI18n(d.displayName),
      areaName: d.areaName != null ? resolveLocalizedJsonStringFromI18n(d.areaName) : null,
    })),
  };
}

const mapNormalizeAssetItemRow = (i: AssetItemFromApi) =>
  normalizeAssetItemFromResponse(
    i as AssetItemFromApi & { nfc_tag?: string | null; qr_tag?: string | null }
  );

/**
 * Lấy danh sách thiết bị (GET /api/asset/items), có thể lọc theo houseId và/hoặc categoryId.
 * @param params - houseId, categoryId (optional); không truyền = lấy tất cả.
 * @returns Promise<AssetItemsApiResponse> - data là mảng AssetItemFromApi.
 */
export const getAssetItems = async (
  params?: AssetItemsParams
): Promise<AssetItemsApiResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.houseId) searchParams.set("houseId", params.houseId);
  if (params?.categoryId) searchParams.set("categoryId", params.categoryId);
  if (params?.nfcId) searchParams.set("nfcId", params.nfcId);

  const query = searchParams.toString();
  const url = query
    ? `${BACKEND_API_BASE}/assets/items?${query}`
    : `${BACKEND_API_BASE}/assets/items`;

  const response = await axiosClient.get<unknown>(url);
  return assetItemsFromAxiosBody(response.data, (items) =>
    filterOutDisposedItems(items.map(mapNormalizeAssetItemRow))
  );
};

/**
 * Lấy danh sách thiết bị theo houseId (GET /api/assets/items/house/:houseId).
 * Dùng cho tenant: lấy toàn bộ thiết bị thuộc nhà đang thuê.
 * BE đã cập nhật trả về đầy đủ từng item (gồm nfcTag, qrTag) để màn danh sách và chi tiết hiển thị đúng.
 * Response format { data: AssetItemFromApi[], message?, ... }; mảng data được chuẩn hóa (hỗ trợ cả snake_case từ BE).
 */
export const getAssetItemsByHouseId = async (
  houseId: string
): Promise<AssetItemsApiResponse> => {
  const response = await axiosClient.get<unknown>(
    `${BACKEND_API_BASE}/assets/items/house/${encodeURIComponent(houseId)}`
  );
  return assetItemsFromAxiosBody(response.data, (items) =>
    filterOutDisposedItems(items.map(mapNormalizeAssetItemRow))
  );
};

/**
 * Lấy IoT controller + danh sách node của một nhà.
 * GET /api/assets/iot-devices/house/{houseId} — cùng endpoint với app Staff.
 */
export const getIotDevicesByHouseId = async (
  houseId: string
): Promise<IotDevicesByHouseApiResponse> => {
  const url = `${BACKEND_API_BASE}/assets/iot-devices/house/${encodeURIComponent(houseId)}`;
  const response = await axiosClient.get<IotDevicesByHouseApiResponse>(url);
  const body = response.data;
  if (!body?.data || typeof body.data !== "object") return body;
  return {
    ...body,
    data: normalizeIotControllerHouseData(body.data),
  };
};

/**
 * Lấy chi tiết thiết bị theo ID (GET /api/assets/items/:id).
 * Dùng path /assets/... thống nhất với GET /api/assets/items/house/:houseId.
 */
export const getAssetItemById = async (id: string): Promise<AssetItemFromApi | undefined> => {
  try {
    const response = await axiosClient.get<ApiResponse<AssetItemFromApi> | AssetItemFromApi>(
      `${BACKEND_API_BASE}/assets/items/${id}`
    );
    const envelope = response.data as unknown;
    let rawUnknown: unknown;
    if (
      envelope &&
      typeof envelope === "object" &&
      "data" in envelope &&
      (envelope as { data: unknown }).data != null &&
      typeof (envelope as { data: unknown }).data === "object"
    ) {
      rawUnknown = (envelope as { data: AssetItemFromApi }).data;
    } else if (envelope && typeof envelope === "object" && "id" in (envelope as object)) {
      rawUnknown = envelope;
    } else {
      return undefined;
    }
    const raw = rawUnknown as AssetItemFromApi & {
      nfc_tag?: string | null;
      qr_tag?: string | null;
      function_area_id?: string | null;
      functionalAreaId?: string | null;
      functional_area_id?: string | null;
    };
    const normalized = normalizeAssetItemFromResponse(raw);
    if (isAssetItemDisposedStatus(normalized.status)) return undefined;
    return normalized;
  } catch {
    return undefined;
  }
};

/**
 * Lấy danh sách ảnh của asset item.
 * Endpoint: GET /api/assets/items/:id/images
 */
export const getAssetItemImages = async (itemId: string): Promise<AssetItemImageFromApi[]> => {
  if (!itemId?.trim()) return [];
  const url = `${BACKEND_API_BASE}/assets/items/${encodeURIComponent(itemId)}/images`;
  const response = await axiosClient.get<ApiResponse<AssetItemImageFromApi[]>>(url);
  if (response.data?.success && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
};


/**
 * Tra cứu thiết bị sau khi quét NFC hoặc QR (GET /api/assets/tags/asset/{tagValue}).
 */
export const getAssetItemByTag = async (
  tagValue: string
): Promise<AssetItemFromApi | undefined> => {
  const normalized = tagValue.trim();
  if (!normalized) return undefined;
  const apiTagValue = normalizeTagValueForApi(normalized);

  const tagMatchesScanned = (val: string | null | undefined) => {
    if (val == null || String(val).trim() === "") return false;
    return (
      normalizeTagValueForCompare(String(val)) === normalizeTagValueForCompare(apiTagValue)
    );
  };

  try {
    const response = await axiosClient.get<GetAssetByTagValueApiResponse>(
      `${BACKEND_API_BASE}/assets/tags/asset/${encodeURIComponent(apiTagValue)}`
    );

    const responseData = response.data.data;

    let raw: AssetItemFromApi | undefined;

    if (Array.isArray(responseData)) {
      raw = responseData[0];
    } else if (responseData && typeof responseData === "object") {
      raw = responseData as AssetItemFromApi;
    }

    if (!raw) return undefined;

    const normalized = normalizeAssetItemFromResponse(
      raw as AssetItemFromApi & {
        nfc_tag?: string | null;
        qr_tag?: string | null;
        function_area_id?: string | null;
        functionalAreaId?: string | null;
        functional_area_id?: string | null;
      }
    );
    if (isAssetItemDisposedStatus(normalized.status)) return undefined;
    return normalized;
  } catch {
    try {
      const res = await getAssetItems();
      const found = res.data.find((d) => {
        const item = normalizeAssetItemFromResponse(
          d as AssetItemFromApi & {
            nfc_tag?: string | null;
            qr_tag?: string | null;
            function_area_id?: string | null;
            functionalAreaId?: string | null;
            functional_area_id?: string | null;
          }
        );
        if (tagMatchesScanned(item.nfcTag) || tagMatchesScanned(item.qrTag)) return true;
        return (
          Array.isArray(item.tags) &&
          item.tags.some((t) => t.isActive !== false && tagMatchesScanned(t.tagValue))
        );
      });
      if (!found) return undefined;
      const normalized = normalizeAssetItemFromResponse(
        found as AssetItemFromApi & {
          nfc_tag?: string | null;
          qr_tag?: string | null;
          function_area_id?: string | null;
        }
      );
      if (isAssetItemDisposedStatus(normalized.status)) return undefined;
      return normalized;
    } catch {
      return undefined;
    }
  }
};

/** Alias: quét NFC thường dùng cùng endpoint tra cứu theo tag. */
export const getAssetItemByNfcId = getAssetItemByTag;
