import * as Sharing from "expo-sharing";
import { RefObject } from "react";
import { View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { Sale } from "@/types";

// Saves the on-screen receipt (components/sales/ReceiptView.tsx) as a PNG
// and opens the phone's share sheet (Viber, Messenger, Gallery, ...).
export const shareReceiptImage = async (
  receiptRef: RefObject<View | null>,
  sale: Sale & { id: number },
) => {
  if (!receiptRef.current) throw new Error("Receipt is not ready yet");
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing is not available on this device");
  }

  const uri = await captureRef(receiptRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    fileName: `receipt-${sale.invoiceNumber ?? sale.id}`,
  });

  await Sharing.shareAsync(uri, {
    mimeType: "image/png",
    dialogTitle: `Receipt #${sale.invoiceNumber ?? sale.id}`,
    UTI: "public.png",
  });
};
