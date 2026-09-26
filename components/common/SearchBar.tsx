import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../ui/Input';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  showFilterButton?: boolean;
  onFilterPress?: () => void;
  filterActive?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = "Search...",
  showFilterButton = false,
  onFilterPress,
  filterActive = false,
}) => {
  const theme = Colors[useColorScheme() ?? 'light'];
  return (
    <View style={styles.container}>
      <Input
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        containerStyle={styles.searchInput}
      />
      
      {showFilterButton && (
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: theme.surface }]}
          onPress={onFilterPress}
        >
          <Ionicons
            name={filterActive ? "filter" : "filter-outline"}
            size={24}
            color={filterActive ? theme.tint : theme.muted}
          />
          {filterActive && <View style={[styles.filterActiveDot, { backgroundColor: theme.tint }]} />}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
