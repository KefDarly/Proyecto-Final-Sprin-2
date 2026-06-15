import React from 'react';
import { Monitoreo, Incidencia } from '../types';

interface DashboardViewProps {
  monitoreos: Monitoreo[];
  incidencias: Incidencia[];
  onNavigate: (tab: 'dashboard' | 'monitoreo' | 'flota' | 'rutas' | 'incidencias' | 'roles') => void;
}

export default function DashboardView({ monitoreos, incidencias, onNavigate }: DashboardViewProps) {
  // Compute metrics dynamically from the active DB state
  const vehiculosEnRutaCount = monitoreos.filter(m => m.estado === 'EN RUTA').length;
  const activeIncidenciasCount = incidencias.length;

  // Recent activity subset (up to 5 items)
  const recentTrips = monitoreos.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 1. KPIs Section (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Vehicles in Route KPI Card */}
        <div 
          onClick={() => onNavigate('monitoreo')} 
          className="bg-surface-container-low border border-outline-variant p-6 rounded-xl hover:bg-surface-container-high transition-all group relative overflow-hidden cursor-pointer active:scale-[0.99]"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px] text-primary">local_shipping</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Vehículos en Ruta</span>
            <span className="bg-primary/10 text-primary p-2 rounded-lg material-symbols-outlined text-sm">trending_up</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-secondary">{vehiculosEnRutaCount}</h2>
            <span className="text-on-surface-variant text-xs">/ {monitoreos.length} monitoreos</span>
          </div>
          <div className="mt-4 w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div 
              className="bg-secondary h-full transition-all duration-500" 
              style={{ width: `${monitoreos.length > 0 ? (vehiculosEnRutaCount / monitoreos.length) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Incidents KPI Card */}
        <div 
          onClick={() => onNavigate('incidencias')}
          className="bg-surface-container-low border border-outline-variant p-6 rounded-xl hover:bg-surface-container-high transition-all group relative overflow-hidden cursor-pointer active:scale-[0.99]"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px] text-error">warning</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Incidencias Activas</span>
            <span className="bg-error-container text-error p-2 rounded-lg material-symbols-outlined text-sm">report_problem</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-error">{activeIncidenciasCount}</h2>
            <span className="text-on-surface-variant text-xs">Acciones requeridas</span>
          </div>
          <div className="mt-4 flex gap-1">
            <span className={`h-1 flex-1 rounded-full ${activeIncidenciasCount > 0 ? 'bg-error' : 'bg-surface-container-highest'}`}></span>
            <span className={`h-1 flex-1 rounded-full ${activeIncidenciasCount > 1 ? 'bg-error' : 'bg-surface-container-highest'}`}></span>
            <span className={`h-1 flex-1 rounded-full ${activeIncidenciasCount > 2 ? 'bg-error' : 'bg-surface-container-highest'}`}></span>
            <span className="h-1 flex-1 bg-surface-container-highest rounded-full"></span>
          </div>
        </div>

        {/* Combustible KPI Card */}
        <div className="bg-surface-container-low border border-outline-variant p-6 rounded-xl hover:bg-surface-container-high transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[120px] text-secondary">oil_barrel</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-on-surface-variant text-xs font-bold uppercase tracking-wider">Combustible Mes</span>
            <span className="bg-secondary-container/25 text-secondary p-2 rounded-lg material-symbols-outlined text-sm">payments</span>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-3xl font-black text-on-surface">S/ 45,200</h2>
          </div>
          <p className="mt-4 text-on-surface-variant text-xs flex items-center gap-1">
            <span className="text-error material-symbols-outlined text-xs">arrow_upward</span>
            <span className="font-bold">12.5%</span> vs mes anterior
          </p>
        </div>

      </div>

      {/* 2. Main Activity Chart & Live Location Map Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Travels Chart Layout */}
        <div className="lg:col-span-2 bg-surface-container-low border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-on-surface">Actividad Semanal de Viajes</h3>
                <p className="text-xs text-on-surface-variant">Rendimiento operacional de distribución</p>
              </div>
              <div className="flex bg-surface-container-highest rounded-lg p-1 text-xs gap-1">
                <button className="px-3 py-1 bg-surface-container-high text-secondary rounded shadow-sm font-bold">SEM</button>
                <button className="px-3 py-1 text-on-surface-variant hover:text-on-surface">MES</button>
              </div>
            </div>

            {/* Visual graph column mockup with real-time hover indicators */}
            <div className="h-[220px] w-full flex items-end gap-5 px-4 mt-4 select-none">
              {[
                { label: "LUN", val: "60%", count: 12, highlight: false },
                { label: "MAR", val: "75%", count: 15, highlight: false },
                { label: "MIE", val: "90%", count: 18, highlight: true },
                { label: "JUE", val: "55%", count: 11, highlight: false },
                { label: "VIE", val: "82%", count: 17, highlight: false },
                { label: "SAB", val: "40%", count: 8, highlight: false },
                { label: "DOM", val: "25%", count: 5, highlight: false },
              ].map((day, dIdx) => (
                <div key={dIdx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end relative">
                  <span className="absolute -top-7 scale-0 group-hover:scale-100 bg-surface-container-highest px-2 py-0.5 border border-outline-variant rounded text-[10px] font-bold text-secondary transition-all z-20 whitespace-nowrap">
                    {day.count} envíos
                  </span>
                  <div 
                    className={`w-full rounded-t transition-all duration-300 relative cursor-pointer ${
                      day.highlight 
                        ? 'bg-secondary/40 hover:bg-secondary/60' 
                        : 'bg-primary/20 hover:bg-primary/40'
                    }`} 
                    style={{ height: day.val }}
                  />
                  <span className="text-[10px] font-bold tracking-wider text-on-surface-variant group-hover:text-secondary transition-colors uppercase">
                    {day.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-Time Live Map Overlay Block */}
        <div className="bg-surface-container-low border border-outline-variant p-6 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Estado en Tiempo Real</h3>
            <span className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </span>
          </div>

          <div className="flex-1 relative rounded-lg overflow-hidden border border-outline-variant group min-h-[170px]">
            {/* Elegant telemetry stylized image overlay */}
            <img 
              alt="Mapa de Monitoreo" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[6s]" 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=600&auto=format&fit=crop"
            />
            {/* Visual satellite matrix grid dots effect over image */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-secondary/5 mix-blend-color-dodge"></div>
            
            {/* Location tag details overlay */}
            <div className="absolute bottom-3 left-3 right-3 bg-surface-container/95 backdrop-blur-md p-3 rounded-lg border border-outline-variant shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">F-902 (Scania Fleet)</span>
                <span className="text-[9px] font-bold text-secondary tracking-widest uppercase">EN MOVIMIENTO</span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1 font-mono">Vía Evitamiento - Altura Puente Trujillo</p>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Recent Activity Table */}
      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-md">
        <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant bg-surface-container-high/60">
          <h3 className="text-sm font-bold tracking-wider text-on-surface uppercase">Actividad Reciente Bajo Monitoreo</h3>
          <button 
            onClick={() => onNavigate('monitoreo')} 
            className="text-secondary text-xs font-bold uppercase hover:underline cursor-pointer"
          >
            Ver Monitoreo Detallado
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentTrips.length === 0 ? (
            <div className="text-center p-8 text-on-surface-variant font-medium text-sm">
              No hay viajes ni unidades activas en monitoreo de ruta actualmente.
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container uppercase text-[10px] text-on-surface-variant font-bold border-b border-outline-variant">
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Vehículo Placa</th>
                  <th className="px-6 py-3">Conductor Asignado</th>
                  <th className="px-6 py-3">Ruta de Viaje</th>
                  <th className="px-6 py-3">Estado Operativo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs">
                {recentTrips.map((trip) => {
                  const initial = trip.conductor ? trip.conductor.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() : 'CO';
                  return (
                    <tr key={trip.id} className="hover:bg-surface-container-highest/40 transition-colors group">
                      <td className="px-6 py-3.5 font-mono text-secondary-fixed-dim font-bold">{trip.id}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-on-surface block">{trip.placa}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono">{trip.tipo_carga}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-surface-container-highest border border-outline-variant text-[10px] text-primary flex items-center justify-center font-bold">
                            {initial}
                          </div>
                          <span className="text-on-surface font-medium">{trip.conductor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-on-surface-variant font-medium">
                        {trip.origen} <span className="text-secondary text-xs">→</span> {trip.destino}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          trip.estado === 'EN RUTA' 
                            ? 'bg-green-500/10 border-green-500 text-green-400' 
                            : trip.estado === 'INCIDENCIA'
                            ? 'bg-error/10 border-error text-error'
                            : 'bg-primary/10 border-primary text-primary'
                        }`}>
                          {trip.estado}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
