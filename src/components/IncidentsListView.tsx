import React from 'react';
import { Incidencia } from '../types';

interface IncidentsListViewProps {
  incidencias: Incidencia[];
}

export default function IncidentsListView({ incidencias }: IncidentsListViewProps) {
  return (
    <div className="space-y-6 select-none animate-fadeIn">
      <div>
        <h2 className="text-3xl font-black text-on-surface">Historial de Incidencias</h2>
        <p className="text-on-surface-variant text-sm mt-1">Monitoreo de alertas críticas reportadas por los conductores de ruta o supervisores de control.</p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider px-2">Alertas de Seguridad Logística</h3>
          <span className="text-xs font-mono bg-error-container/30 text-error px-2 py-0.5 border border-error/20 rounded font-bold uppercase">
            Incidencias: {incidencias.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          {incidencias.length === 0 ? (
            <div className="text-center p-12 text-on-surface-variant font-medium text-sm">
              No se han reportado incidencias críticas en ruta hoy.
            </div>
          ) : (
            <table className="w-full text-left font-sans">
              <thead className="bg-surface-container uppercase text-[10px] text-on-surface-variant font-bold border-b border-outline-variant">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Monitoreo ID</th>
                  <th className="px-6 py-4">Categoría de Evento</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Descripción Detallada</th>
                  <th className="px-6 py-4">Estado Alerta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface bg-surface-container-lowest/10">
                {incidencias.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-container-highest/20 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-error">{item.id}</td>
                    <td className="px-6 py-4 font-mono text-secondary-fixed-dim font-bold">{item.monitoreo_id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-error-container/20 text-error px-2.5 py-1 border border-error/20 rounded font-bold text-[10px] uppercase">
                        {item.tipo_incidencia}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-on-surface-variant">
                      {item.fecha} {item.hora}
                    </td>
                    <td className="px-6 py-4 font-medium text-on-surface/90 max-w-sm whitespace-normal break-words leading-relaxed">
                      {item.descripcion}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 border border-error text-error animate-pulse">
                        ● ACTIVA
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
