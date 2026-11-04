import dotenv from 'dotenv';

dotenv.config();

import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

// ============================================================
// CONEXIÓN A POSTGRESQL
// ============================================================

const pool = new Pool({
    user: 'postgres',
    password: '1234',
    host: 'localhost',
    port: 5432,
    database: 'pase_lista_qr'
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
    adapter
});


// ============================================================
// SEED
// ============================================================

async function main() {

    console.log('');
    console.log('========================================');
    console.log('   🌱 INICIANDO SEED PASE DE LISTA QR');
    console.log('========================================');
    console.log('');


    // ========================================================
    // 1. LIMPIAR BASE DE DATOS
    // ========================================================
    //
    // IMPORTANTE:
    // Esto elimina los registros actuales.
    // Después vuelve a insertar datos de prueba.
    //
    // Se deben borrar primero las tablas hijas.
    // ========================================================

    console.log('🗑️ Eliminando datos anteriores...');

    await prisma.asistencia.deleteMany();
    await prisma.sesionQR.deleteMany();
    await prisma.incidencia.deleteMany();
    await prisma.horario.deleteMany();
    await prisma.log.deleteMany();

    await prisma.alumno.deleteMany();

    await prisma.maestroMateriaGrupo.deleteMany();

    await prisma.grupo.deleteMany();
    await prisma.maestro.deleteMany();
    await prisma.materia.deleteMany();
    await prisma.carrera.deleteMany();
    await prisma.tutor.deleteMany();

    await prisma.usuario.deleteMany();


    // ========================================================
    // 2. CARRERAS
    // ========================================================

    console.log('🎓 Creando carreras...');

    await prisma.carrera.createMany({
        data: [
            {
                id: 'carrera-001',
                nombre: 'Tecnologías de la Información',
                clave: 'TI'
            },
            {
                id: 'carrera-002',
                nombre: 'Mecatrónica',
                clave: 'MEC'
            },
            {
                id: 'carrera-003',
                nombre: 'Electrónica',
                clave: 'ELEC'
            },
            {
                id: 'carrera-004',
                nombre: 'Desarrollo de Software',
                clave: 'DS'
            },
            {
                id: 'carrera-005',
                nombre: 'Operación de Drones',
                clave: 'UAS'
            }
        ]
    });


    // ========================================================
    // 3. MATERIAS
    // ========================================================

    console.log('📚 Creando materias...');

    await prisma.materia.createMany({
        data: [
            {
                id: 'materia-001',
                nombre: 'Programación',
                clave: 'PROG',
                cuatrimestre: 4
            },
            {
                id: 'materia-002',
                nombre: 'Bases de Datos',
                clave: 'BD',
                cuatrimestre: 4
            },
            {
                id: 'materia-003',
                nombre: 'Desarrollo Web Integral',
                clave: 'DWI',
                cuatrimestre: 4
            },
            {
                id: 'materia-004',
                nombre: 'Redes de Computadoras',
                clave: 'RED',
                cuatrimestre: 5
            },
            {
                id: 'materia-005',
                nombre: 'Inglés',
                clave: 'ING',
                cuatrimestre: 4
            }
        ]
    });


    // ========================================================
    // 4. TUTORES
    // ========================================================

    console.log('👨‍👩‍👦 Creando tutores...');

    await prisma.tutor.createMany({
        data: [
            {
                id: 'tutor-001',
                nombre: 'Laura Martínez',
                telefono: '7711000001',
                correo: 'laura.martinez@test.com'
            },
            {
                id: 'tutor-002',
                nombre: 'Carlos Hernández',
                telefono: '7711000002',
                correo: 'carlos.hernandez@test.com'
            },
            {
                id: 'tutor-003',
                nombre: 'Patricia Gómez',
                telefono: '7711000003',
                correo: 'patricia.gomez@test.com'
            },
            {
                id: 'tutor-004',
                nombre: 'Roberto Sánchez',
                telefono: '7711000004',
                correo: 'roberto.sanchez@test.com'
            },
            {
                id: 'tutor-005',
                nombre: 'Mónica Ramírez',
                telefono: '7711000005',
                correo: 'monica.ramirez@test.com'
            }
        ]
    });


    // ========================================================
    // 5. USUARIOS
    // ========================================================

    console.log('👤 Creando usuarios...');

    await prisma.usuario.createMany({
        data: [
            {
                id: 'usuario-001',
                nombre: 'Administrador',
                correo: 'admin@paseqr.com',
                password: '123456',
                rol: 'ADMIN',
                activo: true
            },
            {
                id: 'usuario-002',
                nombre: 'Juan Pérez',
                correo: 'juan.perez@paseqr.com',
                password: '123456',
                rol: 'MAESTRO',
                activo: true
            },
            {
                id: 'usuario-003',
                nombre: 'Ana López',
                correo: 'ana.lopez@paseqr.com',
                password: '123456',
                rol: 'MAESTRO',
                activo: true
            },
            {
                id: 'usuario-004',
                nombre: 'Carlos Díaz',
                correo: 'carlos.diaz@paseqr.com',
                password: '123456',
                rol: 'ALUMNO',
                activo: true
            },
            {
                id: 'usuario-005',
                nombre: 'María Torres',
                correo: 'maria.torres@paseqr.com',
                password: '123456',
                rol: 'ALUMNO',
                activo: true
            }
        ]
    });


    // ========================================================
    // 6. MAESTROS
    // ========================================================

    console.log('👨‍🏫 Creando maestros...');

    await prisma.maestro.createMany({
        data: [
            {
                id: 'maestro-001',
                numeroEmpleado: 'EMP001',
                nombre: 'Juan Pérez',
                correo: 'juan.perez@paseqr.com',
                telefono: '7712000001',
                usuarioId: 'usuario-002'
            },
            {
                id: 'maestro-002',
                numeroEmpleado: 'EMP002',
                nombre: 'Ana López',
                correo: 'ana.lopez@paseqr.com',
                telefono: '7712000002',
                usuarioId: 'usuario-003'
            },
            {
                id: 'maestro-003',
                numeroEmpleado: 'EMP003',
                nombre: 'Miguel Ramírez',
                correo: 'miguel.ramirez@paseqr.com',
                telefono: '7712000003'
            },
            {
                id: 'maestro-004',
                numeroEmpleado: 'EMP004',
                nombre: 'Sofía Hernández',
                correo: 'sofia.hernandez@paseqr.com',
                telefono: '7712000004'
            },
            {
                id: 'maestro-005',
                numeroEmpleado: 'EMP005',
                nombre: 'David Gómez',
                correo: 'david.gomez@paseqr.com',
                telefono: '7712000005'
            }
        ]
    });


    // ========================================================
    // 7. GRUPOS
    // ========================================================

    console.log('👨‍🎓 Creando grupos...');

    await prisma.grupo.createMany({
        data: [
            {
                id: 'grupo-001',
                nombre: 'TI-401',
                cuatrimestre: 4,
                turno: 'MATUTINO',
                carreraId: 'carrera-001'
            },
            {
                id: 'grupo-002',
                nombre: 'TI-402',
                cuatrimestre: 4,
                turno: 'VESPERTINO',
                carreraId: 'carrera-001'
            },
            {
                id: 'grupo-003',
                nombre: 'MEC-401',
                cuatrimestre: 4,
                turno: 'MATUTINO',
                carreraId: 'carrera-002'
            },
            {
                id: 'grupo-004',
                nombre: 'ELEC-401',
                cuatrimestre: 4,
                turno: 'MATUTINO',
                carreraId: 'carrera-003'
            },
            {
                id: 'grupo-005',
                nombre: 'UAS-401',
                cuatrimestre: 4,
                turno: 'VESPERTINO',
                carreraId: 'carrera-005'
            }
        ]
    });


    // ========================================================
    // 8. MAESTRO - MATERIA - GRUPO
    // ========================================================

    console.log('🔗 Creando relaciones maestro-materia-grupo...');

    await prisma.maestroMateriaGrupo.createMany({
        data: [
            {
                id: 'mmg-001',
                maestroId: 'maestro-001',
                materiaId: 'materia-001',
                grupoId: 'grupo-001'
            },
            {
                id: 'mmg-002',
                maestroId: 'maestro-002',
                materiaId: 'materia-002',
                grupoId: 'grupo-001'
            },
            {
                id: 'mmg-003',
                maestroId: 'maestro-003',
                materiaId: 'materia-003',
                grupoId: 'grupo-002'
            },
            {
                id: 'mmg-004',
                maestroId: 'maestro-004',
                materiaId: 'materia-004',
                grupoId: 'grupo-003'
            },
            {
                id: 'mmg-005',
                maestroId: 'maestro-005',
                materiaId: 'materia-005',
                grupoId: 'grupo-005'
            }
        ]
    });


    // ========================================================
    // 9. HORARIOS
    // ========================================================

    console.log('🕐 Creando horarios...');

    await prisma.horario.createMany({
        data: [
            {
                id: 'horario-001',
                diaSemana: 'LUNES',
                horaInicio: '08:00',
                horaFin: '10:00',
                mmgId: 'mmg-001'
            },
            {
                id: 'horario-002',
                diaSemana: 'MARTES',
                horaInicio: '10:00',
                horaFin: '12:00',
                mmgId: 'mmg-002'
            },
            {
                id: 'horario-003',
                diaSemana: 'MIERCOLES',
                horaInicio: '08:00',
                horaFin: '10:00',
                mmgId: 'mmg-003'
            },
            {
                id: 'horario-004',
                diaSemana: 'JUEVES',
                horaInicio: '12:00',
                horaFin: '14:00',
                mmgId: 'mmg-004'
            },
            {
                id: 'horario-005',
                diaSemana: 'VIERNES',
                horaInicio: '16:00',
                horaFin: '18:00',
                mmgId: 'mmg-005'
            }
        ]
    });


    // ========================================================
    // 10. ALUMNOS
    // ========================================================

    console.log('🎓 Creando alumnos...');

    await prisma.alumno.createMany({
        data: [
            {
                id: 'alumno-001',
                matricula: '20264001',
                nombre: 'Carlos',
                apellidoPaterno: 'Díaz',
                apellidoMaterno: 'López',
                correo: 'carlos.diaz@paseqr.com',
                telefono: '7713000001',
                activo: true,
                grupoId: 'grupo-001',
                tutorId: 'tutor-001',
                usuarioId: 'usuario-004'
            },
            {
                id: 'alumno-002',
                matricula: '20264002',
                nombre: 'María',
                apellidoPaterno: 'Torres',
                apellidoMaterno: 'Hernández',
                correo: 'maria.torres@paseqr.com',
                telefono: '7713000002',
                activo: true,
                grupoId: 'grupo-001',
                tutorId: 'tutor-002',
                usuarioId: 'usuario-005'
            },
            {
                id: 'alumno-003',
                matricula: '20264003',
                nombre: 'Luis',
                apellidoPaterno: 'Martínez',
                apellidoMaterno: 'Gómez',
                correo: 'luis.martinez@paseqr.com',
                telefono: '7713000003',
                activo: true,
                grupoId: 'grupo-002',
                tutorId: 'tutor-003'
            },
            {
                id: 'alumno-004',
                matricula: '20264004',
                nombre: 'Fernanda',
                apellidoPaterno: 'Sánchez',
                apellidoMaterno: 'Ramírez',
                correo: 'fernanda.sanchez@paseqr.com',
                telefono: '7713000004',
                activo: true,
                grupoId: 'grupo-003',
                tutorId: 'tutor-004'
            },
            {
                id: 'alumno-005',
                matricula: '20264005',
                nombre: 'Jorge',
                apellidoPaterno: 'Hernández',
                apellidoMaterno: 'Pérez',
                correo: 'jorge.hernandez@paseqr.com',
                telefono: '7713000005',
                activo: true,
                grupoId: 'grupo-005',
                tutorId: 'tutor-005'
            }
        ]
    });


    // ========================================================
    // 11. SESIONES QR
    // ========================================================

    console.log('📱 Creando sesiones QR...');

    const ahora = new Date();

    await prisma.sesionQR.createMany({
        data: [
            {
                id: 'qr-001',
                tokenQR: 'PASEQR-TI401-PROG-001',
                fecha: ahora,
                horaGenerada: new Date(
                    ahora.getTime() - 30 * 60 * 1000
                ),
                expiracion: new Date(
                    ahora.getTime() + 30 * 60 * 1000
                ),
                activa: true,
                mmgId: 'mmg-001'
            },
            {
                id: 'qr-002',
                tokenQR: 'PASEQR-TI401-BD-002',
                fecha: new Date(
                    ahora.getTime() - 24 * 60 * 60 * 1000
                ),
                horaGenerada: new Date(
                    ahora.getTime() - 24 * 60 * 60 * 1000
                ),
                expiracion: new Date(
                    ahora.getTime() - 23 * 60 * 60 * 1000
                ),
                activa: false,
                mmgId: 'mmg-002'
            },
            {
                id: 'qr-003',
                tokenQR: 'PASEQR-TI402-WEB-003',
                fecha: new Date(
                    ahora.getTime() - 2 * 24 * 60 * 60 * 1000
                ),
                horaGenerada: new Date(
                    ahora.getTime() - 2 * 24 * 60 * 60 * 1000
                ),
                expiracion: new Date(
                    ahora.getTime() - 47 * 60 * 60 * 1000
                ),
                activa: false,
                mmgId: 'mmg-003'
            },
            {
                id: 'qr-004',
                tokenQR: 'PASEQR-MEC401-RED-004',
                fecha: new Date(
                    ahora.getTime() - 3 * 24 * 60 * 60 * 1000
                ),
                horaGenerada: new Date(
                    ahora.getTime() - 3 * 24 * 60 * 60 * 1000
                ),
                expiracion: new Date(
                    ahora.getTime() - 71 * 60 * 60 * 1000
                ),
                activa: false,
                mmgId: 'mmg-004'
            },
            {
                id: 'qr-005',
                tokenQR: 'PASEQR-UAS401-ING-005',
                fecha: new Date(
                    ahora.getTime() - 4 * 24 * 60 * 60 * 1000
                ),
                horaGenerada: new Date(
                    ahora.getTime() - 4 * 24 * 60 * 60 * 1000
                ),
                expiracion: new Date(
                    ahora.getTime() - 95 * 60 * 60 * 1000
                ),
                activa: false,
                mmgId: 'mmg-005'
            }
        ]
    });


    // ========================================================
    // 12. ASISTENCIAS
    // ========================================================

    console.log('✅ Creando asistencias...');

    await prisma.asistencia.createMany({
        data: [
            {
                id: 'asistencia-001',
                alumnoId: 'alumno-001',
                sesionQRId: 'qr-001',
                fechaHora: new Date(
                    ahora.getTime() - 20 * 60 * 1000
                ),
                estado: 'PRESENTE',
                observaciones: 'Asistencia registrada mediante QR'
            },
            {
                id: 'asistencia-002',
                alumnoId: 'alumno-002',
                sesionQRId: 'qr-001',
                fechaHora: new Date(
                    ahora.getTime() - 15 * 60 * 1000
                ),
                estado: 'RETARDO',
                observaciones: 'Llegó tarde a clase'
            },
            {
                id: 'asistencia-003',
                alumnoId: 'alumno-003',
                sesionQRId: 'qr-003',
                fechaHora: new Date(
                    ahora.getTime() - 2 * 24 * 60 * 60 * 1000
                ),
                estado: 'PRESENTE',
                observaciones: 'Asistencia normal'
            },
            {
                id: 'asistencia-004',
                alumnoId: 'alumno-004',
                sesionQRId: 'qr-004',
                fechaHora: new Date(
                    ahora.getTime() - 3 * 24 * 60 * 60 * 1000
                ),
                estado: 'FALTA',
                observaciones: 'No se presentó'
            },
            {
                id: 'asistencia-005',
                alumnoId: 'alumno-005',
                sesionQRId: 'qr-005',
                fechaHora: new Date(
                    ahora.getTime() - 4 * 24 * 60 * 60 * 1000
                ),
                estado: 'JUSTIFICADA',
                observaciones: 'Falta justificada'
            }
        ]
    });


    // ========================================================
    // 13. INCIDENCIAS
    // ========================================================

    console.log('⚠️ Creando incidencias...');

    await prisma.incidencia.createMany({
        data: [
            {
                id: 'incidencia-001',
                tipo: 'RETARDO',
                descripcion: 'Llegó tarde a clase',
                fecha: new Date(
                    ahora.getTime() - 24 * 60 * 60 * 1000
                ),
                alumnoId: 'alumno-001'
            },
            {
                id: 'incidencia-002',
                tipo: 'FALTA',
                descripcion: 'Falta sin justificar',
                fecha: new Date(
                    ahora.getTime() - 2 * 24 * 60 * 60 * 1000
                ),
                alumnoId: 'alumno-002'
            },
            {
                id: 'incidencia-003',
                tipo: 'JUSTIFICANTE',
                descripcion: 'Presentó justificante',
                fecha: new Date(
                    ahora.getTime() - 3 * 24 * 60 * 60 * 1000
                ),
                alumnoId: 'alumno-003'
            },
            {
                id: 'incidencia-004',
                tipo: 'CONDUCTA',
                descripcion: 'Reporte de conducta',
                fecha: new Date(
                    ahora.getTime() - 4 * 24 * 60 * 60 * 1000
                ),
                alumnoId: 'alumno-004'
            },
            {
                id: 'incidencia-005',
                tipo: 'OTRA',
                descripcion: 'Observación administrativa',
                fecha: new Date(
                    ahora.getTime() - 5 * 24 * 60 * 60 * 1000
                ),
                alumnoId: 'alumno-005'
            }
        ]
    });


    // ========================================================
    // 14. LOGS
    // ========================================================

    console.log('📝 Creando logs...');

    await prisma.log.createMany({
        data: [
            {
                id: 'log-001',
                accion: 'INICIO_SESION',
                fecha: new Date(
                    ahora.getTime() - 60 * 60 * 1000
                ),
                usuarioId: 'usuario-001'
            },
            {
                id: 'log-002',
                accion: 'GENERAR_QR',
                fecha: new Date(
                    ahora.getTime() - 50 * 60 * 1000
                ),
                usuarioId: 'usuario-002'
            },
            {
                id: 'log-003',
                accion: 'REGISTRAR_ASISTENCIA',
                fecha: new Date(
                    ahora.getTime() - 40 * 60 * 1000
                ),
                usuarioId: 'usuario-002'
            },
            {
                id: 'log-004',
                accion: 'CONSULTAR_ASISTENCIAS',
                fecha: new Date(
                    ahora.getTime() - 30 * 60 * 1000
                ),
                usuarioId: 'usuario-003'
            },
            {
                id: 'log-005',
                accion: 'CONSULTAR_ALUMNO',
                fecha: new Date(
                    ahora.getTime() - 20 * 60 * 1000
                ),
                usuarioId: 'usuario-001'
            }
        ]
    });


    // ========================================================
    // RESUMEN
    // ========================================================

    console.log('');
    console.log('========================================');
    console.log('       ✅ SEED TERMINADO');
    console.log('========================================');
    console.log('');

    console.log('📊 Registros creados:');
    console.log('');
    console.log('Carreras:              5');
    console.log('Materias:              5');
    console.log('Tutores:               5');
    console.log('Usuarios:              5');
    console.log('Maestros:              5');
    console.log('Grupos:                5');
    console.log('MaestroMateriaGrupo:   5');
    console.log('Horarios:              5');
    console.log('Alumnos:               5');
    console.log('Sesiones QR:           5');
    console.log('Asistencias:           5');
    console.log('Incidencias:           5');
    console.log('Logs:                  5');

    console.log('');
    console.log('🔐 USUARIOS DE PRUEBA');
    console.log('');
    console.log('ADMIN:');
    console.log('admin@paseqr.com / 123456');
    console.log('');
    console.log('MAESTROS:');
    console.log('juan.perez@paseqr.com / 123456');
    console.log('ana.lopez@paseqr.com / 123456');
    console.log('');
    console.log('ALUMNOS:');
    console.log('carlos.diaz@paseqr.com / 123456');
    console.log('maria.torres@paseqr.com / 123456');
    console.log('');

}


// ============================================================
// EJECUTAR
// ============================================================

main()
    .catch((error) => {

        console.error('');
        console.error('❌ ERROR EN EL SEED');
        console.error('');
        console.error(error);

        process.exit(1);

    })
    .finally(async () => {

        await prisma.$disconnect();

        await pool.end();

    });