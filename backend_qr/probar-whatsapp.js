
import "dotenv/config";

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v25.0";

// Número personal autorizado en Meta, sin el signo +
const destinatario = "527716509314";

async function probarWhatsApp() {
    if (!token || !phoneNumberId) {
        console.error("Faltan las variables de WhatsApp en .env");
        return;
    }

    const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    const mensaje = {
        messaging_product: "whatsapp",
        to: destinatario,
        type: "template",
        template: {
            name: "aviso_asistencia",
            language: {
                code: "es_MX"
            },
            components: [
                {
                    type: "body",
                    parameters: [
                        { type: "text", text: "María García" },
                        { type: "text", text: "Juan Pérez" },
                        { type: "text", text: "28/10/2026" },
                        { type: "text", text: "08:30 AM" },
                        { type: "text", text: "4A" }
                    ]
                }
            ]
        }
    };

    try {
        const respuesta = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(mensaje)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            console.error("Error de WhatsApp:", resultado.error?.message);
            return;
        }

        console.log("Mensaje aceptado por WhatsApp Cloud API");
        console.log("ID:", resultado.messages?.[0]?.id);
        console.log("Revisa tu WhatsApp.");
    } catch (error) {
        console.error("Error de conexión:", error.message);
    }
}

probarWhatsApp();

