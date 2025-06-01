import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getSaleById } from "@/services/storage";
import { useAppStore } from "@/store";
import { Product, Sale } from "@/types";

export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { products } = useAppStore();

  useEffect(() => {
    const loadSale = async () => {
      if (id) {
        setLoading(true);
        const saleData = await getSaleById(id);
        setSale(saleData);
        setLoading(false);
      }
    };

    loadSale();
  }, [id]);

  const getProductById = (productId: string): Product | undefined => {
    return products.find((product) => product.id === productId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const generateInvoiceHTML = () => {
    if (!sale) return "";

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
              <div>Invoice #: ${sale.id.substring(0, 8)}</div>
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

  const generatePdf = async () => {
    if (!sale) return;

    try {
      setIsGeneratingPdf(true);
      const htmlContent = generateInvoiceHTML();

      // Generate PDF file
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);

      // Create a more descriptive filename
      const pdfName = `invoice-${sale.id.substring(0, 8)}.pdf`;
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

  const sharePdfInvoice = async () => {
    try {
      const pdfUri = await generatePdf();
      if (!pdfUri) return;

      // Check if sharing is available on this device
      const isSharingAvailable = await Sharing.isAvailableAsync();

      if (isSharingAvailable) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice for ${sale?.customer.name}`,
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

  const printPdfInvoice = async () => {
    try {
      const htmlContent = generateInvoiceHTML();
      await Print.printAsync({
        html: htmlContent,
      });
    } catch (error) {
      console.error("Error printing invoice:", error);
      Alert.alert("Error", "Failed to print invoice");
    }
  };

  const shareInvoice = async () => {
    try {
      await Share.share({
        message: "Here is your invoice",
        title: `Invoice #${sale?.id.substring(0, 8)}`,
      });
    } catch (error) {
      console.error("Error sharing invoice:", error);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  if (!sale) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Sale not found</ThemedText>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>
            Invoice #{sale.id.substring(0, 8)}
          </ThemedText>
          <Button
            title="Back"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>

        <Card style={styles.detailsCard}>
          <View style={styles.detailsRow}>
            <ThemedText style={styles.detailsLabel}>Date:</ThemedText>
            <ThemedText>{formatDate(sale.date)}</ThemedText>
          </View>
          <View style={styles.detailsRow}>
            <ThemedText style={styles.detailsLabel}>Customer:</ThemedText>
            <ThemedText>{sale.customer.name}</ThemedText>
          </View>
          {sale.customer.contact && (
            <View style={styles.detailsRow}>
              <ThemedText style={styles.detailsLabel}>Contact:</ThemedText>
              <ThemedText>{sale.customer.contact}</ThemedText>
            </View>
          )}
          {sale.customer.address && (
            <View style={styles.detailsRow}>
              <ThemedText style={styles.detailsLabel}>Address:</ThemedText>
              <ThemedText>{sale.customer.address}</ThemedText>
            </View>
          )}
        </Card>

        <Card style={styles.itemsCard}>
          <ThemedText style={styles.sectionTitle}>Items</ThemedText>

          <View style={styles.tableHeader}>
            <ThemedText style={[styles.tableHeaderText, styles.productCol]}>
              Product
            </ThemedText>
            <ThemedText style={[styles.tableHeaderText, styles.qtyCol]}>
              Qty
            </ThemedText>
            <ThemedText style={[styles.tableHeaderText, styles.priceCol]}>
              Price
            </ThemedText>
            <ThemedText style={[styles.tableHeaderText, styles.totalCol]}>
              Total
            </ThemedText>
          </View>

          {sale.items.map((item) => {
            return (
              <View key={item.productId} style={styles.tableRow}>
                <ThemedText style={styles.productCol}>
                  {item.productName}
                </ThemedText>
                <ThemedText style={styles.qtyCol}>{item.quantity}</ThemedText>
                <ThemedText style={styles.priceCol}>
                  {item.unitPrice.toFixed(2)}
                </ThemedText>
                <ThemedText style={styles.totalCol}>
                  {item.lineTotal.toFixed(2)}
                </ThemedText>
              </View>
            );
          })}
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <ThemedText>Subtotal:</ThemedText>
            <ThemedText>{sale.subtotal.toFixed(2)}</ThemedText>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalText}>Total:</ThemedText>
            <ThemedText style={styles.totalText}>
              {sale.total.toFixed(2)}
            </ThemedText>
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title="Share PDF Invoice"
            onPress={sharePdfInvoice}
            style={styles.shareButton}
            disabled={isGeneratingPdf}
          />
          <Button
            title="Print Invoice"
            onPress={printPdfInvoice}
            style={styles.printButton}
            variant="secondary"
            disabled={isGeneratingPdf}
          />
          {isGeneratingPdf && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0066cc" />
              <ThemedText style={styles.loadingText}>
                Generating PDF...
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailsLabel: {
    fontWeight: "600",
    width: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  itemsCard: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontWeight: "600",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productCol: {
    flex: 3,
  },
  qtyCol: {
    flex: 1,
    textAlign: "center",
  },
  priceCol: {
    flex: 1.5,
    textAlign: "right",
  },
  totalCol: {
    flex: 1.5,
    textAlign: "right",
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingTop: 8,
    marginTop: 8,
  },
  totalText: {
    fontWeight: "700",
    fontSize: 18,
  },
  actions: {
    marginTop: 24,
    alignItems: "center",
    gap: 12,
  },
  shareButton: {
    minWidth: 200,
  },
  printButton: {
    minWidth: 200,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
  },
});
