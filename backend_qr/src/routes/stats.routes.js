import express from "express";
import prisma from "../config/prisma.js";

const router = express.Router();

// TOTAL ALUMNOS
router.get("/alumnos", async (req, res) => {

    try {

        const total = await prisma.alumno.count();

        res.json({
            total
        });

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener alumnos"
        });

    }

});


// TOTAL MAESTROS
router.get("/maestros", async (req, res) => {

    try {

        const total = await prisma.maestro.count();

        res.json({
            total
        });

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener maestros"
        });

    }

});


// TOTAL ASISTENCIAS
router.get("/asistencias", async (req, res) => {

    try {

        const total = await prisma.asistencia.count();

        res.json({
            total
        });

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener asistencias"
        });

    }

});


// TOTAL FALTAS
router.get("/faltas", async (req, res) => {

    try {

        const total = await prisma.falta.count();

        res.json({
            total
        });

    } catch (error) {

        res.status(500).json({
            error: "Error al obtener faltas"
        });

    }

});



export default router;