import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Layers, UserRound, ClipboardList, ScanLine, RefreshCw, ArrowRight } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import api from "../api";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);
ChartJS.defaults.font.family = "inherit";
ChartJS.defaults.color = "#64748b";

const ESTADOS = {
  PRESENTE: { texto: "Presente", clase: "bg-green-50 text-green-700 ring-green-600/20", punto: "bg-green-500" },
  RETARDO: { texto: "Retardo", clase: "bg-amber-50 text-amber-700 ring-amber-600/20", punto: "bg-amber-500" },
  FALTA: { texto: "Falta", clase: "bg-red-50 text-red-700 ring-red-600/20", punto: "bg-red-500" },
  JUSTIFICADA: { texto: "Justificada", clase: "bg-blue-50 text-blue-700 ring-blue-600/20", punto: "bg-blue-500" },
};

const COLUMNAS = "sm:grid-cols-[130px_minmax(0,1fr)_110px_130px]";

const formatearHora = (iso) =>
  new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
const formatearFecha = (iso) =>
  new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
const esHoy = (iso) => new Date(iso).toDateString() === new Date().toDateString();
const iniciales = (nombre) =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function TarjetaResumen({ titulo, valor, Icono, tono }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${tono}`}>
        <Icono size={24} />
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-slate-900">
          {valor.toLocaleString("es-MX")}
        </p>
        <p className="text-sm font-medium text-slate-500 mt-1">{titulo}</p>
      </div>
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="p-6 md:p-8 mx-auto flex max-w-7xl flex-col gap-6 animate-pulse">
      <div className="h-10 w-56 rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-slate-200" />
        ))}
      </div>
      <div className="h-72 rounded-2xl bg-slate-200" />
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargarResumen = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/resumen", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!data.success) throw new Error(data.message);
      setResumen(data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarResumen();
    const id = setInterval(cargarResumen, 60000);
    return () => clearInterval(id);
  }, [cargarResumen]);

  const recargar = async () => {
    setRefrescando(true);
    await cargarResumen();
    setRefrescando(false);
  };

  if (cargando) return <Esqueleto />;

  if (!resumen) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800">No se pudo cargar el dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button
            onClick={recargar}
            disabled={refrescando}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw size={16} className={refrescando ? "animate-spin" : ""} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  const { tarjetas, ultimosRegistros, asistenciaSemanal } = resumen;

  const totalSemana = asistenciaSemanal.reduce(
    (acc, d) => acc + d.presente + d.retardo + d.falta + d.justificada,
    0
  );

  const fechaHoy = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const datosGrafica = {
    labels: asistenciaSemanal.map((d) => d.etiqueta),
    datasets: [
      { label: "Presente", data: asistenciaSemanal.map((d) => d.presente), backgroundColor: "#22c55e", maxBarThickness: 44 },
      { label: "Retardo", data: asistenciaSemanal.map((d) => d.retardo), backgroundColor: "#f59e0b", maxBarThickness: 44 },
      { label: "Falta", data: asistenciaSemanal.map((d) => d.falta), backgroundColor: "#ef4444", maxBarThickness: 44 },
      { label: "Justificada", data: asistenciaSemanal.map((d) => d.justificada), backgroundColor: "#3b82f6", maxBarThickness: 44 },
    ],
  };

  const opcionesGrafica = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        position: "bottom",
        labels: { usePointStyle: true, pointStyle: "circle", boxWidth: 8, padding: 16 },
      },
    },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: {
        stacked: true,
        beginAtZero: true,
        suggestedMax: 5,
        ticks: { precision: 0 },
        grid: { color: "#f1f5f9" },
        border: { display: false },
      },
    },
  };

  return (
    <div className="p-6 md:p-8 min-h-screen bg-slate-50/50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        {/* Encabezado */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-500">Resumen del control de asistencia diaria</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium capitalize text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
              {fechaHoy}
            </span>
            <button
              onClick={recargar}
              title="Actualizar"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:text-blue-600 cursor-pointer"
            >
              <RefreshCw size={16} className={refrescando ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Tarjetas */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <TarjetaResumen titulo="Alumnos activos" valor={tarjetas.alumnosActivos} Icono={Users} tono="bg-blue-100 text-blue-600" />
          <TarjetaResumen titulo="Grupos" valor={tarjetas.grupos} Icono={Layers} tono="bg-amber-100 text-amber-600" />
          <TarjetaResumen titulo="Profesores" valor={tarjetas.profesores} Icono={UserRound} tono="bg-purple-100 text-purple-600" />
          <TarjetaResumen titulo="Asistencias de hoy" valor={tarjetas.asistenciasHoy} Icono={ClipboardList} tono="bg-green-100 text-green-600" />
        </div>

        {/* Acceso rápido + gráfica */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-5 items-stretch">
          <section className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/30 p-6 sm:p-8 xl:col-span-2 shadow-sm">
            <ScanLine size={160} strokeWidth={1} className="absolute -right-6 -bottom-6 text-blue-200/50 pointer-events-none" aria-hidden="true" />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-slate-900">Iniciar pase de lista</h2>
              <p className="mt-2 max-w-xs text-slate-600 text-sm leading-relaxed">
                Acceso rápido al proceso diario de asistencia para registrar alumnos.
              </p>
            </div>
            <button
              onClick={() => navigate("/asistencia")}
              className="relative z-10 inline-flex items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:gap-3 hover:bg-blue-700 cursor-pointer"
            >
              Iniciar pase de lista <ArrowRight size={18} />
            </button>
          </section>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-3 flex flex-col justify-between">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Asistencia de los últimos 7 días</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {totalSemana} registros
              </span>
            </div>
            <div className="relative h-64 w-full">
              <Bar data={datosGrafica} options={opcionesGrafica} />
              {totalSemana === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm border border-slate-100">
                    Sin registros en los últimos 7 días
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Últimos registros */}
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Últimos registros</h2>
            <button
              onClick={() => navigate("/asistencia")}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {ultimosRegistros.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">Aún no hay registros de asistencia.</p>
          ) : (
            <div role="table" className="w-full">
              <div
                role="row"
                className={`hidden sm:grid ${COLUMNAS} gap-4 bg-slate-50/80 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100`}
              >
                <span role="columnheader">Hora</span>
                <span role="columnheader">Alumno</span>
                <span role="columnheader">Grupo</span>
                <span role="columnheader">Estado</span>
              </div>

              <div className="divide-y divide-slate-100">
                {ultimosRegistros.map((r) => {
                  const est = ESTADOS[r.estado];
                  return (
                    <div
                      key={r.id}
                      role="row"
                      className={`grid grid-cols-2 items-center gap-x-4 gap-y-2 px-6 py-3.5 transition hover:bg-slate-50/50 sm:${COLUMNAS.replace("sm:", "")} ${COLUMNAS}`}
                    >
                      <div role="cell" className="text-sm text-slate-700">
                        <span className="font-semibold">{formatearHora(r.fechaHora)}</span>
                        {!esHoy(r.fechaHora) && (
                          <span className="ml-2 text-xs text-slate-400">{formatearFecha(r.fechaHora)}</span>
                        )}
                      </div>
                      <div role="cell" className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          {iniciales(r.alumno)}
                        </span>
                        <span className="truncate text-sm font-medium text-slate-900">{r.alumno}</span>
                      </div>
                      <div role="cell">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {r.grupo}
                        </span>
                      </div>
                      <div role="cell">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                            est?.clase ?? "bg-slate-50 text-slate-600 ring-slate-500/20"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${est?.punto ?? "bg-slate-400"}`} />
                          {est?.texto ?? r.estado}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;