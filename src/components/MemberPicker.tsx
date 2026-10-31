import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

import { services } from "@/services";
import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError, MemberView } from "@/types";

import { BottomSheet, Icon, Input, Text } from "./ui";

export interface PickedMember {
  id: string;
  full_name: string;
  document_number: string;
}

/** One 56 px row: "Elegir miembro" or the chosen one (with a clear button). The search lives in a sheet. */
export function MemberPicker({
  value,
  onChange,
  label = "Miembro (opcional)",
}: {
  value: PickedMember | null;
  onChange: (member: PickedMember | null) => void;
  label?: string;
}) {
  const { colors, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [results, setResults] = useState<MemberView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | undefined>();

  const query = text.trim();
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBusy(true);
    const t = setTimeout(() => {
      services.members
        .list({ search: query, status: "all", page: 1, page_size: 6 })
        .then(
          (r) => {
            if (cancelled) return;
            setResults(r.data);
            setError(undefined);
            setBusy(false);
          },
          (e: ApiError) => {
            if (cancelled) return;
            setError(e);
            setBusy(false);
          },
        );
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, query]);

  const pick = (m: PickedMember | null) => {
    onChange(m);
    setOpen(false);
    setText("");
  };

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 52,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            value ? `Miembro: ${value.full_name}. Cambiar` : label
          }
          onPress={() => setOpen(true)}
          style={{
            flex: 1,
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingHorizontal: 14,
          }}
        >
          <Icon name="person-outline" size={20} color={colors.textMuted} />
          {value ? (
            <View style={{ flex: 1 }}>
              <Text variant="label" numberOfLines={1}>
                {value.full_name}
              </Text>
              <Text variant="caption" tone="muted">
                {value.document_number}
              </Text>
            </View>
          ) : (
            <Text tone="muted" style={{ flex: 1 }}>
              {label}
            </Text>
          )}
        </Pressable>
        {value && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Quitar miembro"
            onPress={() => onChange(null)}
            style={{
              width: 48,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Elegir miembro">
        <Input
          accessibilityLabel="Buscar miembro por nombre o documento"
          placeholder="Nombre, DNI o CE"
          value={text}
          onChangeText={setText}
          autoCorrect={false}
          autoFocus
        />
        {error && <Text tone="danger">{error.message}</Text>}
        {!error && !busy && results.length === 0 && (
          <Text tone="muted">Sin resultados.</Text>
        )}
        {results.map((m) => (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={`${m.full_name}, ${m.document_number}`}
            onPress={() =>
              pick({
                id: m.id,
                full_name: m.full_name,
                document_number: m.document_number,
              })
            }
            style={({ pressed }) => ({
              minHeight: 52,
              justifyContent: "center",
              borderBottomWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text variant="label" numberOfLines={1}>
              {m.full_name}
            </Text>
            <Text variant="caption" tone="muted">
              {m.document_type.toUpperCase()} {m.document_number}
            </Text>
          </Pressable>
        ))}
      </BottomSheet>
    </>
  );
}
