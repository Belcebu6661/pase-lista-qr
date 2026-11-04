import prisma from "../config/prisma.js";

const DIAS = 7;

// Clave YYYY-MM-DD en hora LOCAL (toISOString usaría UTC y movería el día)
const claveDia = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export const obtenerResumenDashboard = async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - (DIAS - 1));

    const [alumnosActivos, grupos, profesores, asistenciasHoy, ultimos, semana] =
      await Promise.all([
        prisma.alumno.count({ where: { activo: true } }),
        prisma.grupo.count(),
        prisma.maestro.count(),
        prisma.asistencia.count({
          where: { fechaHora: { gte: hoy, lt: manana } },
        }),
        prisma.asistencia.findMany({
          take: 5,
          orderBy: { fechaHora: "desc" },
          select: {
            id: true,
            fechaHora: true,
            estado: true,
            alumno: {
              select: {
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                Grupo: { select: { nombre: true } },
              },
            },
          },
        }),
        prisma.asistencia.findMany({
          where: { fechaHora: { gte: desde, lt: manana } },
          select: { fechaHora: true, estado: true },
        }),
      ]);

    // Serie de los últimos 7 días (incluye días sin registros, en cero)
    const dias = [];
    for (let i = 0; i < DIAS; i++) {
      const d = new Date(desde);
      d.setDate(desde.getDate() + i);
      dias.push({
        fecha: claveDia(d),
        etiqueta: d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric" }),
        presente: 0,
        retardo: 0,
        falta: 0,
        justificada: 0,
      });
    }
    const porDia = new Map(dias.map((d) => [d.fecha, d]));

    for (const a of semana) {
      const fila = porDia.get(claveDia(a.fechaHora));
      if (fila) fila[a.estado.toLowerCase()] += 1;
    }

    return res.json({
      success: true,
      data: {
        tarjetas: { alumnosActivos, grupos, profesores, asistenciasHoy },
        ultimosRegistros: ultimos.map((a) => ({
          id: a.id,
          fechaHora: a.fechaHora,
          alumno: [a.alumno.nombre, a.alumno.apellidoPaterno, a.alumno.apellidoMaterno]
            .filter(Boolean)
            .join(" "),
          grupo: a.alumno.Grupo?.nombre ?? "—",
          estado: a.estado,
        })),
        asistenciaSemanal: dias,
      },
    });
  } catch (error) {
    console.error("ERROR DASHBOARD:", error);
    return res.status(500).json({
      success: false,
      message: "No se pudo obtener el resumen del dashboard",
    });
  }
};