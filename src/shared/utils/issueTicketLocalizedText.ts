import type { IssueTicketResponseFromApi, TenantTicketFromApi } from "../types/api";
import {
  mergeTranslationMapsFromApi,
  resolveLocalizedApiFieldFromI18n,
  resolveLocalizedJsonStringFromI18n,
} from "./resolveLocalizedJsonString";

/**
 * Ticket QUESTION + phản hồi: BE trả bản dịch (JSON `{"vi","en","ja"}`, object, hoặc kèm *Translations).
 * Chọn theo locale app — cùng chuỗi util với asset/house.
 */

function stringOrObjectToTranslationMap(
  field: unknown
): Record<string, string> | undefined {
  if (field == null) return undefined;
  if (typeof field === "string") return undefined;
  if (typeof field === "object" && !Array.isArray(field)) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(field as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim() !== "") out[k] = v.trim();
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return undefined;
}

function canonicalEnglishFromMaybeLocalizedField(field: unknown): string {
  if (field == null) return "";
  if (typeof field === "string") return field.trim();
  if (typeof field === "object" && !Array.isArray(field)) {
    const o = field as Record<string, unknown>;
    const en = o.en;
    if (typeof en === "string" && en.trim() !== "") return en.trim();
  }
  return String(field ?? "").trim();
}

function pickRaw(record: unknown, key: string): unknown {
  if (record == null || typeof record !== "object" || Array.isArray(record)) return undefined;
  return (record as Record<string, unknown>)[key];
}

function resolveLocalizedTextField(
  value: unknown,
  ...translationSources: (Record<string, unknown> | null | undefined)[]
): string {
  const objectMap = stringOrObjectToTranslationMap(value);
  const map = mergeTranslationMapsFromApi(objectMap, ...translationSources);
  if (map && Object.keys(map).length > 0) {
    const defaultForResolve =
      typeof value === "string" ? value : canonicalEnglishFromMaybeLocalizedField(value) || null;
    return resolveLocalizedApiFieldFromI18n(defaultForResolve, map);
  }
  if (typeof value === "string") {
    return resolveLocalizedJsonStringFromI18n(value);
  }
  if (value == null) return "";
  if (typeof value === "object" && !Array.isArray(value)) {
    return resolveLocalizedJsonStringFromI18n(JSON.stringify(value));
  }
  return resolveLocalizedJsonStringFromI18n(String(value));
}

/** Tiêu đề ticket (REPAIR/QUESTION): ưu tiên bản theo locale thiết bị. */
export function getTenantTicketTitleForUi(ticket: TenantTicketFromApi): string {
  const raw = pickRaw(ticket, "title");
  return resolveLocalizedTextField(
    raw,
    pickRaw(ticket, "titleTranslations") as Record<string, unknown> | undefined,
    pickRaw(ticket, "title_translations") as Record<string, unknown> | undefined
  );
}

/** Mô tả ticket. */
export function getTenantTicketDescriptionForUi(ticket: TenantTicketFromApi): string {
  const raw = pickRaw(ticket, "description");
  return resolveLocalizedTextField(
    raw,
    pickRaw(ticket, "descriptionTranslations") as Record<string, unknown> | undefined,
    pickRaw(ticket, "description_translations") as Record<string, unknown> | undefined
  );
}

/** Nội dung phản hồi staff cho ticket (thường dùng với type QUESTION). */
export function getIssueResponseContentForUi(
  response: IssueTicketResponseFromApi
): string {
  const raw = pickRaw(response, "content");
  return resolveLocalizedTextField(
    raw,
    pickRaw(response, "contentTranslations") as Record<string, unknown> | undefined,
    pickRaw(response, "content_translations") as Record<string, unknown> | undefined
  );
}
