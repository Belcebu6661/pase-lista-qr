import XLSX from 'xlsx';
import prisma from '../config/prisma.js';

export const cargaMasivaAlumnos = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Debes seleccionar un archivo Excel'
            });
        }

        const workbook = XLSX.read(req.file.buffer, {
            type: 'buffer'
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const alumnosExcel = XLSX.utils.sheet_to_json(sheet);

        if (alumnosExcel.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El archivo está vacío'
            });
        }

        const alumnos = alumnosExcel.map(alumno => ({
    matricula: alumno.matricula,
    nombre: alumno.nombre,
    apellidoPaterno: alumno.apellidoPaterno,
    apellidoMaterno: alumno.apellidoMaterno,
    correo: alumno.correo,
    telefono: alumno.telefono,
    grupoId: Number(alumno.grupoId)
}));

        const resultado = await prisma.alumno.createMany({
            data: alumnos,
            skipDuplicates: true
        });

        return res.status(201).json({
            success: true,
            message: `${resultado.count} alumnos importados correctamente`
        });

    } catch (error) {

    console.error(error);

    return res.status(500).json({

        success: false,

        message: error.message

    });

}
};