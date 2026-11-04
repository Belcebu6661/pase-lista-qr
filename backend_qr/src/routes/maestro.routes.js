import { Router } from "express";
import { 
    obtenerMaestros, 
    obtenerMaestroPorId, 
    registrarMaestro, 
    editarMaestro, 
    eliminarMaestro,
    importarMaestros 
} from "../controllers/maestroController.js";

const router = Router();

// Rutas para el CRUD de Maestros
router.get("/maestros", obtenerMaestros);
router.get("/maestros/:id", obtenerMaestroPorId);
router.post("/maestros", registrarMaestro);
router.put("/maestros/:id", editarMaestro);
router.delete("/maestros/:id", eliminarMaestro);



// --- Parte o implementación Diego C. A. ---
// Ruta para importación masiva de maestros
router.post("/maestros/importar", importarMaestros);

export default router;