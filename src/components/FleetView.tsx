import React, { useState } from 'react';
import { Vehiculo, Monitoreo } from '../types';

interface FleetViewProps {
  vehiculos: Vehiculo[];
  monitoreos: Monitoreo[];
  onAddVehicle: (vehicleData: any) => Promise<boolean>;
  onReportIncident: (incidentData: any) => Promise<boolean>;
  onScheduleMaintenance: (placa: string, fecha: string, estado: string) => Promise<boolean>;
}

export default function FleetView({ 
  vehiculos, 
  monitoreos, 
  onAddVehicle, 
  onReportIncident,
  onScheduleMaintenance
}: FleetViewProps) {
  
  // Tab toggling state
  const [activeTab, setActiveTab] = useState<'vehiculo' | 'incidencia'>('vehiculo');

  // FORM: Nuevo Vehículo state
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [capacidad, setCapacidad] = useState('');
  
  // FORM: Reportar Incidencia state
  const [selectedMonitoreoId, setSelectedMonitoreoId] = useState('');
  const [tipoIncidencia, setTipoIncidencia] = useState('');
  const [fechaSuceso, setFechaSuceso] = useState('');
  const [horaSuceso, setHoraSuceso] = useState('');
  const [descripcionIncident, setDescripcionIncident] = useState('');

  // Maintenance selection state
  const [schedulingPlaca, setSchedulingPlaca] = useState('');
  const [maintFecha, setMaintFecha] = useState('');
  const [maintEstado, setMaintEstado] = useState('PRÓXIMO 15D');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', isError: false });

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa || !marca || !modelo || !anio || !capacidad) {
      setMsg({ text: 'Por favor complete todos los datos del vehículo.', isError: true });
      return;
    }

    setLoading(true);
    setMsg({ text: '', isError: false });

    const success = await onAddVehicle({
      placa: placa.toUpperCase(),
      marca,
      modelo,
      anio: parseInt(anio, 10),
      capacidad: parseFloat(capacidad),
      estado_mantenimiento: 'ÓPTIMO',
      fecha_mantenimiento: 'No Agendada'
    });

    setLoading(false);

    if (success) {
      setMsg({ text: '¡Vehículo registrado exitosamente en el inventario!', isError: false });
      // Reset
      setPlaca('');
      setMarca('');
      setModelo('');
      setAnio('');
      setCapacidad('');
    } else {
      setMsg({ text: 'Error al registrar vehículo. Verifique si la placa ya existe.', isError: true });
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMonitoreoId || !tipoIncidencia || !descripcionIncident) {
      setMsg({ text: 'Por favor seleccione una unidad y describa la incidencia.', isError: true });
      return;
    }

    setLoading(true);
    setMsg({ text: '', isError: false });

    // Format current date and time if empty
    const finalFecha = fechaSuceso || new Date().toISOString().split('T')[0];
    const finalHora = horaSuceso || new Date().toTimeString().split(' ')[0].substring(0, 5);

    const success = await onReportIncident({
      monitoreo_id: selectedMonitoreoId,
      tipo_incidencia: tipoIncidencia,
      fecha: finalFecha,
      hora: finalHora,
      descripcion: descripcionIncident
    });

    setLoading(false);

    if (success) {
      setMsg({ text: '¡Incidencia reportada con éxito! La central ha sido alertada.', isError: false });
      // Reset
      setSelectedMonitoreoId('');
      setTipoIncidencia('');
      setFechaSuceso('');
      setHoraSuceso('');
      setDescripcionIncident('');
    } else {
      setMsg({ text: 'Error al reportar la incidencia. Verifique la conexión.', isError: true });
    }
  };

  // Routine schedule trigger
  const handleScheduleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingPlaca || !maintFecha) {
      return;
    }

    setLoading(true);
    const success = await onScheduleMaintenance(schedulingPlaca, maintFecha, maintEstado);
    setLoading(false);

    if (success) {
      setSchedulingPlaca('');
      setMaintFecha('');
      alert('¡Mantenimiento agendado correctamente para esta unidad!');
    } else {
      alert('Error al agender el mantenimiento.');
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* Page Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-black text-on-surface">Gestión de Flota e Incidencias</h2>
        <p className="text-on-surface-variant text-sm mt-1">Ingrese los datos para dar de alta nuevas unidades cisterna o reportar eventualidades en ruta.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-lg border text-xs font-semibold ${
          msg.isError 
            ? 'bg-error-container/20 border-error text-error' 
            : 'bg-green-500/10 border-green-500 text-green-400'
        }`}>
          {msg.text}
        </div>
      )}

      {/* Grid: Forms and side stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form panel container (Asymmetric layout) */}
        <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-xl">
          
          {/* Tabs */}
          <div className="flex border-b border-outline-variant px-4 bg-surface-container-high/40">
            <button 
              onClick={() => { setActiveTab('vehiculo'); setMsg({ text: '', isError: false }); }}
              className={`px-6 py-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'vehiculo' 
                  ? 'border-secondary text-secondary font-black' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              <span>Nuevo Vehículo</span>
            </button>

            <button 
              onClick={() => { setActiveTab('incidencia'); setMsg({ text: '', isError: false }); }}
              className={`px-6 py-4 font-bold text-xs uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'incidencia' 
                  ? 'border-error text-error font-black' 
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>Reportar Incidencia</span>
            </button>
          </div>

          <div className="p-6">
            
            {/* Tab: Nuevo Vehículo Form */}
            {activeTab === 'vehiculo' && (
              <form onSubmit={handleCreateVehicle} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Placa de Rodaje</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: ABC-123" 
                      value={placa}
                      onChange={(e) => setPlaca(e.target.value)}
                      className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface font-mono uppercase"
                    />
                    <span className="text-[10px] text-on-surface-variant/70">Formato estándar peruano: LLL-NNN</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Marca del Vehículo</label>
                    <select 
                      value={marca} 
                      onChange={(e) => setMarca(e.target.value)}
                      required
                      className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
                    >
                      <option value="">Seleccione marca...</option>
                      <option value="Volvo">Volvo</option>
                      <option value="Scania">Scania</option>
                      <option value="Mercedes-Benz">Mercedes-Benz</option>
                      <option value="Kenworth">Kenworth</option>
                      <option value="International">International</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Modelo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej: FH16 750" 
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Año</label>
                      <input 
                        type="number" 
                        required
                        placeholder="2024" 
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-on-surface-variant uppercase">Capacidad (Ton)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        required
                        placeholder="32" 
                        value={capacidad}
                        onChange={(e) => setCapacidad(e.target.value)}
                        className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-primary-container/20 border border-primary/10 rounded-lg flex gap-2.5 text-xs text-on-primary-container">
                  <span className="material-symbols-outlined text-primary">info</span>
                  <p>Las unidades de carga nuevas requieren una aprobación técnica inicial antes de ser programadas en un viaje activo de Petro Mapi.</p>
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-secondary text-on-secondary hover:brightness-110 active:scale-95 transition-all rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md shadow-secondary/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    <span>{loading ? 'Procesando...' : 'Guardar Nuevo Vehículo'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Tab: Reportar Incidencia Form */}
            {activeTab === 'incidencia' && (
              <form onSubmit={handleReportIncident} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Unidad Bajo Monitoreo</label>
                    <select 
                      value={selectedMonitoreoId} 
                      onChange={(e) => setSelectedMonitoreoId(e.target.value)}
                      required
                      className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
                    >
                      <option value="">Seleccione ruta activa...</option>
                      {monitoreos.filter(m => m.estado === 'EN RUTA' || m.estado === 'INCIDENCIA').map(m => (
                        <option key={m.id} value={m.id}>
                          {m.id} - Placa {m.placa} ({m.conductor})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Tipo de Incidencia</label>
                    <select 
                      value={tipoIncidencia} 
                      onChange={(e) => setTipoIncidencia(e.target.value)}
                      required
                      className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
                    >
                      <option value="">Seleccione tipo...</option>
                      <option value="Falla Mecánica">Falla Mecánica</option>
                      <option value="Accidente de Tránsito">Accidente de Tránsito</option>
                      <option value="Retraso Vial / Bloqueo">Retraso Vial / Bloqueo</option>
                      <option value="Condiciones Climáticas">Condiciones Climáticas</option>
                      <option value="Desvío de Ruta Sin Autorizar">Desvío de Ruta Sin Autorizar</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Fecha y Hora aproximada</label>
                    <div className="flex gap-2">
                      <input 
                        type="date" 
                        value={fechaSuceso} 
                        onChange={(e) => setFechaSuceso(e.target.value)}
                        className="bg-surface-container-highest border border-outline-variant rounded-lg p-2 text-xs text-on-surface flex-1"
                      />
                      <input 
                        type="time" 
                        value={horaSuceso} 
                        onChange={(e) => setHoraSuceso(e.target.value)}
                        className="bg-surface-container-highest border border-outline-variant rounded-lg p-2 text-xs text-on-surface flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Descripción Detallada del Evento</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Describa puntualmente los hechos ocurridos, indicando hito de kilometraje actual e integridad o estado del conductor..."
                      value={descripcionIncident} 
                      onChange={(e) => setDescripcionIncident(e.target.value)}
                      className="bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface resize-none focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-red-500/10 border border-error/20 rounded-lg flex gap-2.5 text-xs text-error">
                  <span className="material-symbols-outlined">priority_high</span>
                  <p>Este reporte alertará de inmediato a la central regional logística activando protocolos de resguardo.</p>
                </div>

                <div className="flex justify-end pt-3">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-error text-white hover:brightness-110 active:scale-95 transition-all rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md shadow-error/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>{loading ? 'Fijando Alerta...' : 'Enviar Reporte de Incidencia'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* Side stats summary cards (Asymmetric) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center gap-4">
            <div className="w-11 h-11 bg-secondary/10 text-secondary border border-secondary/20 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Flota Registrada</p>
              <h4 className="font-black text-on-surface text-lg">{vehiculos.length} Cisternas</h4>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center gap-4">
            <div className="w-11 h-11 bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Operatividad</p>
              <h4 className="font-black text-on-surface text-lg">98.2%</h4>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl flex items-center gap-4">
            <div className="w-11 h-11 bg-red-500/10 text-error border border-error/20 flex items-center justify-center rounded-lg">
              <span className="material-symbols-outlined">history</span>
            </div>
            <div>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Monitoreos Activos</p>
              <h4 className="font-black text-on-surface text-lg">{monitoreos.length} Procesados</h4>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Inventario de Vehículos Table Area */}
      <div id="inventario-flota" className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-xl mt-6">
        <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider px-2">Inventario de Vehículos Cisterna</h3>
          <div className="flex gap-2">
            <span className="bg-primary/10 border border-primary/25 text-primary text-[9px] font-bold px-2 py-0.5 rounded uppercase">CISTERNA ACTIVA</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase">
              <tr>
                <th className="px-6 py-4">Placa</th>
                <th className="px-6 py-4">Marca-Fabricante</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4 text-center">Año</th>
                <th className="px-6 py-4 text-right">Capacidad (TN)</th>
                <th className="px-6 py-4">Estado Mantenimiento</th>
                <th className="px-6 py-4 text-right">Acción Correctiva</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface">
              {vehiculos.map((v) => (
                <tr key={v.placa} className="hover:bg-surface-container-highest/20 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-secondary font-bold text-sm">{v.placa}</td>
                  <td className="px-6 py-3.5 font-semibold">{v.marca}</td>
                  <td className="px-6 py-3.5 text-on-surface-variant font-medium">{v.modelo}</td>
                  <td className="px-6 py-3.5 text-center font-mono">{v.anio}</td>
                  <td className="px-6 py-3.5 text-right font-mono font-bold">{v.capacidad.toFixed(1)} TN</td>
                  <td className="px-6 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-on-surface-variant">{v.fecha_mantenimiento || 'No Agendada'}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        v.estado_mantenimiento === 'ÓPTIMO' 
                          ? 'text-green-400' 
                          : v.estado_mantenimiento === 'PRÓXIMO 15D'
                          ? 'text-secondary'
                          : 'text-error'
                      }`}>
                        {v.estado_mantenimiento}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button 
                      onClick={() => setSchedulingPlaca(v.placa)}
                      className="text-secondary-fixed-dim hover:text-secondary border border-secondary/20 hover:border-secondary px-2.5 py-1 rounded text-[10px] font-black tracking-wide transition-all active:scale-95 flex items-center gap-1 ml-auto cursor-pointer font-sans uppercase"
                    >
                      <span className="material-symbols-outlined text-[12px]">build</span>
                      Agendar Mantenimiento
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP FOR SCHEDULING MAINTENANCE */}
      {schedulingPlaca && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-xl max-w-sm w-full shadow-2xl overflow-hidden animate-fadeIn">
            <div className="p-4 bg-surface-container-high border-b border-outline-variant flex items-center justify-between">
              <h5 className="font-bold text-xs uppercase tracking-wider text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">event_repeat</span>
                Programar Mantenimiento: {schedulingPlaca}
              </h5>
              <button onClick={() => setSchedulingPlaca('')} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <form onSubmit={handleScheduleMaintSubmit} className="p-4 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Fecha de Programación</label>
                <input 
                  type="date"
                  required
                  value={maintFecha}
                  onChange={(e) => setMaintFecha(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded p-2 text-xs font-mono text-on-surface"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant">Estado Correctivo</label>
                <select 
                  value={maintEstado}
                  onChange={(e) => setMaintEstado(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded p-2 text-xs text-on-surface"
                >
                  <option value="PRÓXIMO 15D">PRÓXIMO 15D (Preventivo)</option>
                  <option value="VENCIDO">VENCIDO (Urgencia de parada)</option>
                  <option value="ÓPTIMO">ÓPTIMO (Aprobado)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setSchedulingPlaca('')}
                  className="px-3 py-1.5 bg-surface-container text-on-surface-variant hover:text-on-surface rounded text-xs font-bold"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-1.5 bg-secondary text-on-secondary hover:brightness-110 rounded text-xs font-bold"
                >
                  Confirmar Fecha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Contextual Visual Aid Map Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Peruvian Dispersion Map */}
        <div className="lg:col-span-2 bg-surface-container border border-outline-variant rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-base font-bold text-on-surface">Mapa General de Dispersión de Flota</h3>
            <span className="material-symbols-outlined text-secondary">map</span>
          </div>

          <div className="h-64 rounded bg-surface-container-low border border-outline-variant flex items-center justify-center relative overflow-hidden">
            <img 
              alt="Mapa Logístico" 
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-50" 
              src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800&auto=format&fit=crop"
            />
            
            <div className="z-10 bg-surface/90 p-4 rounded-xl border border-secondary shadow-2xl text-center max-w-xs">
              <p className="font-extrabold text-secondary text-xs uppercase tracking-widest animate-pulse">MONITOREO GPS REAL-TIME</p>
              <p className="text-[11px] text-on-surface-variant mt-1.5 leading-relaxed">Localizando telemetría y georeferenciando la trayectoria de todas las cisternas registradas en tránsito.</p>
            </div>
          </div>
        </div>

        {/* Fleet alerts list */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-on-surface mb-4">Alertas Críticas de Flota</h3>
            <div className="space-y-3">
              <div className="flex gap-2.5 items-start p-3 bg-red-500/10 border-l-4 border-error rounded-r text-xs">
                <span className="material-symbols-outlined text-error text-lg mt-0.5">emergency</span>
                <div>
                  <p className="font-bold text-on-surface">F9L-403: Motor Sobrecalentado</p>
                  <p className="text-[10px] text-on-surface-variant uppercase mt-0.5">Ruta: Arequipa ➔ Cusco</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start p-3 bg-secondary/10 border-l-4 border-secondary rounded-r text-xs">
                <span className="material-symbols-outlined text-secondary text-lg mt-0.5">build</span>
                <div>
                  <p className="font-bold text-on-surface">B3X-115: Mantenimiento Preventivo</p>
                  <p className="text-[10px] text-on-surface-variant uppercase mt-0.5">Vence en 3 días</p>
                </div>
              </div>
            </div>
          </div>

          <a 
            href="#inventario-flota" 
            className="w-full mt-6 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest rounded text-center font-bold text-xs flex items-center justify-center gap-1"
          >
            <span>Ver Inventario Completo</span>
            <span className="material-symbols-outlined text-xs">arrow_forward</span>
          </a>
        </div>

      </div>

    </div>
  );
}
