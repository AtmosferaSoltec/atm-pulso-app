import { randomUUID } from "expo-crypto";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MemberPicker, type PickedMember } from "@/components/MemberPicker";
import {
  BottomSheet,
  Button,
  Chips,
  ErrorState,
  Icon,
  SkeletonList,
  Text,
} from "@/components/ui";
import { useProducts } from "@/hooks/queries";
import { formatMoney, METHOD_LABEL, METHODS } from "@/lib/format";
import { services } from "@/services";
import { getLastMethod, rememberMethod } from "@/state/last-method";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError, PaymentMethod, Product } from "@/types";

/** Quick sale: tap a product to add one, choose «Cobrar» or «Dejar pendiente». Module `sales`. */
export default function SaleScreen() {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { hasFeature, activeBranch, user, visibility, invalidate } =
    useSession();
  const products = useProducts();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [member, setMember] = useState<PickedMember | null>(null);
  const [branchId, setBranchId] = useState(activeBranch?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>(getLastMethod());
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<ApiError | undefined>();
  const [done, setDone] = useState<string | undefined>();
  // One id per attempt: retrying the very same sale never duplicates it; any change gets a new id.
  const attempt = useRef({ signature: "", id: "" });

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(undefined), 4000);
    return () => clearTimeout(t);
  }, [done]);

  if (!hasFeature("sales")) return null;

  const list: Product[] = products.data ?? [];
  const lines = list
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, quantity: cart[p.id] }));
  const total = lines.reduce(
    (sum, l) => sum + Number(l.product.price) * l.quantity,
    0,
  );
  const units = lines.reduce((sum, l) => sum + l.quantity, 0);
  const change = (id: string, delta: number) => {
    setFailure(undefined);
    setCart((c) => {
      const next = Math.min(99, Math.max(0, (c[id] ?? 0) + delta));
      const { [id]: _removed, ...rest } = c;
      return next === 0 ? rest : { ...rest, [id]: next };
    });
  };

  async function submit(status: "paid" | "pending") {
    if (saving || lines.length === 0) return;
    const body = {
      branch_id: branchId,
      ...(member ? { member_id: member.id } : {}),
      status,
      ...(status === "paid" ? { method } : {}),
      items: lines.map((l) => ({
        product_id: l.product.id,
        quantity: l.quantity,
      })),
    };
    const signature = JSON.stringify(body);
    if (attempt.current.signature !== signature)
      attempt.current = { signature, id: randomUUID() };
    setSaving(true);
    setFailure(undefined);
    try {
      const sale = await services.sales.sell({ ...body, id: attempt.current.id });
      if (status === "paid") rememberMethod(method);
      setDone(
        status === "paid"
          ? `Venta cobrada · ${formatMoney(sale.total)} · ${METHOD_LABEL[method]}`
          : `Pendiente de ${member?.full_name} · ${formatMoney(sale.total)}`,
      );
      setCart({});
      setPaying(false);
      attempt.current = { signature: "", id: "" };
      invalidate();
    } catch (e) {
      setFailure(e as ApiError);
      setPaying(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 12 }}
      >
        {done && (
          <View
            accessibilityLiveRegion="polite"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: colors.successSoft,
            }}
          >
            <Icon name="checkmark-circle" size={20} color={colors.success} />
            <Text variant="label" style={{ flex: 1, color: colors.success }}>
              {done}
            </Text>
          </View>
        )}
        <MemberPicker value={member} onChange={setMember} />
        {visibility.showBranch && (
          <Chips
            options={
              user?.branches.map((b) => ({ value: b.id, label: b.name })) ?? []
            }
            value={branchId}
            onChange={setBranchId}
          />
        )}
        {products.loading && <SkeletonList rows={4} />}
        {products.error && (
          <ErrorState error={products.error} onRetry={products.refetch} />
        )}
        {!products.loading && !products.error && list.length === 0 && (
          <Text tone="muted">
            No hay productos activos. Se agregan desde la web.
          </Text>
        )}
        <View>
          {list.map((p) => {
            const qty = cart[p.id] ?? 0;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`Agregar ${p.name}, ${formatMoney(p.price)}${qty ? `, ${qty} en la venta` : ""}`}
                onPress={() => change(p.id, 1)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 56,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="label" style={{ fontSize: 15 }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {formatMoney(p.price)}
                  </Text>
                </View>
                {qty > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar uno de ${p.name}`}
                      onPress={() => change(p.id, -1)}
                      style={{
                        width: 48,
                        height: 48,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="remove-circle-outline" size={26} color={colors.textMuted} />
                    </Pressable>
                    <Text
                      variant="heading"
                      style={{ minWidth: 28, textAlign: "center" }}
                    >
                      {qty}
                    </Text>
                    <View
                      style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
                    >
                      <Icon name="add-circle" size={26} color={colors.brand} />
                    </View>
                  </View>
                ) : (
                  <View
                    style={{ width: 48, height: 48, alignItems: "center", justifyContent: "center" }}
                  >
                    <Icon name="add-circle-outline" size={26} color={colors.brand} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 12),
          gap: 8,
          borderTopWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        {failure && (
          <Text tone="danger" accessibilityLiveRegion="polite">
            {failure.message}
          </Text>
        )}
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text variant="title" style={{ flex: 1 }}>
            {formatMoney(total)}
          </Text>
          <Text tone="muted">
            {units === 0 ? "Sin productos" : units === 1 ? "1 unidad" : `${units} unidades`}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            title="Dejar pendiente"
            variant="secondary"
            fullWidth={false}
            style={{ flex: 1 }}
            disabled={lines.length === 0 || !member}
            loading={saving && !paying}
            onPress={() => void submit("pending")}
          />
          <Button
            title="Cobrar"
            fullWidth={false}
            style={{ flex: 1 }}
            disabled={lines.length === 0}
            onPress={() => {
              setMethod(getLastMethod());
              setPaying(true);
            }}
          />
        </View>
        {lines.length > 0 && !member && (
          <Text variant="caption" tone="muted">
            Para dejar pendiente, elige un miembro.
          </Text>
        )}
      </View>

      <BottomSheet
        visible={paying}
        onClose={() => setPaying(false)}
        title={`Cobrar ${formatMoney(total)}`}
      >
        <Chips
          options={METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
          value={method}
          onChange={setMethod}
        />
        <Button
          title={`Cobrar ${formatMoney(total)}`}
          loading={saving}
          onPress={() => void submit("paid")}
        />
      </BottomSheet>
    </View>
  );
}
