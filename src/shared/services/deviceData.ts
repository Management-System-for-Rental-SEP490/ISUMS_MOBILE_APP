import { Device } from "../types";

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
    name: "Thiết bị NFC - NTAG213",
    type: "other",
    nfcTagId: "1D A3 8A 0E 09 10 80",
    location: "Chưa xác định",
    status: "active",
    metadata: {
      serialNumber: "SN-NFC-2025-003",
      manufacturer: "NXP Semiconductors",
      model: "NTAG213",
      installationDate: new Date().toISOString().split("T")[0],
    },
  },
];

export const getDeviceByNfcTag = (nfcTagId: string): Device | undefined =>
  mockDevices.find((device) => device.nfcTagId === nfcTagId);

export const getDeviceById = (id: string): Device | undefined =>
  mockDevices.find((device) => device.id === id);