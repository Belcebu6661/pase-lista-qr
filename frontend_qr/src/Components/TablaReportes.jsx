
import "../styles/TablaReportes.css";

const TablaReportes = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="tabla-vacia">
        <i className="fas fa-inbox"></i>
        <p>No hay datos para mostrar</p>
        <span>Selecciona filtros y presiona "Consultar"</span>
      </div>
    );
  }

  const obtenerNombreAlumno = (item) => {
    if (item.alumno) {
      const alumno = item.alumno;
      const nombre = alumno.nombre || '';
      const apellidoPaterno = alumno.apellidoPaterno || '';
      const apellidoMaterno = alumno.apellidoMaterno || '';
      return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim() || 'Sin nombre';
    }
    
    if (item.nombre) {
      const nombre = item.nombre || '';
      const apellidoPaterno = item.apellidoPaterno || '';
      const apellidoMaterno = item.apellidoMaterno || '';
      return `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim() || 'Sin nombre';
    }
    
    return 'Sin nombre';
  };

  const obtenerMatricula = (item) => {
    if (item.alumno && item.alumno.matricula) {
      return item.alumno.matricula;
    }
    return item.matricula || '-';
  };

  const obtenerGrupo = (item) => {
    if (item.alumno && item.alumno.grupo) {
      if (typeof item.alumno.grupo === 'object') {
        return item.alumno.grupo.nombre || item.alumno.grupo.clave || item.alumno.grupo.id || '-';
      }
      return item.alumno.grupo;
    }
    
    if (item.grupo) {
      if (typeof item.grupo === 'object') {
        return item.grupo.nombre || item.grupo.clave || item.grupo.id || '-';
      }
      return item.grupo;
    }
    
    return '-';
  };

  const obtenerMateria = (item) => {
    if (item.sesionQR?.mmg?.materia?.nombre) {
      return item.sesionQR.mmg.materia.nombre;
    }
    if (item.sesionQR?.mmg?.materia) {
      return item.sesionQR.mmg.materia;
    }
    return '-';
  };

  const obtenerFecha = (item) => {
    const fecha = item.fecha || item.fechaHora || item.createdAt;
    if (fecha) {
      try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-MX', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return fecha;
      }
    }
    return '-';
  };

  const obtenerEstado = (item) => {
    const estado = item.estado || '';
    // Mapear los estados del enum
    const estadoMap = {
      'PRESENTE': 'Presente',
      'RETARDO': 'Retardo',
      'FALTA': 'Falta',
      'JUSTIFICADA': 'Justificada'
    };
    return estadoMap[estado] || estado || 'Presente';
  };

  const getColorEstado = (estado) => {
    switch(estado) {
      case 'Presente': return 'estado-presente';
      case 'Falta': return 'estado-falta';
      case 'Justificada': return 'estado-justificada';
      case 'Retardo': return 'estado-retardo';
      default: return 'estado-default';
    }
  };

  const getIconoEstado = (estado) => {
    switch(estado) {
      case 'Presente': return 'fa-check-circle';
      case 'Falta': return 'fa-times-circle';
      case 'Justificada': return 'fa-clipboard-check';
      case 'Retardo': return 'fa-clock';
      default: return 'fa-circle';
    }
  };

  return (
    <div className="tabla-container">
      {/* Header con contador mejorado */}
      <div className="tabla-header">
        <h2>
          <i className="fas fa-list-ul"></i> Resultados de Asistencias
        </h2>
        <span className="registros-badge">
          <i className="fas fa-database"></i> {data.length} registros
        </span>
      </div>

      {/* Tabla mejorada */}
      <div className="tabla-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Matrícula</th>
              <th>Alumno</th>
              <th>Grupo</th>
              <th>Materia</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => {
              const estado = obtenerEstado(item);
              const estadoClass = getColorEstado(estado);
              const iconoEstado = getIconoEstado(estado);
              
              return (
                <tr key={item.id || index}>
                  <td className="col-index">{index + 1}</td>
                  
                  <td className="col-matricula">
                    {obtenerMatricula(item)}
                  </td>
                  
                  <td className="col-alumno">
                    <span className="nombre-alumno">
                      {obtenerNombreAlumno(item)}
                    </span>
                  </td>
                  
                  <td className="col-grupo">
                    <span className="grupo-badge">
                      {obtenerGrupo(item)}
                    </span>
                  </td>
                  
                  <td className="col-materia">
                    {obtenerMateria(item)}
                  </td>
                  
                  <td className="col-estado">
                    <span className={`estado-badge ${estadoClass}`}>
                      <i className={`fas ${iconoEstado}`}></i>
                      {estado}
                    </span>
                  </td>
                  
                  <td className="col-fecha">
                    <i className="fas fa-calendar-alt fecha-icon"></i>
                    {obtenerFecha(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con estadísticas */}
      <div className="tabla-footer">
        <div className="estadisticas">
          <span>
            <i className="fas fa-users"></i> Total: {data.length} registros
          </span>
          <span className="separator">|</span>
          <span>
            <i className="fas fa-check-circle" style={{ color: '#0b6133' }}></i>
            {data.filter(item => obtenerEstado(item) === 'Presente').length} Presentes
          </span>
          <span className="separator">|</span>
          <span>
            <i className="fas fa-times-circle" style={{ color: '#b33c3c' }}></i>
            {data.filter(item => obtenerEstado(item) === 'Falta').length} Faltas
          </span>
        </div>
      </div>
    </div>
  );
};

export default TablaReportes;