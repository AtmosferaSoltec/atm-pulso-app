import { randomUUID } from "expo-crypto";
import { useState } from "react";
import { View } from "react-native";
import { router, Stack } from "expo-router";

import {
  addMonths,
  coverageEnd,
  displayToIso,
  formatDate,
  formatMoney,
  isoToDisplay,
  maskDate,
  METHOD_LABEL,
  planLabel,
  todayLima,
} from "@/lib/format";
import { services } from "@/services";
import { useSession } from "@/state/session";
import type {
  ApiError,
  DocumentType,
  MemberDetail,
  MembershipView,
  PaymentMethod,
  PeriodChanges,
  Sale,
} from "@/types";

import { BottomSheet, Button, Chips, Input, Screen, Text } from "./ui";

const DURATIONS = ["1", "3", "6", "12"] as const;
const METHODS: PaymentMethod[] = ["yape_plin", "cash", "card", "transfer"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text variant="label">{label}</Text>
      {children}
    </View>
  );
}

/**
 * One form for the three writes, with everything pre-filled:
 * - no `member`: new member + first subscription (one screen, no steps)
 * - `member`: renew (start defaults to the end of the current one, or today if it already expired)
 * - `member` + `subscription`: modify that subscription
 * The end date is never typed: it is shown as a one-line preview.
 */
