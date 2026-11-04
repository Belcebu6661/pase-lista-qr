
import prisma from "../config/prisma.js";

import {
    notificarAsistenciaWhatsApp
} from "../services/whatsapp.service.js";

// ========================================
// RELACIONES DE ASISTENCIA
// ========================================

const relacionesAsistencia = {
    alumno: {
        select: {
            matricula: true,
            nombre: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            grupoId: true
        }
    },
    SesionQR: {
        include: {
            MaestroMateriaGrupo: {
                include: {
                    Maestro: {
                        select: {
                            nombre: true,
                            numeroEmpleado: true
                        }
                    },
                    Materia: {
                        select: {
                            nombre: true
                        }
                    }
                }
            }
        }
    }
};

// Mantener compatibilidad con Asistencia.jsx
const formatearAsistencia = (asistencia) => {
    const sesion = asistencia.SesionQR;
    const relacion = sesion?.MaestroMateriaGrupo;

    return {
        ...asistencia,
        sesionQR: sesion
            ? {
                ...sesion,
                mmg: relacion
                    ? {
                        ...relacion,
                        maestro: relacion.Maestro,
                        materia: relacion.Materia
                    }
                    : null
            }
            : null
    };
};

// ========================================
// API 1 — REGISTRAR ASISTENCIA
// ========================================

export const registrarAsistencia = async (req, res) => {
    try {
        const { matricula, docente_id } = req.body;

        // 1. Validar datos
        if (!matricula || !docente_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Matrícula y docente_id son obligatorios"
            });
        }

        // 2. Buscar alumno
        const alumno = await prisma.alumno.findUnique({
            where: {
                matricula: String(matricula).trim()
            }
        });

        if (!alumno) {
            return res.status(404).json({
                success: false,
                message:
                    "El alumno con esa matrícula no existe"
            });
        }

        // 3. Buscar docente por ID o número de empleado
        const identificadorDocente =
            String(docente_id).trim();

        const maestro = await prisma.maestro.findFirst({
            where: {
                OR: [
                    { id: identificadorDocente },
                    { numeroEmpleado: identificadorDocente }
                ]
            }
        });

        if (!maestro) {
            return res.status(404).json({
                success: false,
                message: "El docente no existe"
            });
        }

        // 4. Buscar sesión QR activa
        const sesionActiva = await prisma.sesionQR.findFirst({
            where: {
                activa: true,
                expiracion: {
                    gt: new Date()
                },
                MaestroMateriaGrupo: {
                    is: {
                        maestroId: maestro.id
                    }
                }
            },
            orderBy: {
                horaGenerada: "desc"
            }
        });

        if (!sesionActiva) {
            return res.status(404).json({
                success: false,
                message:
                    "No hay ninguna sesión QR activa para este docente"
            });
        }

        // 5. Fecha y hora de México
        const ahora = new Date();

        const partes = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Mexico_City",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(ahora);

        const obtener = (tipo) =>
            partes.find(
                (parte) => parte.type === tipo
            )?.value;

        const fechaHoy =
            `${obtener("year")}-${obtener("month")}-${obtener("day")}`;

        const inicioDia = new Date(
            `${fechaHoy}T00:00:00-06:00`
        );

        const finDia = new Date(
            inicioDia.getTime() + 24 * 60 * 60 * 1000
        );

        // 6. Evitar asistencias duplicadas
        const asistenciaExistente =
            await prisma.asistencia.findFirst({
                where: {
                    alumnoId: alumno.id,
                    fechaHora: {
                        gte: inicioDia,
                        lt: finDia
                    }
                }
            });

        if (asistenciaExistente) {
            return res.status(409).json({
                success: false,
                message:
                    "Asistencia ya registrada hoy"
            });
        }

        // 7. Guardar asistencia
        const asistencia = await prisma.asistencia.create({
            data: {
                alumnoId: alumno.id,
                sesionQRId: sesionActiva.id,
                estado: "PRESENTE",
                fechaHora: ahora
            }
        });

        console.log(
            "ASISTENCIA GUARDADA:",
            asistencia.id
        );

        // 8. Consultar alumno, grupo y tutor
        // Si esta consulta falla, la asistencia
        // ya guardada no debe perderse.
        let alumnoConGrupo = null;

        try {
            alumnoConGrupo = await prisma.alumno.findUnique({
                where: {
                    id: alumno.id
                },
                include: {
                    Grupo: true,
                    Tutor: true
                }
            });
        } catch (errorConsulta) {
            console.error(
                "ERROR CONSULTANDO DATOS DE WHATSAPP:",
                errorConsulta.message
            );
        }

        // 9. Diagnóstico de teléfonos
        // No mostramos números completos en los logs.
        if (alumnoConGrupo) {
            console.log("DATOS PARA WHATSAPP:", {
                alumnoTieneTelefono:
                    Boolean(alumnoConGrupo.telefono),
                tutorExiste:
                    Boolean(alumnoConGrupo.Tutor),
                tutorTieneTelefono:
                    Boolean(alumnoConGrupo.Tutor?.telefono),
                grupo:
                    alumnoConGrupo.Grupo?.nombre || "Sin grupo"
            });
        }

        // 10. Enviar notificación por WhatsApp
        let resultadoWhatsApp = {
            configurado: false,
            enviados: 0,
            resultados: []
        };

        if (alumnoConGrupo) {
            try {
                console.log(
                    "INICIANDO ENVÍO DE WHATSAPP..."
                );

                resultadoWhatsApp =
                    await notificarAsistenciaWhatsApp({
                        alumno: alumnoConGrupo,
                        fechaHora: asistencia.fechaHora,
                        grupo:
                            alumnoConGrupo.Grupo?.nombre ||
                            "Sin grupo"
                    });

                console.log(
                    "RESULTADO WHATSAPP:",
                    JSON.stringify(
                        resultadoWhatsApp,
                        null,
                        2
                    )
                );

            } catch (errorWhatsApp) {
                console.error(
                    "ERROR AL ENVIAR WHATSAPP:",
                    errorWhatsApp.message
                );
            }
        } else {
            console.warn(
                "WHATSAPP OMITIDO: no se pudieron consultar " +
                "los datos del alumno."
            );
        }

        // 11. Responder al frontend
        const alumnoRespuesta =
            alumnoConGrupo || alumno;

        return res.status(201).json({
            success: true,
            message: "Asistencia registrada correctamente",
            alumno: {
                nombre: alumnoRespuesta.nombre,
                apellidoPaterno:
                    alumnoRespuesta.apellidoPaterno,
                apellidoMaterno:
                    alumnoRespuesta.apellidoMaterno || "",
                grupo:
                    alumnoConGrupo?.Grupo?.nombre || null
            },
            whatsapp: {
                configurado:
                    resultadoWhatsApp.configurado || false,
                enviados:
                    resultadoWhatsApp.enviados || 0,
                resultados:
                    resultadoWhatsApp.resultados || []
            }
        });

    } catch (error) {
        console.error(
            "DETALLE DEL ERROR EN ASISTENCIA:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
};

// ========================================
// API 2 — CONSULTAR ASISTENCIAS
// ========================================

export const consultarAsistencias = async (req, res) => {
    try {
        const asistencias = await prisma.asistencia.findMany({
            include: relacionesAsistencia,
            orderBy: {
                fechaHora: "desc"
            }
        });

        console.log(
            "TOTAL ASISTENCIAS ENCONTRADAS:",
            asistencias.length
        );

        return res.status(200).json({
            success: true,
            message:
                "Asistencias obtenidas correctamente",
            total: asistencias.length,
            data: asistencias.map(formatearAsistencia)
        });

    } catch (error) {
        console.error(
            "ERROR CONSULTANDO ASISTENCIAS:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error al consultar asistencias"
        });
    }
};

