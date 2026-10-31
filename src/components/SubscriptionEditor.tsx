import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { BottomSheet, Button, FilterChips, Input, Screen, Text } from "./ui";
import { MethodPicker } from "./MethodPicker";
import { useTheme } from "@/theme/ThemeProvider";
import { useSession } from "@/state/session";
import { addMonths, formatDate, formatMoney, todayLima } from "@/lib/format";
import type { MemberProfile, Subscription } from "@/services";
import type { DocumentType, PaymentMethod } from "@/types";
export function SubscriptionEditor({
  member,
  subscription,
  mode = "enroll",
}: {
  member?: MemberProfile;
  subscription?: Subscription;
  mode?: string;
}) {
  const { colors } = useTheme();
  const { visibility, user, activeBranch } = useSession();
  const enroll = mode === "enroll";
  const [step, setStep] = useState(enroll ? 0 : 1);
  const [docType, setDocType] = useState<DocumentType>("dni");
  const [doc, setDoc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [months, setMonths] = useState(String(subscription?.months ?? 1));
  const [start, setStart] = useState(
    subscription?.starts_on ??
      (mode === "renew" && member && member.ends_on > todayLima()
        ? member.ends_on
        : todayLima()),
  );
  const [amount, setAmount] = useState(subscription?.amount ?? "100.00");
  const [method, setMethod] = useState<PaymentMethod>(
    subscription?.method ?? "yape_plin",
  );
  const [branch, setBranch] = useState(
    subscription?.collection_branch.id ?? activeBranch?.id ?? "",
  );
  const [attempted, setAttempted] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const validDoc =
    docType === "dni" ? /^\d{8}$/.test(doc) : /^\d{9,12}$/.test(doc);
  const validPhone = /^9\d{8}$/.test(phone);
  const validName = name.trim().split(/\s+/).length >= 2;
  const validMonths =
    /^\d+$/.test(months) && Number(months) >= 1 && Number(months) <= 24;
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(start) &&
    !Number.isNaN(Date.parse(start)) &&
    new Date(start).toISOString().slice(0, 10) === start;
  const validAmount = /^\d+(\.\d{1,2})?$/.test(amount) && Number(amount) > 0;
  const end =
    validDate && validMonths ? addMonths(start, Number(months)) : null;
  const title = enroll
    ? "Una nueva historia."
    : mode === "edit"
      ? "Ajusta su suscripción."
      : mode === "new"
        ? "Su próximo comienzo."
        : "Que siga en movimiento.";
  return (
    <Screen contentContainerStyle={{ padding: 24, gap: 22 }}>
      <Text variant="caption" tone="brand">
        {enroll
          ? `PASO ${step + 1} DE 2 · ${step === 0 ? "EL MIEMBRO" : "SU SUSCRIPCIÓN"}`
          : member?.full_name.toUpperCase()}
      </Text>
      <Text variant="display">{title}</Text>
      <Text tone="muted">
        {step === 0
          ? "Primero, lo esencial para conocerle."
          : "Elige el inicio y los meses. El fin se calcula como vista previa."}
      </Text>
      {step === 0 ? (
        <>
          <FilterChips
            options={[
              { value: "dni", label: "DNI" },
              { value: "ce", label: "CE" },
            ]}
            value={docType}
            onChange={setDocType}
          />
          <Input
            label="Número de documento"
            keyboardType="number-pad"
            value={doc}
            onChangeText={setDoc}
            maxLength={docType === "dni" ? 8 : 12}
            error={
              attempted && !validDoc
                ? docType === "dni"
                  ? "Ingresa 8 dígitos."
                  : "Ingresa entre 9 y 12 dígitos."
                : undefined
            }
          />
          <Input
            label="Nombre completo"
            autoCapitalize="words"
            value={name}
            onChangeText={setName}
            error={
              attempted && !validName
                ? "Ingresa nombres y apellidos."
                : undefined
            }
          />
          <Input
            label="Teléfono"
            keyboardType="phone-pad"
            maxLength={9}
            value={phone}
            onChangeText={setPhone}
            error={
              attempted && !validPhone
                ? "Usa 9 dígitos, empezando por 9."
                : undefined
            }
          />
          <Button
            title="Continuar con la suscripción"
            icon="arrow-forward"
            size="lg"
            onPress={() => {
              setAttempted(true);
              if (validDoc && validPhone && validName) {
                setStep(1);
                setAttempted(false);
              }
            }}
          />
        </>
      ) : (
        <>
          <Input
            label="Fecha de inicio"
            placeholder="YYYY-MM-DD"
            keyboardType="numbers-and-punctuation"
            value={start}
            onChangeText={setStart}
            maxLength={10}
            hint="Puedes elegir un inicio futuro."
            error={
              attempted && !validDate
                ? "Usa una fecha válida: YYYY-MM-DD."
                : undefined
            }
          />
          <Text variant="label">Duración</Text>
          <FilterChips
            options={[1, 3, 6, 12].map((n) => ({
              value: String(n),
              label: n === 1 ? "1 mes" : `${n} meses`,
            }))}
            value={months}
            onChange={setMonths}
          />
          <Input
            label="Meses completos (1–24)"
            keyboardType="number-pad"
            value={months}
            onChangeText={setMonths}
            maxLength={2}
            error={
              attempted && !validMonths
                ? "Elige entre 1 y 24 meses completos."
                : undefined
            }
          />
          <View
            style={{
              padding: 22,
              borderRadius: 24,
              backgroundColor: colors.brandSoft,
              gap: 6,
            }}
          >
            <Text variant="caption" tone="brand">
              VISTA PREVIA · FECHA DE FIN
            </Text>
            <Text variant="title">
              {end ? formatDate(end) : "Completa inicio y duración"}
            </Text>
            <Text variant="caption" tone="muted">
              Meses calendario, con tope al último día del mes.
            </Text>
          </View>
          <Input
            label="Monto · S/"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(",", "."))}
            error={
              attempted && !validAmount
                ? "Ingresa un monto mayor a cero, con hasta 2 decimales."
                : undefined
            }
          />
          <MethodPicker value={method} onChange={setMethod} />
          {visibility.hasMultipleBranches && (
            <View style={{ gap: 8 }}>
              <Text variant="label">
                {enroll ? "Sede de inscripción y cobro" : "Sede de cobro"}
              </Text>
              <FilterChips
                options={
                  user?.branches.map((b) => ({ value: b.id, label: b.name })) ??
                  []
                }
                value={branch}
                onChange={setBranch}
              />
            </View>
          )}
          <Button
            title="Revisar suscripción"
            size="lg"
            icon="checkmark"
            onPress={() => {
              setAttempted(true);
              if (validDate && validMonths && validAmount) setConfirm(true);
            }}
          />
          {enroll && (
            <Button
              title="Volver a datos del miembro"
              variant="ghost"
              onPress={() => setStep(0)}
            />
          )}
        </>
      )}
      <BottomSheet
        visible={confirm}
        onClose={() => {
          setConfirm(false);
          setDone(false);
        }}
        title={done ? "Vista previa completada" : "Todo listo para revisar"}
      >
        {done ? (
          <>
            <Text>
              Así se verá la confirmación. Esta maqueta no guarda miembros,
              suscripciones ni cobros.
            </Text>
            <Button
              title="Volver"
              onPress={() => {
                setConfirm(false);
                router.back();
              }}
            />
          </>
        ) : (
          <>
            <Text variant="heading">{enroll ? name : member?.full_name}</Text>
            <Text>
              {months} {Number(months) === 1 ? "mes" : "meses"} ·{" "}
              {formatMoney(amount)}
            </Text>
            <Text tone="muted">
              {validDate ? formatDate(start) : ""} →{" "}
              {end ? formatDate(end) : ""}
            </Text>
            <Text variant="caption" tone="muted">
              Vista de diseño · sin cambios guardados.
            </Text>
            <Button
              title="Confirmar vista previa"
              onPress={() => setDone(true)}
            />
            <Button
              title="Seguir editando"
              variant="ghost"
              onPress={() => setConfirm(false)}
            />
          </>
        )}
      </BottomSheet>
    </Screen>
  );
}
