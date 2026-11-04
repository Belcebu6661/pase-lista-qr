
import { Router } from "express";

import {
    obtenerCarreras,
    obtenerGrupos,
    obtenerMaterias,
    obtenerReporteGeneral,
    obtenerReportePorGrupo,
    obtenerReportePorCarrera,
    exportarReportePDF,
    exportarReporteExcel
} from "../controllers/reportes.controllers.js";

const router = Router();

// ==========================================
// 1. CATÁLOGOS PARA FILTROS
// ==========================================

// Obtener carreras disponibles
router.get("/carreras", obtenerCarreras);

// Obtener grupos disponibles
router.get("/grupos", obtenerGrupos);

// Obtener materias disponibles
router.get("/materias", obtenerMaterias);


// ==========================================
// 2. EXPORTACIONES PDF
// ==========================================

// Reporte general
router.get("/general/pdf", exportarReportePDF);

// Reporte por grupo
router.get("/grupo/pdf", exportarReportePDF);

// Reporte por carrera
router.get("/carrera/pdf", exportarReportePDF);


// ==========================================
// 3. EXPORTACIONES EXCEL
// ==========================================

// Reporte general
router.get("/general/excel", exportarReporteExcel);

// Reporte por grupo
router.get("/grupo/excel", exportarReporteExcel);

// Reporte por carrera
router.get("/carrera/excel", exportarReporteExcel);


// ==========================================
// 4. CONSULTAS DE REPORTES
// ==========================================

// Consultar todas las asistencias
router.get("/general", obtenerReporteGeneral);

// Consultar asistencias filtradas por grupo
router.get("/grupo", obtenerReportePorGrupo);

// Consultar asistencias filtradas por carrera
// Nota: requiere que el esquema permita relacionar
// grupos con carreras.
router.get("/carrera", obtenerReportePorCarrera);


// ==========================================
// EXPORTAR ROUTER
// ==========================================

export default router;
