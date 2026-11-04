
import prisma from "../config/prisma.js";

/**
 * Convierte los valores recibidos en texto limpio.
 */
const limpiarTexto = (valor) => {
    if (valor === undefined || valor === null) return "";
    return String(valor).trim();
};

/**
 * Obtiene los alumnos con su grupo y tutor.
 */
export const obtenerAlumnos = async (req, res) => {
    try {
        const alumnos = await prisma.alumno.findMany({
            include: {
                Grupo: true,
                Tutor: true
            },
            orderBy: {
                matricula: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            message: "Alumnos obtenidos correctamente",
            data: alumnos
        });
    } catch (error) {
        console.error("Error al obtener alumnos:", error);

        return res.status(500).json({
            success: false,
            message: "Error al obtener los alumnos",
            error: error.message
        });
    }
};

/**
 * Crea un alumno individual.
 */
export const crearAlumno = async (req, res) => {
    try {
        const {
            matricula,
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            correoElectronico,
            correo,
            telefono,
            grupoId
        } = req.body;

        const matriculaLimpia = limpiarTexto(matricula);
        const nombreLimpio = limpiarTexto(nombre);
        const grupoIdLimpio = limpiarTexto(grupoId);

        if (!matriculaLimpia || !nombreLimpio || !grupoIdLimpio) {
            return res.status(400).json({
                success: false,
                message: "La matrícula, el nombre y el grupo son obligatorios."
            });
        }

        // Comprobar que el grupo exista.
        const grupo = await prisma.grupo.findFirst({
            where: {
                OR: [
                    { id: grupoIdLimpio },
                    { nombre: grupoIdLimpio }
                ]
            }
        });

        if (!grupo) {
            return res.status(400).json({
                success: false,
                message: `No existe un grupo con el identificador o nombre "${grupoIdLimpio}".`
            });
        }

        // Evitar matrículas duplicadas.
        const existente = await prisma.alumno.findUnique({
            where: {
                matricula: matriculaLimpia
            }
        });

        if (existente) {
            return res.status(409).json({
                success: false,
                message: `La matrícula ${matriculaLimpia} ya está registrada.`
            });
        }

        const nuevoAlumno = await prisma.alumno.create({
            data: {
                matricula: matriculaLimpia,
                nombre: nombreLimpio,
                apellidoPaterno: limpiarTexto(apellidoPaterno),
                apellidoMaterno: limpiarTexto(apellidoMaterno),
                correo: limpiarTexto(correoElectronico || correo),
                telefono: limpiarTexto(telefono),
                grupoId: grupo.id
            }
        });

        return res.status(201).json({
            success: true,
            message: "Alumno creado correctamente",
            data: nuevoAlumno
        });
    } catch (error) {
        console.error("Error al crear alumno:", error);

        return res.status(500).json({
            success: false,
            message: "Error al guardar el alumno",
            error: error.message
        });
    }
};

/**
 * Importa alumnos enviados por el frontend como JSON.
 *
 * Cada registro se inserta en la base de datos.
 * Los duplicados y registros con errores se reportan por separado.
 */
export const cargaMasivaAlumnos = async (req, res) => {
    try {
        const { alumnos } = req.body ?? {};

        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No se proporcionaron registros para la carga masiva."
            });
        }

        const importados = [];
        const omitidos = [];
        const errores = [];

        // Evitar que dos filas del mismo archivo compartan matrícula.
        const matriculasArchivo = new Set();

        // Cache de grupos para no consultar repetidamente el mismo grupo.
        const gruposCache = new Map();

        for (let i = 0; i < alumnos.length; i++) {
            const alumno = alumnos[i];
            const fila = i + 2; // Fila 1 normalmente contiene encabezados.

            try {
                if (!alumno || typeof alumno !== "object") {
                    errores.push({
                        fila,
                        matricula: "",
                        motivo: "El registro no tiene un formato válido."
                    });
                    continue;
                }

                const matricula = limpiarTexto(alumno.matricula);
                const nombre = limpiarTexto(alumno.nombre);
                const apellidoPaterno = limpiarTexto(alumno.apellidoPaterno);
                const apellidoMaterno = limpiarTexto(alumno.apellidoMaterno);
                const correo = limpiarTexto(
                    alumno.correoElectronico || alumno.correo
                );
                const telefono = limpiarTexto(alumno.telefono);
                const grupoTexto = limpiarTexto(alumno.grupoId);

                // Validación de los campos obligatorios.
                if (!matricula || !nombre || !grupoTexto) {
                    errores.push({
                        fila,
                        matricula,
                        motivo: "Falta matrícula, nombre o grupo."
                    });
                    continue;
                }

                // Detectar duplicados dentro del mismo archivo.
                if (matriculasArchivo.has(matricula)) {
                    omitidos.push({
                        fila,
                        matricula,
                        motivo: "La matrícula está repetida en el archivo."
                    });
                    continue;
                }

                matriculasArchivo.add(matricula);

                // Buscar el grupo por su ID o nombre.
                let grupo = gruposCache.get(grupoTexto);

                if (grupo === undefined) {
                    grupo = await prisma.grupo.findFirst({
                        where: {
                            OR: [
                                { id: grupoTexto },
                                { nombre: grupoTexto }
                            ]
                        }
                    });

                    gruposCache.set(grupoTexto, grupo || null);
                }

                if (!grupo) {
                    errores.push({
                        fila,
                        matricula,
                        motivo: `No existe el grupo "${grupoTexto}".`
                    });
                    continue;
                }

                // Revisar si la matrícula ya existe en PostgreSQL.
                const existente = await prisma.alumno.findUnique({
                    where: { matricula }
                });

                if (existente) {
                    omitidos.push({
                        fila,
                        matricula,
                        motivo: "La matrícula ya está registrada en la base de datos."
                    });
                    continue;
                }

                // INSERT REAL mediante Prisma.
                const nuevoAlumno = await prisma.alumno.create({
                    data: {
                        matricula,
                        nombre,
                        apellidoPaterno,
                        apellidoMaterno,
                        correo,
                        telefono,
                        grupoId: grupo.id
                    }
                });

                importados.push({
                    matricula: nuevoAlumno.matricula,
                    nombre: nuevoAlumno.nombre
                });

            } catch (errorFila) {
                console.error(
                    `Error al importar la fila ${fila}:`,
                    errorFila
                );

                if (errorFila.code === "P2002") {
                    omitidos.push({
                        fila,
                        matricula: limpiarTexto(alumno?.matricula),
                        motivo: "La matrícula ya existe o infringe una restricción única."
                    });
                } else if (errorFila.code === "P2003") {
                    errores.push({
                        fila,
                        matricula: limpiarTexto(alumno?.matricula),
                        motivo: "El grupo u otra relación no existe en la base de datos."
                    });
                } else {
                    errores.push({
                        fila,
                        matricula: limpiarTexto(alumno?.matricula),
                        motivo: errorFila.message || "Error al insertar el alumno."
                    });
                }
            }
        }

        const totalImportados = importados.length;
        const totalOmitidos = omitidos.length;
        const totalErrores = errores.length;

        return res.status(200).json({
            success: totalImportados > 0,
            message: totalImportados > 0
                ? "Proceso de carga masiva finalizado."
                : "No se importaron alumnos. Consulta el detalle de los registros.",
            recibidos: alumnos.length,
            importados: totalImportados,
            omitidos: totalOmitidos,
            errores: totalErrores,
            detalle: {
                importados,
                omitidos,
                errores
            }
        });

    } catch (error) {
        console.error("Error general en carga masiva:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno durante la carga masiva.",
            error: error.message
        });
    }
};

