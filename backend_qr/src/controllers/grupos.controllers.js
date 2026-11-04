
import prisma from "../config/prisma.js";

// ==========================================
// 1. CREAR GRUPO
// ==========================================

export const crearGrupo = async (req, res) => {
    try {
        console.log("BODY RECIBIDO:", req.body);

        const { id, nombre, cuatrimestre, turno } = req.body;

        // Validar campos obligatorios
        if (
            typeof id !== "string" ||
            typeof nombre !== "string" ||
            typeof turno !== "string" ||
            !id.trim() ||
            !nombre.trim() ||
            !turno.trim()
        ) {
            return res.status(400).json({
                ok: false,
                msg: "Todos los campos son obligatorios"
            });
        }

        const numeroCuatrimestre = Number(cuatrimestre);

        if (
            !Number.isInteger(numeroCuatrimestre) ||
            numeroCuatrimestre < 1
        ) {
            return res.status(400).json({
                ok: false,
                msg: "El cuatrimestre debe ser un número válido"
            });
        }

        // Verificar si ya existe el grupo
        const existe = await prisma.grupo.findUnique({
            where: { id: id.trim() }
        });

        if (existe) {
            return res.status(409).json({
                ok: false,
                msg: "Ya existe un grupo con ese ID"
            });
        }

        // Crear grupo
        const nuevoGrupo = await prisma.grupo.create({
            data: {
                id: id.trim(),
                nombre: nombre.trim(),
                cuatrimestre: numeroCuatrimestre,
                turno: turno.trim()
            }
        });

        return res.status(201).json({
            ok: true,
            msg: "Grupo creado correctamente",
            data: nuevoGrupo
        });

    } catch (error) {
        console.error("Error en crearGrupo:", error);

        if (error.code === "P2002") {
            return res.status(409).json({
                ok: false,
                msg: "El ID del grupo ya está registrado"
            });
        }

        return res.status(500).json({
            ok: false,
            msg: "Error interno al crear grupo",
            error: error.message
        });
    }
};


// ==========================================
// 2. OBTENER TODOS LOS GRUPOS
// ==========================================

export const obtenerGrupos = async (req, res) => {
    try {

        const grupos = await prisma.grupo.findMany({
            orderBy: [
                { cuatrimestre: "asc" },
                { nombre: "asc" }
            ]
        });

        console.log("GRUPOS ENCONTRADOS:", grupos);

        return res.status(200).json({
            ok: true,
            msg: "Grupos obtenidos correctamente",
            data: grupos
        });

    } catch (error) {

        console.error("Error al obtener grupos:", error);

        return res.status(500).json({
            ok: false,
            msg: "Error al obtener los grupos",
            error: error.message
        });
    }
};


// ==========================================
// 3. OBTENER UN GRUPO POR ID
// ==========================================

export const obtenerGrupoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const grupo = await prisma.grupo.findUnique({
            where: { id }
        });

        if (!grupo) {
            return res.status(404).json({
                ok: false,
                msg: "Grupo no encontrado"
            });
        }

        return res.status(200).json({
            ok: true,
            data: grupo
        });

    } catch (error) {

        console.error("Error en obtenerGrupoPorId:", error);

        return res.status(500).json({
            ok: false,
            msg: "Error al obtener el grupo",
            error: error.message
        });
    }
};


// ==========================================
// 4. ACTUALIZAR GRUPO
// ==========================================

export const actualizarGrupo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, cuatrimestre, turno } = req.body;

        const datos = {};

        if (nombre !== undefined) {
            if (typeof nombre !== "string" || !nombre.trim()) {
                return res.status(400).json({
                    ok: false,
                    msg: "El nombre no es válido"
                });
            }

            datos.nombre = nombre.trim();
        }

        if (cuatrimestre !== undefined) {
            const numero = Number(cuatrimestre);

            if (!Number.isInteger(numero) || numero < 1) {
                return res.status(400).json({
                    ok: false,
                    msg: "Cuatrimestre no válido"
                });
            }

            datos.cuatrimestre = numero;
        }

        if (turno !== undefined) {
            if (typeof turno !== "string" || !turno.trim()) {
                return res.status(400).json({
                    ok: false,
                    msg: "El turno no es válido"
                });
            }

            datos.turno = turno.trim();
        }

        const grupoActualizado = await prisma.grupo.update({
            where: { id },
            data: datos
        });

        return res.status(200).json({
            ok: true,
            msg: "Grupo actualizado correctamente",
            data: grupoActualizado
        });

    } catch (error) {

        console.error("Error al actualizar grupo:", error);

        if (error.code === "P2025") {
            return res.status(404).json({
                ok: false,
                msg: "Grupo no encontrado"
            });
        }

        return res.status(500).json({
            ok: false,
            msg: "Error al actualizar grupo",
            error: error.message
        });
    }
};


// ==========================================
// 5. ELIMINAR GRUPO
// ==========================================

export const eliminarGrupo = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.grupo.delete({
            where: { id }
        });

        return res.status(200).json({
            ok: true,
            msg: "Grupo eliminado correctamente"
        });

    } catch (error) {

        console.error("Error al eliminar grupo:", error);

        if (error.code === "P2025") {
            return res.status(404).json({
                ok: false,
                msg: "Grupo no encontrado"
            });
        }

        if (error.code === "P2003") {
            return res.status(409).json({
                ok: false,
                msg: "No puedes eliminar un grupo que tiene registros relacionados"
            });
        }

        return res.status(500).json({
            ok: false,
            msg: "Error al eliminar grupo",
            error: error.message
        });
    }
};


// ==========================================
// ALIAS DE COMPATIBILIDAD
// ==========================================

export const crearMateria = crearGrupo;
export const obtenerMaterias = obtenerGrupos;
export const obtenerMateriaPorId = obtenerGrupoPorId;
export const actualizarMateria = actualizarGrupo;
export const eliminarMateria = eliminarGrupo;
