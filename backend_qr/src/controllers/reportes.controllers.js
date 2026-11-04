import prisma from "../config/prisma.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ============================================================
   FUNCIÓN PRIVADA PARA OBTENER ASISTENCIAS FILTRADAS - CORREGIDA
   ============================================================ */

   
/* ==========================================
   OBTENER ASISTENCIAS FILTRADAS
   Compatible con el schema.prisma actual
========================================== */

const obtenerAsistenciasFiltradas = async (query = {}) => {

    const {
        carreraId,
        grupoId,
        materiaId,
        estado,
        fechaInicio,
        fechaFin
    } = query;

    const filtroActivo = (valor) =>
        valor !== undefined &&
        valor !== null &&
        valor !== "" &&
        valor !== "null" &&
        valor !== "undefined";

    const where = {};

    // ---------------------------------------
    // VALIDAR CARRERA
    // ---------------------------------------

    if (filtroActivo(carreraId)) {
        const error = new Error(
            "El esquema actual no relaciona Grupo con Carrera. " +
            "El filtro por carrera no está disponible."
        );
        error.statusCode = 400;
        throw error;
    }

    // ---------------------------------------
    // FILTRO POR ESTADO
    // ---------------------------------------

    if (filtroActivo(estado)) {
        const estadosValidos = [
            "PRESENTE",
            "RETARDO",
            "FALTA",
            "JUSTIFICADA"
        ];

        if (!estadosValidos.includes(estado)) {
            const error = new Error("Estado de asistencia no válido");
            error.statusCode = 400;
            throw error;
        }

        where.estado = estado;
    }

    // ---------------------------------------
    // FILTRO POR FECHAS
    // Zona horaria: Ciudad de México
    // ---------------------------------------

    const validarFecha = (valor) => {
        if (
            !/^\d{4}-\d{2}-\d{2}$/.test(valor) ||
            !Number.isFinite(Date.parse(valor)) ||
            new Date(valor).toISOString().slice(0, 10) !== valor
        ) {
            const error = new Error(
                "Formato de fecha no válido. Utiliza YYYY-MM-DD"
            );
            error.statusCode = 400;
            throw error;
        }
    };

    if (filtroActivo(fechaInicio) || filtroActivo(fechaFin)) {

        where.fechaHora = {};

        if (filtroActivo(fechaInicio)) {
            validarFecha(fechaInicio);

            where.fechaHora.gte = new Date(
                `${fechaInicio}T00:00:00-06:00`
            );
        }

        if (filtroActivo(fechaFin)) {
            validarFecha(fechaFin);

            // Límite superior exclusivo: inicio del día siguiente
            const inicioFin = new Date(
                `${fechaFin}T00:00:00-06:00`
            );

            where.fechaHora.lt = new Date(
                inicioFin.getTime() + 86400000
            );
        }

        if (
            where.fechaHora.gte &&
            where.fechaHora.lt &&
            where.fechaHora.gte >= where.fechaHora.lt
        ) {
            const error = new Error("El rango de fechas no es válido");
            error.statusCode = 400;
            throw error;
        }
    }

    // ---------------------------------------
    // FILTRO POR GRUPO
    // ---------------------------------------

    if (filtroActivo(grupoId)) {
        where.alumno = {
            is: {
                grupoId: String(grupoId)
            }
        };
    }

    // ---------------------------------------
    // FILTRO POR MATERIA
    // ---------------------------------------

    if (filtroActivo(materiaId)) {
        where.SesionQR = {
            is: {
                MaestroMateriaGrupo: {
                    is: {
                        materiaId: String(materiaId)
                    }
                }
            }
        };
    }

    // ---------------------------------------
    // CONSULTA PRINCIPAL
    // ---------------------------------------

    const asistencias = await prisma.asistencia.findMany({
        where,

        include: {
            alumno: {
                include: {
                    Grupo: true
                }
            },

            SesionQR: {
                include: {
                    MaestroMateriaGrupo: {
                        include: {
                            Materia: true,
                            Maestro: true
                        }
                    }
                }
            }
        },

        orderBy: {
            fechaHora: "desc"
        }
    });

    // ---------------------------------------
    // ADAPTAR LA RESPUESTA AL FRONTEND
    // ---------------------------------------

    return asistencias.map((item) => {

        const sesion = item.SesionQR;

        const relacion = sesion?.MaestroMateriaGrupo;

        return {
            ...item,

            alumno: item.alumno ? {
                ...item.alumno,
                grupo: item.alumno.Grupo
            } : null,

            sesionQR: sesion ? {
                ...sesion,

                mmg: relacion ? {
                    ...relacion,
                    materia: relacion.Materia,
                    maestro: relacion.Maestro
                } : null

            } : null
        };
    });
};


