import { Router } from "express";
import { login } from "../controllers/login.controllers.js";

const router = Router();

router.get("/login", login);
//! Ruta para el login

//! Ruta para cerrar sesión (logout)
export default router;