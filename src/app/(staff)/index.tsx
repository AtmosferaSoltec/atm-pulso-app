import { useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GymHeader } from "@/components/GymHeader";
import { MemberRow } from "@/components/MemberRow";
import {
  Chips,
  EmptyState,
  ErrorState,
  Icon,
  Input,
  SkeletonList,
  Text,
} from "@/components/ui";
import { useMembers } from "@/hooks/queries";
import { useTheme } from "@/theme/ThemeProvider";
import type { MemberStatus } from "@/types";

type Filter = MemberStatus | "all";

/** The app's only list: search, status filters (with the "Por vencer" shortcut) and "Nuevo". */
export default function Members() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const searching = search.trim().length > 0;
  // A search always looks across every status so nobody gets "lost" behind a filter.
  const result = useMembers({ search, status: searching ? "all" : filter });
  const counts = result.counts;
  const retry = result.refetch;
  const header = (
    <View style={{ gap: 12, paddingBottom: 4 }}>
      <GymHeader />
      <View>
        <Input
          accessibilityLabel="Buscar por nombre, DNI o CE"
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar nombre, DNI o CE"
          returnKeyType="search"
          autoCorrect={false}
          style={{ paddingLeft: 42, paddingRight: 44 }}
        />
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 14, top: 14 }}
        >
          <Icon name="search-outline" size={20} color={colors.textMuted} />
        </View>
        {searching && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Borrar búsqueda"
            onPress={() => setSearch("")}
            style={{
              position: "absolute",
              right: 2,
              top: 2,
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
      {!searching && (
        <Chips
          scroll
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Todos" },
            { value: "expiring", label: "Por vencer", count: counts?.expiring },
            { value: "expired", label: "Vencidos", count: counts?.expired },
            { value: "active", label: "Activos" },
            { value: "scheduled", label: "Programados" },
          ]}
        />
      )}
      {result.loading && <SkeletonList />}
      {result.error && <ErrorState error={result.error} onRetry={retry} />}
      {!result.loading && !result.error && result.items.length === 0 && (
        <EmptyState
          title={
            searching
              ? "Sin resultados"
              : filter === "all"
                ? "Aún no hay miembros"
                : "Nadie en este filtro"
          }
          message={
            searching
              ? "Revisa el nombre o el número de documento."
              : filter === "all"
                ? "Registra al primero con «Nuevo»."
                : undefined
          }
          actionLabel={searching ? "Borrar búsqueda" : undefined}
          onAction={searching ? () => setSearch("") : undefined}
        />
      )}
    </View>
  );
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }}
    >
      <FlatList
        data={result.error || result.loading ? [] : result.items}
        onEndReached={result.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={result.loadingMore ? <SkeletonList rows={2} /> : undefined}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MemberRow member={item} />}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 88,
        }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={false}
        onRefresh={result.refetch}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nuevo miembro"
        onPress={() => router.push("/members/new")}
        style={({ pressed }) => ({
          position: "absolute",
          right: 16,
          bottom: insets.bottom + 16,
          height: 52,
          paddingHorizontal: 20,
          borderRadius: 26,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: colors.brand,
          boxShadow: "0px 2px 8px rgba(0,0,0,0.18)",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Icon name="add" size={22} color={colors.onBrand} />
        <Text variant="label" style={{ color: colors.onBrand, fontSize: 15 }}>
          Nuevo
        </Text>
      </Pressable>
    </View>
  );
}
