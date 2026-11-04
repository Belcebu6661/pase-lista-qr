import { useState, useRef } from "react";
import "../styles/BotonesReportes.css";

const BotonesReportes = ({ tipoReporte, setTipoReporte }) => {
  const [exportando, setExportando] = useState(false);
  const exportandoRef = useRef(false); // ← Para evitar ejecuciones dobles

  const handleExportar = async (formato) => {
    // ✅ Evitar ejecuciones simultáneas
    if (exportandoRef.current) {
      console.log('⏳ Ya hay una exportación en curso...');
      return;
    }

    exportandoRef.current = true;
    setExportando(true);

    try {
      const filtrosStorage = localStorage.getItem('filtrosReporte');
      const filtros = filtrosStorage ? JSON.parse(filtrosStorage) : {};
      
      const params = new URLSearchParams();
      
      // ✅ Limpiar filtros vacíos correctamente
      for (const [key, value] of Object.entries(filtros)) {
        if (value && value !== "" && value !== null && value !== undefined) {
          params.append(key, value);
        }
      }

      const url = `http://localhost:3000/api/${tipoReporte}/${formato}?${params.toString()}`;
      
      console.log(`📤 Exportando a ${formato.toUpperCase()}:`, url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': formato === 'pdf' 
            ? 'application/pdf' 
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('El archivo generado está vacío');
      }

      const fecha = new Date().toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      
      const extension = formato === 'pdf' ? 'pdf' : 'xlsx';
      const nombreArchivo = `reporte_${tipoReporte}_${fecha}.${extension}`;
      
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = nombreArchivo;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      console.log(`✅ Archivo ${formato.toUpperCase()} descargado: ${nombreArchivo}`);

    } catch (error) {
      console.error(`❌ Error al exportar a ${formato.toUpperCase()}:`, error);
      alert(`Error al generar el ${formato.toUpperCase()}: ${error.message}`);
    } finally {
      exportandoRef.current = false;
      setExportando(false);
    }
  };

  const botones = [
    { id: 'general', label: 'Reporte General', icon: 'fa-file-alt' },
    { id: 'grupo', label: 'Reporte por Grupo', icon: 'fa-users' },
    { id: 'carrera', label: 'Reporte por Carrera', icon: 'fa-university' },
  ];

  return (
    <div className="botones-reportes-container">
      <div className="botones-content">
        {/* Botones de tipo de reporte */}
        <div className="botones-tipo">
          {botones.map((boton) => (
            <button
              key={boton.id}
              onClick={() => setTipoReporte(boton.id)}
              className={`btn-tipo ${tipoReporte === boton.id ? 'active' : ''}`}
            >
              <i className={`fas ${boton.icon}`}></i>
              {boton.label}
            </button>
          ))}
        </div>

        {/* Botones de exportación */}
        <div className="botones-exportar">
          <button
            onClick={() => handleExportar('pdf')}
            disabled={exportando}
            className="btn-exportar btn-pdf"
          >
            {exportando ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Generando...
              </>
            ) : (
              <>
                <i className="fas fa-file-pdf"></i>
                PDF
              </>
            )}
          </button>
          <button
            onClick={() => handleExportar('excel')}
            disabled={exportando}
            className="btn-exportar btn-excel"
          >
            {exportando ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Generando...
              </>
            ) : (
              <>
                <i className="fas fa-file-excel"></i>
                Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Indicador de estado */}
      {exportando && (
        <div className="exportando-indicator">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>Generando archivo...</p>
        </div>
      )}
    </div>
  );
};

export default BotonesReportes;