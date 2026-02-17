import React, { useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from "react-native";
import { useTranslation } from "react-i18next";
import Header from "../../shared/components/header";
import Icons from "../../shared/theme/icon";
import { notificationStyles } from "./notificationStyles";

/**
 * Loại thông báo: phiếu bảo trì hoặc cảnh báo AI (điện / nước).
 * Khi có API từ BE, có thể mở rộng thêm type và map từ response.
 */
export type NotificationType = "ticket" | "electric_anomaly" | "water_anomaly";

/**
 * Cấu trúc một thông báo (mock). Sau khi có API: thay bằng DTO từ BE,
 * có thể giữ type + title/body hoặc dùng messageKey + params để i18n.
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  /** Key i18n cho tiêu đề (ví dụ notification.msg_ticket_received_title) */
  titleKey: string;
  /** Key i18n cho nội dung (ví dụ notification.msg_ticket_received_body) */
  bodyKey: string;
  /** Tham số interpolation cho title/body (ví dụ { id: "T001" }, { percent: 40 }) */
  params?: Record<string, string | number>;
  /** Thời điểm tạo – dùng để hiển thị "X phút/giờ/ngày trước" */
  createdAt: Date;
  /** Đã đọc hay chưa – khi có API có thể sync với BE */
  read?: boolean;
}

/**
 * Mock danh sách thông báo: ticket (phiếu bảo trì) + cảnh báo điện/nước từ AI.
 * Khi có API: thay bằng dữ liệu từ endpoint, map về NotificationItem hoặc cấu trúc tương đương.
 */
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "ticket",
    titleKey: "notification.msg_ticket_received_title",
    bodyKey: "notification.msg_ticket_received_body",
    params: { id: "T001" },
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: "2",
    type: "electric_anomaly",
    titleKey: "notification.msg_electric_anomaly_title",
    bodyKey: "notification.msg_electric_anomaly_body",
    params: { percent: 40 },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: "3",
    type: "water_anomaly",
    titleKey: "notification.msg_water_anomaly_title",
    bodyKey: "notification.msg_water_anomaly_body",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "4",
    type: "ticket",
    titleKey: "notification.msg_ticket_done_title",
    bodyKey: "notification.msg_ticket_done_body",
    params: { id: "T002" },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: "5",
    type: "ticket",
    titleKey: "notification.msg_ticket_assigned_title",
    bodyKey: "notification.msg_ticket_assigned_body",
    params: { id: "T003" },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
  },
];

/**
 * Tính chuỗi "X phút/giờ/ngày trước" từ Date.
 * Dùng key i18n notification.time_minutes / time_hours / time_days với {{n}}.
 */
function formatTimeAgo(
  date: Date,
  t: (key: string, opts?: { n?: number }) => string
): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMins < 60) return t("notification.time_minutes", { n: diffMins || 1 });
  if (diffHours < 24) return t("notification.time_hours", { n: diffHours });
  return t("notification.time_days", { n: diffDays });
}

const NotificationScreen = () => {
  const { t } = useTranslation();

  /** Danh sách mock – khi có API thay bằng state từ hook/query */
  const notifications = useMemo(() => MOCK_NOTIFICATIONS, []);

  const renderItem: ListRenderItem<NotificationItem> = ({ item }) => {
    const title = t(item.titleKey, item.params as Record<string, string>);
    const body = t(item.bodyKey, item.params as Record<string, string>);
    const timeStr = formatTimeAgo(item.createdAt, t);

    let iconWrapperStyle = notificationStyles.iconWrapperTicket;
    let IconComponent = Icons.contract;
    let iconColor = "#0c6ab5";
    if (item.type === "electric_anomaly") {
      iconWrapperStyle = notificationStyles.iconWrapperElectric;
      IconComponent = Icons.electric;
      iconColor = "#2E7D32";
    } else if (item.type === "water_anomaly") {
      iconWrapperStyle = notificationStyles.iconWrapperWater;
      IconComponent = Icons.water;
      iconColor = "#00838F";
    }

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[
          notificationStyles.itemCard,
          !item.read && notificationStyles.itemCardUnread,
        ]}
      >
        <View style={[notificationStyles.iconWrapper, iconWrapperStyle]}>
          <IconComponent size={22} color={iconColor} />
        </View>
        <View style={notificationStyles.itemBody}>
          <Text style={notificationStyles.itemTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={notificationStyles.itemMessage} numberOfLines={3}>
            {body}
          </Text>
          <Text style={notificationStyles.itemTime}>{timeStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <Text style={notificationStyles.title}>
      {t("screens.notification")}
    </Text>
  );

  const listEmpty = (
    <View style={notificationStyles.emptyWrapper}>
      <Text style={notificationStyles.emptyText}>
        {t("notification.empty")}
      </Text>
    </View>
  );

  return (
    <View style={notificationStyles.container}>
      <Header variant="default" />
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={
          notifications.length === 0
            ? [notificationStyles.listContent, { flex: 1 }]
            : notificationStyles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default NotificationScreen;
