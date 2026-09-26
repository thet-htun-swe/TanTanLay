import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ThemedView } from "../ThemedView";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { height } = Dimensions.get("window");

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  expandable?: boolean;
  scrollable?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  height: sheetHeight = height * 0.5,
  expandable = false,
  scrollable = false,
}) => {
  const theme = Colors[useColorScheme() ?? "light"];
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const maxHeight = height * 0.9; // 90% of screen height
  const currentHeight = isExpanded && expandable ? maxHeight : sheetHeight;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: currentHeight,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      // Reset expanded state when closing
      setIsExpanded(false);
    }
  }, [isVisible, translateY, backdropOpacity, currentHeight]);

  // Update animation when expanding/contracting
  useEffect(() => {
    if (isVisible && expandable) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isExpanded, expandable, isVisible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward swipes when not scrollable or at top of scroll
        return !scrollable || gestureState.dy > 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else if (expandable && gestureState.dy < -50 && !isExpanded) {
          // Expand on upward swipe
          setIsExpanded(true);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > currentHeight * 0.2 || gestureState.vy > 0.5) {
          onClose();
        } else if (expandable && gestureState.dy < -50 && !isExpanded) {
          setIsExpanded(true);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!isVisible) return null;

  const ContentWrapper = scrollable ? ScrollView : View;
  const contentWrapperProps = scrollable 
    ? { 
        showsVerticalScrollIndicator: false,
        bounces: false,
        style: styles.scrollContent 
      }
    : { style: styles.content };

  return (
    <Modal transparent animationType="none" visible={isVisible}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: currentHeight,
              transform: [{ translateY }],
              backgroundColor: theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
        >
          <View 
            style={[styles.handle, { backgroundColor: theme.border }]}
            {...panResponder.panHandlers}
          />
          {expandable && (
            <TouchableWithoutFeedback
              onPress={() => setIsExpanded(!isExpanded)}
            >
              <View style={styles.expandButton}>
                <View style={[
                  styles.expandIndicator,
                  { borderTopColor: theme.muted, transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }
                ]} />
              </View>
            </TouchableWithoutFeedback>
          )}
          <ThemedView style={styles.contentContainer} pointerEvents="box-none">
            <ContentWrapper {...contentWrapperProps}>
              {children}
            </ContentWrapper>
          </ThemedView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 0,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
  expandButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  expandIndicator: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
