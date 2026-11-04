// C:\Users\ucbcr\OneDrive\Escritorio\Nvo_PaseLista\pase_lista\frontend_qr\src\Components\TablaMaestros.jsx


import { useEffect, useState, useMemo } from 'react';
import { getMaestros, deleteMaestro, createMaestro, updateMaestro } from '../service/maestroService';
import Modal from './Modal';
import FormularioMaestro from './FormularioMaestro';

const TablaMaestros = () => {
    const [maestros, setMaestros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState(''); // Estado para el buscador

    // Estados para el Modal y Edición
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [maestroEditando, setMaestroEditando] = useState(null);

 
const cargarDatos = async () => {
    setLoading(true);

    try {
        const res = await getMaestros();

        console.log("RESPUESTA DE MAESTROS:", res);

        // Verificar que el backend no haya devuelto un error
        if (res?.ok === false || res?.success === false) {
            throw new Error(
                res.msg ||
                res.message ||
                "Error al consultar maestros"
            );
        }

        // Garantizar que maestros siempre sea un arreglo
        const listaMaestros = Array.isArray(res)
            ? res
            : Array.isArray(res?.data)
                ? res.data
                : [];

        setMaestros(listaMaestros);

    } catch (error) {
        console.error(
            "ERROR AL OBTENER MAESTROS:",
            error.message
        );

        setMaestros([]);

    } finally {
        setLoading(false);
    }
};


    useEffect(() => { cargarDatos(); }, []);

    // Lógica de filtrado en tiempo real
    const maestrosFiltrados = maestros.filter((m) =>
        (m.nombre?.toLowerCase().includes(busqueda.toLowerCase())) ||
        (m.correo?.toLowerCase().includes(busqueda.toLowerCase())) ||
        (m.numeroEmpleado?.toString().includes(busqueda))
    );

    // Indicadores: "activo" se calcula a partir de la cuenta de Usuario vinculada
    // (Maestro no tiene campo propio "activo" en el modelo; Usuario sí).
    const stats = useMemo(() => ({
        registrados: maestros.length,
        activos: maestros.filter((m) => m.Usuario?.activo).length,
        sinCorreo: maestros.filter((m) => !m.correo).length,
    }), [maestros]);

    const handleEliminar = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este maestro?")) {
            const res = await deleteMaestro(id);
            if (res) {
                setMaestros(maestros.filter(m => m.id !== id));
            }
        }
    };

    const handleGuardar = async (formData) => {
        try {
            let res;
            if (maestroEditando) {
                res = await updateMaestro(maestroEditando.id, formData);
            } else {
                res = await createMaestro(formData);
            }

            if (res) {
                setIsModalOpen(false);
                setMaestroEditando(null);
                cargarDatos();
            } else {
                alert("Error al guardar: Inténtalo de nuevo");
            }
        } catch (error) {
            console.error("Error en la operación:", error);
            alert("Error de conexión con el servidor.");
        }
    };

    if (loading) return <p className="p-6">Cargando maestros...</p>;

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-800">Lista de Maestros</h2>

                {/* Input de Buscador */}
                <input
                    type="text"
                    placeholder="Buscar por nombre, correo o número..."
                    className="p-2 border border-slate-300 rounded-lg w-full md:w-80 outline-none focus:ring-2 focus:ring-blue-500"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />

                <button
                    onClick={() => { setMaestroEditando(null); setIsModalOpen(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full md:w-auto"
                >
                    + Agregar Maestro
                </button>
            </div>

            {/* Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-slate-800">{stats.registrados}</p>
                    <p className="text-sm text-slate-500">Registrados</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">{stats.activos}</p>
                    <p className="text-sm text-slate-500">Activos</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-amber-700">{stats.sinCorreo}</p>
                    <p className="text-sm text-slate-500">Sin correo</p>
                </div>
            </div>

            <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="p-3 text-left">Nombre</th>
                        <th className="p-3 text-left">Correo</th>
                        <th className="p-3 text-left">Teléfono</th>
                        <th className="p-3 text-left">Número Empleado</th>
                        <th className="p-3 text-left">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {maestrosFiltrados.map((maestro) => (
                        <tr key={maestro.id} className="border-b hover:bg-slate-50">
                            <td className="p-3">{maestro.nombre}</td>
                            <td className="p-3">{maestro.correo || '—'}</td>
                            <td className="p-3">{maestro.telefono || '—'}</td>
                            <td className="p-3">{maestro.numeroEmpleado}</td>
                            <td className="p-3 flex gap-2">
                                <button
                                    onClick={() => { setMaestroEditando(maestro); setIsModalOpen(true); }}
                                    className="text-blue-600 hover:underline"
                                >Editar</button>
                                <button
                                    onClick={() => handleEliminar(maestro.id)}
                                    className="text-red-600 hover:underline"
                                >Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={maestroEditando ? "Editar Maestro" : "Nuevo Maestro"}
            >
                <FormularioMaestro
                    maestroEditando={maestroEditando}
                    onGuardar={handleGuardar}
                    onClose={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default TablaMaestros;