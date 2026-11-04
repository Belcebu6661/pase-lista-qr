
import { useState, useEffect } from "react";

import BotonesReportes from "./BotonesReportes";
import FiltrosReportes from "./FiltrosReportes";
import TablaReportes from "./TablaReportes";

import "../styles/Reportes.css";

// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API_URL = "http://localhost:3000/api/reportes";

const Reportes = () => {

    // ======================================
    // ESTADOS
    // ======================================

    const [tipoReporte, setTipoReporte] = useState("general");

    const [filtros, setFiltros] = useState({});

    const [data, setData] = useState([]);

    const [cargando, setCargando] = useState(false);

    const [error, setError] = useState(null);


    // ======================================
    // GUARDAR FILTROS EN LOCALSTORAGE
    // ======================================

    useEffect(() => {

        localStorage.setItem(
            "filtrosReporte",
            JSON.stringify(filtros)
        );

    }, [filtros]);


    // ======================================
    // FUNCIÓN PARA CONSULTAR REPORTES
    // ======================================

    const fetchReportes = async (filtrosConsulta = {}) => {

        // Activar indicador de carga
        setCargando(true);

        // Limpiar errores anteriores
        setError(null);

        try {

            // Identificar el reporte seleccionado.
            // Se utiliza el estado actual como referencia.

            const reporteSeleccionado =
                filtrosConsulta.tipoReporte ||
                tipoReporte ||
                "general";

            // Rutas disponibles en Express

            const rutasPermitidas = [
                "general",
                "grupo",
                "carrera"
            ];

            if (!rutasPermitidas.includes(reporteSeleccionado)) {

                throw new Error(
                    "El tipo de reporte seleccionado no es válido"
                );

            }

            // ==================================
            // PREPARAR FILTROS
            // ==================================

            const params = new URLSearchParams();

            const filtrosFinales = {
                ...filtrosConsulta,
                tipoReporte: reporteSeleccionado
            };

            Object.entries(filtrosFinales).forEach(
                ([clave, valor]) => {

                    if (
                        valor !== undefined &&
                        valor !== null &&
                        valor !== "" &&
                        valor !== "null" &&
                        valor !== "undefined"
                    ) {

                        params.append(
                            clave,
                            String(valor)
                        );

                    }

                }
            );


            // ==================================
            // CONSTRUIR URL
            // ==================================

            const url =
                `${API_URL}/${reporteSeleccionado}?${params.toString()}`;

            console.log(
                "CONSULTANDO REPORTE:",
                url
            );


            // ==================================
            // SOLICITUD AL BACKEND
            // ==================================

            const response = await fetch(url);

            // Leer la respuesta una sola vez

            const textoRespuesta = await response.text();

            let resultado;

            try {

                resultado = textoRespuesta
                    ? JSON.parse(textoRespuesta)
                    : {};

            } catch {

                throw new Error(
                    "El servidor devolvió una respuesta no válida"
                );

            }

            console.log(
                "RESPUESTA DEL BACKEND:",
                resultado
            );


            // ==================================
            // VALIDAR RESPUESTA
            // ==================================

            if (!response.ok || resultado.ok === false) {

                throw new Error(
                    resultado.mensaje ||
                    resultado.message ||
                    resultado.msg ||
                    `Error HTTP ${response.status}`
                );

            }


            // ==================================
            // EXTRAER REGISTROS
            // ==================================

            const registros = Array.isArray(resultado)
                ? resultado
                : Array.isArray(resultado.data)
                    ? resultado.data
                    : [];

            // Actualizar tabla

            setData(registros);

            console.log(
                "TOTAL DE REGISTROS:",
                registros.length
            );

            // Limpiar errores si todo salió bien

            setError(null);

        } catch (err) {

            console.error(
                "❌ ERROR AL OBTENER REPORTES:",
                err
            );

            // Limpiar datos cuando falla la consulta

            setData([]);

            // Mostrar mensaje dentro de la vista

            setError(
                err.message ||
                "No fue posible consultar los reportes"
            );

        } finally {

            // Desactivar indicador de carga

            setCargando(false);

        }
    };


    // ======================================
    // BOTÓN CONSULTAR
    // ======================================

    const handleConsultar = (filtrosRecibidos) => {

        // Utilizar los filtros recibidos del componente
        // o los almacenados en el estado.

        const filtrosActuales = (
            filtrosRecibidos &&
            typeof filtrosRecibidos === "object" &&
            !Array.isArray(filtrosRecibidos)
        )
            ? filtrosRecibidos
            : filtros;

        console.log(
            "FILTROS SELECCIONADOS:",
            filtrosActuales
        );

        fetchReportes({
            ...filtrosActuales,
            tipoReporte: tipoReporte
        });

    };


    // ======================================
    // CAMBIAR TIPO DE REPORTE
    // ======================================

    const cambiarTipoReporte = (nuevoTipo) => {

        setTipoReporte(nuevoTipo);

        // Limpiar resultados anteriores

        setData([]);

        setError(null);

        // Limpiar filtros del reporte anterior

        setFiltros({});

    };


    // ======================================
    // INTERFAZ PRINCIPAL
    // ======================================

    return (

        <div className="reportes-container">

            {/* ==================================
                ENCABEZADO
            ================================== */}

            <div className="reportes-header">

                <div className="header-left">

                    <h1>

                        <i className="fas fa-clipboard-list"></i>

                        {" "}Módulo de Reportes

                    </h1>

                    <p className="header-subtitle">

                        <i className="fas fa-info-circle"></i>

                        {" "}Consulta y genera reportes de
                        asistencia de los alumnos.

                    </p>

                </div>

                <div className="header-badge">

                    <i className="fas fa-users"></i>

                    <span>Asistencia</span>

                </div>

            </div>


            {/* ==================================
                BOTONES DE TIPO DE REPORTE
            ================================== */}

            <BotonesReportes

                tipoReporte={tipoReporte}

                setTipoReporte={cambiarTipoReporte}

            />


            {/* ==================================
                FILTROS
            ================================== */}

            <FiltrosReportes

                tipoReporte={tipoReporte}

                setFiltros={setFiltros}

                onConsultar={handleConsultar}

            />


            {/* ==================================
                RESULTADOS
            ================================== */}

            <div className="resultados-section">

                {/* Mensajes de error */}

                {error && (

                    <div className="error-message">

                        <i className="fas fa-exclamation-circle"></i>

                        <p>Error: {error}</p>

                    </div>

                )}


                {/* Indicador de carga */}

                {cargando ? (

                    <div className="loading-container">

                        <div className="spinner"></div>

                        <p className="loading-text">

                            Cargando datos...

                        </p>

                    </div>

                ) : (

                    /* Tabla de asistencias */

                    <TablaReportes data={data} />

                )}

            </div>

        </div>

    );
};

export default Reportes;
