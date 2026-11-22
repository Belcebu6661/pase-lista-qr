
import { useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

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

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function PanelAdministrativo() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const location = useLocation();

  const titulos = {
    "/dashboard": "Inicio",
    "/alumnos": "Gestión de Alumnos",
    "/profesores": "Profesores",
    "/grupos": "Grupos",
    "/materias": "Materias",
    "/pases-lista": "Pases de lista",
    "/asistencia": "Pases de lista",
    "/reportes": "Reportes"
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-100">
      <Sidebar
        abierto={menuAbierto}
        cerrarMenu={() => setMenuAbierto(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado móvil */}
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setMenuAbierto(true)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Abrir menú"
          >
            <Menu size={24} />
          </button>

          <h1 className="truncate text-base font-bold text-slate-800">
            {titulos[location.pathname] || "Pase de Lista QR"}
          </h1>
        </header>

        {/* Contenido principal */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 lg:p-8">
          <div className="mx-auto w-full min-w-0 max-w-[1600px]">
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
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      {/* Rutas privadas */}
      <Route
        path="/*"
        element={
          <RutaPrivada>
            <PanelAdministrativo />
          </RutaPrivada>
        }
      />
    </Routes>
  );
}

export default App;