/**
 * Actualiza un alumno usando su matrícula como identificador.
 */
export const actualizarAlumno = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nombre,
            apellidoPaterno,
            apellidoMaterno,
            correoElectronico,
            correo,
            telefono,
            grupoId
        } = req.body;

        const datos = {
            nombre: limpiarTexto(nombre),
            apellidoPaterno: limpiarTexto(apellidoPaterno),
            apellidoMaterno: limpiarTexto(apellidoMaterno),
            correo: limpiarTexto(correoElectronico || correo),
            telefono: limpiarTexto(telefono)
        };

        if (grupoId !== undefined) {
            const grupoTexto = limpiarTexto(grupoId);

            const grupo = await prisma.grupo.findFirst({
                where: {
                    OR: [
                        { id: grupoTexto },
                        { nombre: grupoTexto }
                    ]
                }
            });

            if (!grupo) {
                return res.status(400).json({
                    success: false,
                    message: `No existe el grupo "${grupoTexto}".`
                });
            }

            datos.grupoId = grupo.id;
        }

        const alumnoActualizado = await prisma.alumno.update({
            where: { matricula: id },
            data: datos
        });

        return res.status(200).json({
            success: true,
            message: "Alumno actualizado correctamente",
            data: alumnoActualizado
        });
    } catch (error) {
        console.error("Error al actualizar alumno:", error);

        return res.status(error.code === "P2025" ? 404 : 500).json({
            success: false,
            message: error.code === "P2025"
                ? "No se encontró el alumno."
                : "Error al actualizar el alumno.",
            error: error.message
        });
    }
};

/**
 * Elimina un alumno por matrícula.
 */
export const eliminarAlumno = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.alumno.delete({
            where: { matricula: id }
        });

        return res.status(200).json({
            success: true,
            message: "Alumno eliminado correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar alumno:", error);

        return res.status(error.code === "P2025" ? 404 : 500).json({
            success: false,
            message: error.code === "P2025"
                ? "No se encontró el alumno."
                : "Error al eliminar el alumno.",
            error: error.message
        });
    }
};
