import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { fetchTenantInvoiceDetail } from "../../../../shared/services/tenantInvoiceApi";
import type { InvoicePaymentAttemptFromApi } from "../../../../shared/types/api";
import { filterSuccessfulPayments } from "../../../../shared/utils/tenantInvoice";
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
};

export function InvoicePaymentFlowSection({
  invoiceId,
  detailCtaLabel,
  onPressOpenDetail,
  hideTitle = false,
  unstyled = false,
}: Props) {
  const { t } = useTranslation();
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
      <Text style={styles.paymentFlowSummaryLine}>{methodBody}</Text>
      {detailCtaLabel && onPressOpenDetail ? (
        <TouchableOpacity onPress={onPressOpenDetail} activeOpacity={0.85} style={{ marginTop: 12 }}>
          <Text style={styles.issueInvoiceNavHint}>{detailCtaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
