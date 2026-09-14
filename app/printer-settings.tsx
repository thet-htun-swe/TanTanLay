import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { ActionButtons } from "@/components/common/ActionButtons";
import { ScreenHeader } from "@/components/common/ScreenHeader";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  getBondedBluetoothDevices,
  openSystemBluetoothSettings,
  printBluetoothTestReceipt,
  type BluetoothDeviceInfo,
} from "@/services/bluetoothPrinter";
import { getPrinterSettings, savePrinterSettings } from "@/services/database";
import { printWifiTestReceipt } from "@/services/thermalPrinter";
import { PrinterSettings } from "@/types";

export default function PrinterSettingsScreen() {
  const [savedPrinter, setSavedPrinter] = useState<PrinterSettings | null>(null);
  const [wifiHost, setWifiHost] = useState("");
  const [wifiPort, setWifiPort] = useState("9100");
  const [devices, setDevices] = useState<BluetoothDeviceInfo[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    getPrinterSettings()
      .then((settings) => {
        setSavedPrinter(settings);
        if (settings?.connectionType === "wifi") {
          setWifiHost(settings.host);
          setWifiPort(String(settings.port));
        }
      })
      .catch((error) => console.warn("Failed to load printer settings:", error));
  }, []);

  const saveWifiPrinter = async () => {
    const settings: PrinterSettings = {
      connectionType: "wifi",
      host: wifiHost,
      port: Number(wifiPort),
    };

    try {
      await savePrinterSettings(settings);
      setSavedPrinter({ ...settings, host: settings.host.trim() });
      Alert.alert("Printer saved", "Wi-Fi printer selected");
    } catch (error) {
      Alert.alert("Printer setup", error instanceof Error ? error.message : "Could not save printer");
    }
  };

  const loadBluetoothDevices = async () => {
    setIsLoadingDevices(true);
    try {
      setDevices(await getBondedBluetoothDevices());
    } catch (error) {
      Alert.alert("Bluetooth", error instanceof Error ? error.message : "Could not load paired devices");
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const selectBluetoothPrinter = async (device: BluetoothDeviceInfo) => {
    const settings: PrinterSettings = {
      connectionType: "bluetooth",
      address: device.address,
      name: device.name,
    };

    try {
      await savePrinterSettings(settings);
      setSavedPrinter(settings);
      Alert.alert("Printer saved", `${device.name} selected`);
    } catch (error) {
      Alert.alert("Printer setup", error instanceof Error ? error.message : "Could not save printer");
    }
  };

  const testPrint = async () => {
    if (!savedPrinter) {
      Alert.alert("Printer setup", "Save a printer before running a test print.");
      return;
    }

    setIsTesting(true);
    try {
      if (savedPrinter.connectionType === "bluetooth") {
        await printBluetoothTestReceipt(savedPrinter);
      } else {
        await printWifiTestReceipt(savedPrinter);
      }
      Alert.alert("Printer test", "Test receipt sent");
    } catch (error) {
      Alert.alert("Printer test failed", error instanceof Error ? error.message : "Could not reach printer");
    } finally {
      setIsTesting(false);
    }
  };

  const currentPrinter = savedPrinter
    ? savedPrinter.connectionType === "bluetooth"
      ? `${savedPrinter.name} (${savedPrinter.address})`
      : `${savedPrinter.host}:${savedPrinter.port}`
    : "No printer selected";
  const classicDevices = devices.filter((device) => device.type !== "LOW_ENERGY");

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader
        title="Printer connections"
        subtitle="Select one printer for sales-history receipts"
        rightComponent={
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText style={styles.back}>Back</ThemedText>
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Card style={styles.currentCard}>
          <ThemedText style={styles.currentLabel}>Current printer</ThemedText>
          <ThemedText style={styles.currentValue}>{currentPrinter}</ThemedText>
        </Card>

        <ThemedText style={styles.sectionTitle}>Bluetooth printer</ThemedText>
        <ThemedText style={styles.hint}>
          Pair the printer in Android Bluetooth settings first, then refresh this list and select it.
        </ThemedText>
        {Platform.OS === "android" ? (
          <>
            <ActionButtons
              buttons={[
                { title: "Android Bluetooth settings", onPress: openSystemBluetoothSettings, variant: "secondary" },
                { title: isLoadingDevices ? "Refreshing..." : "Refresh paired devices", onPress: loadBluetoothDevices, disabled: isLoadingDevices },
              ]}
              direction="column"
            />
            {classicDevices.map((device) => {
              const selected = savedPrinter?.connectionType === "bluetooth" && savedPrinter.address === device.address;
              return (
                <TouchableOpacity key={device.address} onPress={() => selectBluetoothPrinter(device)}>
                  <Card
                    style={selected ? { ...styles.deviceCard, ...styles.selectedDevice } : styles.deviceCard}
                  >
                    <ThemedText style={styles.deviceName}>{device.name}</ThemedText>
                    <ThemedText style={styles.deviceAddress}>{device.address}</ThemedText>
                    {selected && <ThemedText style={styles.selectedText}>Selected printer</ThemedText>}
                  </Card>
                </TouchableOpacity>
              );
            })}
            {!isLoadingDevices && classicDevices.length === 0 && (
              <ThemedText style={styles.emptyText}>
                No paired Bluetooth Classic printers found. Pair the printer in Android settings, then refresh.
              </ThemedText>
            )}
          </>
        ) : (
          <ThemedText style={styles.emptyText}>
            Bluetooth printer selection is supported on Android. iOS requires the printer's MFi protocol.
          </ThemedText>
        )}

        <ThemedText style={styles.sectionTitle}>Wi-Fi printer</ThemedText>
        <ThemedText style={styles.hint}>
          Use this for ESC/POS printers on the same network. Port 9100 is the usual default.
        </ThemedText>
        <Input
          label="Printer IP address"
          value={wifiHost}
          onChangeText={setWifiHost}
          placeholder="192.168.1.100"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Input
          label="Port"
          value={wifiPort}
          onChangeText={setWifiPort}
          placeholder="9100"
          keyboardType="number-pad"
          containerStyle={styles.portInput}
        />
        <ActionButtons
          buttons={[{ title: "Save Wi-Fi printer", onPress: saveWifiPrinter, variant: "secondary" }]}
          direction="column"
        />

        <ActionButtons
          buttons={[{ title: isTesting ? "Printing..." : "Test selected printer", onPress: testPrint, disabled: !savedPrinter || isTesting }]}
          direction="column"
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  content: {
    paddingBottom: 32,
  },
  back: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
  currentCard: {
    marginTop: 0,
    marginBottom: 20,
  },
  currentLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  currentValue: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 12,
  },
  deviceCard: {
    marginVertical: 4,
  },
  selectedDevice: {
    borderWidth: 1,
    borderColor: "#0a7ea4",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "700",
  },
  deviceAddress: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 2,
  },
  selectedText: {
    color: "#0a7ea4",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    marginVertical: 8,
  },
  portInput: {
    marginTop: 12,
  },
});
