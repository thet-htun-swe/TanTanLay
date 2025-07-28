import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { utils as XLSXUtils, write as XLSXWrite } from "xlsx";
import { Sale } from "@/types";

export class ExportUtils {
  static formatDate(dateString: string): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  }

  static async generateExcel(sales: Sale[]): Promise<void> {
    try {
      // Create worksheet data
      const wsData = [
        ["Sale ID", "Date", "Customer", "Contact", "Items", "Total"],
      ];

      sales.forEach((sale) => {
        wsData.push([
          sale.id,
          this.formatDate(sale.date),
          sale.customer.name,
          sale.customer.contact,
          sale.items.length.toString(),
          sale.total.toFixed(2),
        ]);
      });

      // Create detailed items worksheet
      const itemsData = [
        [
          "Sale ID",
          "Date",
          "Customer",
          "Product",
          "Quantity",
          "Unit Price",
          "Line Total",
        ],
      ];

      sales.forEach((sale) => {
        sale.items.forEach((item) => {
          itemsData.push([
            sale.id,
            this.formatDate(sale.date),
            sale.customer.name,
            item.productName,
            item.quantity.toString(),
            item.unitPrice.toFixed(2),
            item.lineTotal.toFixed(2),
          ]);
        });
      });

      // Create workbook with multiple sheets
      const wb = XLSXUtils.book_new();
      const ws = XLSXUtils.aoa_to_sheet(wsData);
      const itemsWs = XLSXUtils.aoa_to_sheet(itemsData);

      XLSXUtils.book_append_sheet(wb, ws, "Sales Summary");
      XLSXUtils.book_append_sheet(wb, itemsWs, "Sales Items");

      // Generate Excel file
      const wbout = XLSXWrite(wb, { type: "base64", bookType: "xlsx" });

      // Define file path
      const fileName = `TanTanLay_Sales_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const fileUri = FileSystem.documentDirectory + fileName;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Share the file
      await Sharing.shareAsync(fileUri, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Sales Data",
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      throw new Error("Failed to generate Excel file");
    }
  }

  static async generateShippingLabels(sales: Sale[]): Promise<void> {
    try {
      if (sales.length === 0) {
        throw new Error("No sales to generate shipping labels for.");
      }

      // Create HTML content for shipping labels
      let htmlContent = this.generateShippingLabelsHTML(sales);

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // Share the PDF
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Shipping Labels",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error generating shipping labels:", error);
      throw new Error("Failed to generate shipping labels");
    }
  }

  private static generateShippingLabelsHTML(sales: Sale[]): string {
    const LABELS_PER_PAGE = 6;
    const totalSales = sales.length;
    const totalPages = Math.ceil(totalSales / LABELS_PER_PAGE);

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 15px;
            width: 100%;
            box-sizing: border-box;
          }
          .page {
            page-break-after: always;
            width: 100%;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .labels-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
            width: 100%;
          }
          .shipping-label {
            border: 1px solid #000;
            padding: 15px;
            width: calc(50% - 10px);
            height: 180px;
            position: relative;
            margin-bottom: 20px;
            box-sizing: border-box;
            break-inside: avoid;
          }
          .label-header {
            text-align: center;
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          .customer-info {
            margin-bottom: 10px;
            font-size: 14px;
          }
          .customer-name {
            font-weight: bold;
            font-size: 16px;
          }
          .customer-detail {
            margin: 5px 0;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .total {
            position: absolute;
            bottom: 15px;
            right: 15px;
            font-weight: bold;
            font-size: 16px;
            border-top: 1px solid #ccc;
            padding-top: 5px;
          }
          .date {
            position: absolute;
            bottom: 15px;
            left: 15px;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; padding: 10px; }
            .page { height: 100%; }
            .shipping-label { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
    `;

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      htmlContent += '<div class="page"><div class="labels-container">';

      const startIdx = pageIndex * LABELS_PER_PAGE;
      const endIdx = Math.min(startIdx + LABELS_PER_PAGE, totalSales);

      for (let i = startIdx; i < endIdx; i++) {
        const sale = sales[i];
        const saleDate = this.formatDate(sale.date);

        htmlContent += `
          <div class="shipping-label">
            <div class="label-header">Tan Tan Lay</div>
            <div class="customer-info">
              <div class="customer-name">${sale.customer.name}</div>
              <div class="customer-detail">${
                sale.customer.address || "No address provided"
              }</div>
              <div class="customer-detail">Contact: ${
                sale.customer.contact || "No contact provided"
              }</div>
            </div>
            <div class="total">Total: $${sale.total.toFixed(2)}</div>
            <div class="date">Order Date: ${saleDate}</div>
          </div>
        `;
      }

      htmlContent += "</div></div>";
    }

    htmlContent += `
      </body>
      </html>
    `;

    return htmlContent;
  }
}