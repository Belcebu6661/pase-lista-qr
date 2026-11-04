import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

const TestConnectionScreen: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [responseMessage, setResponseMessage] = useState<string>("  ");
    const API_URL = 'http://192.168.137.99:3000/api/test-connection';

    //FUNCIÓN PARA PROBAR LA CONEXIÓN CON EL BACKEND
    const handleTestConnection = async () => {
        setLoading(true);
        setResponseMessage("");

        try {
            //petición al backend para probar la conexión
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            //verificar si la respuesta es exitosa
            if (response.ok) {
                setResponseMessage(data.message ||
                    "Conexión exitosa con el backend.");
            } else {
                setResponseMessage(`Error: ${data.message}`);
            }

        } catch (error: any) {
            console.error('Error:', error);
            setResponseMessage("Error al conectar con el backend");
        } finally {
            setLoading(false);//desactiva el estado de carga|
        }
    };
    //ESTILOS PARA LA PANTALLA DE PRUEBA DE CONEXIÓN
    // Renderizado de la interfaz
    return (
        <View style={styles.container}>
            {/* SECCIÓN HEADER */}
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Prueba de Conexión</Text>
                <Text style={styles.subtitle}>Verifica el estado del backend</Text>
            </View>

            {/* SECCIÓN CENTRAL: Muestra spinner o respuesta */}
            <View style={styles.centerContainer}>
                {loading ? (
                    // Si está cargando, muestra el spinner
                    <ActivityIndicator size="large" color="#007AFF" />
                ) : (
                    // Si no está cargando, muestra el cuadro de respuesta
                    <View style={styles.responseBox}>
                        <Text style={styles.responseLabel}>Respuesta del servidor:</Text>
                        <Text style={styles.responseText}>
                            {responseMessage || "Presiona el botón para probar"}
                        </Text>
                    </View>
                )}
            </View>

            {/* SECCIÓN INFERIOR: Botones de acción */}
            <View style={styles.bottomContainer}>
                {/* Botón principal: Dispara la prueba de conexión */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleTestConnection}
                    disabled={loading} // Deshabilitado mientras carga
                    activeOpacity={0.8} // Efecto al presionar
                >
                    <Text style={styles.buttonText}>Ping al Servidor</Text>
                </TouchableOpacity>

                {/* Botón secundario: Navega hacia atrás */}
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={() => router.back()} // Vuelve a la pantalla anterior
                    activeOpacity={0.8}
                >
                    <Text style={styles.secondaryButtonText}>Volver al Inicio</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// Definición de estilos (similar a CSS pero en JavaScript)
const styles = StyleSheet.create({
    container: {
        flex: 1, // Ocupa todo el espacio disponible
        backgroundColor: "#F2F2F7", // Color de fondo gris claro (estilo iOS)
        paddingHorizontal: 24, // Margen horizontal
        justifyContent: "space-between", // Distribuye el espacio verticalmente
    },
    headerContainer: {
        marginTop: 80, // Espacio superior
    },
    title: {
        fontSize: 34,
        fontWeight: "700",
        color: "#1C1C1E",
        letterSpacing: -0.5, // Espaciado entre letras
    },
    subtitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#8E8E93",
        textTransform: "uppercase", // Texto en mayúsculas
        letterSpacing: 1,
        marginTop: 4,
    },
    centerContainer: {
        flex: 1, // Ocupa el espacio restante
        justifyContent: "center",
        alignItems: "center",
    },
    responseBox: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        padding: 20,
        borderRadius: 14, // Esquinas redondeadas
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2, // Sombra en Android
        alignItems: "center",
    },
    responseLabel: {
        fontSize: 14,
        color: "#8E8E93",
        marginBottom: 8,
        fontWeight: "500",
    },
    responseText: {
        fontSize: 16,
        color: "#1C1C1E",
        textAlign: "center",
        fontWeight: "600",
    },
    bottomContainer: {
        marginBottom: 50,
        gap: 12, // Espacio entre botones
    },
    primaryButton: {
        backgroundColor: "#34C759", // Verde para denotar acción positiva
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 17,
        fontWeight: "600",
    },
    secondaryButton: {
        backgroundColor: "transparent",
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    secondaryButtonText: {
        color: "#007AFF",
        fontSize: 17,
        fontWeight: "600",
    },
});

export default TestConnectionScreen;