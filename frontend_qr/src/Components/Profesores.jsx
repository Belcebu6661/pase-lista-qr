import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import TablaMaestros from './TablaMaestros';
// IMPORTANTE: Asegúrate de que este archivo exista en la ruta indicada
import { importarMaestros } from '../service/maestroService.js';

function Profesores() {
    const [maestros, setMaestros] = useState([]); 
    const [vista, setVista] = useState('lista'); // 'lista' o 'importar'

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            setMaestros(jsonData);
        };
        reader.readAsArrayBuffer(file);
    };

    const handleInputChange = (index, field, value) => {
        const nuevosMaestros = [...maestros];
        nuevosMaestros[index][field] = value;
        setMaestros(nuevosMaestros);
    };

    const handleGuardar = async () => {
        if (maestros.length === 0) return;

        try {
            // Se llama a la función importada del servicio
            const result = await importarMaestros(maestros);

            if (result.success) {
                alert(result.msg || 'Maestros guardados correctamente');
                setMaestros([]);
            } else {
                alert('Error del servidor: ' + (result.msg || 'Error desconocido'));
            }
        } catch (error) {
            console.error("DETALLE DEL ERROR:", error);
            alert("Error de conexión: Revisa si el servidor está encendido y la ruta es correcta");
        }
    };

    return (
        <div className="w-full mx-auto p-6 bg-white rounded-xl shadow-lg border border-slate-100 mt-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6 text-center">Gestión de Maestros</h1>
            
            <div className="flex justify-center gap-4 mb-8">
                <button 
                    onClick={() => setVista('importar')}
                    className={`px-4 py-2 rounded-lg font-semibold ${vista === 'importar' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                    Importar Maestros
                </button>
                <button 
                    onClick={() => setVista('lista')}
                    className={`px-4 py-2 rounded-lg font-semibold ${vista === 'lista' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                >
                    Maestros Registrados
                </button>
            </div>

            {vista === 'importar' ? (
                <div>
                    <div className="flex justify-center mb-8">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls"
                            onChange={handleFileUpload} 
                            className="block text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                        />
                    </div>

                    {maestros.length > 0 && (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse bg-white border border-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="border p-3 text-left">Número Empleado</th>
                                        <th className="border p-3 text-left">Nombre</th>
                                        <th className="border p-3 text-left">Correo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maestros.map((maestro, index) => (
                                        <tr key={index} className="hover:bg-slate-50 border-b">
                                            <td className="p-2"><input className="w-full p-2 border rounded" value={maestro.numeroEmpleado || ''} onChange={(e) => handleInputChange(index, 'numeroEmpleado', e.target.value)} /></td>
                                            <td className="p-2"><input className="w-full p-2 border rounded" value={maestro.nombre || ''} onChange={(e) => handleInputChange(index, 'nombre', e.target.value)} /></td>
                                            <td className="p-2"><input className="w-full p-2 border rounded" value={maestro.correo || ''} onChange={(e) => handleInputChange(index, 'correo', e.target.value)} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end mt-6">
                                <button onClick={handleGuardar} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700">
                                    Guardar Maestros
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <TablaMaestros />
            )}
        </div>
    );
}

export default Profesores;