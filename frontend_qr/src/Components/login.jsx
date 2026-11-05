
import "../screens/Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Login() {
    const navigate = useNavigate();

    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const iniciarSesion = async (e) => {
        e.preventDefault();
        setError("");
        setCargando(true);

        try {
            const response = await api.post("/auth/login", {
                email: correo.trim(),
                password
            });

            const token = response.data.token;

            if (!token) {
                setError("El servidor no devolvió un token.");
                return;
            }

            localStorage.setItem("token", token);
            navigate("/dashboard", { replace: true });

        } catch (err) {
            console.error("Error al iniciar sesión:", err);

            setError(
                err.response?.data?.message ||
                "No se pudo iniciar sesión. Verifica tus datos."
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h1>Iniciar Sesión</h1>

                <p className="subtitulo">
                    Sistema de Asistencia QR
                </p>

                {error && (
                    <p style={{ color: "red" }}>
                        {error}
                    </p>
                )}

                <form onSubmit={iniciarSesion}>
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={cargando}>
                        {cargando ? "Ingresando..." : "Iniciar Sesión"}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/register")}
                    >
                        Crear Cuenta
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate("/forgot-password")}
                    >
                        ¿Olvidaste tu contraseña?
                    </button>
                </form>

                <p className="footer">
                    Universidad Tecnológica del Valle del Mezquital
                </p>
            </div>
        </div>
    );
}

export default Login;