export function SubscriptionForm({
  member,
  subscription,
}: {
  member?: MemberDetail;
  subscription?: MembershipView;
}) {
  const { visibility, user, activeBranch, plans, invalidate } = useSession();
  const enroll = !member;
  const edit = !!subscription;
  const today = todayLima();
  // With several plans the user picks one; with exactly one it is implicit (the API uses it).
  const multiplePlans = plans.length > 1;
  const [planId, setPlanId] = useState(
    subscription?.plan_id ??
      plans.find((p) => p.id === member?.memberships[0]?.plan_id)?.id ??
      plans[0]?.id ??
      "",
  );
  const plan = plans.find((p) => p.id === planId);
  // A renewal continues the same plan: it starts when that plan's latest period ends.
  const continueOn =
    member && !edit
      ? (member.memberships
          .filter(
            (s) =>
              (!multiplePlans || s.plan_id === planId) && s.ends_on > today,
          )
          .map((s) => s.ends_on)
          .sort()
          .at(-1) ?? null)
      : null;
  const priceFor = (m: number, forPlan = plan) =>
    forPlan?.prices.find((p) => p.months === m)?.amount ?? "";

  const [docType, setDocType] = useState<DocumentType>("dni");
  const [doc, setDoc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const initialMonths = String(subscription?.months ?? 1);
  const [duration, setDuration] = useState<string>(
    (DURATIONS as readonly string[]).includes(initialMonths)
      ? initialMonths
      : "other",
  );
  const [otherMonths, setOtherMonths] = useState(initialMonths);
  const [chosenStart, setStartChoice] = useState<
    "continue" | "today" | "other"
  >(edit ? "other" : continueOn ? "continue" : "today");
  const startChoice =
    chosenStart === "continue" && !continueOn ? "today" : chosenStart;
  const [otherDate, setOtherDate] = useState(
    subscription ? isoToDisplay(subscription.starts_on) : "",
  );
  const [amount, setAmount] = useState(
    subscription?.amount ?? priceFor(Number(initialMonths)),
  );
  const [method, setMethod] = useState<PaymentMethod>("yape_plin");
  const [branch, setBranch] = useState(activeBranch?.id ?? "");
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<ApiError | undefined>();
  const [sale, setSale] = useState<Sale | undefined>();
  // One id per form: repeating a submit returns the same sale instead of charging twice.
  const [requestId] = useState(() => randomUUID());

  const monthsText = duration === "other" ? otherMonths : duration;
  const months = Number(monthsText);
  const validMonths = /^\d+$/.test(monthsText) && months >= 1 && months <= 24;
  const start =
    startChoice === "continue"
      ? continueOn
      : startChoice === "today"
        ? today
        : displayToIso(otherDate);
  const end = start && validMonths ? addMonths(start, months) : null;
  const validDoc =
    docType === "dni" ? /^\d{8}$/.test(doc) : /^\d{9,12}$/.test(doc);
  const validName = name.trim().split(/\s+/).length >= 2;
  const validPhone = /^9\d{8}$/.test(phone);
  const validAmount =
    /^\d+(\.\d{1,2})?$/.test(amount) && Number(amount) <= 1_000_000;
  const valid =
    (!enroll || (validDoc && validName && validPhone)) &&
    validMonths &&
    !!start &&
    validAmount;
  const show = (ok: boolean) => attempted && !ok;

  const pickDuration = (value: string) => {
    setDuration(value);
    const price = value === "other" ? "" : priceFor(Number(value));
    if (price && !edit) setAmount(price);
  };
  const pickPlan = (id: string) => {
    setPlanId(id);
    const price = priceFor(
      validMonths ? months : 1,
      plans.find((p) => p.id === id),
    );
    if (price && !edit) setAmount(price);
  };

  function finish() {
    const done = sale;
    setSale(undefined);
    // Reload lists and cards only now: refetching earlier would unmount this form (and its sheet).
    invalidate();
    if (enroll && done)
      router.replace({
        pathname: "/members/[id]",
        params: { id: done.member.id },
      });
    else router.back();
  }

  async function submit() {
    setAttempted(true);
    if (!valid || !start || saving) return;
    setSaving(true);
    setFailure(undefined);
    const terms = {
      id: requestId,
      branch_id: branch,
      ...(multiplePlans ? { plan_id: planId } : {}),
      months,
      starts_on: start,
      amount,
      method,
    };
    try {
      let result: Sale;
      if (edit && member && subscription) {
        const changes: PeriodChanges = {
          ...(months !== subscription.months ? { months } : {}),
          ...(start !== subscription.starts_on ? { starts_on: start } : {}),
          ...(Number(amount) !== Number(subscription.amount) ? { amount } : {}),
        };
        if (Object.keys(changes).length === 0) {
          setFailure({ code: "NO_CHANGES", message: "No hiciste cambios." });
          return;
        }
        result = await services.members.updatePeriod(
          member.id,
          subscription.id,
          changes,
        );
      } else if (member)
        result = await services.members.renew(member.id, terms);
      else
        result = await services.members.enroll({
          ...terms,
          document_type: docType,
          document_number: doc,
          full_name: name.trim().replace(/\s+/g, " "),
          phone,
        });
      setSale(result);
    } catch (e) {
      setFailure(e as ApiError);
    } finally {
      setSaving(false);
    }
  }

  const title = enroll
    ? "Nuevo miembro"
    : edit
      ? "Modificar suscripción"
      : "Renovar";
  const action = enroll ? "Registrar" : edit ? "Guardar cambios" : "Renovar";

  return (
    <Screen contentContainerStyle={{ paddingTop: 4, gap: 18 }}>
      <Stack.Screen options={{ title }} />
      {member && (
        <Text tone="muted">
          {member.full_name}
          {edit
            ? ""
            : ` · ${member.status === "expired" ? "venció" : "vence"} ${formatDate(coverageEnd(member))}`}
        </Text>
      )}

      {enroll && (
        <>
          <Field label="Documento">
            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}
            >
              <Chips
                options={[
                  { value: "dni", label: "DNI" },
                  { value: "ce", label: "CE" },
                ]}
                value={docType}
                onChange={setDocType}
              />
              <View style={{ flex: 1 }}>
                <Input
                  accessibilityLabel={`Número de ${docType.toUpperCase()}`}
                  placeholder={
                    docType === "dni" ? "8 dígitos" : "9 a 12 dígitos"
                  }
                  keyboardType="number-pad"
                  value={doc}
                  onChangeText={(v) => setDoc(v.replace(/\D/g, ""))}
                  maxLength={docType === "dni" ? 8 : 12}
                  style={{ minHeight: 44 }}
                  error={
                    show(validDoc)
                      ? docType === "dni"
                        ? "Deben ser 8 dígitos."
                        : "Deben ser de 9 a 12 dígitos."
                      : undefined
                  }
                />
              </View>
            </View>
          </Field>
          <Input
            label="Nombre y apellidos"
            autoCapitalize="words"
            autoComplete="name"
            value={name}
            onChangeText={setName}
            error={show(validName) ? "Escribe nombre y apellido." : undefined}
          />
          <Input
            label="Celular"
            placeholder="9xx xxx xxx"
            keyboardType="phone-pad"
            autoComplete="tel"
            maxLength={9}
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, ""))}
            error={show(validPhone) ? "9 dígitos, empieza con 9." : undefined}
          />
        </>
      )}

      {multiplePlans && !edit && (
        <Field label="Plan">
          <Chips
            options={plans.map((p) => ({ value: p.id, label: p.name }))}
            value={planId}
            onChange={pickPlan}
          />
        </Field>
      )}

      <Field label="Duración">
        <Chips
          options={[
            ...DURATIONS.map((n) => ({
              value: n,
              label: planLabel(Number(n)),
            })),
            { value: "other", label: "Otro" },
          ]}
          value={duration}
          onChange={pickDuration}
        />
        {duration === "other" && (
          <Input
            accessibilityLabel="Meses"
            placeholder="Meses (1 a 24)"
            keyboardType="number-pad"
            maxLength={2}
            value={otherMonths}
            onChangeText={(v) => setOtherMonths(v.replace(/\D/g, ""))}
            error={show(validMonths) ? "Entre 1 y 24 meses." : undefined}
          />
        )}
      </Field>

      <Field label="Inicio">
        {!edit && (
          <Chips
            options={[
              ...(continueOn
                ? [
                    {
                      value: "continue" as const,
                      label: `Al vencer (${formatDate(continueOn).slice(0, -5)})`,
                    },
                  ]
                : []),
              { value: "today" as const, label: "Hoy" },
              { value: "other" as const, label: "Otra fecha" },
            ]}
            value={startChoice}
            onChange={setStartChoice}
          />
        )}
        {startChoice === "other" && (
          <Input
            accessibilityLabel="Fecha de inicio"
            placeholder="DD/MM/AAAA"
            keyboardType="number-pad"
            maxLength={10}
            value={otherDate}
            onChangeText={(v) => setOtherDate(maskDate(v))}
            error={show(!!start) ? "Fecha no válida (DD/MM/AAAA)." : undefined}
          />
        )}
        <Text variant="caption" tone="muted">
          {end && start
            ? `Del ${formatDate(start)} al ${formatDate(end)}`
            : "Elige inicio y duración para ver el fin."}
        </Text>
      </Field>

      <Input
        label="Monto (S/)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(",", "."))}
        error={
          show(validAmount) ? "Escribe el monto, hasta 2 decimales." : undefined
        }
      />

      {!edit && (
        <Field label="Pago">
          <Chips
            options={METHODS.map((m) => ({ value: m, label: METHOD_LABEL[m] }))}
            value={method}
            onChange={setMethod}
          />
        </Field>
      )}

      {visibility.showBranch && !edit && (
        <Field label="Sede">
          <Chips
            options={
              user?.branches.map((b) => ({ value: b.id, label: b.name })) ?? []
            }
            value={branch}
            onChange={setBranch}
          />
        </Field>
      )}

      {failure && (
        <View style={{ gap: 6 }}>
          <Text tone="danger" accessibilityLiveRegion="polite">
            {failure.message}
          </Text>
          {failure.code === "MEMBERSHIP_OVERLAP" &&
            (failure.details as { suggested_starts_on?: string } | undefined)
              ?.suggested_starts_on && (
              <Button
                title={`Empezar el ${formatDate((failure.details as { suggested_starts_on: string }).suggested_starts_on)}`}
                variant="secondary"
                onPress={() => {
                  setStartChoice("other");
                  setOtherDate(
                    isoToDisplay(
                      (failure.details as { suggested_starts_on: string })
                        .suggested_starts_on,
                    ),
                  );
                  setFailure(undefined);
                }}
              />
            )}
          {failure.code === "MEMBER_DOCUMENT_TAKEN" &&
            (failure.details as { member_id?: string } | undefined)
              ?.member_id && (
              <Button
                title="Abrir su ficha"
                variant="secondary"
                onPress={() =>
                  router.replace({
                    pathname: "/members/[id]",
                    params: {
                      id: (failure.details as { member_id: string }).member_id,
                    },
                  })
                }
              />
            )}
        </View>
      )}

      <Button
        title={action}
        loading={saving}
        style={{ marginTop: 4 }}
        onPress={submit}
      />

      <BottomSheet
        visible={!!sale}
        onClose={finish}
        title={
          enroll
            ? "Miembro registrado"
            : edit
              ? "Cambios guardados"
              : "Renovación registrada"
        }
      >
        <Text variant="heading">{sale?.member.full_name}</Text>
        {sale && (
          <>
            <Text>
              {multiplePlans ? `${sale.membership.plan_name} · ` : ""}
              {sale.membership.plan_label} ·{" "}
              {formatMoney(sale.membership.amount)}
            </Text>
            <Text tone="muted">
              Del {formatDate(sale.membership.starts_on)} al{" "}
              {formatDate(sale.membership.ends_on)} · Boleta{" "}
              {sale.receipt.number}
            </Text>
          </>
        )}
        <Button title={enroll ? "Ver ficha" : "Listo"} onPress={finish} />
      </BottomSheet>
    </Screen>
  );
}
