import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Keyboard, KeyboardEvent, Platform } from "react-native";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Option {
  id: string;
  label: string;
  value: any;
}

interface CreatableSelectProps {
  options: Option[];
  value: Option | null;
  onSelect: (option: Option | null) => void;
  onCreate: (label: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  disabled?: boolean;
  noOptionsMessage?: string;
  createOptionMessage?: string;
}

const DROPDOWN_MAX_HEIGHT = 200;
const DROPDOWN_ITEM_HEIGHT = 44;
const SCREEN_PADDING = 20;

export const CreatableSelect: React.FC<CreatableSelectProps> = ({
  options,
  value,
  onSelect,
  onCreate,
  placeholder = "Select...",
  containerStyle,
  disabled = false,
  noOptionsMessage = "No options found",
  createOptionMessage = "Create",
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const containerRef = useRef<View>(null);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const inputRef = useRef<TextInput>(null);
  
  // Check if there's enough space below the input for the dropdown
  const checkDropdownPosition = () => {
    if (!containerRef.current) return;
    
    containerRef.current.measure((x, y, width, height, pageX, pageY) => {
      const screenHeight = Dimensions.get('window').height;
      const effectiveScreenHeight = keyboardVisible ? screenHeight - keyboardHeight : screenHeight;
      const spaceBelow = effectiveScreenHeight - pageY - height - SCREEN_PADDING;
      const spaceNeeded = Math.min(
        DROPDOWN_MAX_HEIGHT, 
        filteredOptions.length * DROPDOWN_ITEM_HEIGHT + (showCreateOption ? DROPDOWN_ITEM_HEIGHT : 0)
      );
      
      // If keyboard is visible or there's not enough space below, show dropdown on top
      if ((keyboardVisible && spaceBelow < spaceNeeded) || (spaceBelow < spaceNeeded && pageY > spaceNeeded)) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    });
  };

  useEffect(() => {
    if (value) {
      setInputValue(value.label);
    } else {
      setInputValue("");
    }
  }, [value]);
  
  // Set up keyboard listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event: KeyboardEvent) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  // Check dropdown position when focus changes, filtered options change, or keyboard visibility changes
  useEffect(() => {
    if (isFocused) {
      checkDropdownPosition();
    }
  }, [isFocused, filteredOptions.length, keyboardVisible, keyboardHeight]);

  useEffect(() => {
    if (inputValue.trim() === "") {
      setFilteredOptions([]);
      return;
    }

    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(inputValue.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [inputValue, options]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (value && text !== value.label) {
      onSelect(null);
    }
  };

  const handleSelectOption = (option: Option) => {
    setInputValue(option.label);
    setIsFocused(false);
    Keyboard.dismiss();
    onSelect?.(option);
  };

  const handleCreateOption = () => {
    onCreate(inputValue);
    setIsFocused(false);
    Keyboard.dismiss();
  };
  


  const showCreateOption = 
    inputValue.trim() !== "" && 
    !filteredOptions.some(
      option => option.label.toLowerCase() === inputValue.toLowerCase()
    );

  return (
    <View ref={containerRef} style={[styles.container, containerStyle]}>
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: isFocused ? theme.tint : theme.border,
            backgroundColor: theme.background,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: theme.text }]}
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={theme.tabIconDefault}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow option selection
            setTimeout(() => setIsFocused(false), 150);
          }}
          editable={!disabled}
        />
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => {
            if (isFocused) {
              setIsFocused(false);
              inputRef.current?.blur();
            } else {
              setIsFocused(true);
              inputRef.current?.focus();
            }
          }}
        >
          <Ionicons
            name={isFocused ? "chevron-up" : "chevron-down"}
            size={16}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      {isFocused && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: theme.background, borderColor: theme.border },
            dropdownPosition === 'top' ? styles.dropdownTop : styles.dropdownBottom,
          ]}
        >
          {filteredOptions.length > 0 ? (
            <ScrollView 
              style={styles.optionsList}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {filteredOptions.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.option}
                  onPress={() => handleSelectOption(item)}
                >
                  <Text style={[styles.optionText, { color: theme.text }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : inputValue.trim() === "" ? (
            <Text style={[styles.noOptions, { color: theme.tabIconDefault }]}>
              Type to search...
            </Text>
          ) : (
            <Text style={[styles.noOptions, { color: theme.tabIconDefault }]}>
              {noOptionsMessage}
            </Text>
          )}

          {showCreateOption && (
            <TouchableOpacity
              style={styles.createOption}
              onPress={handleCreateOption}
            >
              <Ionicons name="add-circle-outline" size={16} color={theme.tint} />
              <Text style={[styles.createOptionText, { color: theme.tint }]}>
                {createOptionMessage} "{inputValue}"
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  iconContainer: {
    padding: 4,
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownTop: {
    bottom: 52,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownBottom: {
    top: 52,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  optionsList: {
    maxHeight: 150,
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
  },
  noOptions: {
    padding: 16,
    textAlign: "center",
    fontSize: 14,
  },
  createOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  createOptionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
});
