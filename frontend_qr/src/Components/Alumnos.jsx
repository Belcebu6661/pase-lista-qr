

import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Plus, X, Edit, Trash2, Search, Filter, QrCode, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

function Alumnos() {
    const [alumnos, setAlumnos] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarModalQR, setMostrarModalQR] = useState(false);
    const [mostrarModalPreview, setMostrarModalPreview] = useState(false);
    const [alumnosPreview, setAlumnosPreview] = useState([]);
    const [alumnoSeleccionadoQR, setAlumnoSeleccionadoQR] = useState(null);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [alumnoActualId, setAlumnoActualId] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtroGrupo, setFiltroGrupo] = useState("");
    const [importando, setImportando] = useState(false);

    const inputFileRef = useRef(null);

    const [formulario, setFormulario] = useState({
        matricula: "",
        nombre: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        correoElectronico: "",
        telefono: "",
        grupoId: ""
    });

    useEffect(() => {
        obtenerAlumnos();
        obtenerGrupos();
    }, []);

    const obtenerAlumnos = async () => {
        try {
            const respuesta = await axios.get("http://localhost:3000/api/alumnos");
            setAlumnos(respuesta.data.data || []);
        } catch (error) {
            console.log("Error al cargar alumnos:", error);
        }
    };

    const obtenerGrupos = async () => {
        try {
            const respuesta = await axios.get("http://localhost:3000/api/grupos");
            setGrupos(respuesta.data.data || []);
        } catch (error) {
            console.log("Error al cargar grupos:", error);
        }
    };

    const handleChange = (e) => {
        setFormulario({
            ...formulario,
            [e.target.name]: e.target.value
        });
    };

    const abrirModalCrear = () => {
        setModoEdicion(false);
        setAlumnoActualId(null);
        setFormulario({
            matricula: "",
            nombre: "",
            apellidoPaterno: "",
            apellidoMaterno: "",
            correoElectronico: "",
            telefono: "",
            grupoId: ""
        });
        setMostrarModal(true);
    };

    const abrirModalEditar = (alumno) => {
        setModoEdicion(true);
        setAlumnoActualId(alumno.matricula || alumno.id);
        setFormulario({
            matricula: alumno.matricula || "",
            nombre: alumno.nombre || "",
            apellidoPaterno: alumno.apellidoPaterno || "",
            apellidoMaterno: alumno.apellidoMaterno || "",
            correoElectronico: alumno.correo || alumno.correoElectronico || "",
            telefono: alumno.telefono || "",
            grupoId: alumno.grupoId || ""
        });
        setMostrarModal(true);
    };

    const abrirModalQR = (alumno) => {
        setAlumnoSeleccionadoQR(alumno);
        setMostrarModalQR(true);
    };

    const guardarAlumno = async (e) => {
        e.preventDefault();
        try {
            if (modoEdicion) {
                await axios.put(`http://localhost:3000/api/alumnos/${alumnoActualId}`, formulario);
                alert("Alumno actualizado correctamente");
            } else {
                await axios.post("http://localhost:3000/api/alumnos", formulario);
                alert("Alumno creado correctamente");
            }

            setMostrarModal(false);
            obtenerAlumnos();
        } catch (error) {
            console.log("Error detallado:", error.response?.data || error);
            alert(error.response?.data?.msg || "Error al procesar la solicitud");
        }
    };

    const eliminarAlumno = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este alumno?")) return;
        try {
            await axios.delete(`http://localhost:3000/api/alumnos/${id}`);
            alert("Alumno eliminado correctamente");
            obtenerAlumnos();
        } catch (error) {
            console.log("Error al eliminar:", error);
            alert("Error al eliminar el alumno");
        }
    };

 
    const manejarSeleccionArchivo = (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const lector = new FileReader();
        lector.onload = (evt) => {
            try {
                const datosBinarios = evt.target.result;
                const libro = XLSX.read(datosBinarios, { type: "binary" });
                const nombreHoja = libro.SheetNames[0];
                const hoja = libro.Sheets[nombreHoja];
                const listaRegistros = XLSX.utils.sheet_to_json(hoja);

                if (listaRegistros.length === 0) {
                    alert("El archivo está vacío o no tiene el formato correcto.");
                    return;
                }

                const datosFormateados = listaRegistros.map((fila, index) => {
                    // Mapeo flexible para capturar las cabeceras exactas de tu Excel
                    const matricula = String(fila.MATRÍCULA || fila.matricula || fila.Matricula || "").trim();
                    const nombre = String(fila.NOMBRE || fila.nombre || fila.Nombre || "").trim();
                    const apellidoPaterno = String(fila["AP. PATERNO"] || fila.apellidoPaterno || fila.ApellidoPaterno || fila.APELLIDO_PATERNO || fila.Apellidos || "").trim();
                    const apellidoMaterno = String(fila["AP. MATERNO"] || fila.apellidoMaterno || fila.ApellidoMaterno || fila.APELLIDO_MATERNO || "").trim();
                    const correoElectronico = String(fila.CORREO || fila.correo || fila.Correo || fila.correoElectronico || "").trim();
                    const telefono = String(fila.TELÉFONO || fila.TELEFONO || fila.telefono || fila.Telefono || "").trim();
                    const grupoId = String(fila["GRUPO ID"] || fila.grupoId || fila.GrupoId || fila.grupo || fila.GRUPO || "").trim();

                    const esValido = matricula !== "" && nombre !== "" && grupoId !== "";

                    return {
                        idTemp: index,
                        matricula,
                        nombre,
                        apellidoPaterno,
                        apellidoMaterno,
                        correoElectronico,
                        telefono,
                        grupoId,
                        esValido
                    };
                });

                setAlumnosPreview(datosFormateados);
                setMostrarModalPreview(true);
            } catch (error) {
                console.log("Error al leer archivo:", error);
                alert("Hubo un error al procesar el archivo Excel/CSV.");
            } finally {
                if (inputFileRef.current) inputFileRef.current.value = "";
            }
        };

        lector.readAsBinaryString(archivo);
    };

    const handlePreviewChange = (index, campo, valor) => {
        const nuevosDatos = [...alumnosPreview];
        nuevosDatos[index][campo] = valor;

        const item = nuevosDatos[index];
        item.esValido = item.matricula.trim() !== "" && item.nombre.trim() !== "" && item.grupoId.trim() !== "";

        setAlumnosPreview(nuevosDatos);
    };

 
    
