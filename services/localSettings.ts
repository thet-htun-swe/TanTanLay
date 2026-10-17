import AsyncStorage from "@react-native-async-storage/async-storage";

import { PrinterSettings } from "@/types";
import { DEFAULT_PAPER_WIDTH, PaperWidth } from "@/utils/escPos";

// Settings that belong to this phone only (not shared through Supabase)

const PRINTER_SETTINGS_KEY = "printerSettings";
const PAPER_WIDTH_KEY = "receiptPaperWidth";

export const getPrinterSettings = async (): Promise<PrinterSettings | null> => {
  const stored = await AsyncStorage.getItem(PRINTER_SETTINGS_KEY);
  if (!stored) return null;

  try {
    const settings = JSON.parse(stored) as Partial<PrinterSettings>;
    if (settings.connectionType === "bluetooth" && settings.address) {
      return {
        connectionType: "bluetooth",
        address: settings.address,
        name: settings.name || settings.address,
      };
    }
    if (settings.connectionType === "wifi" && settings.host) {
      return {
        connectionType: "wifi",
        host: settings.host,
        port: Number(settings.port) || 9100,
      };
    }
  } catch (error) {
    console.warn("Saved printer settings are invalid:", error);
  }
  return null;
};

export const savePrinterSettings = async (settings: PrinterSettings): Promise<void> => {
  if (settings.connectionType === "wifi") {
    const host = settings.host.trim();
    if (!host) throw new Error("Enter the printer IP address");
    if (!Number.isInteger(settings.port) || settings.port < 1 || settings.port > 65535) {
      throw new Error("Printer port must be between 1 and 65535");
    }

    const wifi: PrinterSettings = { connectionType: "wifi", host, port: settings.port };
    await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(wifi));
    return;
  }

  if (!settings.address) throw new Error("Select a Bluetooth printer");
  const bluetooth: PrinterSettings = {
    connectionType: "bluetooth",
    address: settings.address,
    name: settings.name,
  };
  await AsyncStorage.setItem(PRINTER_SETTINGS_KEY, JSON.stringify(bluetooth));
};

// Receipt paper size (58 mm or 80 mm); 58 mm until changed
export const getPaperWidth = async (): Promise<PaperWidth> => {
  const stored = await AsyncStorage.getItem(PAPER_WIDTH_KEY);
  return stored === "80" ? 80 : stored === "58" ? 58 : DEFAULT_PAPER_WIDTH;
};

export const savePaperWidth = async (paperWidth: PaperWidth): Promise<void> => {
  await AsyncStorage.setItem(PAPER_WIDTH_KEY, String(paperWidth));
};