/* ============================================================
   OBTENER CARRERAS
   ============================================================ */
export const obtenerCarreras = async (req, res) => {
  try {
    const carreras = await prisma.carrera.findMany({
      orderBy: { nombre: "asc" }
    });
    res.json(carreras);
  } catch (error) {
    console.error('❌ Error al obtener carreras:', error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener las carreras" });
  }
};

/* ============================================================
   OBTENER GRUPOS
   ============================================================ */

   
export const obtenerGrupos = async (req, res) => {
    try {

        const grupos = await prisma.grupo.findMany({
            orderBy: [
                { cuatrimestre: "asc" },
                { nombre: "asc" }
            ]
        });

        return res.status(200).json(grupos);

    } catch (error) {
        console.error(
            "ERROR AL OBTENER GRUPOS PARA REPORTES:",
            error
        );

        return res.status(500).json({
            ok: false,
            mensaje: "Error al obtener grupos"
        });
    }
};


/* ============================================================
   OBTENER MATERIAS
   ============================================================ */
export const obtenerMaterias = async (req, res) => {
  try {
    const materias = await prisma.materia.findMany({
      orderBy: { nombre: "asc" }
    });
    res.json(materias);
  } catch (error) {
    console.error('❌ Error al obtener materias:', error);
    res.status(500).json({ ok: false, mensaje: "Error al obtener materias" });
  }
};

/* ============================================================
   REPORTE GENERAL - CORREGIDO
   ============================================================ */
export const obtenerReporteGeneral = async (req, res) => {
  try {
    const { tipoReporte, ...filtros } = req.query;
    
    // Limpiar filtros vacíos
    const filtrosLimpios = {};
    for (const [key, value] of Object.entries(filtros)) {
      if (value && value !== '' && value !== 'null' && value !== 'undefined') {
        filtrosLimpios[key] = value;
      }
    }
    
    const asistencias = await obtenerAsistenciasFiltradas(filtrosLimpios);
    
    res.json({
      data: asistencias,
      total: asistencias.length
    });
  } catch (error) {
    console.error('❌ Error al generar reporte:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al generar reporte",
      error: error.message
    });
  }
};

/* ============================================================
   REPORTE POR GRUPO - NUEVO
   ============================================================ */
export const obtenerReportePorGrupo = async (req, res) => {
  try {
    const { tipoReporte, ...filtros } = req.query;
    
    // Limpiar filtros vacíos
    const filtrosLimpios = {};
    for (const [key, value] of Object.entries(filtros)) {
      if (value && value !== '' && value !== 'null' && value !== 'undefined') {
        filtrosLimpios[key] = value;
      }
    }
    
    // Validar que tenga grupoId
    if (!filtrosLimpios.grupoId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El filtro grupoId es requerido para reporte por grupo'
      });
    }
    
    const asistencias = await obtenerAsistenciasFiltradas(filtrosLimpios);
    
    res.json({
      data: asistencias,
      total: asistencias.length
    });
  } catch (error) {
    console.error('❌ Error al generar reporte por grupo:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al generar reporte por grupo",
      error: error.message
    });
  }
};