const confirmarImportacionMasiva = async () => {
    const validos = alumnosPreview.filter(
        (a) => a.esValido
    );

    if (validos.length === 0) {
        alert("No hay registros válidos para importar.");
        return;
    }

    setImportando(true);

    try {
        const respuesta = await axios.post(
            "http://localhost:3000/api/alumnos/carga-masiva",
            {
                alumnos: validos.map((alumno) => ({
                    matricula: alumno.matricula.trim(),
                    nombre: alumno.nombre.trim(),
                    apellidoPaterno: alumno.apellidoPaterno.trim(),
                    apellidoMaterno: alumno.apellidoMaterno.trim(),
                    correoElectronico: alumno.correoElectronico.trim(),
                    telefono: alumno.telefono.trim(),
                    grupoId: alumno.grupoId.trim()
                }))
            }
        );

        const datos = respuesta.data;

        // Mostrar resultados reales del backend.
        let mensaje =
            `${datos.message}\n\n` +
            `Registros recibidos: ${datos.recibidos}\n` +
            `Importados: ${datos.importados}\n` +
            `Omitidos: ${datos.omitidos}\n` +
            `Errores: ${datos.errores}`;

        const detalle = datos.detalle;

        if (detalle?.omitidos?.length) {
            mensaje += "\n\n--- OMITIDOS ---\n";

            mensaje += detalle.omitidos
                .map(
                    (item) =>
                        `Fila ${item.fila} (${item.matricula}): ${item.motivo}`
                )
                .join("\n");
        }

        if (detalle?.errores?.length) {
            mensaje += "\n\n--- ERRORES ---\n";

            mensaje += detalle.errores
                .map(
                    (item) =>
                        `Fila ${item.fila} (${item.matricula}): ${item.motivo}`
                )
                .join("\n");
        }

        alert(mensaje);

        // Cerrar la vista previa y actualizar la tabla.
        setMostrarModalPreview(false);
        await obtenerAlumnos();

    } catch (error) {
        console.error(
            "Error en la importación masiva:",
            error.response?.data || error
        );

        alert(
            error.response?.data?.message ||
            "Error al importar alumnos. Revisa la consola del backend."
        );
    } finally {
        setImportando(false);
    }
};



    const alumnosFiltrados = alumnos.filter((a) => {
        const textoBusqueda = busqueda.toLowerCase();
        const matricula = (a.matricula || "").toLowerCase();
        const nombre = (a.nombre || "").toLowerCase();
        const apellidoPaterno = (a.apellidoPaterno || "").toLowerCase();
        const apellidoMaterno = (a.apellidoMaterno || "").toLowerCase();
        const correo = (a.correo || a.correoElectronico || "").toLowerCase();

        const coincideTexto = (
            matricula.includes(textoBusqueda) ||
            nombre.includes(textoBusqueda) ||
            apellidoPaterno.includes(textoBusqueda) ||
            apellidoMaterno.includes(textoBusqueda) ||
            correo.includes(textoBusqueda)
        );

        const coincideGrupo = filtroGrupo === "" || a.grupoId === filtroGrupo;

        return coincideTexto && coincideGrupo;
    });

    return (
        <div className="w-full max-w-none px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-slate-800">
                    Gestión de Alumnos
                </h1>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={inputFileRef}
                        onChange={manejarSeleccionArchivo}
                        accept=".csv, .xlsx, .xls"
                        className="hidden"
                    />

                    <button
                        onClick={() => inputFileRef.current?.click()}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 shadow-sm transition cursor-pointer"
                    >
                        <Upload size={18} />
                        Importar Excel/CSV
                    </button>

                    <button
                        onClick={abrirModalCrear}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition cursor-pointer"
                    >
                        <Plus size={18} />
                        Agregar Alumno
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 w-full max-w-md">
                    <Search size={20} className="text-gray-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Buscar por matrícula, nombre o correo..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full outline-none text-sm text-slate-700 bg-transparent"
                    />
                </div>

                <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-2 w-full sm:w-72">
                    <Filter size={18} className="text-gray-400 mr-2" />
                    <select
                        value={filtroGrupo}
                        onChange={(e) => setFiltroGrupo(e.target.value)}
                        className="w-full outline-none text-sm text-slate-700 bg-transparent cursor-pointer"
                    >
                        <option value="">Todos los grupos</option>
                        {grupos.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.nombre} ({g.id})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto w-full">
                <table className="min-w-[900px] w-full">
                    <thead className="bg-slate-200">
                        <tr>
                            <th className="p-3 text-left">Matrícula</th>
                            <th className="p-3 text-left">Nombre</th>
                            <th className="p-3 text-left">Apellidos</th>
                            <th className="p-3 text-left">Correo</th>
                            <th className="p-3 text-left">Teléfono</th>
                            <th className="p-3 text-left">Grupo</th>
                            <th className="p-3 text-center">QR</th>
                            <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alumnosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-4 text-center text-gray-500">
                                    No se encontraron alumnos registrados con esos criterios.
                                </td>
                            </tr>
                        ) : (
                            alumnosFiltrados.map((a) => (
                                <tr key={a.matricula || a.id} className="border-b hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-700">{a.matricula}</td>
                                    <td className="p-3 text-slate-600">{a.nombre}</td>
                                    <td className="p-3 text-slate-600">{`${a.apellidoPaterno || ''} ${a.apellidoMaterno || ''}`}</td>
                                    <td className="p-3 text-slate-600">{a.correo || a.correoElectronico}</td>
                                    <td className="p-3 text-slate-600">{a.telefono}</td>
                                    <td className="p-3 text-slate-600">{a.Grupo?.nombre || a.grupoId}</td>
                                    
                                    <td className="p-3 text-center">
                                        <button
                                            onClick={() => abrirModalQR(a)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition text-xs font-medium cursor-pointer"
                                            title="Ver Código QR"
                                        >
                                            <QrCode size={14} />
                                            Generado
                                        </button>
                                    </td>

                                    <td className="p-3 text-center flex justify-center gap-2">
                                        <button
                                            onClick={() => abrirModalEditar(a)}
                                            className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition cursor-pointer"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => eliminarAlumno(a.matricula || a.id)}
                                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition cursor-pointer"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal para Crear y Editar */}
            {mostrarModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-slate-800">
                                {modoEdicion ? "Editar Alumno" : "Agregar Nuevo Alumno"}
                            </h2>
                            <button
                                onClick={() => setMostrarModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={guardarAlumno} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Matrícula</label>
                                <input
                                    type="text"
                                    name="matricula"
                                    placeholder="Ej. 20262589"
                                    value={formulario.matricula}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={modoEdicion}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    placeholder="Ej. Arturo"
                                    value={formulario.nombre}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellido Paterno</label>
                                    <input
                                        type="text"
                                        name="apellidoPaterno"
                                        placeholder="Apellido Paterno"
                                        value={formulario.apellidoPaterno}
                                        onChange={handleChange}
                                        className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Apellido Materno</label>
                                    <input
                                        type="text"
                                        name="apellidoMaterno"
                                        placeholder="Apellido Materno"
                                        value={formulario.apellidoMaterno}
                                        onChange={handleChange}
                                        className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    name="correoElectronico"
                                    placeholder="ejemplo@correo.com"
                                    value={formulario.correoElectronico}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    name="telefono"
                                    placeholder="773..."
                                    value={formulario.telefono}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Grupo</label>
                                <select
                                    name="grupoId"
                                    value={formulario.grupoId}
                                    onChange={handleChange}
                                    className="border border-gray-300 w-full p-2.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Selecciona un grupo</option>
                                    {grupos.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.nombre} ({g.id})
                                        </option>
                                    ))}
                                </select>
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
                                    {modoEdicion ? "Actualizar Alumno" : "Guardar Alumno"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Vista Previa Editable para Importación Masiva */}
            {mostrarModalPreview && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
                        
                        <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Vista Previa de Importación Masiva
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Revisa, edita celdas si es necesario y verifica que los campos obligatorios (Matrícula, Nombre y Grupo) sean válidos.
                                </p>
                            </div>
                            <button
                                onClick={() => setMostrarModalPreview(false)}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 border border-gray-200 rounded-xl mb-4">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-100 sticky top-0">
                                    <tr>
                                        <th className="p-3">Estado</th>
                                        <th className="p-3">Matrícula</th>
                                        <th className="p-3">Nombre</th>
                                        <th className="p-3">Apellido Paterno</th>
                                        <th className="p-3">Apellido Materno</th>
                                        <th className="p-3">Correo</th>
                                        <th className="p-3">Teléfono</th>
                                        <th className="p-3">Grupo ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {alumnosPreview.map((item, index) => (
                                        <tr key={item.idTemp} className={item.esValido ? "hover:bg-slate-50" : "bg-red-50 hover:bg-red-100/50"}>
                                            <td className="p-3 text-center">
                                                {item.esValido ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold" title="Registro válido">
                                                        <CheckCircle size={16} /> Válido
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold" title="Faltan datos obligatorios (Matrícula, Nombre o Grupo)">
                                                        <AlertTriangle size={16} /> Error
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.matricula}
                                                    onChange={(e) => handlePreviewChange(index, "matricula", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.nombre}
                                                    onChange={(e) => handlePreviewChange(index, "nombre", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.apellidoPaterno}
                                                    onChange={(e) => handlePreviewChange(index, "apellidoPaterno", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.apellidoMaterno}
                                                    onChange={(e) => handlePreviewChange(index, "apellidoMaterno", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.correoElectronico}
                                                    onChange={(e) => handlePreviewChange(index, "correoElectronico", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.telefono}
                                                    onChange={(e) => handlePreviewChange(index, "telefono", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={item.grupoId}
                                                    onChange={(e) => handlePreviewChange(index, "grupoId", e.target.value)}
                                                    className="border border-gray-300 rounded px-2 py-1 w-full text-xs bg-white"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <p className="text-xs text-slate-500">
                                Total de registros: <span className="font-bold">{alumnosPreview.length}</span> | 
                                Válidos para importar: <span className="font-bold text-emerald-600">{alumnosPreview.filter(a => a.esValido).length}</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMostrarModalPreview(false)}
                                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={importando || alumnosPreview.filter(a => a.esValido).length === 0}
                                    onClick={confirmarImportacionMasiva}
                                    className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 shadow-md cursor-pointer disabled:opacity-50"
                                >
                                    {importando ? "Importando..." : "Confirmar e Importar"}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal para Visualizar el Código QR */}
            {mostrarModalQR && alumnoSeleccionadoQR && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
                        <div className="flex justify-between items-center pb-3 mb-3 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-slate-800">
                                Credencial QR
                            </h2>
                            <button
                                onClick={() => setMostrarModalQR(false)}
                                className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="my-4 flex flex-col items-center">
                            <p className="font-semibold text-slate-700 text-base">
                                {alumnoSeleccionadoQR.nombre} {alumnoSeleccionadoQR.apellidoPaterno} {alumnoSeleccionadoQR.apellidoMaterno || ""}
                            </p>
                            <p className="text-xs text-slate-500 mb-4">
                                Matrícula: <span className="font-mono font-bold text-slate-700">{alumnoSeleccionadoQR.matricula}</span>
                            </p>

                            <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-inner inline-block">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                        `Matrícula: ${alumnoSeleccionadoQR.matricula} \vert{} Nombre:${alumnoSeleccionadoQR.nombre} ${alumnoSeleccionadoQR.apellidoPaterno}${alumnoSeleccionadoQR.apellidoMaterno || ""}`
                                    )}`}
                                    alt={`QR de ${alumnoSeleccionadoQR.nombre}`}
                                    className="w-44 h-44 object-contain"
                                />
                            </div>

                            <p className="text-[11px] text-gray-400 mt-4">
                                Al escanear este código se obtendrá la matrícula y los datos completos del alumno.
                            </p>
                        </div>

                        <button
                            onClick={() => setMostrarModalQR(false)}
                            className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Alumnos;