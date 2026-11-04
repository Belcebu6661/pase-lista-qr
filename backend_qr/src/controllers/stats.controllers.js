import prisma from "../config/prisma.js";

// Total de alumnos
export const totalAlumnos = async (req, res) => {

    try {

        const total = await prisma.alumno.count();

        return res.json({
            total
        });

    } catch (error) {

        return res.status(500).json({
            message: "Error al obtener alumnos",
            error: error.message
        });

    }

};

// Total de docentes
export const totalMaestro = async (req, res) => {

    try {

        const total = await prisma.maestro.count();

        return res.json({
            total
        });

    } catch (error) {

        return res.status(500).json({
            message: "Error al obtener maestro",
            error: error.message
        });

    }

};

// Total asistencias
export const totalAsistencias = async (req, res) => {

    try {

        const total = await prisma.asistencia.count();

        return res.json({
            total
        });

    } catch (error) {

        return res.status(500).json({
            message: "Error al obtener asistencias",
            error: error.message
        });

    }

};

// Total faltas
export const totalFaltas = async (req, res) => {

    try {

        const total = await prisma.falta.count();

        return res.json({
            total
        });

    } catch (error) {

        return res.status(500).json({
            message: "Error al obtener faltas",
            error: error.message
        });

    }

};