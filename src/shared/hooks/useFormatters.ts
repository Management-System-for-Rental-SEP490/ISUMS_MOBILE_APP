import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  useBillsPreferences,
  useDisplayPreferences,
} from "./usePreferences";

const LOCALE_BY_LANG: Record<string, string> = {
  vi: "vi-VN",
  en: "en-US",
  ja: "ja-JP",
};

type RtfLang = "vi" | "en" | "ja";

function formatRelativeTimeFallback(diffMs: number, lang: RtfLang): string {
  const past = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const seconds = Math.round(absMs / 1000);
  const minutes = Math.round(absMs / 60000);
  const hours = Math.round(absMs / 3600000);
  const days = Math.round(absMs / 86400000);

  if (seconds < 60) {
    if (lang === "vi") return past ? "vừa xong" : "trong giây lát";
    if (lang === "ja") return past ? "たった今" : "まもなく";
    return past ? "just now" : "in a moment";
  }
  if (minutes < 60) {
    if (lang === "vi") return past ? `${minutes} phút trước` : `sau ${minutes} phút`;
    if (lang === "ja") return past ? `${minutes}分前` : `${minutes}分後`;
    return past
      ? `${minutes} minute${minutes === 1 ? "" : "s"} ago`
      : `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  }
  if (hours < 24) {
    if (lang === "vi") return past ? `${hours} giờ trước` : `sau ${hours} giờ`;
    if (lang === "ja") return past ? `${hours}時間前` : `${hours}時間後`;
    return past
      ? `${hours} hour${hours === 1 ? "" : "s"} ago`
      : `in ${hours} hour${hours === 1 ? "" : "s"}`;
  }
  if (lang === "vi") return past ? `${days} ngày trước` : `sau ${days} ngày`;
  if (lang === "ja") return past ? `${days}日前` : `${days}日後`;
  return past
    ? `${days} day${days === 1 ? "" : "s"} ago`
    : `in ${days} day${days === 1 ? "" : "s"}`;
}

export type Formatters = {
  number: (value: number, opts?: Intl.NumberFormatOptions) => string;
  decimal: (value: number, decimals?: number) => string;
  percent: (value: number, decimals?: number) => string;
  currency: (value: number) => string;
  unit: (value: number, unit: string, decimals?: number) => string;
  delta: (value: number, decimals?: number) => string;
  date: (value: string | number | Date, opts?: Intl.DateTimeFormatOptions) => string;
  time: (value: string | number | Date) => string;
  dateTime: (value: string | number | Date) => string;
  relativeTime: (from: string | number | Date) => string;
  weekday: (value: string | number | Date) => string;
  monthDay: (value: string | number | Date) => string;
  compactNumber: (value: number) => string;
  bytes: (value: number) => string;
  duration: (seconds: number) => string;
  locale: string;
  decimalPrecision: 0 | 1 | 2;
  use24Hour: boolean;
  currencyCode: string;
};

export function useFormatters(): Formatters {
  const { i18n } = useTranslation();
  const display = useDisplayPreferences();
  const bills = useBillsPreferences();

  const locale = LOCALE_BY_LANG[i18n.language] ?? "vi-VN";
  const decimalPrecision = display.decimalPrecision;
  const use24Hour = display.use24HourTime;
  const currencyCode = bills.currency;

  return useMemo(() => {
    const numberFormat = new Intl.NumberFormat(locale);
    const currencyFormat = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    });
    const decimalFormat = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPrecision,
      maximumFractionDigits: decimalPrecision,
    });
    const percentFormat = (decimals: number) =>
      new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    const compactFormat = new Intl.NumberFormat(locale, {
      notation: "compact",
      maximumFractionDigits: 1,
    });

    const toDate = (value: string | number | Date): Date => {
      if (value instanceof Date) return value;
      return new Date(value);
    };

    const number = (value: number, opts?: Intl.NumberFormatOptions) => {
      if (!Number.isFinite(value)) return "—";
      if (opts) return new Intl.NumberFormat(locale, opts).format(value);
      return numberFormat.format(value);
    };

    const decimal = (value: number, decimals?: number) => {
      if (!Number.isFinite(value)) return "—";
      const d = decimals ?? decimalPrecision;
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      }).format(value);
    };

    const percent = (value: number, decimals = 0) => {
      if (!Number.isFinite(value)) return "—";
      return percentFormat(decimals).format(value);
    };

    const currency = (value: number) => {
      if (!Number.isFinite(value)) return "—";
      return currencyFormat.format(value);
    };

    const unit = (value: number, u: string, decimals?: number) => {
      if (!Number.isFinite(value)) return `— ${u}`;
      return `${decimal(value, decimals)} ${u}`;
    };

    const delta = (value: number, decimals?: number) => {
      if (!Number.isFinite(value)) return "—";
      const sign = value > 0 ? "+" : value < 0 ? "−" : "";
      const absStr = decimal(Math.abs(value), decimals);
      return `${sign}${absStr}`;
    };

    const date = (value: string | number | Date, opts?: Intl.DateTimeFormatOptions) => {
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(
        locale,
        opts ?? { day: "2-digit", month: "2-digit", year: "numeric" },
      ).format(d);
    };

    const time = (value: string | number | Date) => {
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: !use24Hour,
      }).format(d);
    };

    const dateTime = (value: string | number | Date) => {
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: !use24Hour,
      }).format(d);
    };

    const relativeTime = (from: string | number | Date) => {
      const d = toDate(from);
      if (Number.isNaN(d.getTime())) return "—";
      const diffMs = d.getTime() - Date.now();
      const lang = locale.startsWith("vi") ? "vi" : locale.startsWith("ja") ? "ja" : "en";
      return formatRelativeTimeFallback(diffMs, lang);
    };

    const weekday = (value: string | number | Date) => {
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    };

    const monthDay = (value: string | number | Date) => {
      const d = toDate(value);
      if (Number.isNaN(d.getTime())) return "—";
      return new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
      }).format(d);
    };

    const compactNumber = (value: number) => {
      if (!Number.isFinite(value)) return "—";
      return compactFormat.format(value);
    };

    const bytes = (value: number) => {
      if (!Number.isFinite(value) || value < 0) return "—";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let n = value;
      let i = 0;
      while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
      }
      return `${decimal(n, 1)} ${units[i]}`;
    };

    const duration = (seconds: number) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "—";
      const s = Math.floor(seconds);
      const days = Math.floor(s / 86400);
      const hours = Math.floor((s % 86400) / 3600);
      const minutes = Math.floor((s % 3600) / 60);
      if (days > 0) return `${days}d ${hours}h`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      if (minutes > 0) return `${minutes}m`;
      return `${s}s`;
    };

    return {
      number,
      decimal,
      percent,
      currency,
      unit,
      delta,
      date,
      time,
      dateTime,
      relativeTime,
      weekday,
      monthDay,
      compactNumber,
      bytes,
      duration,
      locale,
      decimalPrecision,
      use24Hour,
      currencyCode,
    };
  }, [locale, decimalPrecision, use24Hour, currencyCode]);
}

export function useUnitFormatter() {
  const f = useFormatters();
  return useCallback(
    (value: number, unit: string, decimals?: number) =>
      f.unit(value, unit, decimals),
    [f],
  );
}
