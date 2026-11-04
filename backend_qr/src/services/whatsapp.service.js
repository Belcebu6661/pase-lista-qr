/**
 * src/services/whatsapp.service.js
 * Notificaciones de asistencia por WhatsApp Cloud API.
 * Una falla de WhatsApp no debe impedir guardar la asistencia.
 */

const limpiarTelefono = (valor) =>
    String(valor ?? "").trim();

const normalizarTelefono = (valor) => {
    let numero = limpiarTelefono(valor).replace(/\D/g, "");

    if (!numero) return null;

    // Compatibilidad con el formato mexicano antiguo +521XXXXXXXXXX
    if (numero.startsWith("521") && numero.length === 13) {
        numero = `52${numero.slice(3)}`;
    } else if (numero.length === 10) {
        const codigoPais = String(
            process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || "52"
        ).replace(/\D/g, "");

        numero = `${codigoPais}${numero}`;
    }

    if (numero.length < 10 || numero.length > 15) {
        return null;
    }

    // Cloud API recibe el número internacional sin el signo +
    return numero;
};

const fechaYHoraLocal = (fecha) => {
    const fechaHora = new Date(fecha);

    const fechaTexto = new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Mexico_City",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(fechaHora);

    const horaTexto = new Intl.DateTimeFormat("es-MX", {
        timeZone: "America/Mexico_City",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    }).format(fechaHora);

    return { fechaTexto, horaTexto };
};

const enviarPlantillaWhatsApp = async ({
    telefono,
    parametros
}) => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId =
        process.env.WHATSAPP_PHONE_NUMBER_ID;

    const nombrePlantilla =
        process.env.WHATSAPP_TEMPLATE_NAME || "aviso_asistencia";

    const idiomaPlantilla =
        process.env.WHATSAPP_TEMPLATE_LANGUAGE || "es_MX";

    const versionApi =
        process.env.WHATSAPP_GRAPH_API_VERSION || "v23.0";

    if (!token || !phoneNumberId) {
        return {
            enviado: false,
            omitido: true,
            motivo: "WhatsApp no está configurado"
        };
    }

    const destinatario = normalizarTelefono(telefono);

    if (!destinatario) {
        return {
            enviado: false,
            omitido: true,
            motivo: "Teléfono vacío o no válido"
        };
    }

    const url =
        `https://graph.facebook.com/${versionApi}/${phoneNumberId}/messages`;

    const respuesta = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: destinatario,
            type: "template",
            template: {
                name: nombrePlantilla,
                language: {
                    code: idiomaPlantilla
                },
                components: [
                    {
                        type: "body",
                        parameters: parametros.map((texto) => ({
                            type: "text",
                            text: String(texto || "No especificado")
                        }))
                    }
                ]
            }
        }),
        signal: AbortSignal.timeout(10000)
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
        console.error("WhatsApp Cloud API rechazó el mensaje:", {
            status: respuesta.status,
            error: resultado?.error?.message || "Respuesta no válida"
        });

        return {
            enviado: false,
            motivo:
                resultado?.error?.message ||
                `Error HTTP ${respuesta.status}`
        };
    }

    return {
        enviado: true,
        messageId: resultado?.messages?.[0]?.id || null
    };
};

/**
 * Envía el aviso al alumno y a su tutor.
 * Datos requeridos:
 * alumno, fechaHora y grupo.
 */
export const notificarAsistenciaWhatsApp = async ({
    alumno,
    fechaHora,
    grupo
}) => {
    try {
        if (
            !process.env.WHATSAPP_ACCESS_TOKEN ||
            !process.env.WHATSAPP_PHONE_NUMBER_ID
        ) {
            console.warn(
                "Asistencia guardada. WhatsApp no configurado; " +
                "se omitieron las notificaciones."
            );

            return {
                configurado: false,
                enviados: 0
            };
        }

        const nombreAlumno = [
            alumno?.nombre,
            alumno?.apellidoPaterno,
            alumno?.apellidoMaterno
        ].filter(Boolean).join(" ").trim() || "Alumno";

        const { fechaTexto, horaTexto } =
            fechaYHoraLocal(fechaHora);

        const destinatarios = [
            {
                tipo: "alumno",
                nombre: nombreAlumno,
                telefono: alumno?.telefono
            },
            {
                tipo: "tutor",
                nombre: alumno?.Tutor?.nombre || "Tutor",
                telefono: alumno?.Tutor?.telefono
            }
        ];

        const validos = destinatarios
            .map((destinatario) => ({
                ...destinatario,
                telefonoNormalizado:
                    normalizarTelefono(destinatario.telefono)
            }))
            .filter((destinatario) =>
                destinatario.telefonoNormalizado
            );

        // Evitar enviar dos mensajes al mismo número.
        const unicos = new Map();

        for (const destinatario of validos) {
            if (!unicos.has(destinatario.telefonoNormalizado)) {
                unicos.set(
                    destinatario.telefonoNormalizado,
                    destinatario
                );
            }
        }

        const resultados = await Promise.all(
            [...unicos.values()].map(async (destinatario) => {
                const resultado = await enviarPlantillaWhatsApp({
                    telefono: destinatario.telefonoNormalizado,
                    parametros: [
                        destinatario.nombre,
                        nombreAlumno,
                        fechaTexto,
                        horaTexto,
                        grupo || "No especificado"
                    ]
                });

                if (resultado.enviado) {
                    console.info(
                        `Aviso WhatsApp enviado al ${destinatario.tipo}.`
                    );
                } else {
                    console.warn(
                        `No se pudo enviar al ${destinatario.tipo}: ` +
                        `${resultado.motivo}`
                    );
                }

                return {
                    tipo: destinatario.tipo,
                    ...resultado
                };
            })
        );

        return {
            configurado: true,
            enviados: resultados.filter(
                (resultado) => resultado.enviado
            ).length,
            resultados
        };
    } catch (error) {
        console.error(
            "Error al notificar asistencia por WhatsApp:",
            error.message
        );

        return {
            configurado: Boolean(
                process.env.WHATSAPP_ACCESS_TOKEN
            ),
            enviados: 0,
            error: true
        };
    }
};