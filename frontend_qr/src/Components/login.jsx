
import "../screens/Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

function Register() {
    const navigate = useNavigate();

    // Datos del formulario
    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [rol, setRol] = useState("ALUMNO");

    // Mensajes y estado
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [cargando, setCargando] = useState(false);

    const registrar = async (e) => {
        e.preventDefault();

        setError(null);
        setSuccess(null);

        // Validar campos
        if (!nombre.trim() || !correo.trim() || !password) {
            setError("Completa todos los campos.");
            return;
        }

        // Validar contraseñas
        if (password !== confirmar) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setCargando(true);

        try {
            // Conexión al backend mediante api.js
            const response = await api.post("/auth/register", {
                nombre: nombre.trim(),
                email: correo.trim(),
                password: password,
                rol: rol
            });

            if (response.data.success) {
                setSuccess(
                    "Cuenta creada correctamente. Redirigiendo al inicio de sesión..."
                );

                setTimeout(() => {
                    navigate("/");
                }, 2000);
            } else {
                setError(
                    response.data.message ||
                    "No se pudo registrar la cuenta."
                );
            }

        } catch (err) {
            console.error("Error al registrar:", err);

            if (err.response?.data) {
                setError(
                    err.response.data.message ||
                    "Ocurrió un error al registrar la cuenta."
                );
            } else {
                setError("Error de conexión con el servidor.");
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                <h1>Crear Cuenta</h1>

                <p className="subtitulo">
                    Completa los datos para registrarte
                </p>

                {error && (
                    <p
                        style={{
                            color: "red",
                            fontSize: "14px",
                            marginBottom: "10px"
                        }}
                    >
                        {error}
                    </p>
                )}

                {success && (
                    <p
                        style={{
                            color: "green",
                            fontSize: "14px",
                            marginBottom: "10px"
                        }}
                    >
                        {success}
                    </p>
                )}

                <form onSubmit={registrar}>

                    <input
                        type="text"
                        placeholder="Nombre completo"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        required
                    />

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

                    <input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)}
                        required
                    />

                    <select
                        value={rol}
                        onChange={(e) => setRol(e.target.value)}
                        required
                        style={{
                            marginBottom: "15px",
                            width: "100%",
                            padding: "10px",
                            borderRadius: "5px",
                            border: "1px solid #ccc"
                        }}
                    >
                        <option value="ALUMNO">Alumno</option>
                        <option value="MAESTRO">Maestro</option>
                    </select>

                    <button
                        type="submit"
                        disabled={cargando || Boolean(success)}
                    >
                        {cargando
                            ? "Registrando..."
                            : "Crear Cuenta"}
                    </button>

                    <button
                        type="button"
                        className="register-button"
                        onClick={() => navigate("/")}
                    >
                        Volver al inicio de sesión
                    </button>

                </form>

                <p className="footer">
                    Universidad Tecnológica del Valle del Mezquital
                </p>

            </div>
        </div>
    );
}

export default Register;
