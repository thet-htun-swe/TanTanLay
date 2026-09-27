import { useColorScheme as useNativeColorScheme } from 'react-native';

export const useColorScheme = () =>
  useNativeColorScheme() === 'dark' ? 'dark' : 'light';
