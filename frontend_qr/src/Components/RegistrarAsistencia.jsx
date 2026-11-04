import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:3000/api";

function RegistrarAsistencia({ alVolver, onAsistenciaCreada }) {
    const [matricula, setMatricula] = useState("");
    const [docenteId, setDocenteId] = useState(""); 
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: "", tipo: "" });

    // Inicializamos el estado cargando lo que haya guardado en el localStorage
    const [ultimosRegistros, setUltimosRegistros] = useState(() => {
        const guardados = localStorage.getItem("ultimos_registros_asistencia");
        return guardados ? JSON.parse(guardados) : [];
    });

    // Respaldamos en el localStorage cada vez que cambie la lista
    useEffect(() => {
        localStorage.setItem("ultimos_registros_asistencia", JSON.stringify(ultimosRegistros));
    }, [ultimosRegistros]);

    const manejarRegistro = async (e) => {
        e.preventDefault();
        if (!matricula.trim() || !docenteId.trim()) {
            setMensaje({ texto: "Todos los campos son obligatorios.", tipo: "error" });
            return;
        }

        setCargando(true);
        setMensaje({ texto: "", tipo: "" });

        try {
            const respuesta = await axios.post(`${API_URL}/asistencias`, {
                matricula: matricula.trim(),
                docente_id: docenteId.trim()
            });

            if (respuesta.data.success) {
                let primerNombre = "Alumno";

                try {
                    const infoAlumno = await axios.get(`${API_URL}/asistencias/alumno/${matricula.trim()}`);
                    if (infoAlumno.data?.alumno?.nombre) {
                        primerNombre = infoAlumno.data.alumno.nombre.split(" ")[0];
                    }
                } catch (errNombre) {
                    console.error("No se pudo obtener el nombre del alumno para el panel lateral:", errNombre);
                }

                const ahora = new Date();
                const horaActual = ahora.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
                const fechaActual = ahora.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric" });

                setMensaje({ texto: "¡Asistencia registrada con éxito!", tipo: "exito" });
                 
                const nuevoRegistro = {
                    matricula: matricula.trim(),
                    nombre: primerNombre,
                    hora: horaActual,
                    fecha: fechaActual
                };
                
                setUltimosRegistros((prev) => [nuevoRegistro, ...prev].slice(0, 2));
                setMatricula(""); 
                setDocenteId("");
                if (onAsistenciaCreada) onAsistenciaCreada(); 
            }
        } catch (error) {
            console.error("Error al registrar:", error);
            setMensaje({ 
                texto: error.response?.data?.message || "Error interno al registrar la asistencia.", 
                tipo: "error" 
            });
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-10 space-y-10 box-border">
            
            {/* Botón para regresar */}
            <div className="block">
                <button 
                    onClick={alVolver}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
                >
                    ← Volver a Consultas
                </button>
            </div>

            {/* Grid de contenido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start !mt-2">
                
                {/* Formulario Izquierdo */}
                <div className="md:col-span-2 bg-white p-10 rounded-xl border border-slate-200 shadow-sm space-y-8">
                    <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-100 pb-4">
                        Registro Manual de Asistencia
                    </h2>
                    
                    <form onSubmit={manejarRegistro} className="space-y-8 flex flex-col">
                        
                        {/* CAMPO 1: DOCENTE */}
                        <div className="flex flex-col space-y-3 !mt-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                ID del Docente (UUID de la base de datos)
                            </label>
                            <input 
                                type="text"
                                value={docenteId}
                                onChange={(e) => setDocenteId(e.target.value)}
                                placeholder="Ej: 06787285-500e-472e-86a9-1d9cca7c8296"
                                className="w-full h-[52px] px-4 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* CAMPO 2: MATRÍCULA */}
                        <div className="flex flex-col space-y-3 !mt-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Matrícula del Alumno
                            </label>
                            <input 
                                type="text"
                                value={matricula}
                                onChange={(e) => setMatricula(e.target.value)}
                                placeholder="Introduce la matrícula del estudiante"
                                className="w-full h-[52px] px-4 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* MENSAJE DE ESTADO */}
                        {mensaje.texto && (
                            <div className={`p-4 rounded-lg text-sm font-semibold transition-all border ${
                                mensaje.tipo === "exito" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                                {mensaje.texto}
                            </div>
                        )}

                        {/* SOLUCIÓN TAILWIND v4: Forzamos el margen superior drásticamente con !mt-16 y padding pt-8 */}
                        <div className="!mt-4 pt-2 border-t border-slate-100 w-full">
                            <button 
                                type="submit"
                                disabled={cargando}
                                className="w-full h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center text-sm tracking-wide cursor-pointer"
                            >
                                {cargando ? "Registrando..." : "Registrar Asistencia"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Panel Derecho: Historial de Últimos registros */}
                <div className="bg-slate-50/60 p-6 rounded-xl border border-slate-200 shadow-inner h-fit space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                            Últimos registros ({ultimosRegistros.length})
                        </h3>
                        {ultimosRegistros.length > 0 && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        )}
                    </div>
                    
                    {ultimosRegistros.length === 0 ? (
                        <p className="text-sm text-slate-400 italic py-6 text-center">
                            No se han hecho capturas en esta sesión.
                        </p>
                    ) : (
                        <ul className="space-y-4">
                            {ultimosRegistros.map((reg, index) => (
                                <li 
                                    key={index} 
                                    className="flex flex-col p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 hover:border-slate-300 relative overflow-hidden"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-emerald-500 font-bold text-sm">✓</span>
                                            <span className="text-sm font-bold text-slate-800">
                                                {reg.nombre}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                            {reg.matricula}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 border-t border-slate-100 pt-3">
                                        <span className="flex items-center gap-1">
                                            📅 {reg.fecha}
                                        </span>
                                        <span className="flex items-center gap-1 font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                            🕒 {reg.hora}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RegistrarAsistencia;