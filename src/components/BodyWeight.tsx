import { randomUUID } from "expo-crypto";
import { useState } from "react";
import { Pressable, View } from "react-native";

import {
  displayToIso,
  formatDate,
  formatKg,
  maskDate,
  todayLima,
} from "@/lib/format";
import { services } from "@/services";
import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError, BodyMeasurement } from "@/types";

import { BottomSheet, Button, Chips, Icon, Input, Text } from "./ui";

/**
 * Quick weight (module `body_tracking`). Health data is sensitive and every read is audited by the
 * server, so the last value is fetched ONLY when the user taps the row, and it is kept in memory only.
 */
export function BodyWeight({ memberId }: { memberId: string }) {
  const { colors, radius } = useTheme();
  const [latest, setLatest] = useState<BodyMeasurement | null | undefined>();
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<ApiError | undefined>();
  const [open, setOpen] = useState(false);

  async function show() {
    if (loading) return;
    setLoading(true);
    setLoadError(undefined);
    try {
      const all = await services.body.measurements(memberId);
      setLatest(all.find((m) => m.weight_kg !== null) ?? null);
    } catch (e) {
      setLoadError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }

  const summary =
    latest === undefined
      ? loading
        ? "Cargando…"
        : "Ver último peso"
      : latest === null
        ? "Sin mediciones de peso"
        : `${formatKg(latest.weight_kg as number)} · ${formatDate(latest.measured_on)}`;

  return (
    <View style={{ gap: 2 }}>
      <Text variant="caption" tone="muted">
        PESO
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          minHeight: 56,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          paddingLeft: 14,
          paddingRight: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Último peso. ${summary}`}
          onPress={() => void show()}
          disabled={latest !== undefined}
          style={{ flex: 1, minHeight: 56, justifyContent: "center" }}
        >
          <Text variant="label" tone={latest === undefined ? "brand" : "default"}>
            {summary}
          </Text>
          {loadError && (
            <Text variant="caption" tone="danger">
              {loadError.message}
            </Text>
          )}
        </Pressable>
        <Button
          title="Registrar peso"
          icon="scale-outline"
          variant="secondary"
          fullWidth={false}
          onPress={() => setOpen(true)}
        />
      </View>
      <WeightSheet
        key={String(open)}
        visible={open}
        memberId={memberId}
        onClose={() => setOpen(false)}
        onSaved={(m) => {
          setLatest(m);
          setOpen(false);
        }}
      />
    </View>
  );
}

function WeightSheet({
  visible,
  memberId,
  onClose,
  onSaved,
}: {
  visible: boolean;
  memberId: string;
  onClose: () => void;
  onSaved: (m: BodyMeasurement) => void;
}) {
  const { colors } = useTheme();
  const [weight, setWeight] = useState("");
  const [day, setDay] = useState<"today" | "other">("today");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();
  // One id per opened sheet: a retry returns the same record instead of a second one.
  const [requestId] = useState(() => randomUUID());

  const kg = Number(weight);
  const validWeight = /^\d{2,3}(\.\d)?$/.test(weight) && kg >= 20 && kg <= 400;
  const iso = day === "today" ? todayLima() : displayToIso(date);

  async function save() {
    if (!validWeight) return setError("Escribe el peso en kg, entre 20 y 400 (un decimal).");
    if (!iso) return setError("Fecha no válida (DD/MM/AAAA).");
    setSaving(true);
    setError(undefined);
    try {
      onSaved(
        await services.body.record(memberId, {
          id: requestId,
          measured_on: iso,
          weight_kg: kg,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      );
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Registrar peso">
      <Input
        label="Peso (kg)"
        accessibilityLabel="Peso en kilos"
        placeholder="72.5"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={(v) => setWeight(v.replace(",", "."))}
        maxLength={5}
        autoFocus
      />
      <Chips
        options={[
          { value: "today" as const, label: `Hoy (${formatDate(todayLima()).slice(0, -5)})` },
          { value: "other" as const, label: "Otra fecha" },
        ]}
        value={day}
        onChange={setDay}
      />
      {day === "other" && (
        <Input
          accessibilityLabel="Fecha de la medición"
          placeholder="DD/MM/AAAA"
          keyboardType="number-pad"
          maxLength={10}
          value={date}
          onChangeText={(v) => setDate(maskDate(v))}
        />
      )}
      {showNotes ? (
        <Input
          accessibilityLabel="Notas"
          placeholder="Notas (opcional)"
          value={notes}
          onChangeText={setNotes}
          maxLength={500}
          multiline
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowNotes(true)}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40 }}
        >
          <Icon name="add" size={18} color={colors.brand} />
          <Text variant="label" tone="brand">
            Agregar nota
          </Text>
        </Pressable>
      )}
      {error && <Text tone="danger">{error}</Text>}
      <Button title="Guardar" loading={saving} onPress={() => void save()} />
    </BottomSheet>
  );
}
