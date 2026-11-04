
import { Router } from "express";

import {
    obtenerGrupos,
    crearGrupo,
    obtenerGrupoPorId,
    actualizarGrupo,
    eliminarGrupo
} from "../controllers/grupos.controllers.js";

const router = Router();

// Obtener todos los grupos
router.get("/", obtenerGrupos);

// Obtener grupo por ID
router.get("/:id", obtenerGrupoPorId);

// Registrar nuevo grupo
router.post("/", crearGrupo);

// Actualizar grupo
router.put("/:id", actualizarGrupo);

// Eliminar grupo
router.delete("/:id", eliminarGrupo);

export default router;
