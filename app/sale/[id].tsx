import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router/react-navigation";
import React, { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Alert, View } from "react-native";

import { ReceiptActions, ReceiptView } from "@/components/sales";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/common/ErrorBanner";
import { getErrorMessage, getSaleById } from "@/services/api";
import { shareReceiptImage } from "@/services/receiptImage";
import { useAppStore, useIsAdmin } from "@/store";
import { Sale } from "@/types";

export default function SaleDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sale, setSale] = useState<(Sale & { id: number }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { products, removeSale } = useAppStore();
  const isAdmin = useIsAdmin();
  const receiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  const loadSale = async () => {
    if (id) {
      setLoading(true);
      try {
        const saleData = await getSaleById(parseInt(id, 10));
        setSale(saleData);
        setLoadError(null);
      } catch (error) {
        setLoadError(getErrorMessage(error, "Failed to load sale"));
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSale();
  }, [id]);

  // Refresh data when screen comes into focus (e.g., returning from edit)
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        loadSale();
      }
    }, [id])
  );

  const handleShareImage = async () => {
    if (!sale) return;
    setIsSharing(true);
    try {
      await shareReceiptImage(receiptRef, sale);
    } catch (error) {
      Alert.alert("Share receipt", getErrorMessage(error, "Could not share the receipt image"));
    } finally {
      setIsSharing(false);
    }
  };

  const handleEdit = () => {
    if (sale) {
      router.push(`/edit-sale/${sale.id}` as any);
    }
  };

  const handleDelete = () => {
    if (sale) {
      Alert.alert(
        "Delete Sale",
        `Are you sure you want to delete this sale (Invoice #${sale.invoiceNumber || sale.id})? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await removeSale(sale.id);
                router.back();
              } catch (error) {
                Alert.alert("Error", getErrorMessage(error, "Failed to delete sale. Please try again."));
              }
            },
          },
        ]
      );
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
        {loadError ? (
          <ErrorBanner message={loadError} onRetry={loadSale} />
        ) : (
          <ThemedText>Sale not found</ThemedText>
        )}
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
        <ReceiptView sale={sale} ref={receiptRef} />

        <ReceiptActions
          onShareImage={handleShareImage}
          isSharing={isSharing}
          // Only admin can edit or delete a sale
          onEdit={isAdmin ? handleEdit : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
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
