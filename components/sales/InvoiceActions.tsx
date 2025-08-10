import React from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';

interface InvoiceActionsProps {
  onSharePdf: () => void;
  isGeneratingPdf: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({ 
  onSharePdf, 
  isGeneratingPdf,
  onEdit,
  onDelete
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonsRow}>
        {onEdit && (
          <TouchableOpacity
            onPress={onEdit}
            style={styles.actionButton}
          >
            <Ionicons name="create-outline" size={24} color="#0066cc" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity
            onPress={onDelete}
            style={[styles.actionButton, styles.deleteButton]}
          >
            <Ionicons name="trash-outline" size={24} color="#dc3545" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onSharePdf}
          disabled={isGeneratingPdf}
          style={[
            styles.actionButton,
            isGeneratingPdf && { opacity: 0.5 },
          ]}
        >
          <Ionicons name="share-outline" size={24} color="#0066cc" />
        </TouchableOpacity>
      </View>
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
  buttonsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
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
  deleteButton: {
    backgroundColor: '#ffe6e6',
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