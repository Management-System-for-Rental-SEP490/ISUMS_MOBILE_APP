import React, { useState } from "react";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../shared/types";
import { ticketStyles } from "../styles/ticketStyles";
import { useTranslation } from "react-i18next";

type TicketRouteProp = RouteProp<RootStackParamList, "Ticket">;
type TicketNavigationProp = NativeStackNavigationProp<RootStackParamList, "Ticket">;

const TicketScreen = () => {
    const { t } = useTranslation();
    const route = useRoute<TicketRouteProp>();
    const navigation = useNavigation<TicketNavigationProp>();
    const { device } = route.params;
    const insets = useSafeAreaInsets();

    // State để lưu thông tin form
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

    // Hàm xử lý khi người dùng gửi phiếu báo cáo
    const handleSubmit = () => {
        // Kiểm tra các trường bắt buộc
        if (!title.trim()) {
            Alert.alert(
                t('ticket.validation_error_title'),
                t('ticket.title_required')
            );
            return;
        }

        if (!description.trim()) {
            Alert.alert(
                t('ticket.validation_error_title'),
                t('ticket.description_required')
            );
            return;
        }

        // TODO: Gửi API request đến backend khi có API
        // Hiện tại chỉ hiển thị thông báo thành công
        Alert.alert(
            t('ticket.success_title'),
            t('ticket.success_message'),
            [
                {
                    text: t('common.close'),
                    onPress: () => navigation.goBack(),
                },
            ]
        );
    };

    return (
        <SafeAreaProvider style={ticketStyles.container}>
            <ScrollView 
                style={ticketStyles.content} 
                contentContainerStyle={[
                    ticketStyles.contentContainer,
                    { paddingBottom: Math.max(insets.bottom, 20) + 40 } // Thêm padding để tránh bị che bởi safe area
                ]}
            >
                {/* Header với nút quay lại */}
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={ticketStyles.backButton}
                >
                    <Text style={ticketStyles.backButtonText}>← {t('common.back')}</Text>
                </TouchableOpacity>

                {/* Tiêu đề màn hình */}
                <Text style={ticketStyles.title}>
                    {t('ticket.title')}
                </Text>

                {/* Thông tin thiết bị (chỉ hiển thị, không chỉnh sửa) */}
                <View style={ticketStyles.deviceInfoSection}>
                    <Text style={ticketStyles.sectionTitle}>
                        {t('ticket.device_info_title')}
                    </Text>
                    <View style={ticketStyles.deviceInfoCard}>
                        <Text style={ticketStyles.deviceInfoLabel}>
                            {t('device_detail.device_name')}
                        </Text>
                        <Text style={ticketStyles.deviceInfoValue}>{device.name}</Text>
                        
                        <Text style={ticketStyles.deviceInfoLabel}>
                            {t('device_detail.id')}
                        </Text>
                        <Text style={ticketStyles.deviceInfoValue}>{device.id}</Text>
                        
                        <Text style={ticketStyles.deviceInfoLabel}>
                            {t('device_detail.location')}
                        </Text>
                        <Text style={ticketStyles.deviceInfoValue}>{device.location}</Text>
                    </View>
                </View>

                {/* Form nhập thông tin báo cáo */}
                <View style={ticketStyles.formSection}>
                    {/* Trường tiêu đề */}
                    <View style={ticketStyles.inputGroup}>
                        <Text style={ticketStyles.label}>
                            {t('ticket.title_label')} <Text style={ticketStyles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={ticketStyles.input}
                            placeholder={t('ticket.title_placeholder')}
                            placeholderTextColor="#9ca3af"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    {/* Trường mô tả */}
                    <View style={ticketStyles.inputGroup}>
                        <Text style={ticketStyles.label}>
                            {t('ticket.description_label')} <Text style={ticketStyles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={[ticketStyles.input, ticketStyles.textArea]}
                            placeholder={t('ticket.description_placeholder')}
                            placeholderTextColor="#9ca3af"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                            maxLength={1000}
                        />
                    </View>

                    {/* Trường mức độ ưu tiên */}
                    <View style={ticketStyles.inputGroup}>
                        <Text style={ticketStyles.label}>
                            {t('ticket.priority_label')}
                        </Text>
                        <View style={ticketStyles.priorityContainer}>
                            <TouchableOpacity
                                style={[
                                    ticketStyles.priorityButton,
                                    priority === "low" && ticketStyles.priorityButtonActive
                                ]}
                                onPress={() => setPriority("low")}
                            >
                                <Text style={[
                                    ticketStyles.priorityButtonText,
                                    priority === "low" && ticketStyles.priorityButtonTextActive
                                ]}>
                                    {t('ticket.priority_low')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    ticketStyles.priorityButton,
                                    priority === "medium" && ticketStyles.priorityButtonActive
                                ]}
                                onPress={() => setPriority("medium")}
                            >
                                <Text style={[
                                    ticketStyles.priorityButtonText,
                                    priority === "medium" && ticketStyles.priorityButtonTextActive
                                ]}>
                                    {t('ticket.priority_medium')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    ticketStyles.priorityButton,
                                    priority === "high" && ticketStyles.priorityButtonActive
                                ]}
                                onPress={() => setPriority("high")}
                            >
                                <Text style={[
                                    ticketStyles.priorityButtonText,
                                    priority === "high" && ticketStyles.priorityButtonTextActive
                                ]}>
                                    {t('ticket.priority_high')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Nút gửi */}
                    <TouchableOpacity 
                        style={ticketStyles.submitButton}
                        onPress={handleSubmit}
                    >
                        <Text style={ticketStyles.submitButtonText}>
                            {t('ticket.submit_button')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaProvider>
    );
};

export default TicketScreen;
