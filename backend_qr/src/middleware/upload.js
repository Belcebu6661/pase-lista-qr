// =======================================================
// Importamos Multer
// Multer nos permite recibir archivos enviados desde React
// =======================================================
import multer from "multer";


// =======================================================
// Configuración del almacenamiento
// memoryStorage guarda el archivo temporalmente en memoria
// para poder procesarlo con XLSX sin guardarlo en disco
// =======================================================
const storage = multer.memoryStorage();


// =======================================================
// Creamos la configuración de Multer
// Utilizará el almacenamiento definido anteriormente
// =======================================================
const upload = multer({

    storage

});


// =======================================================
// Exportamos la configuración
// Se utilizará en las rutas para subir archivos
// Ejemplo:
// upload.single("archivo")
// =======================================================
export default upload;