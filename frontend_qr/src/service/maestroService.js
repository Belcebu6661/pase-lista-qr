// C:\Users\ucbcr\OneDrive\Escritorio\Repositorios\pase_lista\frontend_qr\src\services\maestroService.js
const API_URL = 'http://localhost:3000/api';


export const getMaestros = async () => {
    const res = await fetch(`${API_URL}/maestros`);

    const resultado = await res.json();

    console.log("RESPUESTA API MAESTROS:", resultado);

    if (!res.ok || resultado.ok === false) {
        throw new Error(
            resultado.msg ||
            resultado.message ||
            "No fue posible obtener los maestros"
        );
    }

    return resultado;
};


export const createMaestro = async (maestro) => {
    const res = await fetch(`${API_URL}/maestros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: maestro.nombre,
            email: maestro.email,
            password: maestro.password,
            numeroEmpleado: maestro.numeroEmpleado,
            telefono: maestro.telefono || null
        }),
    });
    return await res.json();
};

export const updateMaestro = async (id, maestro) => {
    const res = await fetch(`${API_URL}/maestros/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            nombre: maestro.nombre,
            email: maestro.email, 
            numeroEmpleado: maestro.numeroEmpleado,
            telefono: maestro.telefono
        }),
    });
    return await res.json();
};

export const deleteMaestro = async (id) => {
    const res = await fetch(`${API_URL}/maestros/${id}`, {
        method: 'DELETE',
    });
    return await res.json();
};

// --- Parte o implementación Diego C. A. ---
// Nueva función para importar masivamente
export const importarMaestros = async (datos) => {
    const res = await fetch(`${API_URL}/maestros/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });
    return await res.json();
};