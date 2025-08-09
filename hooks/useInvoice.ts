import { Sale } from "@/types";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Alert } from "react-native";

export const useInvoice = () => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const generateInvoiceHTML = (sale: Sale & { id: number }) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .customer-info, .invoice-info {
              width: 48%;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            .totals {
              width: 300px;
              margin-left: auto;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .grand-total {
              font-weight: bold;
              font-size: 18px;
              border-top: 2px solid #333;
              padding-top: 5px;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="invoice-title">INVOICE</div>
            <div>TantanLay Invoicing</div>
          </div>
          
          <div class="invoice-details">
            <div class="customer-info">
              <h3>Bill To:</h3>
              <div>${sale.customer.name}</div>
              <div>${sale.customer.contact || "No contact provided"}</div>
              <div>${sale.customer.address || "No address provided"}</div>
            </div>
            
            <div class="invoice-info">
              <h3>Invoice Details:</h3>
              <div>Invoice #: ${sale.invoiceNumber}</div>
              <div>Date: ${formatDate(sale.date)}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items
                .map((item) => {
                  return `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>${item.lineTotal.toFixed(2)}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row">
              <div>Subtotal:</div>
              <div>${sale.subtotal.toFixed(2)}</div>
            </div>
            <div class="total-row grand-total">
              <div>Total:</div>
              <div>${sale.total.toFixed(2)}</div>
            </div>
          </div>
          
          <div style="margin-top: 40px; text-align: center;">
            <p>Thank you for your business!</p>
          </div>
        </body>
      </html>
    `;
  };

  const generatePdf = async (
    sale: Sale & { id: number }
  ): Promise<string | null> => {
    try {
      setIsGeneratingPdf(true);
      const htmlContent = generateInvoiceHTML(sale);

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Create a more descriptive filename
      const pdfName = `invoice-${sale.id.toString().padStart(8, "0")}.pdf`;
      const newUri = FileSystem.documentDirectory + pdfName;

      // Copy the file to a location with a better name
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      // Delete the original temporary file
      await FileSystem.deleteAsync(uri);

      return newUri;
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Failed to generate PDF invoice");
      return null;
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const sharePdfInvoice = async (sale: Sale & { id: number }) => {
    try {
      const pdfUri = await generatePdf(sale);
      if (!pdfUri) return;

      // Check if sharing is available on this device
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice for ${sale.customer.name}`,
          UTI: "com.adobe.pdf", // for iOS
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error sharing PDF invoice:", error);
      Alert.alert("Error", "Failed to share PDF invoice");
    }
  };

  return {
    formatDate,
    isGeneratingPdf,
    sharePdfInvoice,
  };
};
