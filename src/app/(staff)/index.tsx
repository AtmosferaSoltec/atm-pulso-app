import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  RefreshControl,
  View,
  type FlatList,
  TextInput,
} from "react-native";
import { router, useIsFocused } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GymHeader, GymMark } from "@/components/GymHeader";
import { MemberRow } from "@/components/MemberRow";
import { SearchField } from "@/components/SearchField";
import {
  Chips,
  EmptyState,
  ErrorState,
  Icon,
  PressableScale,
  SkeletonList,
  Text,
} from "@/components/ui";
import { todayLong } from "@/lib/format";
import { useSession } from "@/state/session";
import { useMembers } from "@/hooks/queries";
import { useTheme } from "@/theme/ThemeProvider";
import type { MemberStatus, MemberView } from "@/types";

type Filter = MemberStatus | "all";

/** Height of the compact bar that replaces the canvas once it scrolls away. */
const BAR = 56;
/** The canvas reaches far above the screen so pulling down on iOS never shows a light gap. */
const OVERSCROLL = 1000;
/** Only the first screenful of cards animates in; later ones appear as you scroll, with no delay. */
const STAGGERED = 8;

/** Concentric «pulse» rings behind the title: the app's motif, drawn with plain views. They open once. */
function PulseRings() {
  const reduce = useReducedMotion();
  const open = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (!reduce)
      open.set(
        withDelay(
          80,
          withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
        ),
      );
  }, [reduce, open]);
  const style = useAnimatedStyle(() => ({
    opacity: open.get(),
    transform: [{ scale: interpolate(open.get(), [0, 1], [0.82, 1]) }],
  }));
  const ring = (size: number, a: number) => (
    <View
      key={size}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: `rgba(255,255,255,${a})`,
      }}
    />
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          right: -150,
          bottom: -170,
          width: 460,
          height: 460,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <View
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: 230,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 62%)",
        }}
      />
      {ring(120, 0.18)}
      {ring(230, 0.12)}
      {ring(340, 0.08)}
      {ring(460, 0.05)}
    </Animated.View>
  );
}

/**
 * The app's only list, on a brand canvas: identity and title on the gym's colour, a floating search, status
 * filters (with the «Por vencer» shortcut) and member cards. «Nuevo miembro» and «Venta rápida» float at the
 * thumb. When the canvas scrolls away a compact bar keeps the gym and a search shortcut.
 */
