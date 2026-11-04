
import { Router } from "express";

import {
    obtenerAlumnos,
    crearAlumno,
    actualizarAlumno,
    eliminarAlumno,
    cargaMasivaAlumnos
} from "../controllers/alumnos.controllers.js";

const router = Router();

// Consultar alumnos.
router.get("/", obtenerAlumnos);

// Importación masiva desde Excel procesado por el frontend.
router.post("/carga-masiva", cargaMasivaAlumnos);

// Operaciones individuales.
router.post("/", crearAlumno);
router.put("/:id", actualizarAlumno);
router.delete("/:id", eliminarAlumno);

export default router;
