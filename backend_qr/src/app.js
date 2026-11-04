//este archivo lo compartimos entre todos, revisa bien antes de actualizar

import express from "express";
import loginRoutes from "./routes/login.routes.js";
import alumnosRoutes from './routes/alumnos.routes.js';
import materiaRoutes from "./routes/materias.routes.js";
import statsRoutes from "./routes/stats.routes.js";
import authenticationRoutes from "./routes/authentication.routes.js";
// IMPORT PARA LAS ASISTENCIAS
import asistenciaRoutes from './routes/asistencias.routes.js';
import cors from "cors";
// importacion para maestros CRUD Uriel Cruz Barrera
import maestroRoutes from "./routes/maestro.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
//import de test-connection
import testRoutes from "./routes/test.routes.js";

import gruposRoutes from "./routes/grupos.routes.js";

import dashboardRoutes from "./routes/dashboard.routes.js"; 
const app = express();

// Permitir peticiones del Front


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://192.168.137.76:3000",
  "http://192.168.137.76:5173",
  "http://localhost:8081",
  "https://0hffwew-anonymous-8081.exp.direct",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("Origen rechazado por CORS:", origin);
    return callback(null, false);
  },
  credentials: true,
}));



// Permitir solicitudes JSON grandes para la importación masiva.
app.use(express.json({ limit: "10mb" }));

// Permitir formularios con contenido amplio.
app.use(express.urlencoded({
    extended: true,
    limit: "10mb"
}));
app.get("/", (req, res) => {
  res.json({
    msg: "Backend funcionando"
  });
});

//ruta para el login
app.use("/api", loginRoutes);
//ruta para cosultar los alumnos
app.use('/api/alumnos', alumnosRoutes);
//ruta para materias
app.use("/api", materiaRoutes);
app.use("/api/stats", statsRoutes);
// Ruta para la autenticacion ADRIÁN
app.use('/api', authenticationRoutes);

//  ruta para asistencias 
app.use("/api", asistenciaRoutes);
// Ruta para maestros CRUD Uriel Cruz Barrera
app.use("/api", maestroRoutes);
//reta para reportes
app.use("/api/reportes", reportesRoutes);
//ruta para la conexión  al servidor
//app.use("/api", testRoutes);
app.use("/api/grupos", gruposRoutes);


app.use("/api/dashboard", dashboardRoutes);

export default app;