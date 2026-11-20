import { useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";

import { formatDate } from "@/lib/format";
import { useTheme } from "@/theme/ThemeProvider";

import { BottomSheet, Icon, Text } from "./ui";

LocaleConfig.locales.es = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["D", "L", "M", "M", "J", "V", "S"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

/**
 * A date picked from a brand-tinted calendar in a bottom sheet (never typed).
 * `value` and `onChange` use ISO dates (YYYY-MM-DD).
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = "Elegir fecha",
  error,
  minDate,
}: {
  label: string;
  value: string | null;
  onChange: (iso: string) => void;
  placeholder?: string;
  error?: string;
  /** Earliest selectable day (ISO); earlier days are greyed out. */
  minDate?: string;
}) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : placeholder}`}
        onPress={() => {
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={{
          minHeight: 48,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Icon name="calendar-outline" size={20} color={colors.brand} />
        <Text
          style={{ flex: 1, fontFamily: "Manrope_500Medium" }}
          tone={value ? undefined : "muted"}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <Calendar
          current={value ?? minDate ?? undefined}
          minDate={minDate}
          firstDay={1}
          enableSwipeMonths
          markedDates={
            value ? { [value]: { selected: true, disableTouchEvent: true } } : {}
          }
          onDayPress={(day) => {
            onChange(day.dateString);
            setOpen(false);
          }}
          theme={{
            calendarBackground: colors.surface,
            arrowColor: colors.brand,
            monthTextColor: colors.text,
            textMonthFontFamily: "Manrope_700Bold",
            textMonthFontSize: 17,
            textSectionTitleColor: colors.textMuted,
            textDayHeaderFontFamily: "Manrope_700Bold",
            dayTextColor: colors.text,
            textDayFontFamily: "Manrope_500Medium",
            todayTextColor: colors.brand,
            selectedDayBackgroundColor: colors.brand,
            selectedDayTextColor: colors.onBrand,
            textDisabledColor: colors.border,
          }}
        />
      </BottomSheet>
    </View>
  );
}
