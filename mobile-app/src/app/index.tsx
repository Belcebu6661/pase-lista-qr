import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAttendance } from "../context/AttendanceContext";

// Misma conexión directa que scanner.tsx. Ajusta ambos archivos si cambia el servidor.
const API_URL = "http://192.168.137.99:3000/api/asistencias";
const DOCENTE_ID = "maestro-001";

type ManualResult = {
  kind: "success" | "duplicate" | "error";
  message: string;
  name?: string;
  group?: string;
};

type StudentPayload = {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  grupo?: string | null;
};

type AttendancePayload = {
  success?: boolean;
  message?: string;
  alumno?: StudentPayload;
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    sessionState, setSessionState,
    records, addRecord, loading: summaryLoading, error: summaryError,
    hasLoaded, lastUpdated, refreshRecords,
  } = useAttendance();

  const [manualVisible, setManualVisible] = useState(false);
  const [matricula, setMatricula] = useState("");
  const [loading, setLoading] = useState(false);
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);

  const busy = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  const closeManual = () => {
    if (busy.current) return;

    setManualVisible(false);
    setMatricula("");
    setManualResult(null);
  };

  const registerManual = async () => {
    if (
      busy.current ||
      manualResult?.kind === "success" ||
      manualResult?.kind === "duplicate"
    ) {
      return;
    }

    const value = matricula.trim();

    if (!value) {
      setManualResult({
        kind: "error",
        message: "Escribe la matrícula del alumno.",
      });
      return;
    }

    busy.current = true;
    setLoading(true);
    setManualResult(null);
    Keyboard.dismiss();

    const controller = new AbortController();
    request.current = controller;

    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matricula: value,
          docente_id: DOCENTE_ID,
        }),
        signal: controller.signal,
      });

      let payload: AttendancePayload;

      try {
        payload = await response.json();
      } catch {
        throw new Error("INVALID_RESPONSE");
      }

      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        throw new Error("INVALID_RESPONSE");
      }

      if (!mounted.current) return;

      const kind =
        response.ok && payload.success === true
          ? "success"
          : response.status === 409
            ? "duplicate"
            : "error";

      // Confirma la sesión solo después de un registro aceptado.
      // Un duplicado no verifica la sesión: el backend lo comprueba antes.
      if (kind === "success") {
        setSessionState("Activa");
      } else if (payload.message === "No hay ninguna sesión QR activa para este docente") {
        setSessionState("No disponible");
      }

      const student = payload.alumno;

      const studentName =
        student && typeof student === "object"
          ? [
              student.nombre,
              student.apellidoPaterno,
              student.apellidoMaterno,
            ]
              .filter(
                (part): part is string =>
                  typeof part === "string" && part.length > 0
              )
              .join(" ")
          : undefined;

      const studentGroup =
        typeof student?.grupo === "string" ? student.grupo : undefined;

      setManualResult({
        kind,
        message:
          typeof payload.message === "string" && payload.message.trim()
            ? payload.message
            : kind === "success"
              ? "Asistencia registrada."
              : kind === "duplicate"
                ? "Asistencia ya registrada."
                : "No se pudo registrar la asistencia.",
        name: studentName,
        group: studentGroup,
      });

      if (kind === "success" || kind === "duplicate") {
        addRecord();
      }
    } catch (error) {
      if (!mounted.current) return;

      setManualResult({
        kind: "error",
        message: controller.signal.aborted
          ? "El servidor tardó demasiado. Verifica si se guardó la asistencia antes de volver a intentar."
          : error instanceof Error && error.message === "INVALID_RESPONSE"
            ? "El servidor devolvió una respuesta inesperada. Verifica el registro antes de repetir."
            : "No se pudo confirmar el registro. Revisa la conexión y verifica la asistencia antes de repetir.",
      });
    } finally {
      clearTimeout(timeout);
      request.current = null;
      busy.current = false;

      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const registered =
    manualResult?.kind === "success" ||
    manualResult?.kind === "duplicate";

  const resultColor =
    manualResult?.kind === "success"
      ? "#15803D"
      : manualResult?.kind === "duplicate"
        ? "#B45309"
        : "#B91C1C";

  const totalRegistrados = records.filter(
    (record) => record.estado === "PRESENTE" || record.estado === "RETARDO"
  ).length;

  const totalPresentes = records.filter(
    (record) => record.estado === "PRESENTE"
  ).length;

  const totalRetardos = records.filter(
    (record) => record.estado === "RETARDO"
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Text style={styles.brand}>Pase de lista QR</Text>
          <Text style={styles.title}>Escanear asistencia</Text>
          <Text style={styles.subtitle}>Ingreso general · hoy</Text>

          <View style={styles.session}>
            <Text style={styles.smallLabel}>Modalidad de registro</Text>
            <Text style={styles.sessionTitle}>Entrada escolar</Text>
            <Text style={[styles.smallLabel, { marginTop: 8 }]}>Estado de sesión: {sessionState}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir cámara para escanear el código QR del alumno"
            onPress={() => router.push("/scanner")}
            style={({ pressed }) => [
              styles.scanner,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.qrMark} accessible={false}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              <Text style={styles.qrText}>QR</Text>
            </View>

            <Text style={styles.scanTitle}>
              Escanea el código del alumno
            </Text>

            <Text style={styles.scanHint}>
              El QR debe ser único por alumno
            </Text>

            <Text style={styles.scanAction}>
              Toca para abrir la cámara
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setManualVisible(true)}
            style={({ pressed }) => [
              styles.manualButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.manualText}>
              Ingresar matrícula manual
            </Text>
          </Pressable>

          <View style={styles.stats}>
            {[
              {
                label: "Registrados",
                value: totalRegistrados,
                color: "#2563EB",
              },
              {
                label: "Presentes",
                value: totalPresentes,
                color: "#16A34A",
              },
              {
                label: "Retardos",
                value: totalRetardos,
                color: "#D97706",
              },
            ].map(({ label, value, color }) => (
              <View key={label} style={styles.stat}>
                <Text style={[styles.statValue, { color }]}>
                  {hasLoaded ? value : "—"}
                </Text>
                <Text style={styles.statLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.summaryNote}>
            {summaryLoading ? "Actualizando resumen…"
              : lastUpdated ? `Datos del día · Actualizado a las ${lastUpdated}`
              : "Resumen sin consultar"}
          </Text>
          {!!summaryError && <Text accessibilityLiveRegion="polite" style={styles.summaryError}>{summaryError}</Text>}
          <Pressable accessibilityRole="button" disabled={summaryLoading}
            accessibilityState={{ disabled: summaryLoading, busy: summaryLoading }}
            onPress={() => { void refreshRecords(); }}
            style={[styles.manualButton, summaryLoading && styles.pressed]}>
            <Text style={styles.manualText}>{summaryLoading ? "Actualizando…" : "Actualizar resumen"}</Text>
          </Pressable>

          <View style={styles.history}>
            <Text style={styles.historyTitle}>Últimos registros</Text>

            {records.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>
                  {hasLoaded ? "Aún no hay asistencias hoy" : "Esperando la consulta de asistencias"}
                </Text>

                <Text style={styles.emptyText}>
                  Aquí aparecerán los registros confirmados por el servidor.
                </Text>
              </View>
            ) : (
              records.slice(0, 5).map((record) => (
                <View key={record.id} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyStudent}>
                      <Text style={styles.historyName}>
                        {record.nombre}
                      </Text>

                      <Text style={styles.historyMatricula}>
                        {record.matricula}
                        {record.grupo ? ` · ${record.grupo}` : ""}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.historyStatus,
                        {
                          color:
                            record.estado === "RETARDO" ? "#B45309"
                              : record.estado === "FALTA" ? "#B91C1C"
                              : record.estado === "JUSTIFICADA" ? "#2563EB" : "#15803D",
                        },
                      ]}
                    >
                      {{ PRESENTE: "Presente", RETARDO: "Retardo", JUSTIFICADA: "Justificada", FALTA: "Falta" }[record.estado]}
                    </Text>
                  </View>

                  <View style={styles.historyDetails}>
                    <Text style={styles.historyDetail}>
                      {record.hora}
                    </Text>

                    {!!record.metodo && <Text style={styles.historyMethod}>{record.metodo}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={manualVisible}
        transparent
        animationType="fade"
        onRequestClose={closeManual}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.dialog} accessibilityViewIsModal>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.historyTitle}>Captura manual</Text>

              <Text style={styles.dialogDescription}>
                Escribe la matrícula del alumno cuando no puedas
                escanear su QR.
              </Text>

              <Text style={styles.inputLabel}>Matrícula</Text>

              <TextInput
                accessibilityLabel="Matrícula del alumno"
                value={matricula}
                onChangeText={(text) => {
                  setMatricula(text);
                  setManualResult(null);
                }}
                editable={!loading && !registered}
                returnKeyType="done"
                onSubmitEditing={() => {
                  void registerManual();
                }}
                placeholder="Escribe la matrícula"
                placeholderTextColor="#7B879B"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={64}
                style={styles.input}
              />

              {manualResult && (
                <View
                  style={styles.resultBox}
                  accessibilityLiveRegion="polite"
                >
                  <Text
                    style={[
                      styles.resultHeading,
                      { color: resultColor },
                    ]}
                  >
                    {manualResult.kind === "success"
                      ? "Asistencia registrada"
                      : manualResult.kind === "duplicate"
                        ? "Asistencia ya registrada"
                        : "No se pudo registrar"}
                  </Text>

                  <Text style={styles.resultMessage}>
                    {manualResult.message}
                  </Text>

                  {!!manualResult.name && (
                    <Text style={styles.studentName}>
                      {manualResult.name}
                    </Text>
                  )}

                  {!!manualResult.group && (
                    <Text style={styles.resultMessage}>
                      Grupo: {manualResult.group}
                    </Text>
                  )}
                </View>
              )}

              <Pressable
                disabled={
                  loading || (!registered && !matricula.trim())
                }
                accessibilityRole="button"
                accessibilityState={{
                  disabled:
                    loading || (!registered && !matricula.trim()),
                  busy: loading,
                }}
                onPress={() => {
                  if (registered) {
                    setMatricula("");
                    setManualResult(null);
                  } else {
                    void registerManual();
                  }
                }}
                style={({ pressed }) => [
                  styles.submitButton,
                  (loading ||
                    (!registered && !matricula.trim())) &&
                    styles.submitDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {loading && (
                  <ActivityIndicator
                    color="#FFFFFF"
                    style={{ marginBottom: 6 }}
                  />
                )}

                <Text style={styles.submitText}>
                  {loading
                    ? "Registrando…"
                    : registered
                      ? "Registrar otro alumno"
                      : "Registrar asistencia"}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={loading}
                accessibilityState={{ disabled: loading }}
                onPress={closeManual}
                style={({ pressed }) => [
                  styles.closeButton,
                  (pressed || loading) && styles.pressed,
                ]}
              >
                <Text style={styles.manualText}>Cerrar</Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  summaryNote: { color: "#64748B", fontSize: 12, lineHeight: 18, marginTop: 12 },
  summaryError: { color: "#B91C1C", fontSize: 12, lineHeight: 18, marginTop: 8 },
  safeArea: {
    flex: 1,
    backgroundColor: "#EDF3FB",
  },

  page: {
    flexGrow: 1,
    padding: 16,
    alignItems: "center",
  },

  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D7E2F1",
    padding: 24,
  },

  brand: {
    color: "#111B30",
    fontSize: 20,
    fontWeight: "700",
  },

  title: {
    color: "#111B30",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 4,
  },

  subtitle: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 4,
  },

  session: {
    backgroundColor: "#EFF4FF",
    borderRadius: 15,
    paddingHorizontal: 19,
    paddingVertical: 15,
    marginTop: 20,
  },

  smallLabel: {
    color: "#64748B",
    fontSize: 11,
  },

  sessionTitle: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 5,
  },

  scanner: {
    backgroundColor: "#202B3A",
    borderRadius: 17,
    minHeight: 225,
    marginTop: 20,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  qrMark: {
    width: 95,
    height: 62,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },

  qrText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 2,
  },

  corner: {
    position: "absolute",
    width: 14,
    height: 14,
    borderColor: "#FFFFFF",
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },

  scanTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  scanHint: {
    color: "#C1CAD6",
    fontSize: 12,
    marginTop: 7,
    textAlign: "center",
  },

  scanAction: {
    color: "#DBEAFE",
    fontSize: 11,
    marginTop: 19,
    textAlign: "center",
  },

  pressed: {
    opacity: 0.75,
  },

  manualButton: {
    backgroundColor: "#EAF2FF",
    borderRadius: 11,
    minHeight: 46,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  manualText: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  stats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },

  stat: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E4EAF3",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },

  statValue: {
    fontSize: 21,
    fontWeight: "700",
  },

  statLabel: {
    color: "#64748B",
    fontSize: 10,
    marginTop: 3,
  },

  history: {
    marginTop: 24,
  },

  historyTitle: {
    color: "#111B30",
    fontSize: 16,
    fontWeight: "700",
  },

  emptyState: {
    paddingVertical: 16,
  },

  emptyTitle: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },

  emptyText: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  historyItem: {
    borderWidth: 1,
    borderColor: "#E4EAF3",
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
  },

  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  historyStudent: {
    flex: 1,
  },

  historyName: {
    color: "#111B30",
    fontSize: 15,
    fontWeight: "700",
  },

  historyMatricula: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },

  historyStatus: {
    fontSize: 12,
    fontWeight: "700",
  },

  historyDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },

  historyDetail: {
    color: "#64748B",
    fontSize: 12,
  },

  historyMethod: {
    color: "#2563EB",
    backgroundColor: "#EFF6FF",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: "700",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  dialog: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    padding: 24,
  },

  dialogDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },

  inputLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },

  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
    color: "#111B30",
    backgroundColor: "#F8FAFC",
  },

  resultBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
  },

  resultHeading: {
    fontSize: 15,
    fontWeight: "700",
  },

  resultMessage: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  studentName: {
    color: "#111B30",
    fontSize: 15,
    fontWeight: "600",
    marginTop: 12,
  },

  submitButton: {
    minHeight: 48,
    backgroundColor: "#2563EB",
    borderRadius: 11,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
  },

  submitDisabled: {
    backgroundColor: "#64748B",
  },

  submitText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },

  closeButton: {
    minHeight: 48,
    justifyContent: "center",
    marginTop: 5,
  },
});
