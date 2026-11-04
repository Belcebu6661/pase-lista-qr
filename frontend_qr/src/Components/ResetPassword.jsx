import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
    // useParams extrae el token dinámico de la URL
    const { token } = useParams(); 
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    const [cargando, setCargando] = useState(false);

    const handleActualizarPassword = async (e) => {
        e.preventDefault();
        setMensaje(null);
        setError(null);

        // Validación básica
        if (password !== confirmar) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        setCargando(true);

        try {
            // Petición al backend (Endpoint que crearemos en el siguiente paso)
            const response = await axios.post(`http://localhost:3000/api/auth/reset-password/${token}`, {
                nuevaPassword: password
            });

            if (response.data.success) {
                setMensaje("¡Contraseña actualizada con éxito! Redirigiendo al login...");
                setTimeout(() => {
                    navigate("/");
                }, 3000);
            }
        } catch (error) {
            if (error.response && error.response.data) {
                setError(error.response.data.message);
            } else {
                setError("Error de conexión con el servidor.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container flex items-center justify-center min-h-screen bg-slate-100">
            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md flex flex-col items-center gap-6 text-center">
                
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Nueva Contraseña</h1>
                    <p className="text-sm text-slate-500">
                        Ingresa y confirma tu nueva contraseña
                    </p>
                </div>

                {error && <p className="text-red-500 text-sm font-medium w-full text-left">{error}</p>}
                {mensaje && <p className="text-green-600 text-sm font-medium w-full text-left">{mensaje}</p>}

                <form onSubmit={handleActualizarPassword} className="w-full flex flex-col gap-4">
                    <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-4 rounded-xl bg-slate-50 border-none outline-none text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                    />

                    <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        required
                        className="w-full p-4 rounded-xl bg-slate-50 border-none outline-none text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={cargando}
                        className={`w-full py-4 text-white font-semibold rounded-xl shadow-md transition-colors ${
                            cargando ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {cargando ? "Actualizando..." : "Guardar Contraseña"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;