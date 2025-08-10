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
    const currentDate = new Date().toLocaleDateString();
    const orderDate = sale.orderDate ? formatDate(sale.orderDate) : formatDate(sale.date);
    const itemCount = sale.items.length;
    const totalQuantity = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice #${sale.invoiceNumber || sale.id}</title>
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            body {
              font-family: 'Arial', 'Helvetica', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
              line-height: 1.4;
            }
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .invoice-header {
              text-align: center;
              border-bottom: 3px solid #0066cc;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .invoice-title {
              font-size: 32px;
              font-weight: bold;
              color: #0066cc;
              margin-bottom: 5px;
              letter-spacing: 2px;
            }
            .company-info {
              font-size: 16px;
              color: #666;
              margin-bottom: 10px;
            }
            .invoice-number {
              font-size: 14px;
              color: #999;
              background: #f8f9fa;
              padding: 5px 10px;
              border-radius: 5px;
              display: inline-block;
            }
            .invoice-details {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .customer-info, .invoice-info {
              width: 45%;
            }
            .info-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0066cc;
            }
            .info-section h3 {
              margin: 0 0 15px 0;
              color: #0066cc;
              font-size: 16px;
              font-weight: bold;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-section div {
              margin-bottom: 5px;
              font-size: 14px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              border-radius: 8px;
              overflow: hidden;
            }
            .items-table th {
              background: linear-gradient(135deg, #0066cc, #004499);
              color: white;
              padding: 15px 10px;
              text-align: left;
              font-weight: bold;
              font-size: 14px;
            }
            .items-table td {
              border-bottom: 1px solid #eee;
              padding: 12px 10px;
              font-size: 14px;
            }
            .items-table tbody tr:hover {
              background-color: #f8f9fa;
            }
            .items-table tbody tr:nth-child(even) {
              background-color: #fbfcfd;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
            }
            .summary-stats {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #28a745;
            }
            .summary-stats h4 {
              margin: 0 0 10px 0;
              color: #28a745;
              font-size: 16px;
            }
            .totals {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #0066cc;
              min-width: 300px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .total-row:last-child {
              border-bottom: none;
            }
            .grand-total {
              font-weight: bold;
              font-size: 18px;
              color: #0066cc;
              background: white;
              margin: 10px -10px -10px -10px;
              padding: 15px;
              border-radius: 5px;
              border: 2px solid #0066cc;
            }
            .footer {
              margin-top: 50px;
              padding-top: 20px;
              border-top: 2px solid #eee;
              text-align: center;
            }
            .footer-message {
              font-size: 16px;
              color: #0066cc;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .footer-details {
              font-size: 12px;
              color: #666;
            }
            .currency {
              font-weight: bold;
              color: #0066cc;
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="invoice-header">
              <div class="invoice-title">INVOICE</div>
              <div class="company-info">TantanLay Invoicing System</div>
              <div class="invoice-number">Invoice #${sale.invoiceNumber || sale.id}</div>
            </div>
            
            <div class="invoice-details">
              <div class="customer-info">
                <div class="info-section">
                  <h3>📋 Bill To</h3>
                  <div><strong>${sale.customer.name}</strong></div>
                  ${sale.customer.contact ? `<div>📞 ${sale.customer.contact}</div>` : ''}
                  ${sale.customer.address ? `<div>📍 ${sale.customer.address}</div>` : ''}
                </div>
              </div>
              
              <div class="invoice-info">
                <div class="info-section">
                  <h3>📄 Invoice Details</h3>
                  <div><strong>Invoice Date:</strong> ${formatDate(sale.date)}</div>
                  ${sale.orderDate && sale.orderDate !== sale.date ? `<div><strong>Order Date:</strong> ${orderDate}</div>` : ''}
                  <div><strong>Generated:</strong> ${currentDate}</div>
                  <div><strong>Payment Terms:</strong> Due on Receipt</div>
                </div>
              </div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Description</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Line Total</th>
                </tr>
              </thead>
              <tbody>
                ${sale.items
                  .map((item, index) => {
                    return `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>
                        <strong>${item.productName}</strong>
                        ${typeof item.productId === 'string' && item.productId.startsWith('custom-') ? '<br><small style="color: #666;">Custom Item</small>' : ''}
                      </td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right currency">$${item.unitPrice.toFixed(2)}</td>
                      <td class="text-right currency">$${item.lineTotal.toFixed(2)}</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
            
            <div class="summary-section">
              <div class="summary-stats">
                <h4>📊 Order Summary</h4>
                <div><strong>Total Items:</strong> ${itemCount}</div>
                <div><strong>Total Quantity:</strong> ${totalQuantity}</div>
                <div><strong>Average per Item:</strong> $${(sale.total / itemCount).toFixed(2)}</div>
              </div>
              
              <div class="totals">
                <div class="total-row">
                  <div>Subtotal:</div>
                  <div class="currency">$${sale.subtotal.toFixed(2)}</div>
                </div>
                ${sale.total !== sale.subtotal ? `
                <div class="total-row">
                  <div>Discount/Tax:</div>
                  <div class="currency">$${(sale.total - sale.subtotal).toFixed(2)}</div>
                </div>
                ` : ''}
                <div class="total-row grand-total">
                  <div>TOTAL AMOUNT:</div>
                  <div class="currency">$${sale.total.toFixed(2)}</div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-message">🙏 Thank you for your business!</div>
              <div class="footer-details">
                This invoice was generated electronically by TantanLay Invoicing System<br>
                For questions about this invoice, please contact us with the invoice number above.
              </div>
            </div>
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
