
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  LogOut,
  UserRound,
  X
} from "lucide-react";

function Sidebar({ abierto = false, cerrarMenu = () => {} }) {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { id: "inicio", label: "Inicio", icon: Home, path: "/dashboard" },
    { id: "alumnos", label: "Alumnos", icon: Users, path: "/alumnos" },
    { id: "profesores", label: "Profesores", icon: UserRound, path: "/profesores" },
    { id: "grupos", label: "Grupos", icon: BookOpen, path: "/grupos" },
    { id: "asistencia", label: "Pases de lista", icon: ClipboardList, path: "/asistencia" },
    { id: "reportes", label: "Reportes", icon: BarChart3, path: "/reportes" }
  ];

  const handleLogout = async () => {
    try {
      await fetch(
        "https://pase-lista-qr.onrender.com/api/auth/logout",
        { method: "POST" }
      );
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      localStorage.removeItem("token");
      cerrarMenu();
      navigate("/");
    }
  };

  return (
    <>
      {/* Fondo oscuro para celulares */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={cerrarMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-full w-64 min-w-64 flex-col
          justify-between bg-slate-50
          border-r border-slate-200 shadow-lg
          transition-transform duration-300 ease-in-out

          md:static md:z-auto md:h-screen
          md:translate-x-0 md:shadow-sm

          ${abierto ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="min-h-0 overflow-y-auto">
          {/* Logo */}
          <div className="mx-4 my-6 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 shrink-0 rounded-full bg-blue-600" />
                <h1 className="text-lg font-bold text-slate-800">
                  Pase de lista QR
                </h1>
              </div>

              <button
                type="button"
                onClick={cerrarMenu}
                className="rounded-lg p-1 text-slate-600 md:hidden"
                aria-label="Cerrar menú"
              >
                <X size={22} />
              </button>
            </div>

            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
              Panel Admin
            </p>
          </div>

          {/* Navegación */}
          <nav className="px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <li key={item.id}>
                    <Link
                      to={item.path}
                      onClick={cerrarMenu}
                      className={`
                        flex w-full items-center gap-3.5
                        rounded-xl px-4 py-3 text-sm
                        font-medium transition-all duration-200
                        ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md"
                            : "text-slate-600 hover:bg-slate-200"
                        }
                      `}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Cerrar sesión */}
        <div className="border-t border-slate-200 bg-white p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
