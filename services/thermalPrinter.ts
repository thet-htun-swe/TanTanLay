import TcpSocket from "react-native-tcp-socket";

import { Sale, WifiPrinterSettings } from "@/types";
import { getPaperWidth } from "@/services/localSettings";
import { rasterizeLine } from "@/services/textRaster";
import { buildSaleReceipt, buildTestReceipt } from "@/utils/escPos";

const send = (data: Uint8Array, printer: WifiPrinterSettings) =>
  new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve();
    };

    const socket = TcpSocket.createConnection(
      { host: printer.host, port: printer.port, interface: "wifi", connectTimeout: 5000 },
      () => {
        socket.write(data, undefined, (error) => {
          socket.end();
          finish(error ?? undefined);
        });
      },
    );

    socket.setTimeout(5000, () => {
      socket.destroy();
      finish(new Error("Printer connection timed out"));
    });
    socket.on("error", (error) => finish(error));
  });

export const printWifiSales = async (
  sales: (Sale & { id: number })[],
  printer: WifiPrinterSettings,
) => {
  const paperWidth = await getPaperWidth();
  for (const sale of sales) {
    try {
      await send(await buildSaleReceipt(sale, rasterizeLine, paperWidth), printer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown printer error";
      throw new Error(`Invoice #${sale.invoiceNumber ?? sale.id}: ${reason}`);
    }
  }
};

export const printWifiTestReceipt = async (printer: WifiPrinterSettings) =>
  send(buildTestReceipt(await getPaperWidth()), printer);
