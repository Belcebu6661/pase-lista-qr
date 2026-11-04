import { Router } from "express";
import { obtenerResumenDashboard } from "../controllers/dashboard.controllers.js";

const router = Router();
router.get("/resumen", obtenerResumenDashboard);

export default router;