import React, { useEffect, useRef, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAttendance } from "../context/AttendanceContext";

const API_URL = "http://192.168.137.99:3000/api/asistencias";
const DOCENTE_ID = "maestro-001";

type Student = {
  nombre?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  grupo?: string | null;
};

type Result = {
  kind: "success" | "duplicate" | "error";
  message: string;
  student?: Student;
  receivedAt: string;
};

type AttendancePayload = {
  success?: boolean;
  message?: string;
  alumno?: Student;
};

const presentation = {
  success: {
    title: "Asistencia registrada",
    color: "#15803D",
    background: "#ECFDF3",
    symbol: "✓",
  },
  duplicate: {
    title: "Asistencia ya registrada",
    color: "#B45309",
    background: "#FFF7E6",
    symbol: "!",
  },
  error: {
    title: "No se pudo registrar",
    color: "#B91C1C",
    background: "#FEF2F2",
    symbol: "!",
  },
};

export default function Scanner() {
  const router = useRouter();
  const { addRecord, setSessionState } = useAttendance();

  const [permission, requestPermission, refreshPermission] =
    useCameraPermissions();

  const [foreground, setForeground] = useState(
    AppState.currentState === "active"
  );
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [ready, setReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const locked = useRef(false);
  const switchingCamera = useRef(false);
  const mounted = useRef(true);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, []);

  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => {
      const isActive = state === "active";
      setForeground(isActive);

      if (!isActive) setReady(false);
      if (isActive) void refreshPermission().catch(() => {});
    });

    return () => listener.remove();
  }, [refreshPermission]);

  const goHome = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const enableCamera = async () => {
    setPermissionError("");

    try {
      if (permission?.canAskAgain === false) {
        await Linking.openSettings();
      } else {
        await requestPermission();
      }
    } catch {
      if (mounted.current) {
        setPermissionError(
          "No pudimos abrir los permisos. Revisa los ajustes de la aplicación."
        );
      }
    }
  };

  const cambiarCamara = () => {
    if (
      !ready ||
      loading ||
      locked.current ||
      switchingCamera.current
    ) {
      return;
    }

    switchingCamera.current = true;
    setReady(false);
    setCameraError("");
    setFacing((actual) => (actual === "back" ? "front" : "back"));
  };

  const scanAgain = () => {
    setReady(false);
    setResult(null);
    locked.current = false;
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (
      locked.current ||
      switchingCamera.current ||
      !ready ||
      !foreground
    ) {
      return;
    }

    locked.current = true;

    const matricula = data.trim();
    const receivedAt = () =>
      new Date().toLocaleTimeString("es-MX", {
        timeZone: "America/Mexico_City",
        hour: "2-digit",
        minute: "2-digit",
      });

    if (!matricula) {
      setResult({
        kind: "error",
        message: "El QR está vacío. Prueba con el código del alumno.",
        receivedAt: receivedAt(),
      });
      return;
    }

    setLoading(true);

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
          matricula,
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

      if (!payload || typeof payload !== "object") {
        throw new Error("INVALID_RESPONSE");
      }

      if (!mounted.current) return;

      const kind =
        response.ok && payload.success === true
          ? "success"
          : response.status === 409
            ? "duplicate"
            : "error";

      if (kind === "success") {
        setSessionState("Activa");
      } else if (
        payload.message ===
        "No hay ninguna sesión QR activa para este docente"
      ) {
        setSessionState("No disponible");
      }

      setResult({
        kind,
        message:
          typeof payload.message === "string" && payload.message.trim()
            ? payload.message
            : kind === "success"
              ? "El servidor confirmó el registro."
              : kind === "duplicate"
                ? "La asistencia ya estaba registrada."
                : "No fue posible registrar la asistencia.",
        student: payload.alumno,
        receivedAt: receivedAt(),
      });

      if (kind === "success" || kind === "duplicate") addRecord();
      if (kind === "success") Vibration.vibrate(200);
    } catch (error) {
      if (!mounted.current) return;

      const message = controller.signal.aborted
        ? "El servidor tardó demasiado en responder. El registro podría haberse guardado; verifica antes de repetir."
        : error instanceof Error && error.message === "INVALID_RESPONSE"
          ? "El servidor devolvió una respuesta inesperada. Verifica el registro antes de repetir."
          : "No se pudo confirmar el registro. Revisa tu conexión y verifica la asistencia antes de repetir.";

      setResult({
        kind: "error",
        message,
        receivedAt: receivedAt(),
      });
    } finally {
      clearTimeout(timeout);
      request.current = null;

      if (mounted.current) setLoading(false);
    }
  };

  const modalVisible = loading || result !== null;
  const visual = result ? presentation[result.kind] : null;
  const fullName = result?.student
    ? [
        result.student.nombre,
        result.student.apellidoPaterno,
        result.student.apellidoMaterno,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.card}>
          <Pressable
            accessibilityRole="button"
            onPress={goHome}
            style={styles.back}
          >
            <Text style={styles.link}>‹ Volver al inicio</Text>
          </Pressable>

          <Text style={styles.brand}>Pase de lista QR</Text>
          <Text style={styles.title}>Escanear asistencia</Text>
          <Text style={styles.subtitle}>
            Coloca el QR del alumno frente a la cámara.
          </Text>

          <View style={styles.info}>
            <Text style={styles.infoLabel}>Lectura de código</Text>
            <Text style={styles.infoTitle}>Un alumno a la vez</Text>
          </View>

          <View style={styles.cameraBox}>
            {!permission ? (
              <View style={styles.center}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.cameraText}>
                  Consultando permisos…
                </Text>
              </View>
            ) : !permission.granted ? (
              <View style={styles.center}>
                <Text style={styles.cameraHeading}>Activa la cámara</Text>
                <Text style={styles.cameraText}>
                  Necesitamos tu permiso para leer los códigos QR.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  style={styles.permissionButton}
                  onPress={enableCamera}
                >
                  <Text style={styles.whiteButtonText}>
                    {permission.canAskAgain
                      ? "Permitir cámara"
                      : "Abrir ajustes"}
                  </Text>
                </Pressable>

                {!!permissionError && (
                  <Text style={styles.cameraText}>{permissionError}</Text>
                )}
              </View>
            ) : cameraError ? (
              <View style={styles.center}>
                <Text style={styles.cameraHeading}>
                  Cámara no disponible
                </Text>
                <Text style={styles.cameraText}>
                  Cierra otras apps que usen la cámara e inténtalo de nuevo.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  style={styles.permissionButton}
                  onPress={() => {
                    switchingCamera.current = false;
                    setReady(false);
                    setFacing("back");
                    setCameraError("");
                  }}
                >
                  <Text style={styles.whiteButtonText}>
                    Reintentar con cámara trasera
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                {foreground && !modalVisible && (
                  <CameraView
                    key={facing}
                    style={StyleSheet.absoluteFill}
                    facing={facing}
                    barcodeScannerSettings={{
                      barcodeTypes: ["qr"],
                    }}
                    onCameraReady={() => {
                      switchingCamera.current = false;
                      setReady(true);
                    }}
                    onMountError={() => {
                      switchingCamera.current = false;
                      setReady(false);
                      setCameraError("unavailable");
                    }}
                    onBarcodeScanned={ready ? handleScan : undefined}
                  />
                )}

                <View
                  style={styles.cameraOverlay}
                  pointerEvents="none"
                >
                  <View style={styles.frame}>
                    <View style={[styles.corner, styles.tl]} />
                    <View style={[styles.corner, styles.tr]} />
                    <View style={[styles.corner, styles.bl]} />
                    <View style={[styles.corner, styles.br]} />
                  </View>

                  <Text style={styles.cameraBadge}>
                    {ready
                      ? "Acerca el QR al recuadro"
                      : "Preparando cámara…"}
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Cambiar entre cámara frontal y trasera"
                  accessibilityState={{
                    disabled: !ready || loading || !foreground,
                  }}
                  disabled={!ready || loading || !foreground}
                  onPress={cambiarCamara}
                  style={({ pressed }) => [
                    styles.flipButton,
                    (pressed || !ready || loading || !foreground) &&
                      styles.dimmed,
                  ]}
                >
                  <Text style={styles.flipButtonText}>
                    {facing === "back" ? "Usar frontal" : "Usar trasera"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <Text style={styles.tip}>
            Mantén el código visible y evita reflejos. La lectura se
            realiza automáticamente.
          </Text>

          <Pressable
            accessibilityRole="button"
            style={styles.secondaryButton}
            onPress={goHome}
          >
            <Text style={styles.link}>Volver al inicio</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!loading) goHome();
        }}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog} accessibilityViewIsModal>
            <ScrollView contentContainerStyle={styles.dialogContent}>
              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.resultTitle}>
                    Registrando asistencia
                  </Text>
                  <Text style={styles.resultMessage}>
                    Espera la confirmación del servidor.
                  </Text>
                </View>
              ) : result && visual ? (
                <>
                  <View
                    style={[
                      styles.statusIcon,
                      { backgroundColor: visual.background },
                    ]}
                  >
                    <Text
                      style={[styles.symbol, { color: visual.color }]}
                    >
                      {visual.symbol}
                    </Text>
                  </View>

                  <Text
                    accessibilityRole="header"
                    style={[styles.resultTitle, { color: visual.color }]}
                  >
                    {visual.title}
                  </Text>

                  <Text
                    accessibilityLiveRegion="polite"
                    style={styles.resultMessage}
                  >
                    {result.message}
                  </Text>

                  {!!fullName && (
                    <View style={styles.student}>
                      <Text style={styles.studentName}>{fullName}</Text>
                      <Text style={styles.subtitle}>
                        Grupo:{" "}
                        {result.student?.grupo || "Sin grupo informado"}
                      </Text>
                    </View>
                  )}

                  <Text style={styles.time}>
                    Hora de respuesta: {result.receivedAt}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    style={styles.primaryButton}
                    onPress={scanAgain}
                  >
                    <Text style={styles.whiteButtonText}>
                      Escanear otro código
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    style={styles.secondaryButton}
                    onPress={goHome}
                  >
                    <Text style={styles.link}>Volver al inicio</Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
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
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D7E2F1",
    padding: 24,
  },
  back: {
    minHeight: 44,
    justifyContent: "center",
    marginBottom: 8,
  },
  link: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
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
    lineHeight: 20,
    marginTop: 5,
  },
  info: {
    backgroundColor: "#EFF4FF",
    padding: 16,
    borderRadius: 15,
    marginTop: 20,
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 11,
  },
  infoTitle: {
    color: "#2563EB",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 5,
  },
  cameraBox: {
    height: 320,
    backgroundColor: "#202B3A",
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 20,
  },
  center: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraHeading: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  cameraText: {
    color: "#D5DDE7",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
  },
  permissionButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    padding: 14,
    marginTop: 18,
    minHeight: 48,
  },
  cameraOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  flipButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  flipButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  dimmed: {
    opacity: 0.6,
  },
  frame: {
    width: "85%",
    maxWidth: 240,
    aspectRatio: 1,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "#FFFFFF",
  },
  tl: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  tr: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bl: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  br: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  cameraBadge: {
    color: "#FFFFFF",
    fontSize: 12,
    backgroundColor: "rgba(15,23,42,0.8)",
    borderRadius: 8,
    padding: 8,
    marginTop: 16,
    textAlign: "center",
  },
  tip: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 16,
  },
  secondaryButton: {
    backgroundColor: "#EAF2FF",
    borderRadius: 11,
    padding: 14,
    minHeight: 48,
    justifyContent: "center",
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 11,
    padding: 14,
    minHeight: 48,
    justifyContent: "center",
    marginTop: 20,
  },
  whiteButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.6)",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
  },
  dialogContent: {
    padding: 24,
  },
  loading: {
    alignItems: "center",
    paddingVertical: 28,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  symbol: {
    fontSize: 32,
    fontWeight: "700",
  },
  resultTitle: {
    color: "#111B30",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
  },
  resultMessage: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
  },
  student: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    marginTop: 18,
  },
  studentName: {
    color: "#111B30",
    fontSize: 17,
    fontWeight: "700",
  },
  time: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
  },
});