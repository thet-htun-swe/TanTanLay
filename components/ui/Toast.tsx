import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  duration: number;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const SUCCESS_MS = 2500;
const INFO_MS = 3000;
// Errors stay longer so they are not missed
const ERROR_MS = 5000;

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const nextId = useRef(0);

  const show = useCallback((kind: ToastKind, message: string) => {
    const duration =
      kind === 'error' ? ERROR_MS : kind === 'info' ? INFO_MS : SUCCESS_MS;
    nextId.current += 1;
    setItem({ id: nextId.current, kind, message, duration });
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  const dismiss = useCallback((id: number) => {
    setItem((current) => (current?.id === id ? null : current));
  }, []);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {item && <ToastView key={item.id} item={item} onDismiss={dismiss} />}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside ToastProvider');
  return api;
}

function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));

  const color =
    item.kind === 'success'
      ? theme.success
      : item.kind === 'error'
        ? theme.danger
        : theme.tint;

  const close = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => onDismiss(item.id));
  }, [progress, onDismiss, item.id]);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => close(), item.duration);
    return () => clearTimeout(timer);
    // Runs once per toast; the view is remounted for each new toast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { top: insets.top + 8 }]}
    >
      <Animated.View
        style={{
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-16, 0],
              }),
            },
          ],
        }}
      >
        <Pressable
          onPress={close}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={[
            styles.toast,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
              borderLeftColor: color,
            },
          ]}
        >
          <Ionicons name={ICONS[item.kind]} size={22} color={color} />
          <Text style={[styles.message, { color: theme.text }]}>
            {item.message}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  message: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
  },
});
