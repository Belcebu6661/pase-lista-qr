import { Router } from "express";
import { login } from '../controllers/authentication.controllers.js';
import { verifytoken } from '../controllers/authentication.controllers.js'
import {logout} from '../controllers/authentication.controllers.js'
import { register } from '../controllers/authentication.controllers.js'
import {forgotPassword} from '../controllers/authentication.controllers.js'
import {resetPassword} from '../controllers/authentication.controllers.js'

//! Ruta para el login
const router = Router();
router.post('/auth/login', login);

//! Ruta para verificar el token
router.get('/auth/verify', verifytoken);

//! Ruta para cerrar sesión (logout)
router.post('/auth/logout', logout);

//! Ruta para registrar un nuevo usuario
router.post('/auth/register', register);

//! Ruta para recuperar contraseña
router.post('/auth/forgot-password', forgotPassword);

//! Ruta para guardar la nueva contraseña
//* El ":token" le dice a Express que esa parte de la URL es una variable dinámica
router.post('/auth/reset-password/:token', resetPassword);

export default router;