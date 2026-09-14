import RNBluetoothClassic from "react-native-bluetooth-classic";
import { NativeModules, PermissionsAndroid, Platform } from "react-native";

import { BluetoothPrinterSettings, Sale } from "@/types";
import { buildSaleReceipt, buildTestReceipt } from "@/utils/escPos";

export interface BluetoothDeviceInfo {
  address: string;
  name: string;
  type: string;
}

const requireAndroid = () => {
  if (Platform.OS !== "android") {
    throw new Error("Bluetooth printer selection is available on Android only");
  }
};

const requireBluetoothModule = () => {
  requireAndroid();
  if (!NativeModules.RNBluetoothClassic) {
    throw new Error("Bluetooth printing requires the latest EAS preview build. Expo Go cannot load this native module.");
  }
};

const requestBluetoothAccess = async () => {
  requireBluetoothModule();
  if (Number(Platform.Version) < 31) return;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    {
      title: "Bluetooth printer access",
      message: "Allow Clothing Sales to access paired Bluetooth printers.",
      buttonPositive: "Allow",
      buttonNegative: "Cancel",
    },
  );
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error("Bluetooth permission was not granted");
  }
};

export const getBondedBluetoothDevices = async (): Promise<BluetoothDeviceInfo[]> => {
  await requestBluetoothAccess();
  if (!(await RNBluetoothClassic.isBluetoothEnabled())) {
    const enabled = await RNBluetoothClassic.requestBluetoothEnabled();
    if (!enabled) throw new Error("Turn on Bluetooth to select a printer");
  }

  const devices = await RNBluetoothClassic.getBondedDevices();
  return devices.map((device) => ({
    address: device.address,
    name: device.name || device.address,
    type: device.type,
  }));
};

export const openSystemBluetoothSettings = async () => {
  requireBluetoothModule();
  RNBluetoothClassic.openBluetoothSettings();
};

const send = async (data: Uint8Array, printer: BluetoothPrinterSettings) => {
  requireBluetoothModule();
  const device = await RNBluetoothClassic.connectToDevice(printer.address);
  try {
    const binaryData = Array.from(data, (byte) => String.fromCharCode(byte)).join("");
    if (!(await device.write(binaryData, "binary"))) {
      throw new Error("Printer did not accept the receipt");
    }
  } finally {
    if (await device.isConnected()) await device.disconnect();
  }
};

export const printBluetoothSales = async (
  sales: (Sale & { id: number })[],
  printer: BluetoothPrinterSettings,
) => {
  for (const sale of sales) {
    try {
      await send(buildSaleReceipt(sale), printer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown printer error";
      throw new Error(`Invoice #${sale.invoiceNumber ?? sale.id}: ${reason}`);
    }
  }
};

export const printBluetoothTestReceipt = (printer: BluetoothPrinterSettings) =>
  send(buildTestReceipt(), printer);
