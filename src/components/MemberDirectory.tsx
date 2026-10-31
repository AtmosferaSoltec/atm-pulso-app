import { useState } from "react";
import { FlatList, Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  EmptyState,
  ErrorState,
  FilterChips,
  Icon,
  Input,
  SkeletonList,
  Text,
} from "./ui";
import { Identity } from "./Identity";
import { MemberRow } from "./MemberRow";
import { useMembers } from "@/hooks/queries";
import { useTheme } from "@/theme/ThemeProvider";
import { useSession } from "@/state/session";
import type { MemberStatus } from "@/types";
import { STATUS_LABEL } from "@/lib/format";
export function MemberDirectory({ home = false }: { home?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, setPreviewState } = useSession();
  const params = useLocalSearchParams<{ status?: string }>();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MemberStatus | "all">("all");
  const selected =
    params.status === "expiring" && filter === "all" ? "expiring" : filter;
  const result = useMembers({
    search,
    status: home && !search ? "expiring" : selected,
  });
  const retry = () => {
    setPreviewState("ready");
    result.refetch();
  };
  const header = (
    <View style={{ gap: 24 }}>
      <Identity />
      <View style={{ gap: 8 }}>
        <Text variant="caption" tone="brand">
          {home
            ? `HOLA, ${user?.full_name.split(" ")[0].toUpperCase()}`
            : "TU COMUNIDAD"}
        </Text>
        <Text variant="display">
          {home ? "Cada miembro.\nMás cerca." : "Miembros"}
        </Text>
        <Text tone="muted">
          {home
            ? "Encuentra a quien tienes delante."
            : "Una ficha, toda su historia."}
        </Text>
      </View>
      <View style={{ position: "relative" }}>
        <Input
          accessibilityLabel="Buscar por nombre, DNI o CE"
          value={search}
          onChangeText={setSearch}
          placeholder="Nombre, DNI o CE"
          returnKeyType="search"
          autoCorrect={false}
          style={{ minHeight: 64, borderRadius: 20, paddingLeft: 48 }}
        />
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 16, top: 21 }}
        >
          <Icon name="search-outline" color={colors.brand} />
        </View>
      </View>
      {!home && (
        <FilterChips
          value={selected}
          onChange={(v) => {
            setFilter(v);
            router.setParams({ status: undefined });
          }}
          options={[
            { value: "all", label: "Todos" },
            ...Object.entries(STATUS_LABEL).map(([value, label]) => ({
              value: value as MemberStatus,
              label,
            })),
          ]}
        />
      )}
      {home && !search && (
        <View style={{ gap: 14 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text variant="heading">Un buen momento para renovar</Text>
          </View>
          <Text tone="muted">Suscripciones que vencen en 7 días o menos.</Text>
          {!result.loading && !result.error && !!result.data?.data.length && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 6 }}
            >
              {result.data.data.map((member) => (
                <Pressable
                  key={member.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver a ${member.full_name}, ${member.days_remaining} días restantes`}
                  onPress={() => router.push(`/members/${member.id}`)}
                >
                  <LinearGradient
                    colors={[colors.brandSoft, colors.surface]}
                    style={{
                      width: 245,
                      padding: 22,
                      borderRadius: 26,
                      gap: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Avatar name={member.full_name} />
                      <Icon name="arrow-forward-outline" color={colors.brand} />
                    </View>
                    <Text variant="heading">{member.full_name}</Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 7,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Manrope_700Bold",
                          fontSize: 52,
                          lineHeight: 60,
                          color: colors.onBrandSoft,
                        }}
                      >
                        {member.days_remaining.toString().padStart(2, "0")}
                      </Text>
                      <Text tone="muted">días restantes</Text>
                    </View>
                    <View
                      style={{
                        height: 3,
                        backgroundColor: colors.border,
                        borderRadius: 4,
                      }}
                    >
                      <View
                        style={{
                          height: 3,
                          width: "90%",
                          backgroundColor: colors.brand,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>
          )}
          <Button
            title="Ver todos los que están por vencer"
            icon="arrow-forward"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: "/(staff)/(tabs)/members",
                params: { status: "expiring" },
              })
            }
          />
        </View>
      )}
      {(search || !home) && (
        <Text variant="caption" tone="muted">
          {search ? "RESULTADOS DE BÚSQUEDA" : "DIRECTORIO DE MIEMBROS"}
        </Text>
      )}
      {result.loading && <SkeletonList rows={3} />}
      {result.error && <ErrorState error={result.error} onRetry={retry} />}
      {!result.loading && !result.error && result.data?.data.length === 0 && (
        <EmptyState
          icon="search-outline"
          title={
            search
              ? "No encontramos coincidencias"
              : home
                ? "Todos al día"
                : "Tu comunidad empieza aquí"
          }
          message={
            search
              ? "Prueba con otro nombre o documento."
              : home
                ? "No hay suscripciones próximas a vencer."
                : "Crea la primera ficha para empezar."
          }
          actionLabel={search ? "Limpiar búsqueda" : "Nuevo miembro"}
          onAction={() =>
            search ? setSearch("") : router.push("/members/new")
          }
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
        data={
          result.error || result.loading || (home && !search)
            ? []
            : (result.data?.data ?? [])
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <MemberRow member={item} index={index} />
        )}
        ListHeaderComponent={header}
        contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        refreshing={result.loading}
        onRefresh={result.refetch}
      />
      <View
        style={{
          paddingHorizontal: 24,
          paddingTop: 12,
          paddingBottom: 14,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Button
          title="Nuevo miembro"
          size="lg"
          icon="add"
          onPress={() => router.push("/members/new")}
        />
      </View>
    </View>
  );
}
