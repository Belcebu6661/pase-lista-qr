import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

// Consulta existente de consultarAsistencias. Verifica el montaje en tus rutas.
const API_URL = "http://192.168.137.99:3000/api/asistencias";
export const SCHOOL_TIME_ZONE = "America/Mexico_City";
export type SessionState = "Sin verificar" | "Activa" | "No disponible";
export type AttendanceMethod = "QR" | "Manual";
export type AttendanceStatus = "PRESENTE" | "RETARDO" | "JUSTIFICADA" | "FALTA";
export type AttendanceRecord = {
  id: string;
  matricula: string;
  nombre: string;
  grupo?: string;
  hora: string;
  fechaHora: string;
  metodo?: AttendanceMethod;
  estado: AttendanceStatus;
};

export function schoolDay(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHOOL_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((p) => p.type === name)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// Cuenta alumnos únicos del día, aunque el backend anterior tenga varias sesiones.
// Conserva el registro más reciente por alumno; no elimina nada de la base de datos.
export function normalizeDailyRecords(data: unknown, day: string): AttendanceRecord[] {
  if (!Array.isArray(data)) throw new Error("INVALID_RESPONSE");
  const unique = new Map<string, AttendanceRecord>();
  for (const raw of data) {
    if (!raw || typeof raw !== "object") throw new Error("INVALID_RESPONSE");
    const date = new Date(raw.fechaHora);
    if (!raw.fechaHora || Number.isNaN(date.getTime())) throw new Error("INVALID_RESPONSE");
    if (schoolDay(date) !== day) continue;
    const student = raw.alumno;
    if (!student || typeof student.matricula !== "string" || typeof raw.id !== "string"
      || !["PRESENTE", "RETARDO", "JUSTIFICADA", "FALTA"].includes(raw.estado)) {
      throw new Error("INVALID_RESPONSE");
    }
    const record: AttendanceRecord = {
      id: raw.id,
      matricula: student.matricula,
      nombre: [student.nombre, student.apellidoPaterno, student.apellidoMaterno]
        .filter((part): part is string => typeof part === "string" && !!part.trim()).join(" ") || student.matricula,
      grupo: typeof student.grupo?.nombre === "string" ? student.grupo.nombre : undefined,
      hora: date.toLocaleTimeString("es-MX", { timeZone: SCHOOL_TIME_ZONE, hour: "2-digit", minute: "2-digit" }),
      fechaHora: date.toISOString(),
      estado: raw.estado,
      metodo: raw.metodo === "QR" || raw.metodo === "Manual" ? raw.metodo : undefined,
    };
    const previous = unique.get(record.matricula);
    if (!previous || record.fechaHora > previous.fechaHora) unique.set(record.matricula, record);
  }
  return [...unique.values()].sort((a, b) => b.fechaHora.localeCompare(a.fechaHora));
}

type AttendanceContextType = {
  sessionState: SessionState;
  setSessionState: (state: SessionState) => void;
  records: AttendanceRecord[];
  loading: boolean;
  error: string | null;
  hasLoaded: boolean;
  lastUpdated: string | null;
  refreshRecords: () => Promise<void>;
  addRecord: () => void;
  clearRecords: () => void;
};
const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [sessionState, setSessionState] = useState<SessionState>("Sin verificar");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const mounted = useRef(false);
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const currentDay = useRef(schoolDay(new Date()));

  const refreshRecords = useCallback(async (): Promise<void> => {
    if (!mounted.current) return;
    const day = schoolDay(new Date());
    if (currentDay.current !== day) {
      currentDay.current = day;
      setSessionState("Sin verificar");
      setRecords([]); setHasLoaded(false); setLastUpdated(null);
    }
    const ticket = ++sequence.current;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError(null);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const payload = await Promise.race([
        (async () => {
          const response = await fetch(API_URL, { signal: controller.signal });
          if (!response.ok) throw new Error(`HTTP_${response.status}`);
          return await response.json();
        })(),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(() => {
            reject(new Error("TIMEOUT"));
            controller.abort();
          }, 15000);
        }),
      ]);
      if (!payload || payload.success !== true) throw new Error("INVALID_RESPONSE");
      const daily = normalizeDailyRecords(payload.data, day);
      if (!mounted.current || ticket !== sequence.current) return;
      if (schoolDay(new Date()) !== day) {
        void refreshRecords();
        return;
      }
      setRecords(daily); setHasLoaded(true);
      setLastUpdated(new Date().toLocaleTimeString("es-MX", {
        timeZone: SCHOOL_TIME_ZONE, hour: "2-digit", minute: "2-digit",
      }));
    } catch (cause) {
      if (mounted.current && ticket === sequence.current) {
        const detail = cause instanceof Error ? cause.message : "";
        setError(detail === "TIMEOUT"
          ? "El servidor no respondió en 15 segundos. Revisa la conexión e intenta actualizar."
          : detail.startsWith("HTTP_")
            ? `La consulta de asistencias devolvió HTTP ${detail.slice(5)}. Revisa la ruta del backend.`
            : detail === "INVALID_RESPONSE"
              ? "El servidor devolvió datos de asistencia inesperados."
              : "No se pudo actualizar el resumen. Revisa la conexión y la URL del backend.");
      }
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
      if (mounted.current && ticket === sequence.current) { request.current = null; setLoading(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refreshRecords();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshRecords();
    });
    const timer = setInterval(() => {
      if (currentDay.current !== schoolDay(new Date())) void refreshRecords();
    }, 30000);
    return () => {
      mounted.current = false;
      ++sequence.current;
      request.current?.abort();
      listener.remove(); clearInterval(timer);
    };
  }, [refreshRecords]);

  const addRecord = useCallback(() => { void refreshRecords(); }, [refreshRecords]);
  const clearRecords = useCallback(() => {
    ++sequence.current; request.current?.abort(); setLoading(false);
    setRecords([]); setHasLoaded(false); setLastUpdated(null); setError(null);
    setSessionState("Sin verificar");
  }, []);

  return (
    <AttendanceContext.Provider value={{ sessionState, setSessionState, records, loading, error, hasLoaded, lastUpdated, refreshRecords, addRecord, clearRecords }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) throw new Error("useAttendance debe utilizarse dentro de AttendanceProvider");
  return context;
}
