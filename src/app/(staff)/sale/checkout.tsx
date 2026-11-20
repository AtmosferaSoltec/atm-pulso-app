import { randomUUID } from "expo-crypto";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MemberPicker } from "@/components/MemberPicker";
import { Button, Chips, Text } from "@/components/ui";
import { useProducts } from "@/hooks/queries";
import { formatMoney, METHOD_LABEL, METHODS } from "@/lib/format";
import { services } from "@/services";
import { getLastMethod, rememberMethod } from "@/state/last-method";
import { saleCart, useSaleCart } from "@/state/sale-cart";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError, PaymentMethod } from "@/types";

/** Quick sale, step 2: optional member, payment method, order and «Cobrar» (or «Dejar pendiente» with a member). */
export default function SaleCheckout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { activeBranch, user, visibility, invalidate } = useSession();
  const products = useProducts();
  const { items, member } = useSaleCart();
  const [branchId, setBranchId] = useState(activeBranch?.id ?? "");
  const [method, setMethod] = useState<PaymentMethod>(getLastMethod());
  const [saving, setSaving] = useState<"paid" | "pending" | null>(null);
  const [failure, setFailure] = useState<ApiError | undefined>();
  // One id per attempt: retrying the very same sale never duplicates it; any change gets a new id.
  const attempt = useRef({ signature: "", id: "" });

  const lines = (products.data ?? [])
    .filter((p) => (items[p.id] ?? 0) > 0)
    .map((p) => ({ product: p, quantity: items[p.id] }));
  const total = lines.reduce(
    (sum, l) => sum + Number(l.product.price) * l.quantity,
    0,
  );

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
    setSaving(status);
    setFailure(undefined);
    try {
      const sale = await services.sales.sell({
        ...body,
        id: attempt.current.id,
      });
      if (status === "paid") rememberMethod(method);
      // The next sale is usually for someone else: start clean.
      saleCart.finish(
        status === "paid"
          ? `Venta cobrada · ${formatMoney(sale.total)} · ${METHOD_LABEL[method]}`
          : `Pendiente de ${member?.full_name} · ${formatMoney(sale.total)}`,
      );
      invalidate();
      router.back();
    } catch (e) {
      setFailure(e as ApiError);
      setSaving(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 20 }}
      >
        <MemberPicker
          value={member}
          onChange={(m) => {
            setFailure(undefined);
            saleCart.setMember(m);
          }}
        />
        {visibility.showBranch && (
          <View style={{ gap: 6 }}>
            <Text variant="label">Sede</Text>
            <Chips
              options={
                user?.branches.map((b) => ({ value: b.id, label: b.name })) ??
                []
              }
              value={branchId}
              onChange={setBranchId}
            />
          </View>
        )}
        <View style={{ gap: 6 }}>
          <Text variant="label">Medio de pago</Text>
          <Chips
            options={METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
            value={method}
            onChange={setMethod}
          />
        </View>
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text variant="label" style={{ flex: 1 }}>
              Pedido
            </Text>
            <Button
              title="Editar"
              variant="ghost"
              fullWidth={false}
              onPress={() => router.back()}
            />
          </View>
          {lines.map(({ product, quantity }) => (
            <View
              key={product.id}
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                gap: 8,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ width: 32 }} tone="muted">
                {quantity}×
              </Text>
              <Text style={{ flex: 1 }} numberOfLines={2}>
                {product.name}
              </Text>
              <Text variant="label">
                {formatMoney(Number(product.price) * quantity)}
              </Text>
            </View>
          ))}
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              paddingTop: 8,
            }}
          >
            <Text variant="heading" style={{ flex: 1 }}>
              Total
            </Text>
            <Text variant="title">{formatMoney(total)}</Text>
          </View>
        </View>
      </ScrollView>

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
        {failure && (
          <Text tone="danger" accessibilityLiveRegion="polite">
            {failure.message}
          </Text>
        )}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {member && (
            <Button
              title="Dejar pendiente"
              variant="secondary"
              fullWidth={false}
              style={{ flex: 1 }}
              disabled={lines.length === 0 || saving === "paid"}
              loading={saving === "pending"}
              onPress={() => void submit("pending")}
            />
          )}
          <Button
            title={`Cobrar ${formatMoney(total)}`}
            fullWidth={false}
            style={{ flex: 1 }}
            disabled={lines.length === 0 || saving === "pending"}
            loading={saving === "paid"}
            onPress={() => void submit("paid")}
          />
        </View>
      </View>
    </View>
  );
}
