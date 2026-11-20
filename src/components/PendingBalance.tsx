import { randomUUID } from "expo-crypto";
import { useRef, useState } from "react";
import { Pressable, View } from "react-native";

import { usePendingSales } from "@/hooks/queries";
import { formatMoney, formatShortDay, METHOD_LABEL, METHODS } from "@/lib/format";
import { services, type ProofFile } from "@/services";
import { useSession } from "@/state/session";
import { useTheme } from "@/theme/ThemeProvider";
import type { ApiError, PaymentMethod, ProductSale } from "@/types";

import {
  acceptsProof,
  PaymentProof,
  proofSummary,
  uploadProofs,
} from "./PaymentProof";
import { BottomSheet, Button, Chips, Icon, Text } from "./ui";

const detail = (sale: ProductSale) =>
  sale.items.map((i) => `${i.quantity} × ${i.name}`).join(", ");

/**
 * «Pendiente de cobro» block of the member card (module `sales`). Renders nothing when the member
 * owes nothing. «Cobrar» collects whole sales only: all of them or the ones ticked.
 */
export function PendingBalance({ memberId }: { memberId: string }) {
  const { colors, radius } = useTheme();
  const { activeBranch, invalidate } = useSession();
  const pending = usePendingSales(memberId);
  const [open, setOpen] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [proofs, setProofs] = useState<ProofFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<ApiError | undefined>();
  const [collected, setCollected] = useState<string | undefined>();
  const attempt = useRef({ signature: "", id: "" });

  const data = pending.data;
  if (!data) return null;
  if (data.pending_count === 0 && !collected) return null;

  const chosen = data.sales.filter((s) => !skipped.includes(s.id));
  const amount = chosen.reduce((a, s) => a + Number(s.total), 0);

  async function collect() {
    if (saving || chosen.length === 0) return;
    const body = {
      member_id: memberId,
      branch_id: activeBranch?.id ?? "",
      method,
      sale_ids: chosen.map((s) => s.id),
    };
    const signature = JSON.stringify(body);
    if (attempt.current.signature !== signature)
      attempt.current = { signature, id: randomUUID() };
    setSaving(true);
    setFailure(undefined);
    try {
      const result = await services.sales.collect({
        ...body,
        id: attempt.current.id,
      });
      attempt.current = { signature: "", id: "" };
      // The collection is saved; its optional photos go after it and never undo it.
      const note =
        acceptsProof(method) && proofs.length > 0
          ? proofSummary(
              proofs.length,
              await uploadProofs({ kind: "collection", id: result.id }, proofs),
            )
          : null;
      setProofs([]);
      setCollected(
        `Cobrado ${formatMoney(result.amount)} · ${METHOD_LABEL[method]}` +
          (note ? `\n${note}` : ""),
      );
      setOpen(false);
      setSkipped([]);
      invalidate();
    } catch (e) {
      setFailure(e as ApiError);
      // Someone else may have collected: show the current state.
      if (["SALE_NOT_PENDING", "NOTHING_TO_COLLECT", "SALE_NOT_FOUND"].includes((e as ApiError).code))
        invalidate();
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" tone="muted">
        PENDIENTE DE COBRO
      </Text>
      {collected && data.pending_count === 0 ? (
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
          <Text variant="label" style={{ color: colors.success }}>
            {collected}
          </Text>
        </View>
      ) : (
        <View
          style={{
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 4 }}
          >
            <Text variant="title" style={{ flex: 1 }}>
              {formatMoney(data.balance)}
            </Text>
            <Button
              title="Cobrar"
              fullWidth={false}
              onPress={() => {
                setMethod("cash");
                setFailure(undefined);
                setCollected(undefined);
                setOpen(true);
              }}
            />
          </View>
          {data.sales.map((s) => (
            <View
              key={s.id}
              style={{
                paddingVertical: 8,
                borderTopWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                gap: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text numberOfLines={2}>{detail(s)}</Text>
                <Text variant="caption" tone="muted">
                  {formatShortDay(s.sold_at)}
                </Text>
              </View>
              <Text variant="label">{formatMoney(s.total)}</Text>
            </View>
          ))}
        </View>
      )}

      <BottomSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Cobrar pendiente"
      >
        <View>
          {data.sales.map((s) => {
            const on = !skipped.includes(s.id);
            return (
              <Pressable
                key={s.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${detail(s)}, ${formatMoney(s.total)}`}
                onPress={() =>
                  setSkipped((c) => (on ? [...c, s.id] : c.filter((x) => x !== s.id)))
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 52,
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Icon
                  name={on ? "checkbox" : "square-outline"}
                  size={24}
                  color={on ? colors.brand : colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={2}>{detail(s)}</Text>
                  <Text variant="caption" tone="muted">
                    {formatShortDay(s.sold_at)}
                  </Text>
                </View>
                <Text variant="label">{formatMoney(s.total)}</Text>
              </Pressable>
            );
          })}
        </View>
        <Chips
          options={METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
          value={method}
          onChange={setMethod}
        />
        {acceptsProof(method) && (
          <PaymentProof photos={proofs} onChange={setProofs} />
        )}
        {failure && <Text tone="danger">{failure.message}</Text>}
        <Button
          title={`Cobrar ${formatMoney(amount)}`}
          loading={saving}
          disabled={chosen.length === 0}
          onPress={() => void collect()}
        />
      </BottomSheet>
    </View>
  );
}
