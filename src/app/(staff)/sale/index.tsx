import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SearchField } from "@/components/SearchField";
import {
  Button,
  Chips,
  EmptyState,
  ErrorState,
  Icon,
  SkeletonList,
  Text,
} from "@/components/ui";
import { useProductCategories, useProducts } from "@/hooks/queries";
import { formatMoney } from "@/lib/format";
import { saleCart, useSaleCart } from "@/state/sale-cart";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
import type { Product } from "@/types";

const ALL = "all";
const NONE = "none";

/** "Batido Proteína" matches "batido proteina": search ignores case and accents. */
const fold = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es-PE");

/** Quick sale, step 1: pick products (search, category). Step 2 is /sale/checkout. Module `sales`. */
export default function SaleCatalog() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasFeature } = useSession();
  const products = useProducts();
  const categories = useProductCategories();
  const { items, done } = useSaleCart();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);

  useEffect(() => {
    if (!done) return;
    // A second line is a note about the proof photos: give it time to be read.
    const t = setTimeout(
      () => saleCart.clearDone(),
      done.includes("\n") ? 8000 : 4000,
    );
    return () => clearTimeout(t);
  }, [done]);

  if (!hasFeature("sales")) return null;

  const list: Product[] = products.data ?? [];
  const groups = (categories.data ?? []).filter((c) =>
    list.some((p) => p.category_id === c.id),
  );
  const hasLoose = list.some((p) => !p.category_id);
  const query = fold(search.trim());
  const visible = list.filter(
    (p) =>
      (!query || fold(p.name).includes(query)) &&
      (query ||
        category === ALL ||
        (category === NONE ? !p.category_id : p.category_id === category)),
  );
  const total = list.reduce(
    (sum, p) => sum + Number(p.price) * (items[p.id] ?? 0),
    0,
  );
  const units = Object.values(items).reduce((sum, q) => sum + q, 0);

  const header = (
    <View style={{ gap: 12, paddingBottom: 4 }}>
      {done && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: 12,
            borderRadius: 12,
            backgroundColor: colors.successSoft,
          }}
        >
          <Icon name="checkmark-circle" size={20} color={colors.success} />
          <Text variant="label" style={{ flex: 1, color: colors.success }}>
            {done}
          </Text>
        </View>
      )}
      <SearchField
        elevated={false}
        accessibilityLabel="Buscar producto"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar producto"
      />
      {!query && groups.length > 0 && (
        <Chips
          scroll
          value={category}
          onChange={setCategory}
          options={[
            { value: ALL, label: "Todos" },
            ...groups.map((c) => ({ value: c.id, label: c.name })),
            ...(hasLoose ? [{ value: NONE, label: "Otros" }] : []),
          ]}
        />
      )}
      {products.loading && <SkeletonList rows={4} />}
      {products.error && (
        <ErrorState error={products.error} onRetry={products.refetch} />
      )}
      {!products.loading && !products.error && visible.length === 0 && (
        <EmptyState
          title={list.length === 0 ? "No hay productos" : "Sin resultados"}
          message={
            list.length === 0
              ? "Se agregan desde la web."
              : "Prueba con otro nombre."
          }
        />
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={products.loading || products.error ? [] : visible}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ padding: 16, paddingTop: 4 }}
        renderItem={({ item }) => (
          <ProductRow product={item} quantity={items[item.id] ?? 0} />
        )}
      />
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: insets.bottom + 12,
          gap: 8,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text variant="title" style={{ flex: 1 }}>
            {formatMoney(total)}
          </Text>
          <Text tone="muted">
            {units === 0
              ? "Sin productos"
              : units === 1
                ? "1 unidad"
                : `${units} unidades`}
          </Text>
        </View>
        <Button
          title="Continuar"
          icon="arrow-forward"
          disabled={units === 0}
          onPress={() => router.push("/sale/checkout")}
        />
      </View>
    </View>
  );
}

function ProductRow({
  product,
  quantity,
}: {
  product: Product;
  quantity: number;
}) {
  const { colors } = useTheme();
  const square = {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  } as const;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        minHeight: 56,
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Sumar uno de ${product.name}`}
        onPress={() => saleCart.change(product.id, 1)}
        style={({ pressed }) => ({
          flex: 1,
          minHeight: 56,
          justifyContent: "center",
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Text variant="label" style={{ fontSize: 15 }} numberOfLines={1}>
          {product.name}
        </Text>
        <Text variant="caption" tone="muted">
          {formatMoney(product.price)}
        </Text>
      </Pressable>
      {quantity > 0 && (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar uno de ${product.name}`}
            onPress={() => saleCart.change(product.id, -1)}
            style={square}
          >
            <Icon
              name="remove-circle-outline"
              size={26}
              color={colors.textMuted}
            />
          </Pressable>
          <Text variant="heading" style={{ minWidth: 28, textAlign: "center" }}>
            {quantity}
          </Text>
        </>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Agregar ${product.name}, ${formatMoney(product.price)}${quantity ? `, ${quantity} en la venta` : ""}`}
        onPress={() => saleCart.change(product.id, 1)}
        style={square}
      >
        <Icon
          name={quantity > 0 ? "add-circle" : "add-circle-outline"}
          size={26}
          color={colors.brand}
        />
      </Pressable>
    </View>
  );
}
