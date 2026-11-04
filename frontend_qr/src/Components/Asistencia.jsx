import axios from "axios";
import { useState, useEffect } from "react";

import RegistrarAsistencia from "./RegistrarAsistencia"; 

const API_URL = "http://localhost:3000/api";

const ESTILOS_ESTADO = {
    PRESENTE: { dot: "bg-emerald-500", text: "text-emerald-700 bg-emerald-50" },
};

const COLORES_AVATAR = [
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-sky-100 text-sky-700 border-sky-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-rose-100 text-rose-700 border-rose-200",
    "bg-violet-100 text-violet-700 border-violet-200",
];

function obtenerIniciales(nombre, apellido) {
    const n = nombre?.charAt(0) || "";
    const a = apellido?.charAt(0) || "";
    return (n + a).toUpperCase() || "?";
}

function Asistencia() {
    // NUEVO ESTADO: Controla si vemos "consultar" o "registrar"
    const [vista, setVista] = useState("consultar"); 

    const [modo, setModo] = useState("todos");
    const [matricula, setMatricula] = useState("");
    const [fecha, setFecha] = useState("");

    const [asistencias, setAsistencias] = useState([]);
    const [alumnoInfo, setAlumnoInfo] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    const buscarTodos = async () => {
        setCargando(true);
        setMensaje("");
        setAlumnoInfo(null);
        try {
            const respuesta = await axios.get(`${API_URL}/asistencias`);
            const datos = respuesta.data.data || [];
            setAsistencias(datos);
            if (datos.length === 0) {
                setMensaje("No hay asistencias registradas todavía.");
            }
        } catch (error) {
            console.error("Error al buscar todos:", error);
            setAsistencias([]);
            setMensaje("Error al consultar las asistencias.");
        } finally {
            setCargando(false);
        }
    };

    const buscarPorMatricula = async () => {
        if (!matricula.trim()) {
            setMensaje("Escribe una matrícula para buscar.");
            return;
        }
        setCargando(true);
        setMensaje("");
        try {
            const respuesta = await axios.get(`${API_URL}/asistencias/alumno/${matricula.trim()}`);
            setAsistencias(respuesta.data.data || []);
            setAlumnoInfo(respuesta.data.alumno || null);
        } catch (error) {
            console.error("Error por matrícula:", error);
            setAsistencias([]);
            setAlumnoInfo(null);
            if (error.response?.status === 404) {
                setMensaje(error.response.data.message || "Alumno no encontrado.");
            } else {
                setMensaje("Error al consultar las asistencias.");
            }
        } finally {
            setCargando(false);
        }
    };

    const buscarPorFecha = async () => {
        if (!fecha) {
            setMensaje("Selecciona una fecha para buscar.");
            return;
        }
        setCargando(true);
        setMensaje("");
        alumnoInfo && setAlumnoInfo(null);
        try {
            const respuesta = await axios.get(`${API_URL}/asistencias/fecha/${fecha}`);
            setAsistencias(respuesta.data.data || []);
        } catch (error) {
            console.error("Error por fecha:", error);
            setAsistencias([]);
            if (error.response?.status === 404) {
                setMensaje(error.response.data.message || "No hay asistencias en esa fecha.");
            } else {
                setMensaje("Error al consultar las asistencias.");
            }
        } finally {
            setCargando(false);
        }
    };

    const manejarBuscar = () => {
        if (modo === "todos") buscarTodos();
        if (modo === "matricula") buscarPorMatricula();
        if (modo === "fecha") buscarPorFecha();
    };

    const cambiarModo = (nuevoModo) => {
        setModo(nuevoModo);
        setAsistencias([]);
        setAlumnoInfo(null);
        setMensaje("");
    };

    useEffect(() => {
        if (modo === "todos" && vista === "consultar") {
            buscarTodos();
        }
    }, [modo, vista]);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-6 box-border space-y-8">
            
            {/* Encabezado Principal adaptado para incluir el botón dinámico */}
            <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Asistencias</h1>
                    <p className="text-sm text-slate-500 max-w-2xl">
                        Administra y consulta el historial de pases de lista global del sistema, filtrando convenientemente por estudiantes o fechas específicas.
                    </p>
                </div>
                
                {/* Muestra el botón de agregar (+) solo si no estamos ya en la vista de registro */}
                {vista === "consultar" && (
                    <button
                        onClick={() => setVista("registrar")}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full shadow-md shadow-blue-100 transition-all self-start sm:self-center shrink-0 group"
                    >
                        <span className="text-lg font-bold group-hover:scale-120 transition-transform">+</span>
                        <span>Registrar Asistencia</span>
                    </button>
                )}
            </div>

            {/* RENDERIZADO CONDICIONAL DE VISTAS */}
            {vista === "registrar" ? (
                <RegistrarAsistencia 
                    alVolver={() => setVista("consultar")} 
                    onAsistenciaCreada={() => {
                        if (modo === "todos") buscarTodos();
                    }}
                />
            ) : (
                <>
                    {/* Contenedor de Filtros y Búsqueda */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                                Método de Consulta
                            </label>
                  
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => cambiarModo("todos")}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                                        modo === "todos"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Todos
                                </button>

                                <button
                                    onClick={() => cambiarModo("matricula")}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                                        modo === "matricula"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    Por matrícula
                                </button>

                                <button
                                    onClick={() => cambiarModo("fecha")}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                                        modo === "fecha"
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                                    }`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Por fecha
                                </button>
                            </div>
                        </div>

                        {/* Formulario de Entrada Dinámico */}
                        {modo !== "todos" && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex flex-col sm:flex-row gap-3 max-w-2xl items-end">
                                    
                                    {modo === "matricula" && (
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                Matrícula del Alumno
                                            </label>
                                            <div className="flex items-center w-full h-[46px] border border-slate-300 shadow-sm rounded-md bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                                <span className="pl-4 pr-2 text-slate-400 select-none shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type="text"
                                                    value={matricula}
                                                    onChange={(e) => setMatricula(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && manejarBuscar()}
                                                    placeholder="Introduce la matrícula (Ej. 2330852)"
                                                    className="w-full pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {modo === "fecha" && (
                                        <div className="flex-1 w-full">
                                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                Seleccionar Día
                                            </label>
                                            <input
                                                type="date"
                                                value={fecha}
                                                onChange={(e) => setFecha(e.target.value)}
                                                className="w-full h-[46px] px-4 rounded-md border border-slate-300 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white transition-all"
                                            />
                                        </div>
                                    )}

                                    <button
                                        onClick={manejarBuscar}
                                        className="w-full sm:w-auto px-6 rounded-md bg-blue-600 text-white text-sm font-semibold shadow-md shadow-blue-100 hover:bg-blue-700 active:scale-[0.98] transition-all h-[46px] shrink-0 flex items-center justify-center"
                                    >
                                        Ejecutar Filtro
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Tarjeta del Alumno */}
                    {alumnoInfo && (
                        <div className="p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50/30 border border-blue-100 shadow-sm flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                                {obtenerIniciales(alumnoInfo.nombre, alumnoInfo.apellidoPaterno)}
                            </div>
                            <div>
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-100 rounded-full uppercase tracking-wider mb-1">
                                    Perfil Vinculado
                                </span>
                                <h3 className="font-bold text-slate-800 text-base leading-tight">
                                    {alumnoInfo.nombre} {alumnoInfo.apellidoPaterno}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-mono">Matrícula: {alumnoInfo.matricula}</p>
                            </div>
                        </div>
                    )}

                    {/* Estados de Carga y Mensajes Vacíos */}
                    {cargando && (
                        <div className="flex flex-col items-center gap-3 py-16 bg-white rounded-xl border border-slate-200 shadow-sm justify-center w-full">
                            <span className="animate-spin text-3xl">⏳</span>
                            <p className="text-sm font-medium text-slate-500">Sincronizando registros en tiempo real...</p>
                        </div>
                    )}

                    {!cargando && mensaje && (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200 shadow-inner w-full px-4">
                            <span className="text-3xl block mb-2">📁</span>
                            <p className="text-sm font-medium text-slate-400">{mensaje}</p>
                        </div>
                    )}

                    {/* Tabla de Resultados */}
                    {!cargando && asistencias.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    Lista de Registros ({asistencias.length})
                                </h2>
                            </div>
                            
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
                                <div className="overflow-x-auto w-full">
                                    <table className="w-full text-sm min-w-[750px] border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                                <th className="px-6 py-4 text-left">Estudiante</th>
                                                <th className="px-6 py-4 text-left">Asignatura</th>
                                                <th className="px-6 py-4 text-left">Docente</th>
                                                <th className="px-6 py-4 text-left">Fecha de captura</th>
                                                <th className="px-6 py-4 text-center">Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {asistencias.map((a, i) => {
                                                const colorAvatar = COLORES_AVATAR[i % COLORES_AVATAR.length];
                                                const estilo = ESTILOS_ESTADO[a.estado] || { dot: "bg-slate-400", text: "text-slate-600 bg-slate-50" };
                                                const alumno = a.alumno || alumnoInfo;
                                                return (
                                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-9 w-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${colorAvatar} shadow-sm`}>
                                                                    {obtenerIniciales(alumno?.nombre, alumno?.apellidoPaterno)}
                                                                </div>
                                                                <div className="leading-tight">
                                                                    <p className="font-semibold text-slate-700 whitespace-nowrap group-hover:text-blue-600 transition-colors">
                                                                        {alumno ? `${alumno.nombre} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno || ""}` : "—"}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                                        {alumno?.matricula || "—"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                                            {a.sesionQR?.mmg?.materia?.nombre || "—"}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                            {a.sesionQR?.mmg?.maestro?.nombre || "—"}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500 whitespace-nowrap font-medium">
                                                            {a.fechaHora ? new Date(a.fechaHora).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : "—"}
                                                        </td>
                                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-current/10 ${estilo.text}`}>
                                                                <span className={`h-2 w-2 rounded-full ${estilo.dot}`}></span>
                                                                {a.estado}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Asistencia;