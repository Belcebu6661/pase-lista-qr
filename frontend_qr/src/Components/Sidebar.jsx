import { Link, useLocation, useNavigate } from "react-router-dom"; 
import { Home, Users, BookOpen, ClipboardList, BarChart3, LogOut, UserRound } from "lucide-react";

function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const menuItems = [
        { id: "inicio", label: "Inicio", icon: Home, path: "/dashboard" },
        { id: "alumnos", label: "Alumnos", icon: Users, path: "/alumnos" },
        { id: "profesores", label: "Profesores", icon: UserRound, path: "/profesores" },
        { id: "grupos", label: "Grupos", icon: BookOpen, path: "/grupos" },
        { id: "asistencia", label: "Pases de lista", icon: ClipboardList, path: "/asistencia" },
        { id: "reportes", label: "Reportes", icon: BarChart3, path: "/reportes" },
    ];

    const handleLogout = async () => {
        try {
            await fetch('http://localhost:3000/api/auth/logout', { 
                method: 'POST' 
            });
        } catch (error) {
            console.error("Error en el servidor al cerrar sesión", error);
        } finally {
            localStorage.removeItem('token'); 
            navigate('/'); 
        }
    };

    return (
        <aside className="w-64 min-w-[16rem] h-screen bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm z-10">
            <div>
                {/* Encabezado / Logo */}
                <div className="mx-4 my-6 px-4 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse"></div>
                        <h1 className="text-xl font-bold text-slate-800 tracking-tight">Pase de lista QR</h1>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Panel Admin</p>
                </div>
                
                {/* Menú de navegación */}
                <nav className="px-3">
                    <ul className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <li key={item.id}>
                                    <Link
                                        to={item.path}
                                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group
                                            ${isActive
                                                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                                : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                                            }`}
                                    >
                                        <Icon
                                            size={18}
                                            className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"}
                                        />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </div>
            
            {/* Botón Cerrar Sesión */}
            <div className="p-3 border-t border-slate-200 bg-white">
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 transition-all duration-200 hover:bg-red-50 hover:text-red-700 group cursor-pointer"
                >
                    <LogOut size={18} className="text-red-500 group-hover:text-red-700" />
                    Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;