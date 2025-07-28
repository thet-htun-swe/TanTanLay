import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
} from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import {
  InvoiceHeader,
  InvoiceDetails,
  InvoiceItemsTable,
  InvoiceSummary,
  InvoiceActions,
} from "@/components/sales";
import { getSaleById } from "@/services/database";
import { useAppStore } from "@/store";
import { Sale } from "@/types";
import { useInvoice } from "@/hooks/useInvoice";

export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const { products } = useAppStore();
  const { formatDate, isGeneratingPdf, sharePdfInvoice } = useInvoice();

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




  const handleSharePdf = () => {
    if (sale) {
      sharePdfInvoice(sale);
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
        <InvoiceHeader invoiceId={sale.id} />
        
        <InvoiceDetails sale={sale} formatDate={formatDate} />
        
        <InvoiceItemsTable items={sale.items} />
        
        <InvoiceSummary subtotal={sale.subtotal} total={sale.total} />
        
        <InvoiceActions 
          onSharePdf={handleSharePdf}
          isGeneratingPdf={isGeneratingPdf}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    marginTop: 16,
  },
});
