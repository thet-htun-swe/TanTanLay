import React from 'react';
import { Alert } from 'react-native';
import { Button } from './Button';
import { useAppStore } from '@/store';

export const ClearDataButton: React.FC = () => {
  const { clearAllData } = useAppStore();

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to delete all products, sales, and customers? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Button
      title="Clear All Data"
      onPress={handleClearData}
      style={{ backgroundColor: '#ff4444' }}
      textStyle={{ color: 'white' }}
    />
  );
};