import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/login";
import Dashboard from "./Components/Dashboard";
import Alumnos from "./Components/Alumnos";
import Sidebar from "./Components/Sidebar";
import Materias from "./Components/Materias";
import Reportes from "./Components/Reportes";
import PaseLista from "./Components/PaseLista";
import Register from "./Components/Register";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResetPassword";
import Asistencia from "./Components/Asistencia";
import Profesores from "./Components/Profesores";
import Grupos from "./Components/Grupos"; 


const RutaPrivada = ({ children }) => {
  const token = localStorage.getItem("token");

  //* Si NO hay token guardado, redirigimos inmediatamente al Login ("/")
  if (!token) {
    return <Navigate to="/" replace />;
  }

  //* Si SÍ hay token, renderizamos el contenido
  return children;
};

function App() {
  return (
    <Routes>
      {/* --- RUTAS PÚBLICAS --- */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* --- RUTAS DE RESETEO DE CONTRASEÑA --- */}
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* --- RUTAS PRIVADAS --- */}
      <Route
        path="/*"
        element={
          <RutaPrivada>
            <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-8">
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/alumnos" element={<Alumnos />} />
                  <Route path="/profesores" element={<Profesores />} />
                     <Route path="/grupos" element={<Grupos />} />
                  <Route path="/materias" element={<Materias />} />
                  <Route path="/pases-lista" element={<PaseLista />} />
                  <Route path="/asistencia" element={<Asistencia />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </RutaPrivada>
        }
      />
    </Routes>
  );
}

export default App;