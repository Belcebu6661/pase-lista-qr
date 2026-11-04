import { useState, useEffect } from "react";
import "../styles/FiltrosReportes.css";

const FiltrosReportes = ({ tipoReporte, setFiltros, onConsultar, loading }) => {
  const [filtrosLocales, setFiltrosLocales] = useState({
    carreraId: "",
    grupoId: "",
    materiaId: "",
    estado: "",
    fechaInicio: "",
    fechaFin: ""
  });

  const [carreras, setCarreras] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [error, setError] = useState(null); // ✅ Agregar estado de error

  // Cargar carreras
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/carreras');
        if (res.ok) {
          const data = await res.json();
          setCarreras(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error al cargar carreras:", error);
        setError("Error al cargar carreras");
      }
    };
    fetchCarreras();
  }, []);

  // Cargar grupos (depende de la carrera seleccionada)
  useEffect(() => {
    const fetchGrupos = async () => {
      if (!filtrosLocales.carreraId) {
        setGrupos([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:3000/api/grupos?carreraId=${filtrosLocales.carreraId}`);
        if (res.ok) {
          const data = await res.json();
          setGrupos(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error al cargar grupos:", error);
      }
    };
    fetchGrupos();
  }, [filtrosLocales.carreraId]);

  // Cargar materias (depende de la carrera seleccionada)
  useEffect(() => {
    const fetchMaterias = async () => {
      if (!filtrosLocales.carreraId) {
        setMaterias([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:3000/api/materias?carreraId=${filtrosLocales.carreraId}`);
        if (res.ok) {
          const data = await res.json();
          setMaterias(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error al cargar materias:", error);
      }
    };
    fetchMaterias();
  }, [filtrosLocales.carreraId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFiltrosLocales(prev => {
      const nuevosFiltros = { ...prev, [name]: value };
      // Si cambia la carrera, limpiar grupo y materia
      if (name === 'carreraId') {
        nuevosFiltros.grupoId = "";
        nuevosFiltros.materiaId = "";
      }
      return nuevosFiltros;
    });
    setError(null); // Limpiar error al cambiar filtros
  };

  const handleConsultar = () => {
    // Validar que haya al menos un filtro seleccionado
    const tieneFiltro = Object.values(filtrosLocales).some(
      value => value !== "" && value !== null && value !== undefined
    );

    if (!tieneFiltro) {
      setError("⚠️ Selecciona al menos un filtro para consultar");
      return;
    }

    // Filtrar valores vacíos
    const filtrosValidos = Object.fromEntries(
      Object.entries(filtrosLocales).filter(
        ([key, value]) => {
          // Si es materiaId y está vacío, no lo enviamos (opcional)
          if (key === 'materiaId' && value === '') return false;
          return value !== "" && value !== null && value !== undefined;
        }
      )
    );

    console.log("📤 Enviando filtros válidos:", filtrosValidos);
    
    setFiltros(filtrosValidos);
    setError(null);
    
    if (onConsultar) {
      onConsultar();
    }
  };

  const handleLimpiar = () => {
    setFiltrosLocales({
      carreraId: "",
      grupoId: "",
      materiaId: "",
      estado: "",
      fechaInicio: "",
      fechaFin: ""
    });
    setFiltros({});
    setGrupos([]);
    setMaterias([]);
    setError(null);
  };

  // Definir qué filtros mostrar según el tipo de reporte
  const getFiltrosActivos = () => {
    switch (tipoReporte) {
      case 'general':
        return ['carreraId', 'grupoId', 'materiaId', 'estado', 'fechaInicio', 'fechaFin'];
      case 'grupo':
        return ['carreraId', 'grupoId', 'materiaId', 'estado', 'fechaInicio', 'fechaFin'];
      case 'carrera':
        return ['carreraId', 'estado', 'fechaInicio', 'fechaFin'];
      default:
        return ['carreraId', 'grupoId', 'materiaId', 'estado', 'fechaInicio', 'fechaFin'];
    }
  };

  const filtrosActivos = getFiltrosActivos();

  const getTituloReporte = () => {
    switch (tipoReporte) {
      case 'general':
        return 'Reporte General';
      case 'grupo':
        return 'Reporte por Grupo';
      case 'carrera':
        return 'Reporte por Carrera';
      default:
        return 'Reporte';
    }
  };

  const setFechasRapidas = (dias) => {
    const hoy = new Date();
    const fechaInicio = new Date();
    fechaInicio.setDate(hoy.getDate() - dias);
    
    setFiltrosLocales(prev => ({
      ...prev,
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: hoy.toISOString().split('T')[0]
    }));
    setError(null);
  };

  return (
    <div className="filtros-container">
      <div className="filtros-header">
        <div className="header-left">
          <h2>
            <i className="fas fa-filter"></i> Filtros - {getTituloReporte()}
          </h2>
          <span className="stats-badge">
            <i className="fas fa-graduation-cap"></i> {carreras.length} carreras
            <span className="separator">·</span>
            <i className="fas fa-users"></i> {grupos.length} grupos
            <span className="separator">·</span>
            <i className="fas fa-book"></i> {materias.length} materias
          </span>
        </div>
      </div>

      {/* ✅ Mostrar errores */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      <div className="filtros-grid">
        {filtrosActivos.includes('carreraId') && (
          <div className="filtro-grupo">
            <label htmlFor="carreraId">
              <i className="fas fa-graduation-cap"></i> Carrera
            </label>
            <select
              id="carreraId"
              name="carreraId"
              value={filtrosLocales.carreraId}
              onChange={handleChange}
              className={filtrosLocales.carreraId ? "seleccionado" : ""}
            >
              <option value="">Todas las carreras</option>
              {carreras.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.clave}
                </option>
              ))}
            </select>
          </div>
        )}

        {filtrosActivos.includes('grupoId') && (
          <div className="filtro-grupo">
            <label htmlFor="grupoId">
              <i className="fas fa-users"></i> Grupo
            </label>
            <select
              id="grupoId"
              name="grupoId"
              value={filtrosLocales.grupoId}
              onChange={handleChange}
              disabled={!filtrosLocales.carreraId}
              className={!filtrosLocales.carreraId ? "disabled" : ""}
            >
              <option value="">Todos los grupos</option>
              {grupos.map(g => (
                <option key={g.id} value={g.id}>
                  {g.nombre || g.clave}
                </option>
              ))}
            </select>
            {!filtrosLocales.carreraId && (
              <p className="helper-text">
                <i className="fas fa-info-circle"></i> Selecciona una carrera primero
              </p>
            )}
          </div>
        )}

        {filtrosActivos.includes('materiaId') && (
          <div className="filtro-grupo">
            <label htmlFor="materiaId">
              <i className="fas fa-book"></i> Materia
            </label>
            <select
              id="materiaId"
              name="materiaId"
              value={filtrosLocales.materiaId}
              onChange={handleChange}
              disabled={!filtrosLocales.carreraId}
              className={!filtrosLocales.carreraId ? "disabled" : ""}
            >
              <option value="">Todas las materias</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre || m.clave}
                </option>
              ))}
            </select>
            {!filtrosLocales.carreraId && (
              <p className="helper-text">
                <i className="fas fa-info-circle"></i> Selecciona una carrera primero
              </p>
            )}
          </div>
        )}

        <div className="filtro-grupo">
          <label htmlFor="estado">
            <i className="fas fa-flag"></i> Estado
          </label>
          <select
            id="estado"
            name="estado"
            value={filtrosLocales.estado}
            onChange={handleChange}
          >
            <option value="">Todos los estados</option>
            <option value="PRESENTE">✅ Presente</option>
            <option value="RETARDO">⏰ Retardo</option>
            <option value="FALTA">❌ Falta</option>
            <option value="JUSTIFICADA">📋 Justificada</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label htmlFor="fechaInicio">
            <i className="fas fa-calendar-alt"></i> Fecha Inicio
          </label>
          <input
            type="date"
            id="fechaInicio"
            name="fechaInicio"
            value={filtrosLocales.fechaInicio}
            onChange={handleChange}
          />
        </div>

        <div className="filtro-grupo">
          <label htmlFor="fechaFin">
            <i className="fas fa-calendar-alt"></i> Fecha Fin
          </label>
          <input
            type="date"
            id="fechaFin"
            name="fechaFin"
            value={filtrosLocales.fechaFin}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="filtros-acciones">
        <div className="fechas-rapidas">
          <button onClick={() => setFechasRapidas(30)} type="button">
            <i className="fas fa-clock"></i> Últimos 30 días
          </button>
          <button onClick={() => setFechasRapidas(7)} type="button">
            <i className="fas fa-clock"></i> Últimos 7 días
          </button>
        </div>

        <div className="acciones-botones">
          <button 
            onClick={handleConsultar} 
            className="btn-consultar"
            disabled={loading}
            type="button"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Consultando...
              </>
            ) : (
              <>
                <i className="fas fa-search"></i> Consultar
              </>
            )}
          </button>
          <button 
            onClick={handleLimpiar} 
            className="btn-limpiar"
            type="button"
          >
            <i className="fas fa-undo-alt"></i> Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FiltrosReportes;