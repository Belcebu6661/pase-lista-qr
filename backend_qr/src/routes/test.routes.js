

import { Router } from 'express';
import { testConnection } from '../controllers/test.controller.js'; 
const router = Router();
//ruta para probar la conexion con el backend
router.get('/test-connection', testConnection);
export default router;