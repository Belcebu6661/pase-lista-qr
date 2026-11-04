

export const testConnection = async (req, res) => {
try {
return res.status(200).json({
    status: "success",
    message: "Conexión exitosa con el backend",
    timestampo: new Date().toISOString()
});
} catch (error) {
return res.status(500).json({
status: "error",
message: "Error al conectar con el backend",
error: error.message
});
}

}