

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {useRouter} from "expo-router";
const HomeScreen: React.FC = () => {
const router = useRouter();
  //código para abrir cámara
const handleOpenScanner = () => {
  router.push("/scanner");
};
  return (
    <View style={styles.container}>
      {/* Cabecera / Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.subtitle}>Pase de Lista QR</Text>
        <Text style={styles.title}>Asistencia</Text>
      </View>
      {/* Contenedor Central / Ilustrativo */}
      <View style={styles.centerContainer}>
        <View style={styles.qrPlaceholder}>
          {/* Un recuadro minimalista que simula el escaneo */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
          <Text style={styles.hintText}>Listo para escanears</Text>
        </View>
      </View>
      {/* Botón de Acción Inferior */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleOpenScanner}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Escanear Código QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7", // El gris claro de fondo oficial de iOS
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  headerContainer: {
    marginTop: 80, // Espacio para la barra de estado
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93", // Gris de sistema Apple
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#1C1C1E", // Negro casi puro de iOS
    letterSpacing: -0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  hintText: {
    color: "#AEAEB2",
    fontSize: 16,
    fontWeight: "400",
  },
  // Esquinas minimalistas para simular zona de escaneo
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#007AFF", // Azul Apple
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },

  bottomContainer: {
    marginBottom: 50, // Espacio para el notch/home indicator
  },
  primaryButton: {
    backgroundColor: "#007AFF", // Azul Apple (puedes cambiarlo por "#1C1C1E" si prefieres un look dark-minimal)
    paddingVertical: 16,
    borderRadius: 14, // Bordes muy iOS
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3, // Sombra para Android
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.4,
  },
});

export default HomeScreen;