import "../screens/Login.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // 1. Importamos axios

function Register() {
    const navigate = useNavigate();

    const [nombre, setNombre] = useState("");
    const [correo, setCorreo] = useState("");
    const [password, setPassword] = useState("");
    const [confirmar, setConfirmar] = useState("");
    
    // 2. Agregamos el estado para el ROL (tu backend requiere "ALUMNO" o "MAESTRO")
    const [rol, setRol] = useState("ALUMNO"); 
    
    // 3. Estados para manejar mensajes visuales de éxito o error
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const registrar = async (e) => {
        e.preventDefault();
        setError(null);   // Limpiamos errores previos
        setSuccess(null); // Limpiamos éxitos previos

        // Validación frontend básica
        if (password !== confirmar) {
            setError("Las contraseñas no coinciden");
            return;
        }

        try {
            // 4. Hacemos la petición POST al backend
            const response = await api.post("/auth/register", {
                nombre: nombre,
                email: correo, // El backend espera 'email', le pasamos nuestro estado 'correo'
                password: password,
                rol: rol       // Pasamos el rol seleccionado
            });

            // 5. Si todo salió bien (código 201)
            if (response.data.success) {
                setSuccess("Cuenta creada correctamente. Redirigiendo al login...");
                
                // Esperamos 2 segundos para que el usuario lea el mensaje antes de redirigir
                setTimeout(() => {
                    navigate("/");
                }, 2000);
            }

        } catch (error) {
            // 6. Manejamos los errores (Ej. 400 "El usuario ya existe")
            if (error.response && error.response.data) {
                setError(error.response.data.message);
            } else {
                setError("Error de conexión con el servidor.");
            }
            console.error("Error al registrar:", error);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                <h1>Crear Cuenta</h1>

                <p className="subtitulo">
                    Completa los datos para registrarte
                </p>

                {/* Mostramos errores si existen */}
                {error && <p style={{ color: "red", fontSize: "14px", marginBottom: "10px" }}>{error}</p>}
                
                {/* Mostramos éxito si existe */}
                {success && <p style={{ color: "green", fontSize: "14px", marginBottom: "10px" }}>{success}</p>}

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

                    {/* Selector de Rol (Obligatorio para tu Backend) */}
                    <select 
                        value={rol} 
                        onChange={(e) => setRol(e.target.value)}
                        required
                        style={{ marginBottom: "15px", width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
                    >
                        <option value="ALUMNO">Alumno</option>
                        <option value="MAESTRO">Maestro</option>
                    </select>

                    <button type="submit">
                        Crear Cuenta
                    </button>

                    <button
                        type="button"
                        className="register-button"
                        onClick={() => navigate("/")}
                    >
                        Volver al Login
                    </button>

                </form>
            </div>
        </div>
    );
}

export default Register;