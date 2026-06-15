import React, { useState } from 'react';
import { Monitoreo, Vehiculo, Usuario } from '../types';

interface MonitoringViewProps {
  monitoreos: Monitoreo[];
  vehiculos: Vehiculo[];
  usuarios: Usuario[];
  onAddMonitoreo: (monitoreoData: any) => Promise<boolean>;
  onUpdateEstado: (id: string, estado: 'EN RUTA' | 'INCIDENCIA' | 'COMPLETADO') => Promise<void>;
  dbStatusLabel: string;
}

export default function MonitoringView({ 
  monitoreos, 
  vehiculos, 
  usuarios, 
  onAddMonitoreo, 
  onUpdateEstado,
  dbStatusLabel
}: MonitoringViewProps) {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlaca, setSelectedPlaca] = useState('');
  const [tipoCarga, setTipoCarga] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('');
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [salidaFecha, setSalidaFecha] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Emergency protocol helper popup alert
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Filter list by search query
  const filteredMonitoreos = monitoreos.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.id.toLowerCase().includes(term) ||
      item.placa.toLowerCase().includes(term) ||
      item.conductor.toLowerCase().includes(term) ||
      item.origen.toLowerCase().includes(term) ||
      item.destino.toLowerCase().includes(term) ||
      item.tipo_carga.toLowerCase().includes(term)
    );
  });

  // Filter Conductor de Ruta users
  const conductoresList = usuarios.filter(u => u.rol === 'Conductor de Ruta');

  const handleOpenModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    // Prefill some defaults for speed
    setOrigen('Lima');
    setDestino('Arequipa');
    setTipoCarga('Combustible Diésel B5');
    if (vehiculos.length > 0) setSelectedPlaca(vehiculos[0].placa);
    if (conductoresList.length > 0) setSelectedConductor(conductoresList[0].nombre_completo);
    
    // Default current datetime
    const offset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - offset)).toISOString().slice(0, 16);
    setSalidaFecha(localISOTime);

    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaca || !tipoCarga || !selectedConductor || !origen || !destino || !salidaFecha) {
      setErrorMsg('Por favor complete todos los datos obligatorios.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const formattedDate = salidaFecha.replace('T', ' ');

    const success = await onAddMonitoreo({
      placa: selectedPlaca,
      tipo_carga: tipoCarga,
      conductor: selectedConductor,
      origen,
      destino,
      salida_fecha: formattedDate
    });

    setSubmitting(false);

    if (success) {
      setSuccessMsg('¡Monitoreo de carga creado con éxito!');
      setTimeout(() => {
        setIsModalOpen(false);
        // Clean
        setSelectedPlaca('');
        setTipoCarga('');
        setSelectedConductor('');
        setOrigen('');
        setDestino('');
        setSalidaFecha('');
      }, 1500);
    } else {
      setErrorMsg('Error al registrar el monitoreo. Verifique la conexión.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-black text-on-surface tracking-tight">Monitoreo en Vivo</h2>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="flex items-center gap-2 text-on-surface-variant bg-surface-container px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {monitoreos.filter(m => m.estado === 'EN RUTA').length} Unidades en Ruta
            </span>
            <span className="flex items-center gap-2 text-on-surface-variant bg-surface-container px-3 py-1 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              {monitoreos.filter(m => m.estado === 'INCIDENCIA').length} Incidencias Reportadas
            </span>
          </div>
        </div>

        <button 
          onClick={handleOpenModal}
          className="bg-secondary text-on-secondary font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-secondary/15 select-none"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>Nuevo Monitoreo</span>
        </button>
      </div>

      {/* Database Warning bar */}
      {dbStatusLabel && (
        <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium text-secondary">
            <span className="material-symbols-outlined text-sm">storage</span>
            <span>{dbStatusLabel}</span>
          </div>
          <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-widest font-bold font-mono">Status Terminal</span>
        </div>
      )}

      {/* Live search input bar (micro interactive) */}
      <div className="relative group max-w-md">
        <span className="material-symbols-outlined absolute left-3,5 absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-secondary transition-colors text-lg">search</span>
        <input 
          type="text"
          placeholder="Buscar por código, placa, ruta o conductor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-surface-container-low border border-outline-variant focus:ring-1 focus:ring-secondary focus:border-secondary rounded-full pl-10 pr-4 py-2 text-xs text-on-surface placeholder:text-on-surface-variant/60 transition-all font-sans"
        />
      </div>

      {/* Main Monitoring Table Container */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider px-2">Unidades Bajo Seguimiento</h3>
          <div className="text-[10px] text-on-surface-variant font-bold font-mono uppercase tracking-widest bg-surface/50 px-2 py-1 rounded">
            TOTAL: {filteredMonitoreos.length}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredMonitoreos.length === 0 ? (
            <div className="text-center p-12 text-on-surface-variant font-medium text-sm">
              {searchTerm ? 'Ningún monitoreo coincide con la búsqueda.' : 'No hay unidades activas registradas.'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container uppercase text-[10px] text-on-surface-variant font-bold border-b border-outline-variant">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Vehículo</th>
                  <th className="px-6 py-4">Conductor</th>
                  <th className="px-6 py-4">Ruta (Origen-Destino)</th>
                  <th className="px-6 py-4">F. Salida</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones de Ruta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface">
                {filteredMonitoreos.map((item) => {
                  const initial = item.conductor ? item.conductor.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : 'CO';
                  return (
                    <tr key={item.id} className="group hover:bg-surface-container-highest/20 transition-colors">
                      <td className="px-6 py-4 font-mono text-secondary-fixed-dim font-bold">{item.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface">{item.placa}</span>
                          <span className="text-[10px] text-on-surface-variant mt-0.5">{item.tipo_carga}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-container text-primary border border-primary/20 flex items-center justify-center font-bold text-[10px]">
                            {initial}
                          </div>
                          <span className="font-semibold text-on-surface">{item.conductor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>{item.origen}</span>
                          <span className="material-symbols-outlined text-sm text-outline select-none">trending_flat</span>
                          <span>{item.destino}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-on-surface-variant text-[11px]">
                        {item.salida_fecha}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          item.estado === 'EN RUTA' 
                            ? 'bg-green-500/10 border-green-500 text-green-400' 
                            : item.estado === 'INCIDENCIA'
                            ? 'bg-red-500/10 border-error text-error'
                            : 'bg-blue-500/10 border-primary text-primary'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {item.estado === 'EN RUTA' && (
                            <button 
                              onClick={() => {
                                if(confirm(`¿Desea cambiar el estado de ${item.id} a COMPLETADO?`)){
                                  onUpdateEstado(item.id, 'COMPLETADO');
                                }
                              }}
                              className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 rounded font-semibold text-[10px] transition-all cursor-pointer"
                              title="Marcar como Completado"
                            >
                              Completar
                            </button>
                          )}
                          
                          {item.estado !== 'INCIDENCIA' && item.estado !== 'COMPLETADO' && (
                            <button 
                              onClick={() => {
                                if(confirm(`¿Desea registrar una INCIDENCIA para la unidad ${item.id}?`)){
                                  onUpdateEstado(item.id, 'INCIDENCIA');
                                }
                              }}
                              className="px-2 py-1 bg-red-500/10 border border-error/30 text-error hover:bg-red-500/20 rounded font-semibold text-[10px] transition-all cursor-pointer"
                              title="Registrar Incidencia"
                            >
                              Incidente
                            </button>
                          )}

                          {item.estado === 'COMPLETADO' && (
                            <span className="text-on-surface-variant font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-green-500">check_circle</span>
                              Finalizado
                            </span>
                          )}

                          {item.estado === 'INCIDENCIA' && (
                            <span className="text-error font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              Alerta Activa
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Secondary Data Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
        <div className="md:col-span-4 bg-surface-container-low border border-outline-variant rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity select-none md:block hidden">
            <span className="material-symbols-outlined text-6xl text-on-surface">local_gas_station</span>
          </div>
          <p className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase mb-2">CONSUMO DE COMBUSTIBLE DIARIO</p>
          <h4 className="text-3xl font-black text-secondary mb-3">1,452 Gal</h4>
          <p className="text-xs text-on-surface-variant">Promedio global hoy: <span className="text-green-500 font-semibold">8.2 km/gal</span></p>
        </div>

        <div className="md:col-span-8 bg-surface-container-low border border-outline-variant rounded-xl p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <p className="text-on-surface-variant text-[10px] font-bold tracking-widest uppercase">ALERTA CRÍTICA RECIENTE</p>
            <h4 className="font-bold text-sm text-error">Pérdida de señal GPS - Unidad B4X-112</h4>
            <p className="text-xs text-on-surface-variant">Ubicación registrada: Km 450 Panamericana Sur. Hace 12 minutos.</p>
          </div>
          <button 
            onClick={() => setShowEmergencyModal(true)}
            className="bg-error-container text-on-error-container px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all select-none cursor-pointer border border-error/20"
          >
            <span className="material-symbols-outlined text-sm">emergency</span>
            <span>Protocolo de Emergencia</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          MODAL: REGISTRAR NUEVO MONITOREO
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border border-outline-variant w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col my-8 animate-fadeIn max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">add_location_alt</span>
                Registrar Nuevo Monitoreo de Ruta
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-on-surface-variant hover:text-error transition-colors p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleCreate} className="p-6 overflow-y-auto space-y-5 flex-1 select-none">
              
              {errorMsg && (
                <div className="p-3 bg-error-container/20 border-l-4 border-error text-error text-xs rounded-r">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-500/10 border-l-4 border-green-500 text-green-400 text-xs rounded-r">
                  {successMsg}
                </div>
              )}

              {/* SECTION: VEHICLE info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-secondary md:block uppercase">INFORMACIÓN DEL VEHÍCULO DE FLOTA</span>
                  <div className="h-px bg-outline-variant flex-1"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface">Unidad Cisterna (Placa)</label>
                    <select 
                      value={selectedPlaca}
                      onChange={(e) => setSelectedPlaca(e.target.value)}
                      className="bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface p-2 focus:ring-1 focus:ring-secondary focus:border-secondary"
                    >
                      <option value="">Seleccione vehículo disponible...</option>
                      {vehiculos.map(v => (
                        <option key={v.placa} value={v.placa}>
                          {v.placa} - {v.marca} {v.modelo} ({v.capacidad} TN)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface">Tipo de Carga</label>
                    <input 
                      type="text"
                      placeholder="Ej: Combustible Diésel B5"
                      value={tipoCarga}
                      onChange={(e) => setTipoCarga(e.target.value)}
                      className="bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface p-2 focus:ring-1 focus:ring-secondary focus:border-secondary font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: DRIVER assignment */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-secondary md:block uppercase">ASIGNACIÓN DEL CONDUCTOR</span>
                  <div className="h-px bg-outline-variant flex-1"></div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Nombre del Conductor Registrado</label>
                  <select 
                    value={selectedConductor}
                    onChange={(e) => setSelectedConductor(e.target.value)}
                    className="bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface p-2 focus:ring-1 focus:ring-secondary focus:border-secondary"
                  >
                    <option value="">Seleccione conductor disponible...</option>
                    {conductoresList.map(c => (
                      <option key={c.id} value={c.nombre_completo}>
                        {c.nombre_completo} - {c.documento} (Telf: {c.telefono})
                      </option>
                    ))}
                  </select>
                  {conductoresList.length === 0 && (
                    <p className="text-[10px] text-error">
                      ⚠️ No se encontraron conductores autorizados. Registre personal con rol "Conductor de Ruta" primero.
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION: ROUTE details */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-widest text-secondary md:block uppercase">DETALLES DE RUTA</span>
                  <div className="h-px bg-outline-variant flex-1"></div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface">Origen</label>
                    <input 
                      type="text"
                      placeholder="Ciudad de origen (Ej: Lima)"
                      value={origen}
                      onChange={(e) => setOrigen(e.target.value)}
                      className="bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface p-2 focus:ring-1 focus:ring-secondary focus:border-secondary"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-on-surface">Destino</label>
                    <input 
                      type="text"
                      placeholder="Ciudad de destino (Ej: Arequipa)"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface p-2 focus:ring-1 focus:ring-secondary focus:border-secondary"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Fecha y Hora Planeada de Salida</label>
                  <input 
                    type="datetime-local"
                    value={salidaFecha}
                    onChange={(e) => setSalidaFecha(e.target.value)}
                    className="bg-surface-container border border-outline-variant rounded-lg text-xs text-on-surface p-2 focus:ring-1 focus:ring-secondary focus:border-secondary font-mono"
                  />
                </div>
              </div>

            </form>

            {/* Modal Actions Footer */}
            <div className="p-5 border-t border-outline-variant bg-surface-container-high/40 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface bg-surface-container rounded-lg font-bold text-xs hover:bg-surface-container-high transition-colors cursor-pointer select-none"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={handleCreate}
                disabled={submitting}
                className="px-5 py-2 bg-secondary text-on-secondary rounded-lg font-bold text-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer select-none shadow-md shadow-secondary/10"
              >
                {submitting ? 'Guardando...' : 'Iniciar Monitoreo'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EMERGENCY PROTOCOL MODAL */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-error max-w-md w-full rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-error-container/30 border-b border-error/20 p-4 text-error font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">emergency</span>
              <span>Protocolo de Emergencia Activado</span>
            </div>
            <div className="p-5 space-y-3">
              <h5 className="text-sm font-bold text-on-surface">Instrucciones de Respuesta Rápida:</h5>
              <ol className="list-decimal pl-5 space-y-2 text-xs text-on-surface-variant">
                <li>Intentar restablecer contacto vía canal radial de frecuencia de emergencia #4.</li>
                <li>Llamar directamente al teléfono del conductor Juan Perez Soto: <span className="text-secondary font-bold font-mono">922333444</span>.</li>
                <li>Notificar a la central policial de carreteras sector Km 450 Panamericana Sur.</li>
                <li>Enviar patrulla de asistencia logística regional desde la base de operaciones Ica.</li>
              </ol>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-container flex justify-end">
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-1.5 bg-error text-white font-bold text-xs rounded hover:brightness-110"
              >
                Cerrar Notificación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
