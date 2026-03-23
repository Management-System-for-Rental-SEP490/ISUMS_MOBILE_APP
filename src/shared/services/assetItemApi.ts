/**
 * API thiết bị (asset items) cho app người thuê — chỉ đọc (GET).
 */
import axiosClient from "../api/axiosClient";
import { ASSETS_API_BASE, BACKEND_API_BASE} from "../api/config";
import {
  normalizeAssetItemStatusFromApi,
  type ApiResponse,
  type AssetItemFromApi,
  type AssetItemsApiResponse,
  type AssetItemsParams,
  type GetAssetByTagValueApiResponse,
  type IotDevicesByHouseApiResponse,
} from "../types/api";

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
  if (!tags?.length) return null;
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
    nfcTag: nfcStr !== "" ? nfcStr : null,
    qrTag: qrStr !== "" ? qrStr : null,
    status: normalizeAssetItemStatusFromApi(raw.status),
    functionAreaId:
      functionAreaId != null && String(functionAreaId).trim() !== ""
        ? String(functionAreaId).trim()
        : null,
  };
}

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
    ? `${ASSETS_API_BASE}/assets/items?${query}`
    : `${ASSETS_API_BASE}/assets/items`;

  const response = await axiosClient.get<AssetItemsApiResponse>(url);
  const data = response.data;
  if (Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map((i) =>
        normalizeAssetItemFromResponse(i as AssetItemFromApi & { nfc_tag?: string | null; qr_tag?: string | null })
      ),
    };
  }
  return data;
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
  const response = await axiosClient.get<AssetItemsApiResponse>(
    `${ASSETS_API_BASE}/assets/items/house/${encodeURIComponent(houseId)}`
  );
  const data = response.data;
  if (Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map((i) =>
        normalizeAssetItemFromResponse(i as AssetItemFromApi & { nfc_tag?: string | null; qr_tag?: string | null })
      ),
    };
  }
  return data;
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
  return response.data;
};

/**
 * Lấy chi tiết thiết bị theo ID (GET /api/assets/items/:id).
 * Dùng path /assets/... thống nhất với GET /api/assets/items/house/:houseId.
 */
export const getAssetItemById = async (id: string): Promise<AssetItemFromApi | undefined> => {
  try {
    const response = await axiosClient.get<ApiResponse<AssetItemFromApi> | AssetItemFromApi>(
      `${ASSETS_API_BASE}/assets/items/${id}`
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
    return normalizeAssetItemFromResponse(raw);
  } catch {
    return undefined;
  }
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
      `${ASSETS_API_BASE}/assets/tags/asset/${encodeURIComponent(apiTagValue)}`
    );

    const responseData = response.data.data;

    let raw: AssetItemFromApi | undefined;

    if (Array.isArray(responseData)) {
      raw = responseData[0];
    } else if (responseData && typeof responseData === "object") {
      raw = responseData as AssetItemFromApi;
    }

    if (!raw) return undefined;

    return normalizeAssetItemFromResponse(
      raw as AssetItemFromApi & {
        nfc_tag?: string | null;
        qr_tag?: string | null;
        function_area_id?: string | null;
        functionalAreaId?: string | null;
        functional_area_id?: string | null;
      }
    );
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
        return item.tags?.some(
          (t) => t.isActive !== false && tagMatchesScanned(t.tagValue)
        );
      });
      return found
        ? normalizeAssetItemFromResponse(
            found as AssetItemFromApi & {
              nfc_tag?: string | null;
              qr_tag?: string | null;
              function_area_id?: string | null;
            }
          )
        : undefined;
    } catch {
      return undefined;
    }
  }
};

/** Alias: quét NFC thường dùng cùng endpoint tra cứu theo tag. */
export const getAssetItemByNfcId = getAssetItemByTag;
