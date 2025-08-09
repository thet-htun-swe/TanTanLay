import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Product } from "@/types";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

interface ProductNameInputProps extends Omit<TextInputProps, "onChangeText"> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  value: string;
  onChangeText: (text: string) => void;
  existingProducts: (Product & { id: number })[];
  excludeId?: number;
  onValidationChange?: (isValid: boolean, hasExactMatch: boolean) => void;
}

interface ValidationState {
  isExactMatch: boolean;
  isSimilarMatch: boolean;
  suggestions: (Product & { id: number })[];
}

export function ProductNameInput({
  label,
  error,
  containerStyle,
  value,
  onChangeText,
  existingProducts,
  excludeId,
  onValidationChange,
  ...props
}: ProductNameInputProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const [validation, setValidation] = useState<ValidationState>({
    isExactMatch: false,
    isSimilarMatch: false,
    suggestions: [],
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Fuzzy matching function using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const a = str1.toLowerCase();
    const b = str2.toLowerCase();

    if (a === b) return 1;
    if (a.length === 0) return 0;
    if (b.length === 0) return 0;

    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Calculate Levenshtein distance
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    const maxLength = Math.max(a.length, b.length);
    return 1 - matrix[b.length][a.length] / maxLength;
  };

  useEffect(() => {
    // Debounced validation function
    const validateProductName = (inputValue: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (!inputValue.trim()) {
          const emptyValidation = {
            isExactMatch: false,
            isSimilarMatch: false,
            suggestions: [],
          };
          setValidation(emptyValidation);

          // Notify parent component
          if (onValidationChange) {
            onValidationChange(true, false); // Empty is valid, no exact match
          }
          return;
        }

        const filteredProducts = existingProducts.filter((product) =>
          excludeId ? product.id !== excludeId : true
        );

        // Check for exact match
        const exactMatch = filteredProducts.find(
          (product) => product.name.toLowerCase() === inputValue.toLowerCase()
        );

        // Find all matching suggestions (contains input or similar)
        const suggestions = filteredProducts
          .filter((product) => {
            const similarity = calculateSimilarity(inputValue, product.name);
            const containsInput = product.name
              .toLowerCase()
              .includes(inputValue.toLowerCase());
            const inputContainsProduct = inputValue
              .toLowerCase()
              .includes(product.name.toLowerCase());

            return similarity > 0.4 || containsInput || inputContainsProduct;
          })
          .sort((a, b) => {
            // Sort by similarity score (highest first)
            const similarityA = calculateSimilarity(inputValue, a.name);
            const similarityB = calculateSimilarity(inputValue, b.name);
            return similarityB - similarityA;
          });

        // Check for similar matches (excluding exact match)
        const similarMatches = suggestions.filter(
          (product) => product.name.toLowerCase() !== inputValue.toLowerCase()
        );

        const newValidation = {
          isExactMatch: !!exactMatch,
          isSimilarMatch: similarMatches.length > 0,
          suggestions,
        };

        setValidation(newValidation);

        // Notify parent component of validation state
        if (onValidationChange) {
          onValidationChange(
            !newValidation.isExactMatch,
            newValidation.isExactMatch
          );
        }
      }, 300);
    };

    validateProductName(value);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, existingProducts, excludeId, onValidationChange]);

  const getValidationMessage = () => {
    if (validation.isExactMatch) {
      return "⚠️ A product with this exact name already exists";
    }
    if (validation.isSimilarMatch) {
      return "💡 Similar products found - check suggestions below";
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              borderColor: validation.isExactMatch
                ? "#ff6b6b"
                : validationMessage
                ? "#f59e0b"
                : error
                ? "#ff6b6b"
                : theme.border,
              backgroundColor: theme.background,
            },
          ]}
          placeholderTextColor={theme.tabIconDefault}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />

        {validation.suggestions.length > 0 && !validation.isExactMatch && (
          <View style={styles.matchesContainer}>
            <Text style={[styles.matchesText, { color: "#f59e0b" }]}>
              {validation.suggestions.map((item) => item.name).join(" / ")}
            </Text>
          </View>
        )}
      </View>

      {validationMessage && validation.isExactMatch && (
        <Text
          style={[
            styles.validationMessage,
            { color: validation.isExactMatch ? "#ff6b6b" : "#f59e0b" },
          ]}
        >
          {validationMessage}
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    position: "relative",
    zIndex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  matchesContainer: {
    paddingHorizontal: 4,
  },
  matchesText: {
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 16,
  },
  validationMessage: {
    fontSize: 12,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 14,
  },
});