/* ============================================================
   REPORTE POR CARRERA - NUEVO
   ============================================================ */
export const obtenerReportePorCarrera = async (req, res) => {
  try {
    const { tipoReporte, ...filtros } = req.query;
    
    // Limpiar filtros vacíos
    const filtrosLimpios = {};
    for (const [key, value] of Object.entries(filtros)) {
      if (value && value !== '' && value !== 'null' && value !== 'undefined') {
        filtrosLimpios[key] = value;
      }
    }
    
    // Validar que tenga carreraId
    if (!filtrosLimpios.carreraId) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El filtro carreraId es requerido para reporte por carrera'
      });
    }
    
    const asistencias = await obtenerAsistenciasFiltradas(filtrosLimpios);
    
    res.json({
      data: asistencias,
      total: asistencias.length
    });
  } catch (error) {
    console.error('❌ Error al generar reporte por carrera:', error);
    res.status(500).json({
      ok: false,
      mensaje: "Error al generar reporte por carrera",
      error: error.message
    });
  }
};

/* ============================================================
   EXPORTAR PDF - DISEÑO PROFESIONAL 
   ============================================================ */
export const exportarReportePDF = async (req, res) => {
  try {
    const { tipoReporte } = req.params;
    const { tipoReporte: _, ...filtros } = req.query;

    // Limpiar filtros vacíos
    const filtrosLimpios = {};
    for (const [key, value] of Object.entries(filtros)) {
      if (value && value !== '' && value !== 'null' && value !== 'undefined') {
        filtrosLimpios[key] = value;
      }
    }

    const asistencias = await obtenerAsistenciasFiltradas(filtrosLimpios);

    const titulos = {
      general: 'Reporte General de Asistencias',
      grupo: 'Reporte por Grupo',
      carrera: 'Reporte por Carrera'
    };
    const titulo = titulos[tipoReporte] || 'Reporte de Asistencias';

    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      layout: 'landscape'
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf"`
    );

    doc.pipe(res);

    const margin = 50;
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - (margin * 2);

    let y = 30;

    // ============================================================
    // 1. ENCABEZADO 
    // ============================================================
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#1a237e')
      .text(titulo, margin, y, {
        width: contentWidth,
        align: 'center'
      });

    y += 35;

    doc
      .moveTo(margin + 50, y)
      .lineTo(pageWidth - margin - 50, y)
      .strokeColor('#1a237e')
      .lineWidth(2)
      .stroke();

    y += 18;

    // ============================================================
    // 2. INFORMACIÓN DEL REPORTE
    // ============================================================
    const fechaGeneracion = new Date().toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#666666')
      .text(`Generado: ${fechaGeneracion}`, margin, y, { align: 'left' });

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#1a237e')
      .text(`Total: ${asistencias.length} registros`, margin, y, { align: 'right' });

    y += 25;

    // ============================================================
    // 3. TABLA DE DATOS
    // ============================================================
    if (asistencias && asistencias.length > 0) {
      const rowHeight = 18;
      const headerHeight = 24;
      const pageHeight = doc.page.height - 60;

      const columnas = [
        { label: '#', key: 'num', width: 35, align: 'center' },
        { label: 'Matricula', key: 'matricula', width: 85, align: 'left' },
        { label: 'Alumno', key: 'alumno', width: 170, align: 'left' },
        { label: 'Grupo', key: 'grupo', width: 80, align: 'left' },
        { label: 'Materia', key: 'materia', width: 140, align: 'left' },
        { label: 'Estado', key: 'estado', width: 80, align: 'center' },
        { label: 'Fecha', key: 'fecha', width: 95, align: 'center' }
      ];

      const drawHeader = (startY) => {
        let x = margin;
        let yPos = startY;

        doc
          .rect(margin, yPos, contentWidth, headerHeight)
          .fill('#1a237e');

        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        x = margin;

        columnas.forEach(col => {
          doc.text(col.label, x + 4, yPos + 6, {
            width: col.width - 8,
            align: col.align
          });
          x += col.width;
        });

        return yPos + headerHeight;
      };

      const drawRow = (item, index, startY) => {
        let x = margin;
        let yPos = startY;

        if (index % 2 === 0) {
          doc
            .rect(margin, yPos, contentWidth, rowHeight)
            .fill('#fafafa');
        } else {
          doc
            .rect(margin, yPos, contentWidth, rowHeight)
            .fill('#ffffff');
        }

        doc.fillColor('#1a1a1a').fontSize(8).font('Helvetica');

        const nombreCompleto =
          `${item.alumno?.nombre || ''} ${item.alumno?.apellidoPaterno || ''} ${item.alumno?.apellidoMaterno || ''}`.trim();

        const estadoMap = {
          'PRESENTE': 'Presente',
          'RETARDO': 'Retardo',
          'FALTA': 'Falta',
          'JUSTIFICADA': 'Justificada'
        };

        const estadoLabel = estadoMap[item.estado] || item.estado || '-';

        let estadoColor = '#333333';
        if (estadoLabel === 'Presente') estadoColor = '#2e7d32';
        else if (estadoLabel === 'Falta') estadoColor = '#c62828';
        else if (estadoLabel === 'Retardo') estadoColor = '#e65100';
        else if (estadoLabel === 'Justificada') estadoColor = '#6a1b9a';

        const fecha = item.fechaHora
          ? new Date(item.fechaHora).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          : '-';

        const valores = [
          { value: String(index + 1), align: 'center' },
          { value: item.alumno?.matricula || '-', align: 'left' },
          { value: nombreCompleto || '-', align: 'left' },
          { value: item.alumno?.grupo?.nombre || '-', align: 'left' },
          { value: item.sesionQR?.mmg?.materia?.nombre || '-', align: 'left' },
          { value: estadoLabel, align: 'center', color: estadoColor },
          { value: fecha, align: 'center' }
        ];

        x = margin;
        columnas.forEach((col, idx) => {
          const val = valores[idx];
          const textColor = val.color || '#1a1a1a';

          doc.fillColor(textColor);
          doc.text(val.value, x + 4, yPos + 4, {
            width: col.width - 8,
            align: col.align
          });
          x += col.width;
        });

        return startY + rowHeight;
      };

      let currentY = drawHeader(y);

      asistencias.forEach((item, index) => {
        if (currentY + rowHeight > pageHeight) {
          doc.addPage();
          currentY = 40;
          currentY = drawHeader(currentY);
        }

        currentY = drawRow(item, index, currentY);
      });

      doc
        .moveTo(margin, currentY)
        .lineTo(pageWidth - margin, currentY)
        .strokeColor('#1a237e')
        .lineWidth(1)
        .stroke();

      currentY += 20;

      // ============================================================
      // 4. RESUMEN ESTADÍSTICO
      // ============================================================
      const totalPresentes = asistencias.filter(a => a.estado === 'PRESENTE').length;
      const totalFaltas = asistencias.filter(a => a.estado === 'FALTA').length;
      const totalRetardos = asistencias.filter(a => a.estado === 'RETARDO').length;
      const totalJustificadas = asistencias.filter(a => a.estado === 'JUSTIFICADA').length;

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor('#1a237e')
        .text('Resumen de Asistencias', margin, currentY, {
          width: contentWidth,
          align: 'left'
        });

      currentY += 20;

      const resumenData = [
        { label: 'Presentes', value: totalPresentes, color: '#2e7d32' },
        { label: 'Faltas', value: totalFaltas, color: '#c62828' },
        { label: 'Retardos', value: totalRetardos, color: '#e65100' },
        { label: 'Justificadas', value: totalJustificadas, color: '#6a1b9a' },
        { label: 'Total', value: asistencias.length, color: '#1a237e' }
      ];

      let xPos = margin;
      const cellWidth = (contentWidth - (resumenData.length - 1) * 5) / resumenData.length;

      resumenData.forEach((item) => {
        doc
          .rect(xPos, currentY, cellWidth, 35)
          .fill('#f5f5f5');

        doc
          .rect(xPos, currentY, cellWidth, 35)
          .strokeColor(item.color)
          .lineWidth(1.5)
          .stroke();

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(item.color)
          .text(String(item.value), xPos + 2, currentY + 4, {
            width: cellWidth - 4,
            align: 'center'
          });

        doc
          .fontSize(7.5)
          .font('Helvetica')
          .fillColor('#666666')
          .text(item.label, xPos + 2, currentY + 22, {
            width: cellWidth - 4,
            align: 'center'
          });

        xPos += cellWidth + 5;
      });

      currentY += 45;

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#1a237e')
        .text(`Total de registros: ${asistencias.length}`, margin, currentY, {
          width: contentWidth,
          align: 'right'
        });

    } else {
      doc
        .fontSize(14)
        .font('Helvetica')
        .fillColor('#999999')
        .text('No hay datos para mostrar', margin, y + 30, {
          width: contentWidth,
          align: 'center'
        });
    }

    // ============================================================
    // 5. PIE DE PÁGINA
    // ============================================================
    doc
      .fontSize(7)
      .font('Helvetica')
      .fillColor('#999999')
      .text(
        `Sistema de Control de Asistencias - Pagina ${doc.page.number}`,
        margin,
        doc.page.height - 30,
        {
          width: contentWidth,
          align: 'center'
        }
      );

    doc.end();

  } catch (error) {
    console.error('❌ Error al generar PDF:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al generar PDF: ' + error.message
    });
  }
};

