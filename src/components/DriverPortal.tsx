import React, { useState, useEffect } from 'react';
import { Usuario, Vehiculo, Monitoreo, Incidencia } from '../types';

interface DriverPortalProps {
  currentUser: { id: number; nombre_completo: string; correo: string; rol: string };
  monitoreos: Monitoreo[];
  vehiculos: Vehiculo[];
  incidencias: Incidencia[];
  onUpdateEstado: (id: string, estado: 'EN RUTA' | 'INCIDENCIA' | 'COMPLETADO') => Promise<void>;
  onReportIncident: (incidentData: any) => Promise<boolean>;
  onLogout: () => void;
  syncWithBackendData: () => Promise<void>;
}

export default function DriverPortal({
  currentUser,
  monitoreos,
  vehiculos,
  incidencias,
  onUpdateEstado,
  onReportIncident,
  onLogout,
  syncWithBackendData,
}: DriverPortalProps) {
  // Find trips assigned to this conductor
  const myTrips = monitoreos.filter(
    (m) => m.conductor.trim().toLowerCase() === currentUser.nombre_completo.trim().toLowerCase()
  );

  // If none matches literally, check if we can fall back to the most recent monitoring matching or simply all
  const activeTrip = myTrips.find((m) => m.estado === 'EN RUTA' || m.estado === 'INCIDENCIA') || myTrips[0] || monitoreos[0];

  // Specific vehicle assigned to this trip
  const currentVehicle = vehiculos.find((v) => v.placa === (activeTrip?.placa || ''));

  // Pre-trip security checklist state
  const [checklist, setChecklist] = useState({
    frenos: false,
    neumaticos: false,
    documentacion: false,
    luces: false,
    combustible: false,
    epi: false,
  });

  // Simulated live telemetry state
  const [telemetry, setTelemetry] = useState({
    lat: -12.0463,
    lng: -77.0427,
    speed: 0,
    heading: 'NE',
    sharingGps: true,
  });

  // Incident reporting modal/panel state
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState('FALLA MECÁNICA');
  const [descripcionIncidente, setDescripcionIncidente] = useState('');
  const [reportingLoading, setReportingLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Telemetry real time simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTrip && activeTrip.estado === 'EN RUTA' && telemetry.sharingGps) {
      interval = setInterval(() => {
        setTelemetry((prev) => {
          const deltaLat = (Math.random() - 0.4) * 0.0005;
          const deltaLng = (Math.random() - 0.6) * 0.0005;
          const newSpeed = Math.floor(60 + Math.random() * 25);
          return {
            ...prev,
            lat: parseFloat((prev.lat + deltaLat).toFixed(6)),
            lng: parseFloat((prev.lng + deltaLng).toFixed(6)),
            speed: newSpeed,
            heading: Math.random() > 0.5 ? 'N' : prev.heading,
          };
        });
      }, 3000);
    } else {
      setTelemetry((prev) => ({ ...prev, speed: 0 }));
    }
    return () => clearInterval(interval);
  }, [activeTrip, telemetry.sharingGps]);

  // Compute checklist completion percentage
  const totalChecked = Object.values(checklist).filter(Boolean).length;
  const checklistProgress = Math.round((totalChecked / 6) * 100);

  // Handle reporting incident from the driver profile
  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip) return;
    if (!descripcionIncidente.trim()) return;

    setReportingLoading(true);
    const success = await onReportIncident({
      monitoreo_id: activeTrip.id,
      tipo_incidencia: selectedTipo,
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().split(' ')[0].substring(0, 5),
      descripcion: descripcionIncidente.trim(),
    });

    setReportingLoading(false);
    if (success) {
      setReportSuccess(true);
      setDescripcionIncidente('');
      setTimeout(() => {
        setShowIncidentForm(false);
        setReportSuccess(false);
        syncWithBackendData();
      }, 2000);
    }
  };

  // Helper trigger for quick presets
  const applyPresetReport = (desc: string, tipo: string) => {
    setDescripcionIncidente(desc);
    setSelectedTipo(tipo);
  };

  return (
    <div className="min-h-screen bg-surface-dim text-on-surface flex flex-col md:flex-row">
      
      {/* Dynamic graphic glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/5 rounded-full filter blur-3xl pointer-events-none"></div>

      {/* 1. Sidebar Panel on Mobile / Screen Left */}
      <aside className="w-full md:w-80 bg-surface border-b md:border-b-0 md:border-r border-outline-variant p-6 flex flex-col justify-between z-10 shrink-0">
        <div>
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 border border-secondary/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">local_shipping</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-on-surface">Petro Mapi SAC</h1>
              <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest font-mono">
                Portal de Conductor
              </span>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant/60 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-secondary overflow-hidden bg-surface-container-high shrink-0">
                <img 
                  alt="Avatar Conductor" 
                  referrerPolicy="no-referrer"
                  src="https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=150&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <h3 className="text-sm font-black text-on-surface truncate">{currentUser.nombre_completo}</h3>
                <p className="text-[10px] text-on-surface-variant font-mono truncate">{currentUser.correo}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                  <span className="text-[9px] font-bold text-green-400 capitalize">En Turno Operativo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-surface-container-low border border-outline-variant/50 p-3 rounded-lg text-center">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant/75 block">Mis Rutas</span>
              <span className="text-xl font-black text-secondary">{myTrips.length}</span>
            </div>
            <div className="bg-surface-container-low border border-outline-variant/50 p-3 rounded-lg text-center">
              <span className="text-[10px] font-mono uppercase text-on-surface-variant/75 block">Incidencias</span>
              <span className="text-xl font-black text-error">
                {incidencias.filter((inc) => inc.monitoreo_id === activeTrip?.id).length}
              </span>
            </div>
          </div>

          {/* Emergency contacts menu */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest px-1">
              Servicios de Emergencia
            </h4>
            <a 
              href="tel:116" 
              className="flex items-center justify-between p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">emergency_home</span>
                <span>Bomberos (116)</span>
              </span>
              <span className="material-symbols-outlined text-xs">call</span>
            </a>
            <a 
              href="tel:105" 
              className="flex items-center justify-between p-2.5 bg-secondary-container/10 border border-secondary-container/20 rounded-lg text-xs font-bold text-secondary-fixed hover:bg-secondary-container/20 transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">local_police</span>
                <span>Policía Nacional (105)</span>
              </span>
              <span className="material-symbols-outlined text-xs">call</span>
            </a>
          </div>
        </div>

        {/* Bottom profile actions */}
        <div className="mt-8 pt-4 border-t border-outline-variant/60 space-y-2">
          <button 
            onClick={async () => {
              await syncWithBackendData();
            }}
            className="w-full py-2 bg-surface-container-high hover:bg-surface-container-highest text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-outline-variant"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            <span>Sincronizar Datos</span>
          </button>
          
          <button 
            onClick={onLogout}
            className="w-full py-2 bg-error/10 hover:bg-error/15 text-error text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors border border-error/20"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Work Panel */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Top welcome layout banner details */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] text-secondary font-black tracking-widest uppercase font-mono mb-1 block">PETRO MAPI SAC</span>
            <h2 className="text-xl md:text-2xl font-black text-on-surface leading-tight">
              ¡Hola, {currentUser.nombre_completo.split(' ')[0]}!
            </h2>
            <p className="text-xs text-on-surface-variant mt-1 max-w-lg">
              Tienes control exclusivo sobre la ruta asignada a tu unidad de transporte pesado. Registra incidencias o valida tus entregas en un clic.
            </p>
          </div>
          <div className="bg-surface-container-high border border-outline-variant rounded-xl p-3 flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-on-surface-variant block uppercase font-bold">Hora en Ruta</span>
              <span className="text-sm font-black font-mono text-secondary">
                {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className="material-symbols-outlined text-secondary text-2xl animate-pulse">schedule</span>
          </div>
        </div>

        {/* Grid layout of current duties */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Active Trip Operations Card Column (Lg: 7) */}
          <div className="lg:col-span-8 space-y-6">
            
            {activeTrip ? (
              <div className="bg-surface p-6 rounded-2xl border border-outline-variant shadow-xl relative overflow-hidden">
                
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${activeTrip.estado === 'COMPLETADO' ? 'bg-green-500' : activeTrip.estado === 'INCIDENCIA' ? 'bg-error' : 'bg-secondary animate-pulse'}`}></div>

                {/* Card Title Header */}
                <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-mono font-bold block">MONITOREO DE RUTA ACTIVA</span>
                    <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                      <span className="text-secondary">{activeTrip.id}</span>
                      <span className="text-on-surface-variant/40">|</span>
                      <span>Placa: {activeTrip.placa}</span>
                    </h3>
                  </div>
                  
                  {/* Status Indicator Badge */}
                  <span className={`px-3 py-1 text-xs font-black rounded-full font-mono flex items-center gap-1.5 ${
                    activeTrip.estado === 'COMPLETADO' 
                      ? 'bg-green-500/15 text-green-400 border border-green-500/20' 
                      : activeTrip.estado === 'INCIDENCIA'
                        ? 'bg-error/15 text-error border border-error/20'
                        : 'bg-secondary/15 text-secondary border border-secondary/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeTrip.estado === 'COMPLETADO' ? 'bg-green-400' : activeTrip.estado === 'INCIDENCIA' ? 'bg-error' : 'bg-secondary'}`}></span>
                    {activeTrip.estado}
                  </span>
                </div>

                {/* Origin To Destination Flow Route Grid */}
                <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  <div>
                    <span className="text-[10px] text-on-surface-variant/60 font-mono font-bold block uppercase">Punto de Partida / Origen</span>
                    <p className="text-xs font-black text-on-surface mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-secondary text-sm">location_on</span>
                      {activeTrip.origen}
                    </p>
                    <span className="text-[10px] text-on-surface-variant/70 font-mono block mt-1">Carga Pesada: {activeTrip.tipo_carga}</span>
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-outline-variant pt-3 sm:pt-0 sm:pl-4">
                    <span className="text-[10px] text-on-surface-variant/60 font-mono font-bold block uppercase">Punto de Destino / Entrega</span>
                    <p className="text-xs font-black text-on-surface mt-0.5 flex items-center gap-1">
                      <span className="material-symbols-outlined text-error text-sm">tour</span>
                      {activeTrip.destino}
                    </p>
                    <span className="text-[10px] text-on-surface-variant/70 font-mono block mt-1">Fecha Programada: {activeTrip.salida_fecha}</span>
                  </div>
                </div>

                {/* Interactive Route Stepper Progression */}
                <div className="mb-8">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Progreso de la Ruta</h4>
                  <div className="flex items-center justify-between relative px-2">
                    
                    {/* Stepper bar background */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-surface-container-highest z-0">
                      <div 
                        className={`h-full transition-all duration-700 ${activeTrip.estado === 'COMPLETADO' ? 'w-full bg-green-500' : activeTrip.estado === 'INCIDENCIA' ? 'w-1/2 bg-error' : 'w-1/2 bg-secondary'}`}
                      ></div>
                    </div>

                    {/* Step 1: Salida */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 text-green-400 border-2 border-green-500 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <span className="text-[10px] font-bold text-on-surface mt-1">Salida Realizada</span>
                    </div>

                    {/* Step 2: En ruta */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
                        activeTrip.estado === 'INCIDENCIA'
                          ? 'bg-error/20 text-error border-error'
                          : activeTrip.estado === 'EN RUTA'
                            ? 'bg-secondary/25 text-secondary border-secondary animate-pulse'
                            : 'bg-green-500/20 text-green-400 border-green-500'
                      }`}>
                        {activeTrip.estado === 'INCIDENCIA' ? '⚠️' : '2'}
                      </div>
                      <span className={`text-[10px] font-bold mt-1 ${activeTrip.estado === 'INCIDENCIA' ? 'text-error' : 'text-on-surface'}`}>
                        {activeTrip.estado === 'INCIDENCIA' ? 'Incidencia' : 'Tránsito del Viaje'}
                      </span>
                    </div>

                    {/* Step 3: Llegada */}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 ${
                        activeTrip.estado === 'COMPLETADO' 
                          ? 'bg-green-500/20 text-green-400 border-green-500 shadow-md shadow-green-500/25' 
                          : 'bg-surface-container-high text-on-surface-variant/40 border-outline-variant'
                      }`}>
                        3
                      </div>
                      <span className="text-[10px] font-bold text-on-surface-variant mt-1">Entregado</span>
                    </div>

                  </div>
                </div>

                {/* Operational Quick Controls Buttons */}
                <div className="border-t border-outline-variant pt-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-on-surface-variant max-w-sm">
                      Actualice el estado si ha llegado a destino o reporte problemas de forma inmediata.
                    </span>
                    <div className="flex gap-3">
                      
                      {/* Button: Help / Incident */}
                      <button
                        type="button"
                        onClick={() => setShowIncidentForm(!showIncidentForm)}
                        className="px-4 py-2.5 bg-error/10 hover:bg-error/15 text-error text-xs font-black rounded-xl border border-error/30 flex items-center gap-2 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm">report_problem</span>
                        <span>Reportar Incidencia</span>
                      </button>

                      {/* Button: Complete shipment */}
                      {activeTrip.estado !== 'COMPLETADO' && (
                        <button
                          type="button"
                          onClick={() => onUpdateEstado(activeTrip.id, 'COMPLETADO')}
                          className="px-6 py-2.5 bg-green-500 hover:brightness-110 text-on-secondary text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/10"
                        >
                          <span className="material-symbols-outlined text-sm">done_all</span>
                          <span>Declarar Completado</span>
                        </button>
                      )}

                      {/* Button: Re-route / Resume */}
                      {activeTrip.estado === 'INCIDENCIA' && (
                        <button
                          type="button"
                          onClick={() => onUpdateEstado(activeTrip.id, 'EN RUTA')}
                          className="px-4 py-2.5 bg-secondary hover:brightness-110 text-on-secondary text-xs font-black rounded-xl flex items-center gap-2 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">play_arrow</span>
                          <span>Reanudar Ruta</span>
                        </button>
                      )}

                    </div>
                  </div>

                  {/* Dynamic Incident reporting Form Collapse */}
                  {showIncidentForm && (
                    <div className="bg-surface-container-low border-2 border-red-500/20 rounded-xl p-5 animate-slideDown">
                      <h4 className="text-xs font-black text-error flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-sm">campaign</span>
                        <span>REPORTE EXTRAORDINARIO DE CORRIENTES DE ALERTA</span>
                      </h4>

                      {/* Presets template */}
                      <div className="mb-4">
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1.5">
                          Atajos Rápidos de Incidentes Comunes:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => applyPresetReport('Desperfecto mecánico en el embrague y neumáticos del remolque, se requiere grúa pesada.', 'FALLA MECÁNICA')}
                            className="text-[10px] px-2.5 py-1.5 bg-surface-container-high border border-outline-variant hover:border-error/40 text-on-surface rounded-lg transition-colors cursor-pointer"
                          >
                            ⚙️ Grúa pesada / Embrague
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPresetReport('Vía bloqueada por deslizamiento de piedras en la carretera. Se tomará desvío alternativo de 2 horas.', 'BLOQUEO DE VÍA')}
                            className="text-[10px] px-2.5 py-1.5 bg-surface-container-high border border-outline-variant hover:border-error/40 text-on-surface rounded-lg transition-colors cursor-pointer"
                          >
                            🪨 Desprendimiento / Desvío
                          </button>
                          <button
                            type="button"
                            onClick={() => applyPresetReport('Presión vehicular muy densa debido a protestas en peaje central que limita el avance de la cisterna.', 'CONGESTIÓN VEHICULAR')}
                            className="text-[10px] px-2.5 py-1.5 bg-surface-container-high border border-outline-variant hover:border-error/40 text-on-surface rounded-lg transition-colors cursor-pointer"
                          >
                            🚨 Congestión / Protestas
                          </button>
                        </div>
                      </div>

                      {/* Log details form validation */}
                      <form onSubmit={handleIncidentSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] text-on-surface-variant font-bold uppercase mb-1">Tipo de Incidencia</label>
                            <select
                              value={selectedTipo}
                              onChange={(e) => setSelectedTipo(e.target.value)}
                              className="w-full bg-surface-container-high border border-outline-variant text-sm text-on-surface rounded-lg p-2 focus:outline-none focus:border-error"
                            >
                              <option value="FALLA MECÁNICA">FALLA MECÁNICA</option>
                              <option value="BLOQUEO DE VÍA">BLOQUEO DE VÍA</option>
                              <option value="CONGESTIÓN VEHICULAR">CONGESTIÓN VEHICULAR</option>
                              <option value="CONDICIONES CLIMÁTICAS">CONDICIONES CLIMÁTICAS</option>
                              <option value="ACCIDENTE EN RUTA">ACCIDENTE EN RUTA</option>
                              <option value="OTROS">OTROS</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] text-on-surface-variant font-bold uppercase mb-1">Cisterna ID Coordinado</label>
                            <input
                              type="text"
                              disabled
                              value={`${activeTrip.id} - ${activeTrip.placa}`}
                              className="w-full bg-surface-container-high/40 border border-outline-variant text-sm text-on-surface/50 rounded-lg p-2"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-on-surface-variant font-bold uppercase mb-1">Descripción del Suceso u Obstáculo</label>
                          <textarea
                            required
                            rows={3}
                            value={descripcionIncidente}
                            onChange={(e) => setDescripcionIncidente(e.target.value)}
                            placeholder="Describa el estado actual para que el Centro de Monitoreo autorice auxilio o ruta alterna..."
                            className="w-full bg-surface-container-high border border-outline-variant text-sm text-on-surface rounded-lg p-2 placeholder:text-on-surface-variant/40 focus:outline-none focus:border-error focus:ring-1 focus:ring-error"
                          />
                        </div>

                        {reportSuccess && (
                          <div className="p-3 bg-green-500/15 text-green-400 text-xs font-bold rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            <span>Incidencia ingresada con éxito. El Centro de Mando ha recibido la alerta.</span>
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowIncidentForm(false)}
                            className="px-3 py-1.5 text-xs font-bold hover:bg-surface-container text-on-surface-variant rounded-lg"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={reportingLoading}
                            className="px-4 py-1.5 bg-error text-on-secondary text-xs font-black rounded-lg flex items-center gap-1.5 hover:brightness-110"
                          >
                            {reportingLoading ? 'Reportando...' : 'Declarar Incidencia'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                </div>

              </div>
            ) : (
              <div className="bg-surface-container border border-outline-variant rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-5xl text-secondary-container/40 mb-3 block">calendar_today</span>
                <h3 className="text-base font-black text-on-surface">No tienes rutas activas actualmente</h3>
                <p className="text-xs text-on-surface-variant mt-2 max-w-sm mx-auto">
                  Tu usuario {currentUser.nombre_completo} no registra viajes despachados pendientes en este momento. Por favor contacta al despachador logístico para su programación.
                </p>
              </div>
            )}

            {/* Simulated Live GPS Track & Telemetry Panel */}
            {activeTrip && (
              <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-sm">sensors</span>
                      <span>GPS Telemetry & Posicionamiento Satelital en Vivo</span>
                    </h3>
                    <p className="text-[10px] text-on-surface-variant">Coordenadas y velocidad obtenidas del sensor móvil inercial.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-on-surface-variant font-mono font-bold">TRANSMITIR GPS:</span>
                    <button
                      type="button"
                      onClick={() => setTelemetry(prev => ({ ...prev, sharingGps: !prev.sharingGps }))}
                      className={`relative w-10 h-6 rounded-full transition-colors flex items-center p-0.5 ${telemetry.sharingGps ? 'bg-secondary' : 'bg-surface-container-highest'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform shadow ${telemetry.sharingGps ? 'translate-x-4' : ''}`}></div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-surface-container-low border border-outline-variant p-4 rounded-xl font-mono">
                  <div className="p-2 border-r border-outline-variant/60">
                    <span className="text-[9px] text-on-surface-variant block select-none">LATITUD</span>
                    <span className="text-sm font-black text-secondary">{telemetry.sharingGps ? telemetry.lat.toFixed(6) : 'SIN GPS'}</span>
                  </div>
                  <div className="p-2 border-r border-outline-variant/60">
                    <span className="text-[9px] text-on-surface-variant block select-none">LONGITUD</span>
                    <span className="text-sm font-black text-secondary">{telemetry.sharingGps ? telemetry.lng.toFixed(6) : 'SIN GPS'}</span>
                  </div>
                  <div className="p-2 border-r border-outline-variant/60">
                    <span className="text-[9px] text-on-surface-variant block select-none">VELOCIDAD</span>
                    <span className="text-sm font-black text-green-400">
                      {telemetry.sharingGps ? `${telemetry.speed} KM/H` : '0 KM/H'}
                    </span>
                  </div>
                  <div className="p-2">
                    <span className="text-[9px] text-on-surface-variant block select-none">ESTADO GPS</span>
                    <span className={`text-xs font-black inline-flex items-center gap-1 ${telemetry.sharingGps ? 'text-green-400' : 'text-error'}`}>
                      <span className={`w-2 h-2 rounded-full ${telemetry.sharingGps ? 'bg-green-400 animate-pulse' : 'bg-error'}`}></span>
                      {telemetry.sharingGps ? 'TRASMITIENDO' : 'PAUSADO'}
                    </span>
                  </div>
                </div>

                {/* Styled Map Representation */}
                <div className="mt-4 h-48 bg-surface-container-highest border border-outline-variant rounded-xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-opacity-70 flex flex-col items-center justify-center text-center p-4">
                    {/* Simulated visual grid map */}
                    <div className="absolute inset-0 opacity-[0.07] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    
                    {/* Pulsing route line */}
                    <svg className="absolute w-full h-full stroke-secondary/30 stroke-[3] fill-none" viewBox="0 0 500 200">
                      <path d="M 50 150 Q 250 20 450 120" strokeDasharray="6 4" />
                      {telemetry.sharingGps && (
                        <circle cx="270" cy="80" r="10" className="fill-secondary/20 animate-ping" />
                      )}
                      {telemetry.sharingGps && (
                        <circle cx="270" cy="80" r="4" className="fill-secondary" />
                      )}
                    </svg>

                    <span className="material-symbols-outlined text-4xl text-secondary animate-bounce relative z-10">navigation</span>
                    <div className="relative z-10 mt-1">
                      <p className="text-xs font-bold text-on-surface">Cisterna en movimiento por Carretera Nacional (Ruta PE-1N)</p>
                      <p className="text-[10px] text-on-surface-variant italic mt-0.5">Rumbo asignado: Lima - Chimbote, Norte del Perú</p>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-surface/80 text-[9px] px-2 py-0.5 rounded font-mono border border-outline-variant text-on-surface-variant">
                    DATOS DE COBERTURA: EXCELENTE VÍA SATÉLITE
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Checklist & Vehicle Specifications Column (Lg: 5) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Beautiful Pre-Trip Security Checklist */}
            <div className="bg-surface-container border border-outline-variant rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-black text-on-surface tracking-tight uppercase">Checklist de Seguridad Obligatorio</h3>
                  <p className="text-[10px] text-on-surface-variant">Valide cada elemento antes de iniciar e ingresar a ruta.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-secondary">{checklistProgress}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mb-6">
                <div 
                  className="bg-secondary h-full transition-all duration-300" 
                  style={{ width: `${checklistProgress}%` }}
                ></div>
              </div>

              <div className="space-y-3">
                {/* Check item 1 */}
                <label className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-outline-variant/65 cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={checklist.frenos}
                      onChange={(e) => setChecklist(prev => ({ ...prev, frenos: e.target.checked }))}
                      className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Frenos y Dirección Optimo</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/40">settings_backup_restore</span>
                </label>

                {/* Check item 2 */}
                <label className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-outline-variant/65 cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={checklist.neumaticos}
                      onChange={(e) => setChecklist(prev => ({ ...prev, neumaticos: e.target.checked }))}
                      className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Presión e Integridad Neumáticos</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/40">tire_repair</span>
                </label>

                {/* Check item 3 */}
                <label className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-outline-variant/65 cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={checklist.combustible}
                      onChange={(e) => setChecklist(prev => ({ ...prev, combustible: e.target.checked }))}
                      className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Combustible Suficiente / Completo</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/40">oil_barrel</span>
                </label>

                {/* Check item 4 */}
                <label className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-outline-variant/65 cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={checklist.luces}
                      onChange={(e) => setChecklist(prev => ({ ...prev, luces: e.target.checked }))}
                      className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">Faros y Luces Intermitentes</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/40">highlight</span>
                </label>

                {/* Check item 5 */}
                <label className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-outline-variant/65 cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={checklist.documentacion}
                      onChange={(e) => setChecklist(prev => ({ ...prev, documentacion: e.target.checked }))}
                      className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">SOAT y Guías de Remisión</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/40">news</span>
                </label>

                {/* Check item 6 */}
                <label className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-outline-variant/65 cursor-pointer hover:bg-surface-container-high transition-colors select-none">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      checked={checklist.epi}
                      onChange={(e) => setChecklist(prev => ({ ...prev, epi: e.target.checked }))}
                      className="rounded border-outline-variant text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface">EPP Completo (Botas/Casco/Chaleco)</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-on-surface-variant/40">guardian</span>
                </label>
              </div>

              {checklistProgress === 100 && (
                <div className="mt-4 p-3 bg-secondary/15 text-secondary text-xs rounded-xl font-bold flex items-center gap-2 border border-secondary/20 justify-center animate-bounce">
                  <span className="material-symbols-outlined text-sm animate-spin-slow">verified_user</span>
                  <span>¡Vehículo listo para ruta segura!</span>
                </div>
              )}
            </div>

            {/* Vessel / Vehicle Specification Detail */}
            {currentVehicle && (
              <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <h3 className="text-sm font-black text-on-surface tracking-tight uppercase mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-base">local_shipping</span>
                  <span>Especificaciones de la Unidad</span>
                </h3>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60">
                    <span className="text-on-surface-variant">Marca y Modelo:</span>
                    <span className="font-extrabold text-on-surface select-all">{currentVehicle.marca} {currentVehicle.modelo}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60">
                    <span className="text-on-surface-variant">Año de Fabricación:</span>
                    <span className="font-mono text-on-surface">{currentVehicle.anio}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60">
                    <span className="text-on-surface-variant">Capacidad de Carga:</span>
                    <span className="font-extrabold text-secondary">{currentVehicle.capacidad} Galones</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/60">
                    <span className="text-on-surface-variant">Estado Mantenimiento:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentVehicle.estado_mantenimiento === 'ÓPTIMO' 
                        ? 'text-green-400 bg-green-500/10' 
                        : currentVehicle.estado_mantenimiento === 'PRÓXIMO 15D' 
                          ? 'text-yellow-400 bg-yellow-500/10' 
                          : 'text-error bg-error/10'
                    }`}>
                      {currentVehicle.estado_mantenimiento}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-on-surface-variant mr-2">F. Mantenimiento Preventivo:</span>
                    <span className="font-mono text-on-surface text-right">{currentVehicle.fecha_mantenimiento || 'Sin programar'}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-surface-container-low border border-outline-variant/70 rounded-xl flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-sm">shield</span>
                  <p className="text-[10px] leading-relaxed text-on-surface-variant">
                    Unidad habilitada con seguro contra todo riesgo (SOAT Nº 4410229) y certificación Osinergmin actual.
                  </p>
                </div>
              </div>
            )}

            {/* Incidents logged by driver current trip log */}
            <div className="bg-surface border border-outline-variant rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-tight mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-base">emergency_share</span>
                <span>Bitácora de Incidentes Reportados</span>
              </h3>

              {activeTrip ? (
                <div className="space-y-3">
                  {incidencias.filter((inc) => inc.monitoreo_id === activeTrip.id).length === 0 ? (
                    <p className="text-xs text-on-surface-variant/70 italic text-center p-4">
                      No has reportado incidencias en este viaje. ¡Buen viaje!
                    </p>
                  ) : (
                    incidencias
                      .filter((inc) => inc.monitoreo_id === activeTrip.id)
                      .map((inc, i) => (
                        <div key={i} className="p-3 bg-error-container/10 border-l-4 border-error rounded-r-lg space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase text-error tracking-wider">{inc.tipo_incidencia}</span>
                            <span className="text-[9px] font-mono text-on-surface-variant">{inc.fecha} {inc.hora}</span>
                          </div>
                          <p className="text-xs text-on-surface leading-snug">{inc.descripcion}</p>
                        </div>
                      ))
                  )}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant italic text-center py-4">Sin ruta asignada</p>
              )}
            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
