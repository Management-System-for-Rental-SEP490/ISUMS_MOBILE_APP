import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../shared/types";
import deviceDetailStyles from "./deviceDetailStyles";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
type DeviceDetailRouteProp = RouteProp<RootStackParamList, "DeviceDetail">;
type DeviceDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeviceDetail">;

import { useTranslation } from "react-i18next";

const DeviceDetail = () => {
  const { t } = useTranslation();
  const route = useRoute<DeviceDetailRouteProp>();
  const navigation = useNavigation<DeviceDetailNavigationProp>();
  const { device } = route.params;
  const insets = useSafeAreaInsets();

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return t('device_detail.status_label.active');
      case "inactive": return t('device_detail.status_label.inactive');
      case "maintenance": return t('device_detail.status_label.maintenance');
      case "pending": return t('device_detail.status_label.pending');
      default: return status;
    }
  };

  const getDeviceTypeLabel = (type: string) => {
      switch(type) {
          case 'electric': return t('device_detail.type_label.electric');
          case 'water': return t('device_detail.type_label.water');
          case 'other': return t('device_detail.type_label.other');
          default: return type;
      }
  }

  return (
    <SafeAreaProvider style={deviceDetailStyles.background}>
      <ScrollView 
        style={deviceDetailStyles.content}
        contentContainerStyle={[
          deviceDetailStyles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 100 } // Thêm padding để tránh bị che bởi bottom navigation (khoảng 80px) + safe area
        ]}
      >
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={deviceDetailStyles.backButton}
        >
          <Text style={deviceDetailStyles.detailItemValueBold}>← {t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={deviceDetailStyles.title}>
          {t('device_detail.title')}
        </Text>


        <View style={deviceDetailStyles.deviceInfo}>
          <DetailItem label={t('device_detail.device_name')} value={device.name} />
          <DetailItem label={t('device_detail.id')} value={device.id} />
          <DetailItem label={t('device_detail.type')} value={getDeviceTypeLabel(device.type)} />
          <DetailItem label={t('device_detail.location')} value={device.location} />
          <DetailItem label={t('device_detail.status')} value={getStatusText(device.status)} />
          <DetailItem label={t('device_detail.nfc_tag_id')} value={device.nfcTagId} />
          {/* Nếu thiết bị có trường metadata (thông tin kỹ thuật bổ sung), thì mới hiển thị các thông tin sau: */}
          {device.metadata && ( 
            <>
              <Text style={deviceDetailStyles.TechnicalInfoTitle}>
                {t('device_detail.technical_info')}
              </Text>
              <DetailItem label={t('device_detail.serial_number')} value={device.metadata.serialNumber} />
              <DetailItem label={t('device_detail.manufacturer')} value={device.metadata.manufacturer} />
              <DetailItem label={t('device_detail.model')} value={device.metadata.model} />
              <DetailItem label={t('device_detail.installation_date')} value={device.metadata.installationDate} />
            </>
          )}
        </View>

        {/* Nút báo cáo sự cố - cho phép người dùng tạo phiếu báo cáo bảo trì */}
        <TouchableOpacity 
          style={deviceDetailStyles.reportButton}
          onPress={() => navigation.navigate('Ticket', { device })}
        >
          <Text style={deviceDetailStyles.reportButtonText}>
            {t('device_detail.report_button')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaProvider>
  );
};

const DetailItem = ({ label, value }: { label: string; value?: string }) => {
    const { t } = useTranslation();
    return (
    <View style={deviceDetailStyles.detailItem}>
        <Text style={deviceDetailStyles.detailItemLabel}>{label}</Text>
        <Text style={deviceDetailStyles.detailItemValue}>
        {value || <Text style={deviceDetailStyles.detailItemValueEmpty}>{t('common.no_data')}</Text>}
        </Text>
    </View>
    );
};

    // Xóa hàm getStatusText ở ngoài component vì cần dùng hook t
    // const getStatusText = ... 
    
export default DeviceDetail;