// ========================================
// API 3 — ASISTENCIAS POR ALUMNO
// ========================================

export const asistenciasPorAlumno = async (req, res) => {
    try {
        const { matricula } = req.params;

        const alumno = await prisma.alumno.findUnique({
            where: {
                matricula: matricula.trim()
            }
        });

        if (!alumno) {
            return res.status(404).json({
                success: false,
                message: "Alumno no encontrado"
            });
        }

        const asistencias = await prisma.asistencia.findMany({
            where: {
                alumnoId: alumno.id
            },
            include: relacionesAsistencia,
            orderBy: {
                fechaHora: "desc"
            }
        });

        if (asistencias.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "El alumno no tiene asistencias registradas"
            });
        }

        return res.status(200).json({
            success: true,
            alumno: {
                matricula: alumno.matricula,
                nombre: alumno.nombre,
                apellidoPaterno: alumno.apellidoPaterno,
                apellidoMaterno: alumno.apellidoMaterno
            },
            total: asistencias.length,
            data: asistencias.map(formatearAsistencia)
        });

    } catch (error) {
        console.error(
            "ERROR ASISTENCIAS POR ALUMNO:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error al consultar asistencias del alumno"
        });
    }
};

// ========================================
// API 4 — ASISTENCIAS POR FECHA
// ========================================

export const asistenciasPorFecha = async (req, res) => {
    try {
        const { fecha } = req.params;

        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
            Number.isNaN(Date.parse(fecha)) ||
            new Date(fecha).toISOString().slice(0, 10) !== fecha
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Fecha no válida. Utiliza YYYY-MM-DD"
            });
        }

        const inicioDia = new Date(
            `${fecha}T00:00:00-06:00`
        );

        const finDia = new Date(
            inicioDia.getTime() + 24 * 60 * 60 * 1000
        );

        const asistencias = await prisma.asistencia.findMany({
            where: {
                fechaHora: {
                    gte: inicioDia,
                    lt: finDia
                }
            },
            include: relacionesAsistencia,
            orderBy: {
                fechaHora: "desc"
            }
        });

        if (asistencias.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No hay asistencias registradas en esa fecha"
            });
        }

        return res.status(200).json({
            success: true,
            fecha,
            total: asistencias.length,
            data: asistencias.map(formatearAsistencia)
        });

    } catch (error) {
        console.error(
            "ERROR ASISTENCIAS POR FECHA:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Error al consultar asistencias por fecha"
        });
    }
};
