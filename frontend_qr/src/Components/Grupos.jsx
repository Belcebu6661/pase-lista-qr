

import { useEffect, useState } from "react";
import axios from "axios";
import { Plus, X } from "lucide-react";

function Grupos() {
    const [grupos, setGrupos] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [formulario, setFormulario] = useState({
        id: "",
        nombre: "",
        cuatrimestre: "",
        turno: ""
    });

    useEffect(() => {
        obtenerGrupos();
    }, []);

    // Función para obtener los grupos de la base de datos (Usando GET correctamente)

const obtenerGrupos = async () => {
    try {
        const respuesta = await axios.get(
            "http://localhost:3000/api/grupos"
        );

        // Verificar qué está enviando el backend
        console.log("RESPUESTA COMPLETA:", respuesta.data);

        const listaGrupos = Array.isArray(respuesta.data)
            ? respuesta.data
            : respuesta.data.data || [];

        console.log("GRUPOS RECIBIDOS:", listaGrupos);

        setGrupos(listaGrupos);

    } catch (error) {
        console.error(
            "Error al cargar grupos:",
            error.response?.data || error.message
        );

        setGrupos([]);
    }
};


    const handleChange = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    // Función para guardar un nuevo grupo (Enviando carreraId por defecto en el backend)
  
    
const guardarGrupo = async (e) => {
    e.preventDefault();

    try {
        const datosAEnviar = {
            id: formulario.id.trim(),
            nombre: formulario.nombre.trim(),
            cuatrimestre: Number(formulario.cuatrimestre),
            turno: formulario.turno.trim()
        };

        if (
            !datosAEnviar.id ||
            !datosAEnviar.nombre ||
            !Number.isInteger(datosAEnviar.cuatrimestre) ||
            datosAEnviar.cuatrimestre < 1 ||
            !datosAEnviar.turno
        ) {
            alert("Completa correctamente todos los campos");
            return;
        }

        console.log("Enviando grupo:", datosAEnviar);

        const respuesta = await axios.post(
            "http://localhost:3000/api/grupos",
            datosAEnviar
        );

        alert(
            respuesta.data.msg ||
            "Grupo creado correctamente"
        );

        setFormulario({
            id: "",
            nombre: "",
            cuatrimestre: "",
            turno: ""
        });

        setMostrarModal(false);

        await obtenerGrupos();

    } catch (error) {
        console.error(
            "Error al guardar grupo:",
            error.response?.data || error
        );

        alert(
            error.response?.data?.msg ||
            "No se pudo guardar el grupo"
        );
    }
};


    return (
        <div className="w-full max-w-none px-8 py-6">
            {/* Título y Botón */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">
                    Gestión de Grupos
                </h1>

                <button
                    onClick={() => setMostrarModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition cursor-pointer"
                >
                    <Plus size={18} />
                    Agregar Grupo
                </button>
            </div>

            {/* Tabla de Grupos */}
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full">
                <table className="min-w-[800px] w-full">
                    <thead className="bg-slate-200">
                        <tr>
                            <th className="p-3 text-left">ID Grupo</th>
                            <th className="p-3 text-left">Nombre</th>
                            <th className="p-3 text-left">Cuatrimestre</th>
                            <th className="p-3 text-left">Turno</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grupos.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-4 text-center text-gray-500">
                                    No hay grupos registrados todavía.
                                </td>
                            </tr>
                        ) : (
                            grupos.map((g) => (
                                <tr key={g.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-700">{g.id}</td>
                                    <td className="p-3 text-slate-600">{g.nombre}</td>
                                    <td className="p-3 text-slate-600">{g.cuatrimestre}</td>
                                    <td className="p-3 text-slate-600">{g.turno}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Ventana flotante (Modal) para agregar */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-slate-800">
                                Agregar Nuevo Grupo
                            </h2>
                            <button
                                onClick={() => setMostrarModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={guardarGrupo} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">ID del Grupo</label>
                                <input
                                    type="text"
                                    name="id"
                                    placeholder="Ej. GRP-10M"
                                    value={formulario.id}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    placeholder="Ej. TI 10M"
                                    value={formulario.nombre}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Cuatrimestre</label>
                                <input
                                    type="number"
                                    name="cuatrimestre"
                                    placeholder="Ej. 10"
                                    value={formulario.cuatrimestre}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Turno</label>
                                <input
                                    type="text"
                                    name="turno"
                                    placeholder="Ej. Matutino / Vespertino"
                                    value={formulario.turno}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setMostrarModal(false)}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-md cursor-pointer"
                                >
                                    Guardar Grupo
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}

export default Grupos;