import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface InvoiceActionsProps {
  onSharePdf: () => void;
  isGeneratingPdf: boolean;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({ 
  onSharePdf, 
  isGeneratingPdf 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onSharePdf}
        disabled={isGeneratingPdf}
        style={[
          styles.shareButton,
          isGeneratingPdf && { opacity: 0.5 },
        ]}
      >
        <Ionicons name="share-outline" size={24} color="#0066cc" />
      </TouchableOpacity>
      {isGeneratingPdf && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066cc" />
          <ThemedText style={styles.loadingText}>
            Generating PDF...
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
});