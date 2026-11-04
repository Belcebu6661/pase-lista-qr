//método post para insertar materias
import prisma from "../config/prisma.js";//función para crear una materia
export const crearMateria=async(req,res)=>{
    try{
const {nombre, clave, cuatrimestre} = req.body;
//validar los campos   
if(!nombre || !clave || !cuatrimestre){
return res.status(400).json({
    ok: false,
    msg: "Todos los campos son obligatorios"
});
} 
const nuevaMateria = await prisma.materia.create({
    data:{nombre, clave , cuatrimestre}
});

//respuesta exitosa
return res.status(201).json({
    ok: true,
    msg: "Materua creada correctamente",
    data: nuevaMateria
});
    }
catch(error){
return res.status(500).json({
    ok: false,
    msg: "Error del servidor"
});
    }
}