/* ============================================================
   EXPORTAR EXCEL 
   ============================================================ */
export const exportarReporteExcel = async (req, res) => {
  try {
    const { tipoReporte } = req.params;
    const { tipoReporte: _, ...filtros } = req.query;

    // Limpiar filtros vacíos
    const filtrosLimpios = {};
    for (const [key, value] of Object.entries(filtros)) {
      if (value && value !== '' && value !== 'null' && value !== 'undefined') {
        filtrosLimpios[key] = value;
      }
    }

    const asistencias = await obtenerAsistenciasFiltradas(filtrosLimpios);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Asistencias');

    // ============================================================
    // 1. ENCABEZADO
    // ============================================================
    const titulos = {
      general: 'Reporte General de Asistencias',
      grupo: 'Reporte por Grupo',
      carrera: 'Reporte por Carrera'
    };
    const titulo = titulos[tipoReporte] || 'Reporte de Asistencias';

    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = titulo;
    worksheet.getCell('A1').font = { bold: true, size: 14, name: 'Arial' };
    worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 35;

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Generado: ${new Date().toLocaleString('es-MX')}`;
    worksheet.getCell('A2').font = { size: 10, name: 'Arial', color: { argb: 'FF666666' } };
    worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(2).height = 25;

    // ============================================================
    // 2. CABECERA
    // ============================================================
    const headers = ['#', 'Matricula', 'Alumno', 'Grupo', 'Materia', 'Estado', 'Fecha'];
    const headerRow = worksheet.addRow(headers);

    headerRow.font = { bold: true, size: 11, name: 'Arial', color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A237E' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 30;

    worksheet.getColumn(1).width = 8;
    worksheet.getColumn(2).width = 18;
    worksheet.getColumn(3).width = 35;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 30;
    worksheet.getColumn(6).width = 16;
    worksheet.getColumn(7).width = 20;

    // ============================================================
    // 3. DATOS
    // ============================================================
    const estadoMap = {
      'PRESENTE': 'Presente',
      'RETARDO': 'Retardo',
      'FALTA': 'Falta',
      'JUSTIFICADA': 'Justificada'
    };

    if (asistencias && asistencias.length > 0) {
      asistencias.forEach((a, index) => {
        const nombreCompleto =
          `${a.alumno?.nombre || ''} ${a.alumno?.apellidoPaterno || ''} ${a.alumno?.apellidoMaterno || ''}`.trim();

        const estadoLabel = estadoMap[a.estado] || a.estado || '-';

        const fecha = a.fechaHora
          ? new Date(a.fechaHora).toLocaleDateString('es-MX')
          : '-';

        const row = worksheet.addRow([
          index + 1,
          a.alumno?.matricula || '-',
          nombreCompleto || '-',
          a.alumno?.grupo?.nombre || '-',
          a.sesionQR?.mmg?.materia?.nombre || '-',
          estadoLabel,
          fecha
        ]);

        const fillColor = index % 2 === 0 ? 'FFF8F9FA' : 'FFFFFFFF';
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          };
          cell.font = { size: 10, name: 'Arial' };
          cell.alignment = { vertical: 'middle' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
            right: { style: 'thin', color: { argb: 'FFD0D0D0' } }
          };
        });

        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };

        const estadoCell = row.getCell(6);
        const estadoValue = estadoCell.value;
        let color = 'FF333333';
        let bold = false;
        
        if (estadoValue === 'Presente') {
          color = 'FF2E7D32';
          bold = true;
        } else if (estadoValue === 'Falta') {
          color = 'FFC62828';
          bold = true;
        } else if (estadoValue === 'Retardo') {
          color = 'FFE65100';
          bold = true;
        } else if (estadoValue === 'Justificada') {
          color = 'FF6A1B9A';
          bold = true;
        }
        
        estadoCell.font = { color: { argb: color }, bold: bold, size: 10, name: 'Arial' };

        row.height = 24;
      });
    }

    // ============================================================
    // 4. RESUMEN ESTADÍSTICO
    // ============================================================
    if (asistencias && asistencias.length > 0) {
      const totalPresentes = asistencias.filter(a => a.estado === 'PRESENTE').length || 0;
      const totalFaltas = asistencias.filter(a => a.estado === 'FALTA').length || 0;
      const totalRetardos = asistencias.filter(a => a.estado === 'RETARDO').length || 0;
      const totalJustificadas = asistencias.filter(a => a.estado === 'JUSTIFICADA').length || 0;

      worksheet.addRow([]);

      const totalRow = worksheet.addRow([]);
      const currentRow = worksheet.rowCount;
      
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      totalRow.getCell(1).value = 'Total de registros:';
      totalRow.getCell(1).font = { bold: true, size: 11, name: 'Arial' };
      totalRow.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
      
      worksheet.mergeCells(`F${currentRow}:G${currentRow}`);
      totalRow.getCell(6).value = asistencias.length;
      totalRow.getCell(6).font = { bold: true, size: 12, name: 'Arial', color: { argb: 'FF1A237E' } };
      totalRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      totalRow.height = 28;

      const detailRow = worksheet.addRow([]);
      const currentRow2 = worksheet.rowCount;
      
      worksheet.mergeCells(`A${currentRow2}:G${currentRow2}`);
      detailRow.getCell(1).value = `Presentes: ${totalPresentes}   |   Faltas: ${totalFaltas}   |   Retardos: ${totalRetardos}   |   Justificadas: ${totalJustificadas}`;
      detailRow.getCell(1).font = { size: 10, name: 'Arial' };
      detailRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      detailRow.height = 25;
    }

    // ============================================================
    // 5. CONFIGURACIÓN FINAL
    // ============================================================
    worksheet.views = [{ state: 'frozen', ySplit: 4 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx"`
    );
    res.setHeader('Cache-Control', 'no-cache');

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error al generar Excel:', error);
    res.status(500).json({
      ok: false,
      mensaje: 'Error al generar Excel: ' + error.message
    });
  }
};