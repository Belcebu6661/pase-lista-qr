import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Importamos Axios para la petición real
import "../screens/Login.css"; 

function ForgotPassword() {
    const navigation = useNavigate();

    const [email, setEmail] = useState("");
    const [mensaje, setMensaje] = useState(null); 
    const [error, setError] = useState(null);     
    const [cargando, setCargando] = useState(false); 

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMensaje(null);
        setError(null);
        setCargando(true); 

        try {
            // Petición POST real a tu nuevo endpoint en el backend
            const response = await axios.post("http://localhost:3000/api/auth/forgot-password", {
                email: email
            });

            // Si el backend responde con éxito
            if (response.data.success) {
                // Usamos el mensaje que nos manda el backend
                setMensaje(response.data.message); 
                setEmail(""); // Limpiamos el input para que no se quede escrito
            }

        } catch (error) {
            // Si el backend manda un error (ej. 400 o 500)
            if (error.response && error.response.data) {
                setError(error.response.data.message);
            } else {
                setError("Error de conexión con el servidor.");
            }
            console.error("Error al recuperar contraseña:", error);
        } finally {
            // Detenemos el estado de carga
            setCargando(false); 
        }
    };

    return (
        <div className="login-container flex items-center justify-center min-h-screen bg-slate-100">

            <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md flex flex-col items-center gap-6 text-center">

                <div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Recuperar Contraseña</h1>
                    <p className="text-sm text-slate-500">
                        Ingresa tu correo electrónico para restablecer tu cuenta
                    </p>
                </div>

                {/* --- MENSAJES DE FEEDBACK VISUAL --- */}
                {error && <p className="text-red-500 text-sm font-medium w-full text-left">{error}</p>}
                {mensaje && <p className="text-green-600 text-sm font-medium w-full text-left">{mensaje}</p>}

                <form onSubmit={handleResetPassword} className="w-full flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
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
                        {cargando ? "Enviando..." : "Enviar Enlace"}
                    </button>
                </form>

                <button
                    onClick={() => navigation("/")}
                    disabled={cargando}
                    className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                    Volver al Login
                </button>

                <p className="text-xs text-slate-400 mt-4">
                    Universidad Tecnológica del Valle del Mezquital
                </p>

            </div>
        </div>
    );
}

export default ForgotPassword;