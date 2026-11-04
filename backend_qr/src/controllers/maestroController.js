// C:\Users\ucbcr\OneDrive\Escritorio\Repositorios\pase_lista\backend_qr\src\controllers\maestroController.js


import prisma from "../config/prisma.js";
import crypto from "node:crypto";

// API 1: Obtener todos los maestros
export const obtenerMaestros = async (req, res) => {
    try {
        const maestros = await prisma.maestro.findMany({
            include: { Usuario: true }
        });

        return res.status(200).json({
            ok: true,
            msg: "Maestros obtenidos correctamente",
            data: maestros
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        return res.status(500).json({
            ok: false,
            msg: "Error al obtener maestros"
        });
    }
};

// API 2: Obtener maestro por ID
export const obtenerMaestroPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const maestro = await prisma.maestro.findUnique({
            where: { id },
            // Corregido: el nombre de la relación en el schema es "Usuario" (mayúscula),
            // no "usuario". Con el nombre incorrecto Prisma lanza un error en tiempo de ejecución.
            include: { usuario: true }
        });

        if (!maestro) {
            return res.status(404).json({ ok: false, msg: "Maestro no encontrado" });
        }

        return res.status(200).json({ ok: true, data: maestro });
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        return res.status(500).json({ ok: false, msg: "Error al obtener maestro" });
    }
};

// API 3: Registrar maestro
export const registrarMaestro = async (req, res) => {
    try {
        const { nombre, email, password, numeroEmpleado, telefono } = req.body;

        if (!nombre || !email || !password || !numeroEmpleado) {
            return res.status(400).json({
                ok: false,
                msg: "Todos los campos son obligatorios (nombre, email, password, numeroEmpleado)"
            });
        }

        const resultado = await prisma.$transaction(async (tx) => {
            const nuevoUsuario = await tx.usuario.create({
                // El modelo Usuario tiene `id String @id` sin @default(uuid()),
                // así que hay que generarlo manualmente aquí.
                data: { id: crypto.randomUUID(), nombre, correo: email, password, rol: 'MAESTRO' }
            });

            const nuevoMaestro = await tx.maestro.create({
                data: {
                    nombre,
                    numeroEmpleado,
                    usuarioId: nuevoUsuario.id,
                    correo: email,
                    telefono: telefono || null
                }
            });

            return nuevoMaestro;
        });

        return res.status(201).json({
            ok: true,
            msg: "Maestro registrado correctamente",
            data: resultado
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        return res.status(500).json({ ok: false, msg: "Error al registrar el maestro" });
    }
};

// API 4: Editar maestro
export const editarMaestro = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, numeroEmpleado, telefono } = req.body;

        const maestroExistente = await prisma.maestro.findUnique({ where: { id } });
        if (!maestroExistente) {
            return res.status(404).json({ ok: false, msg: "Maestro no encontrado" });
        }

        const maestroActualizado = await prisma.$transaction(async (tx) => {
            const maestro = await tx.maestro.update({
                where: { id },
                data: {
                    nombre,
                    numeroEmpleado,
                    correo: email,
                    telefono: telefono
                }
            });

            if (maestro.usuarioId) {
                await tx.usuario.update({
                    where: { id: maestro.usuarioId },
                    data: { nombre, correo: email }
                });
            }
            return maestro;
        });

        return res.status(200).json({
            ok: true,
            msg: "Maestro actualizado correctamente",
            data: maestroActualizado
        });
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        return res.status(500).json({ ok: false, msg: "Error al editar maestro" });
    }
};

// API 5: Eliminar maestro
export const eliminarMaestro = async (req, res) => {
    try {
        const { id } = req.params;
        const maestro = await prisma.maestro.findUnique({ where: { id } });

        if (!maestro) {
            return res.status(404).json({ ok: false, msg: "Maestro no encontrado" });
        }

        await prisma.$transaction(async (tx) => {
            await tx.maestro.delete({ where: { id } });
            if (maestro.usuarioId) {
                await tx.usuario.delete({ where: { id: maestro.usuarioId } });
            }
        });

        return res.status(200).json({ ok: true, msg: "Maestro eliminado correctamente" });
    } catch (error) {
        console.error("DETALLE DEL ERROR:", error);
        return res.status(500).json({ ok: false, msg: "Error al eliminar el maestro" });
    }
};

// API para importación masiva de maestros
export const importarMaestros = async (req, res) => {
    try {
        const datosExcel = req.body;

        if (!datosExcel || !Array.isArray(datosExcel) || datosExcel.length === 0) {
            return res.status(400).json({
                success: false,
                msg: 'El cuerpo de la petición debe ser un arreglo de maestros válido.'
            });
        }

        const maestrosFormateados = datosExcel.map(item => ({
            numeroEmpleado: String(item.matricula || item.numeroEmpleado || ''),
            nombre: `${item.nombre || ''} ${item.apellido || ''}`.trim(),
            correo: item.correo || ''
        }));

        const resultado = await prisma.maestro.createMany({
            data: maestrosFormateados,
            skipDuplicates: true
        });

        return res.status(201).json({
            success: true,
            msg: `${resultado.count} maestros importados correctamente`
        });

    } catch (error) {
        console.error('❌ Error crítico en el endpoint de importación:', error);
        return res.status(500).json({
            success: false,
            msg: 'Error al procesar la importación: ' + error.message
        });
    }
};