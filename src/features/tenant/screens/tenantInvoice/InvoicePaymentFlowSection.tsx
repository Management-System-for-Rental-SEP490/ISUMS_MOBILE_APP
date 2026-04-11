import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { fetchTenantInvoiceDetail } from "../../../../shared/services/tenantInvoiceApi";
import type { InvoicePaymentAttemptFromApi } from "../../../../shared/types/api";
import {
  filterSuccessfulPayments,
  formatTenantInvoiceAmount,
} from "../../../../shared/utils/tenantInvoice";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import { brandSecondary } from "../../../../shared/theme/color";
import { tenantInvoiceStyles as styles } from "./tenantInvoiceStyles";

type Props = {
  invoiceId: string;
  /** Nút mở màn chi tiết đầy đủ (màn ticket). */
  detailCtaLabel?: string;
  onPressOpenDetail?: () => void;
  /** Ẩn tiêu đề block (khi đã có `TicketDetailSection` bao ngoài). */
  hideTitle?: boolean;
  /** Bỏ khối viền — nội dung nằm trong card cha. */
  unstyled?: boolean;
  /**
   * Màn chi tiết ticket: khi đã có giao dịch SUCCESS, hiển thị nội dung / số tiền / phương thức / thời gian
   * (thay cho một dòng tóm tắt).
   */
  showPaidLineItems?: boolean;
  /** Tiêu đề hóa đơn làm «nội dung thanh toán» — dùng cùng `showPaidLineItems`. */
  invoiceDisplayTitle?: string;
};

function resolvePaymentMethodLabel(m: string, t: (key: string) => string): string {
  const u = String(m || "").toUpperCase();
  const key = `tenant_invoice.payment_method_${u}`;
  const label = t(key);
  if (label !== key) return label;
  return String(m ?? "").trim() || "—";
}

export function InvoicePaymentFlowSection({
  invoiceId,
  detailCtaLabel,
  onPressOpenDetail,
  hideTitle = false,
  unstyled = false,
  showPaidLineItems = false,
  invoiceDisplayTitle,
}: Props) {
  const { t, i18n } = useTranslation();

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<InvoicePaymentAttemptFromApi[]>([]);

  const load = useCallback(async () => {
    const id = String(invoiceId ?? "").trim();
    if (!id) {
      setPayments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchTenantInvoiceDetail(id);
      setPayments(res?.payments ?? []);
    } catch (e) {
      console.warn("[ISUMS][invoice-payment-flow] Không tải được lịch sử thanh toán:", id, e);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const successfulPayments = useMemo(() => filterSuccessfulPayments(payments), [payments]);

  /** Các phương thức đã thành công — lọc trùng, giữ thứ tự. */
  const paymentMethodLabels = useMemo(() => {
    const resolve = (m: string) => {
      const u = String(m || "").toUpperCase();
      const key = `tenant_invoice.payment_method_${u}`;
      const label = t(key);
      if (label !== key) return label;
      return String(m ?? "").trim() || "—";
    };
    const out: string[] = [];
    const seen = new Set<string>();
    for (const p of successfulPayments) {
      const label = resolve(p.method);
      const k = label.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(label);
    }
    return out;
  }, [successfulPayments, t]);

  const methodBody =
    payments.length === 0
      ? t("tenant_invoice.payment_method_value_empty")
      : paymentMethodLabels.length === 0
        ? t("tenant_invoice.payment_method_value_pending")
        : paymentMethodLabels.join(" · ");

  const paidTitle = String(invoiceDisplayTitle ?? "").trim();
  const showPaidBreakdown =
    Boolean(showPaidLineItems && paidTitle && successfulPayments.length > 0);

  const successfulPaymentsNewestFirst = useMemo(
    () => [...successfulPayments].reverse(),
    [successfulPayments]
  );

  const shellStyle = unstyled ? undefined : styles.paymentFlowCard;

  const titleBlock =
    !hideTitle ? (
      <View style={styles.paymentFlowTitleRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.paymentFlowTitle}>{t("tenant_invoice.payment_method_section_title")}</Text>
      </View>
    ) : null;

  if (loading) {
    return (
      <View style={shellStyle}>
        {titleBlock}
        <ActivityIndicator size="small" color={brandSecondary} />
      </View>
    );
  }

  return (
    <View style={shellStyle}>
      {titleBlock}
      {showPaidBreakdown ? (
        <>
          <View style={{ marginBottom: 2 }}>
            <Text style={[styles.detailLabel, styles.detailLabelFirstInPaymentBreakdown]}>
              {t("tenant_ticket_detail.payment_content_label")}
            </Text>
            <Text style={styles.detailValue} selectable>
              {paidTitle}
            </Text>
          </View>
          {successfulPaymentsNewestFirst.map((p, idx) => {
            const paidRaw = p.paidAt ?? p.createdAt;
            const paidStr =
              paidRaw && String(paidRaw).trim()
                ? formatTenantIssueDateTime(String(paidRaw), locale)
                : "—";
            const amt = formatTenantInvoiceAmount(Number(p.amount ?? 0), "VND", locale, t);
            const method = resolvePaymentMethodLabel(p.method, t);
            return (
              <View key={p.id} style={styles.paymentAttemptRow}>
                {successfulPaymentsNewestFirst.length > 1 ? (
                  <Text style={styles.paymentAttemptPrimary}>
                    {t("tenant_ticket_detail.payment_record_index", { n: idx + 1 })}
                  </Text>
                ) : null}
                <Text style={styles.detailLabel}>{t("tenant_invoice.payment_detail_amount")}</Text>
                <Text style={styles.detailValue} selectable>
                  {amt}
                </Text>
                <Text style={styles.detailLabel}>{t("tenant_invoice.payment_detail_method")}</Text>
                <Text style={styles.detailValue} selectable>
                  {method}
                </Text>
                <Text style={styles.detailLabel}>
                  {t("tenant_ticket_detail.payment_paid_at_label")}
                </Text>
                <Text style={styles.detailValue} selectable>
                  {paidStr}
                </Text>
              </View>
            );
          })}
        </>
      ) : (
        <Text style={styles.paymentFlowSummaryLine}>{methodBody}</Text>
      )}
      {detailCtaLabel && onPressOpenDetail ? (
        <TouchableOpacity onPress={onPressOpenDetail} activeOpacity={0.85} style={{ marginTop: 12 }}>
          <Text style={styles.issueInvoiceNavHint}>{detailCtaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