export default function Members() {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { user, hasFeature } = useSession();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const searching = search.trim().length > 0;
  // A search always looks across every status so nobody gets "lost" behind a filter.
  const result = useMembers({ search, status: searching ? "all" : filter });
  const counts = result.counts;
  const retry = result.refetch;

  const listRef = useRef<FlatList<MemberView>>(null);
  const searchRef = useRef<ComponentRef<typeof TextInput>>(null);
  const scrollY = useSharedValue(0);
  // Where the compact bar takes over: the canvas bottom minus the bar. Measured once the canvas lays out.
  const [canvasHeight, setCanvasHeight] = useState(220);
  const threshold = Math.max(canvasHeight - insets.top - BAR, 1);
  const [barVisible, setBarVisible] = useState(false);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.set(e.contentOffset.y);
    },
  });
  const barStyle = useAnimatedStyle(() => {
    const t = interpolate(
      scrollY.get(),
      [threshold - 24, threshold + 8],
      [0, 1],
      "clamp",
    );
    return { opacity: t, transform: [{ translateY: (1 - t) * -6 }] };
  });

  const toSearch = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setBarVisible(false);
    setTimeout(() => searchRef.current?.focus(), 250);
  };

  const header = (
    <View style={{ paddingBottom: 6 }}>
      <View
        onLayout={(e) =>
          setCanvasHeight(e.nativeEvent.layout.height - OVERSCROLL)
        }
        style={{
          marginHorizontal: -16,
          marginTop: -OVERSCROLL,
          paddingTop: OVERSCROLL + insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 52,
          borderBottomLeftRadius: radius.xxl + 4,
          borderBottomRightRadius: radius.xxl + 4,
          overflow: "hidden",
          backgroundColor: colors.brandDeep,
          backgroundImage: `linear-gradient(165deg, ${colors.brandDeep} 55%, ${colors.brandInk} 100%)`,
        }}
      >
        <PulseRings />
        <GymHeader />
        <View style={{ marginTop: 26, gap: 2 }}>
          <Text
            variant="caption"
            style={{
              color: "#ffffff",
              textTransform: "uppercase",
              letterSpacing: 1.2,
              fontSize: 12,
              fontFamily: "Manrope_700Bold",
            }}
          >
            {todayLong()}
          </Text>
          <Text variant="display" style={{ color: "#ffffff" }}>
            Miembros
          </Text>
        </View>
      </View>
      <SearchField
        inputRef={searchRef}
        accessibilityLabel="Buscar por nombre, DNI o CE"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar nombre, DNI o CE"
        style={{ marginTop: -28 }}
      />
      <View style={{ height: 52, marginTop: 14, justifyContent: "center" }}>
        {searching ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 4,
            }}
          >
            <Icon name="people-outline" size={16} color={colors.textMuted} />
            <Text variant="caption" tone="muted">
              Buscando en todos los miembros
            </Text>
          </View>
        ) : (
          <Chips
            scroll
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Todos" },
              {
                value: "expiring",
                label: "Por vencer",
                count: counts?.expiring,
                tone: "warning",
              },
              {
                value: "expired",
                label: "Vencidos",
                count: counts?.expired,
                tone: "danger",
              },
              { value: "active", label: "Activos" },
              { value: "scheduled", label: "Programados" },
            ]}
          />
        )}
      </View>
      <View style={{ height: 8 }} />
      {result.loading && <SkeletonList variant="cards" rows={6} />}
      {result.error && <ErrorState error={result.error} onRetry={retry} />}
      {!result.loading && !result.error && result.items.length === 0 && (
        <EmptyState
          icon={searching ? "search" : "people-outline"}
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
                ? "Registra al primero con «Nuevo miembro»."
                : undefined
          }
          actionLabel={searching ? "Borrar búsqueda" : undefined}
          onAction={searching ? () => setSearch("") : undefined}
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {focused && <StatusBar style="light" />}
      <Animated.FlatList
        ref={listRef}
        data={result.error || result.loading ? [] : result.items}
        onEndReached={result.loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          result.loadingMore ? (
            <SkeletonList variant="cards" rows={2} />
          ) : undefined
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) =>
          index < STAGGERED ? (
            <Animated.View
              entering={FadeInDown.duration(380)
                .delay(index * 45)
                .springify()
                .damping(20)}
            >
              <MemberRow member={item} />
            </Animated.View>
          ) : (
            <MemberRow member={item} />
          )
        }
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 112,
        }}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) =>
          setBarVisible(e.nativeEvent.contentOffset.y > threshold)
        }
        onScrollEndDrag={(e) =>
          setBarVisible(e.nativeEvent.contentOffset.y > threshold)
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={result.refetch}
            tintColor="#ffffff"
            colors={[colors.brand]}
            progressViewOffset={insets.top}
          />
        }
      />

      {/* Status-bar scrim: list content never scrolls under the clock and battery (edge-to-edge). */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.brandDeep,
        }}
      />
      <Animated.View
        pointerEvents={barVisible ? "auto" : "none"}
        style={[
          {
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            height: BAR,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            paddingLeft: 16,
            paddingRight: 6,
            backgroundColor: colors.brandDeep,
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
            boxShadow: colors.shadowFloat,
          },
          barStyle,
        ]}
      >
        <GymMark size={30} onCanvas />
        <Text
          variant="heading"
          numberOfLines={1}
          style={{ flex: 1, color: "#ffffff" }}
        >
          {user?.gym.name}
        </Text>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Buscar miembro"
          onPress={toSearch}
          style={{
            width: 48,
            height: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="search" size={22} color="#ffffff" />
        </PressableScale>
      </Animated.View>

      {/* Thumb dock: the two everyday actions, over a fade so cards slide under them softly. */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 16,
          paddingTop: 28,
          paddingBottom: insets.bottom + 14,
          flexDirection: "row",
          gap: 10,
          backgroundImage: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${colors.background} 62%)`,
        }}
      >
        {hasFeature("sales") && (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Venta rápida"
            onPress={() => {
              void Haptics.selectionAsync().catch(() => {});
              router.push("/sale");
            }}
            style={{
              height: 56,
              paddingHorizontal: 18,
              borderRadius: radius.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: colors.surface,
              boxShadow: colors.shadowFloat,
            }}
          >
            <Icon name="bag-handle-outline" size={20} color={colors.brand} />
            <Text variant="label" style={{ fontSize: 15 }}>
              Venta rápida
            </Text>
          </PressableScale>
        )}
        <View style={{ flex: 1 }}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Nuevo miembro"
            onPress={() => {
              void Haptics.impactAsync(
                Haptics.ImpactFeedbackStyle.Light,
              ).catch(() => {});
              router.push("/members/new");
            }}
            style={{
              height: 56,
              paddingHorizontal: 16,
              borderRadius: radius.xl,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: colors.brand,
              boxShadow: colors.shadowFloat,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  colors.onBrand === "#ffffff"
                    ? "rgba(255,255,255,0.22)"
                    : "rgba(0,0,0,0.1)",
              }}
            >
              <Icon name="add" size={20} color={colors.onBrand} />
            </View>
            <Text
              variant="label"
              numberOfLines={1}
              style={{ color: colors.onBrand, fontSize: 15 }}
            >
              Nuevo miembro
            </Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}
