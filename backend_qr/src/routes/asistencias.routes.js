import { Router } from "express";
import { 
    registrarAsistencia,
    consultarAsistencias, 
    asistenciasPorAlumno, 
    asistenciasPorFecha
 } 
from "../controllers/asistencias.controllers.js";

const router = Router();

// POST /asistencias
router.post("/asistencias", registrarAsistencia);

// GET /asistencias
router.get("/asistencias", consultarAsistencias);

// GET /asistencias/:matricula
router.get("/asistencias/alumno/:matricula", asistenciasPorAlumno);

// GET /asistencias/fecha/:fecha
router.get("/asistencias/fecha/:fecha", asistenciasPorFecha);

export default router;