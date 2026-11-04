//! Controlador para manejar la autenticacion del usuario (Login, Verificar token, Logout)
import prisma from "../config/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; //? Importar bcrypt para el hash de contraseñas
import nodemailer from "nodemailer"; //? Importar nodemailer para el envío de correos
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config(); //? Cargar variables de entorno desde .env

/*
 * Se instalo la libreria bycrpt y nodemailer para el manejo de contraseñas y envio de correos:
    !npm install bcrypt
    !npm install nodemailer
 */


//! Funcion para manejar el login del usuario
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        //* validar campos
        // * Si el correo o la contraseña no se proporciona se devuelve un error 400 (Bad Request)
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios'
            });
        }
        //* Buscar el usuario en la base de datos por correo
        const usuario = await prisma.usuario.findUnique({
            where: {
                correo: email
            }
        });

        //* Si el usuario no existe o la contraseña no coincide se devuelve un error 401 (Unauthorized)
        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos' // Mantenemos el mensaje genérico por seguridad
            });
        }

        //* Usamos bcrypt.compare para verificar la contraseña encriptada
        const passwordValida = await bcrypt.compare(password, usuario.password);

        //* Si la contraseña no coincide, devolvemos el error 401
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Correo o contraseña incorrectos'
            });
        }
        //! JWT
            //* Crear el payload
        const payload ={
            id: usuario.id,
            correo: usuario.correo,
            rol: usuario.rol
        }
            //* Generar el token
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        //* Si el usuario es encontrado y la contraseña es correcta se devuelve un mensaje de éxito con los datos del usuario
        return res.status(200).json({
            success: true,
            message: 'Login correcto',
            token: token
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error en el login",
            data: error.message
        });
    }
}

//! Funcion para verificar el token 
export const verifytoken = (req, res)=>{
    try{
        const token = req.headers.authorization?.split(' ')[1];

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Token no proporcionado"
            });
        }
        
        //* Verificas el token (si falla, salta directo al catch)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return res.status(200).json({
            success: true,
            message: "Token válido",
        });

    }catch(error){
        //* Agregamos esto para manejar cuando el token expiró o fue inventado
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token inválido o expirado"
            });
        }

        //* Error real del servidor
        return res.status(500).json({
            success: false,
            message: "Error al verificar el token",
            data: error.message
        });
    }
}

//! Funcion para cerras sesion (logout)
export const logout = (req, res)=>{ 
    try{
        //* En JWT, el logout se maneja del lado del cliente eliminando el token almacenado (localStorage, cookies, etc.)
        //* Aquí simplemente respondemos que el logout fue exitoso, pero no hay una acción real en el servidor para invalidar el token
        return res.status(200).json({
            success: true,
            message: "Sesión cerrada"
        });

    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Error al cerrar sesión",
            data: error.message
        });
    }
}

//! Funcion para registrar un nuevo usuario
export const register = async (req, res) => {
    try{
        const{nombre,email,password, rol} = req.body;

        //* Roles permitidos
        const rolesPermitidos = ["MAESTRO", "ALUMNO"]

        //* Validar que se ponga el rol
        if (!rol || !rolesPermitidos.includes(rol)){
            return res.status(400).json({
                success: false,
                message: `El rol es obligatorio y debe ser uno de: ${rolesPermitidos.join(', ')}`
            });
        }

        //* Validar campos
        if(!nombre || !email || !password){
            return res.status(400).json({
                success: false,
                message: "Todos los campos son obligatorios"
            });
        }
        //* Validar si el usuario ya existe
        const usuarioExistente = await prisma.usuario.findUnique({
            where: {
                correo: email
            }
        });

        //* Si el usuario ya existe, devolver un error
        if(usuarioExistente){
            return res.status(400).json({
                success: false,
                message: "El usuario ya existe"
            });
        }

        //* encriptar la contraseña antes de guardarla en la base de datos
        const saltRounds = 10; // Nivel de seguridad de la encriptación
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        //* Guardar el nuevo usuario en la base de datos
        const nuevoUsuario = await prisma.usuario.create({
            data: {
                        id: crypto.randomUUID(), 
                nombre: nombre,
                correo: email,
                password: hashedPassword, // Guardar la contraseña encriptada
                rol : rol 
            }
        });

        //* Devolver una respuesta exitosa
        return res.status(201).json({
            success: true,
            message: "Usuario registrado correctamente",
            data: {
                id: nuevoUsuario.id,
                correo: nuevoUsuario.correo
            }
        });

    }catch(error){
        return res.status(500).json({
            success: false,
            message: "Error al registrar el usuario",
            data: error.message
        });
    }
}


