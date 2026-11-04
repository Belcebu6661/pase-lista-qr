//C:\Users\ucbcr\OneDrive\Escritorio\Nvo_PaseLista\pase_lista\frontend_qr\src\Components\FormularioMaestro.jsx


import React, { useState, useEffect } from 'react';

// Renombramos la función a FormularioMaestro para ser coherente con el nombre del archivo
function FormularioMaestro({ maestroEditando, onGuardar, onClose }) {
    const [formData, setFormData] = useState({
        numeroEmpleado: '',
        nombre: '',
        email: '',
        telefono: '',
        password: ''
    });

    useEffect(() => {
        if (maestroEditando) {
            // Sincronizamos: leemos 'correo' (que es como viene de la BD según tu tabla)
            // y lo guardamos en 'email' (que es como lo espera tu API)
            setFormData({
                numeroEmpleado: maestroEditando.numeroEmpleado || '',
                nombre: maestroEditando.nombre || '',
                email: maestroEditando.correo || maestroEditando.email || '',
                telefono: maestroEditando.telefono || '',
                password: ''
            });
        } else {
            // Reiniciamos con los nombres estandarizados
            setFormData({ numeroEmpleado: '', nombre: '', email: '', telefono: '', password: '' });
        }
    }, [maestroEditando]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onGuardar(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Número de Empleado</label>
                <input
                    className="w-full p-2 border rounded mt-1 outline-none"
                    value={formData.numeroEmpleado}
                    onChange={(e) => setFormData({ ...formData, numeroEmpleado: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
                <input
                    className="w-full p-2 border rounded mt-1 outline-none"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Correo Electrónico</label>
                <input
                    className="w-full p-2 border rounded mt-1 outline-none"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Teléfono</label>
                <input
                    className="w-full p-2 border rounded mt-1 outline-none"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="Opcional"
                />
            </div>
            {!maestroEditando && (
                <div>
                    <label className="block text-sm font-medium text-slate-700">Contraseña</label>
                    <input
                        className="w-full p-2 border rounded mt-1 outline-none"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
            )}
            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onClose} className="w-full bg-slate-200 p-2 rounded hover:bg-slate-300">Cancelar</button>
                <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Guardar</button>
            </div>
        </form>
    );
}

export default FormularioMaestro;