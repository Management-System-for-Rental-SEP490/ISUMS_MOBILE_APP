import { Device } from "../types";

// Dữ liệu giả lập cho danh sách thiết bị
// Tuân thủ kiểu Device trong types/index.ts
export const mockDevices: Device[] = [
  {
    id: "dev-001",
    name: "Đồng hồ điện tòa A - phòng 101",
    type: "electric",
    nfcTagId: "04 9C 59 A2 B2 19 90",
    location: "Tầng 1 - Phòng 101",
    status: "active",
    metadata: {
      serialNumber: "SN-ELEC-2025-001",
      manufacturer: "Siemens",
      model: "SM-2025",
      installationDate: "2023-11-10",
    },
  },
  {
    id: "dev-002",
    name: "Đồng hồ nước tòa A - phòng 102",
    type: "water",
    nfcTagId: "1D 6C 7D 0E 09 10 80",
    location: "Tầng 1 - Phòng 102",
    status: "maintenance",
    metadata: {
      serialNumber: "SN-WATER-2025-002",
      manufacturer: "Kamstrup",
      model: "KM-2024",
      installationDate: "2022-08-06",
    },
  },
  {
    id: "dev-003",
    name: "Máy lạnh Panasonic",
    type: "other",
    nfcTagId: "AC-PANA-99",
    location: "Phòng ngủ",
    status: "active",
    metadata: {
      serialNumber: "PN-123456",
      manufacturer: "Panasonic",
      model: "Inverter 1.5HP",
      installationDate: "2023-05-15",
    },
  },
  {
    id: "dev-004",
    name: "Tủ lạnh Samsung",
    type: "other",
    nfcTagId: "REF-SAM-88",
    location: "Bếp",
    status: "active",
    metadata: {
      serialNumber: "SAM-REF-001",
      manufacturer: "Samsung",
      model: "Inverter 300L",
    },
  },
  {
    id: "dev-005",
    name: "Thiết bị NFC - NTAG213",
    type: "other",
    nfcTagId: "1D A3 8A 0E 09 10 80",
    location: "Chưa xác định",
    status: "pending",
    metadata: {
      serialNumber: "SN-NFC-2025-003",
      manufacturer: "NXP Semiconductors",
      model: "NTAG213",
      installationDate: new Date().toISOString().split("T")[0],
    },
  },
];

// Hàm lấy thiết bị theo NFC Tag ID
export const getDeviceByNfcTag = (nfcTagId: string): Device | undefined =>
  mockDevices.find((device) => device.nfcTagId === nfcTagId);

// Hàm lấy thiết bị theo ID
export const getDeviceById = (id: string): Device | undefined =>
  mockDevices.find((device) => device.id === id);

// Hàm lấy danh sách thiết bị của một ngôi nhà (giả lập)
// Input: houseId (string) - ID của ngôi nhà
// Output: Promise<Device[]> - Danh sách thiết bị
export const getHouseDevices = async (houseId: string): Promise<Device[]> => {
  // Giả lập độ trễ mạng 1 giây
  return new Promise((resolve) => setTimeout(() => resolve(mockDevices), 1000));
};
