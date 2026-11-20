import { useState, type ComponentRef, type Ref } from "react";
import {
  Platform,
  Pressable,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { useTheme } from "@/theme/ThemeProvider";

import { Icon } from "./ui";

/**
 * Search field with the search icon and a clear button. `elevated` (home) floats it over the brand canvas;
 * flat (other screens) sits on the page with a hairline border.
 */
export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  inputRef,
  elevated = true,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
  elevated?: boolean;
  style?: ViewStyle;
}) {
  const { colors, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          height: elevated ? 56 : 52,
          paddingLeft: 16,
          borderRadius: elevated ? radius.xl : radius.lg,
          backgroundColor: colors.surface,
          borderWidth: elevated || focused ? 2 : 1,
          borderColor: focused
            ? colors.brand
            : elevated
              ? colors.surface
              : colors.border,
          boxShadow: elevated ? colors.shadowFloat : undefined,
        },
        style,
      ]}
    >
      <Icon
        name="search"
        size={20}
        color={focused ? colors.brand : colors.textMuted}
      />
      <TextInput
        ref={inputRef}
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          flex: 1,
          height: "100%",
          paddingLeft: 10,
          paddingRight: value ? 0 : 16,
          fontSize: 16,
          fontFamily: "Manrope_500Medium",
          color: colors.text,
          // The field draws its own focus border; drop the browser's outline (web preview only).
          ...(Platform.OS === "web" ? ({ outlineStyle: "none" } as unknown as TextStyle) : null),
        }}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar búsqueda"
          onPress={() => onChangeText("")}
          style={({ pressed }) => ({
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surfaceAlt,
            }}
          >
            <Icon name="close" size={15} color={colors.text} />
          </View>
        </Pressable>
      )}
    </View>
  );
}