//! Función para solicitar recuperación de contraseña y ENVIAR CORREO REAL
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "El correo es obligatorio"
            });
        }

        //* 1. Buscar si el usuario existe en la base de datos
        const usuario = await prisma.usuario.findUnique({
            where: { correo: email }
        });

        //* 2. Por seguridad, no revelamos si el correo existe o no a posibles atacantes
        if (!usuario) {
            return res.status(200).json({
                success: true,
                message: "Si el correo está registrado, te enviaremos un enlace de recuperación."
            });
        }

        //* 3. Generar un JWT especial que expira rápido (15 minutos)
        const resetToken = jwt.sign(
            { id: usuario.id, correo: usuario.correo },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        //* 4. Crear el enlace apuntando al frontend en React
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

        //* 5. Configurar el "Transportador" de Nodemailer usando las credenciales .env
        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        //* 6. Definir el diseño y contenido del correo
        const mailOptions = {
            from: `"Pase de Lista QR" <${process.env.EMAIL_USER}>`,
            to: usuario.correo,
            subject: "Recuperación de contraseña - Pase de Lista QR",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                    <h2 style="color: #1e293b; text-align: center;">Recuperación de Contraseña</h2>
                    <p style="color: #475569; font-size: 16px;">Hola <strong>${usuario.nombre}</strong>,</p>
                    <p style="color: #475569; font-size: 16px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta en Pase de Lista QR. Haz clic en el botón de abajo para asignar una nueva contraseña:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    
                    <p style="color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                        <strong>Nota:</strong> Este enlace expirará en 15 minutos por tu seguridad.<br>
                        Si no solicitaste este cambio, simplemente ignora este correo.
                    </p>
                </div>
            `
        };

        //* 7. Enviar el correo electrónico
        await transporter.sendMail(mailOptions);

        //* 8. Devolver respuesta exitosa al Frontend
        return res.status(200).json({
            success: true,
            message: "Si el correo está registrado, te enviaremos un enlace de recuperación."
        });

    } catch (error) {
        console.error("Error al enviar correo:", error);
        return res.status(500).json({
            success: false,
            message: "Ocurrió un error al procesar la solicitud",
            data: error.message
        });
    }
};

//! Función para guardar la nueva contraseña (Reset Password)
export const resetPassword = async (req, res) => {
    try {
        // 1. Extraemos el token de la URL (params) y la nueva contraseña del body
        const { token } = req.params;
        const { nuevaPassword } = req.body;

        if (!nuevaPassword) {
            return res.status(400).json({
                success: false,
                message: "La nueva contraseña es obligatoria"
            });
        }

        // 2. Verificar si el token es válido y no ha expirado (los 15 minutos)
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            // Si entra al catch, es porque el token fue inventado o ya pasaron los 15 min.
            return res.status(401).json({
                success: false,
                message: "El enlace es inválido o ha expirado. Por favor, solicita uno nuevo."
            });
        }

        // 3. Buscar al usuario usando el ID que venía dentro del token
        const usuario = await prisma.usuario.findUnique({
            where: { id: decoded.id }
        });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: "Usuario no encontrado"
            });
        }

        // 4. Encriptar la nueva contraseña de forma segura
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);

        // 5. Actualizar la contraseña del usuario en la base de datos
        await prisma.usuario.update({
            where: { id: usuario.id },
            data: { password: hashedPassword }
        });

        // 6. Enviar respuesta de éxito al Frontend
        return res.status(200).json({
            success: true,
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("Error al restablecer contraseña:", error);
        return res.status(500).json({
            success: false,
            message: "Error al actualizar la contraseña",
            data: error.message
        });
    }
};