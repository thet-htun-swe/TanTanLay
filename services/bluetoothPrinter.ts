import RNBluetoothClassic from "react-native-bluetooth-classic";
import { NativeModules, PermissionsAndroid, Platform } from "react-native";

import { BluetoothPrinterSettings, Sale } from "@/types";
import { rasterizeLine } from "@/services/textRaster";
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

// Cheap Bluetooth printers have small buffers and slow radios. write() only
// hands data to the phone's Bluetooth stack, so sending everything at once and
// disconnecting straight away can cut off the end of the receipt (e.g. TOTAL).
// Send small pieces with short pauses, then give the printer time to receive
// the rest before closing the connection.
const CHUNK_SIZE = 256;
const CHUNK_PAUSE_MS = 25;
const MIN_FINISH_WAIT_MS = 1500;
const BYTES_PER_SECOND = 5000; // slow printers; keeps the wait on the safe side

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toBinaryString = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");

const send = async (data: Uint8Array, printer: BluetoothPrinterSettings) => {
  requireBluetoothModule();
  const device = await RNBluetoothClassic.connectToDevice(printer.address);
  try {
    for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
      const chunk = data.subarray(offset, offset + CHUNK_SIZE);
      if (!(await device.write(toBinaryString(chunk), "binary"))) {
        throw new Error("Printer did not accept the receipt");
      }
      await wait(CHUNK_PAUSE_MS);
    }
    await wait(Math.max(MIN_FINISH_WAIT_MS, (data.length / BYTES_PER_SECOND) * 1000));
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
      await send(await buildSaleReceipt(sale, rasterizeLine), printer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown printer error";
      throw new Error(`Invoice #${sale.invoiceNumber ?? sale.id}: ${reason}`);
    }
  }
};

export const printBluetoothTestReceipt = (printer: BluetoothPrinterSettings) =>
  send(buildTestReceipt(), printer);
