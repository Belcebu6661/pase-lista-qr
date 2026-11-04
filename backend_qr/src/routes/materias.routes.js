import {Router} from "express";
import { crearMateria } from "../controllers/materias.controllers.js";
const router = Router();
//método post para enviar materias
router.post("/materias", crearMateria);
export default router;