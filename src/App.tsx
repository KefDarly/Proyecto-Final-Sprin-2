import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import DashboardView from './components/DashboardView';
import MonitoringView from './components/MonitoringView';
import FleetView from './components/FleetView';
import SettingsAndRolesView from './components/SettingsAndRolesView';
import IncidentsListView from './components/IncidentsListView';
import DriverPortal from './components/DriverPortal';
import { Usuario, Vehiculo, Monitoreo, Incidencia } from './types';
import { API_BASE_URL, getApiUrl } from './apiConfig';

export default function App() {
  // Session Access State
  const [currentUser, setCurrentUser] = useState<{ id: number; nombre_completo: string; correo: string; rol: string } | null>(null);
  
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'monitoreo' | 'flota' | 'rutas' | 'incidencias' | 'roles'>('dashboard');

  // Backend Database Sync States
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const stored = localStorage.getItem('local_usuarios');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [monitoreos, setMonitoreos] = useState<Monitoreo[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  
  // SQL Server Connectivity State (for visualization in UI)
  const [dbStatus, setDbStatus] = useState({ connected: false, fallback: true, error: '', databaseName: '', server: '' });

  // Load state
  const [loadingDbInfo, setLoadingDbInfo] = useState(true);

  // Fetch all database records upon session mount
  const syncWithBackendData = async () => {
    try {
      const dbStatusRes = await fetch(getApiUrl('/api/db-status'));
      if (dbStatusRes.ok) {
        const statusData = await dbStatusRes.json();
        setDbStatus(statusData);
      }

      const personalRes = await fetch(getApiUrl('/api/personal'));
      if (personalRes.ok) {
        const resJson = await personalRes.json();
        const serverUsers = resJson.data || [];
        
        try {
          const stored = localStorage.getItem('local_usuarios');
          const localUsers: Usuario[] = stored ? JSON.parse(stored) : [];
          
          // Merge lists cleanly based on email as the differentiator
          const mergedMap = new Map<string, Usuario>();
          serverUsers.forEach((u: Usuario) => mergedMap.set(u.correo, u));
          localUsers.forEach((u: Usuario) => mergedMap.set(u.correo, u));
          
          const finalUsers = Array.from(mergedMap.values());
          setUsuarios(finalUsers);
          localStorage.setItem('local_usuarios', JSON.stringify(finalUsers));
        } catch {
          setUsuarios(serverUsers);
        }
      }

      const vehiculosRes = await fetch(getApiUrl('/api/vehiculos'));
      if (vehiculosRes.ok) {
        const resJson = await vehiculosRes.json();
        setVehiculos(resJson.data || []);
      }

      const monitoreosRes = await fetch(getApiUrl('/api/monitoreos'));
      if (monitoreosRes.ok) {
        const resJson = await monitoreosRes.json();
        setMonitoreos(resJson.data || []);
      }

      const incidenciasRes = await fetch(getApiUrl('/api/incidencias'));
      if (incidenciasRes.ok) {
        const resJson = await incidenciasRes.json();
        setIncidencias(resJson.data || []);
      }
    } catch (err) {
      console.warn('Backend server connection failed, app using in-memory mock context: ', err);
    } finally {
      setLoadingDbInfo(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      syncWithBackendData();
      
      // Reset to a safe authorized default view tab based on the specific worker role
      if (currentUser.rol === 'Supervisor de Control') {
        if (!['dashboard', 'monitoreo', 'flota', 'incidencias'].includes(activeTab)) {
          setActiveTab('dashboard');
        }
      } else if (currentUser.rol === 'Controlador de Mando') {
        if (!['dashboard', 'monitoreo', 'incidencias'].includes(activeTab)) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [currentUser]);

  // Handle operations handlers - 1. Create personal role by saving directly to SQL Server backend
  const handleAddUsuario = async (userData: any): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/personal'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setUsuarios(result.data);
          localStorage.setItem('local_usuarios', JSON.stringify(result.data));
          return true;
        }
      }
    } catch (e: any) {
      console.error("[Registrar] Error al guardar en SQL Server:", e);
    }
    return false;
  };

  // 2. Update personal role by saving directly to SQL Server backend
  const handleUpdateUsuario = async (id: number, userData: any): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl(`/api/personal/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setUsuarios(result.data);
          localStorage.setItem('local_usuarios', JSON.stringify(result.data));
          return true;
        }
      }
    } catch (e) {
      console.error("[Actualizar] Error al actualizar en SQL Server:", e);
    }
    return false;
  };

  // 3. Delete personal role by deleting directly from SQL Server backend
  const handleDeleteUsuario = async (id: number): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl(`/api/personal/${id}`), {
        method: 'DELETE'
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setUsuarios(result.data);
          localStorage.setItem('local_usuarios', JSON.stringify(result.data));
          return true;
        }
      }
    } catch (e) {
      console.error("[Eliminar] Error al borrar de SQL Server:", e);
    }
    return false;
  };

  // 4. Create fleet vehicle
  const handleAddVehicle = async (vehicleData: any): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/vehiculos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData)
      });
      if (res.ok) {
        const result = await res.json();
        setVehiculos(result.data);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // 5. Schedule maintenance correctives
  const handleScheduleMaintenance = async (placa: string, fecha: string, estado: string): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl(`/api/vehiculos/${placa}/mantenimiento`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha_mantenimiento: fecha, estado_mantenimiento: estado })
      });
      if (res.ok) {
        const result = await res.json();
        setVehiculos(result.data);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // 6. Create monitoring router
  const handleAddMonitoreo = async (monitoreoData: any): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/monitoreos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoreoData)
      });
      if (res.ok) {
        const result = await res.json();
        setMonitoreos(result.data);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // 7. Update status of active route monitorings (e.g. resolve or trigger incident status)
  const handleUpdateEstado = async (id: string, estado: 'EN RUTA' | 'INCIDENCIA' | 'COMPLETADO'): Promise<void> => {
    try {
      const res = await fetch(getApiUrl(`/api/monitoreos/${id}/estado`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });
      if (res.ok) {
        const result = await res.json();
        setMonitoreos(result.data);
        // Refresh incidents log dynamically if changed to Incident
        if (estado === 'INCIDENCIA') {
          syncWithBackendData();
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Report raw incidence log
  const handleReportIncident = async (incidentData: any): Promise<boolean> => {
    try {
      const res = await fetch(getApiUrl('/api/incidencias'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
      if (res.ok) {
        const result = await res.json();
        setIncidencias(result.data);
        // Sync monitoring state changes from backend
        const monitoreosRefresh = await fetch(getApiUrl('/api/monitoreos'));
        if (monitoreosRefresh.ok) {
          const mJson = await monitoreosRefresh.json();
          setMonitoreos(mJson.data);
        }
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const dbStatusLabel = dbStatus.connected
    ? `Conectado a SQL Server DB [${dbStatus.databaseName}] en el servidor ${dbStatus.server}`
    : `⚠️ Conexión de base de datos no disponible (${dbStatus.error || 'Server Offline'}). Usando almacenamiento en memoria local temporal seguro.`;

  // Render Login state first if no session
  if (!currentUser) {
    return <Login onLoginSuccess={(usr) => setCurrentUser(usr)} />;
  }

  // Render beautiful Driver Portal for driver role
  if (currentUser.rol === 'Conductor de Ruta') {
    return (
      <DriverPortal
        currentUser={currentUser}
        monitoreos={monitoreos}
        vehiculos={vehiculos}
        incidencias={incidencias}
        onUpdateEstado={async (id, estado) => {
          await handleUpdateEstado(id, estado);
        }}
        onReportIncident={handleReportIncident}
        onLogout={() => setCurrentUser(null)}
        syncWithBackendData={syncWithBackendData}
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      
      {/* 1. SideNavBar Component Panel */}
      <aside id="side-navbar" className="h-screen w-64 flex flex-col fixed left-0 top-0 bg-surface border-r border-outline-variant py-4 z-50">
        <div className="px-6 mb-8">
          <h1 className="text-xl font-black text-on-surface tracking-tight">Petro Mapi SAC</h1>
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/80">Sistemas Logísticos</p>
        </div>

        <nav className="flex-1 flex flex-col space-y-1 px-2 select-none">
          {(currentUser.rol === 'Administradores' || currentUser.rol === 'Supervisor de Control' || currentUser.rol === 'Controlador de Mando') && (
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'text-secondary bg-surface-container-high' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/55'
              }`}
            >
              <span className="material-symbols-outlined mr-3">dashboard</span>
              <span>Estadísticas / Inicio</span>
            </button>
          )}

          {(currentUser.rol === 'Administradores' || currentUser.rol === 'Supervisor de Control' || currentUser.rol === 'Controlador de Mando') && (
            <button 
              onClick={() => setActiveTab('monitoreo')} 
              className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monitoreo' 
                  ? 'text-secondary bg-surface-container-high' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/55'
              }`}
            >
              <span className="material-symbols-outlined mr-3">location_searching</span>
              <span>Monitoreo en Vivo</span>
            </button>
          )}

          {(currentUser.rol === 'Administradores' || currentUser.rol === 'Supervisor de Control') && (
            <button 
              onClick={() => setActiveTab('flota')} 
              className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'flota' 
                  ? 'text-secondary bg-surface-container-high' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/55'
              }`}
            >
              <span className="material-symbols-outlined mr-3">local_shipping</span>
              <span>Gestión de Flota</span>
            </button>
          )}

          {(currentUser.rol === 'Administradores' || currentUser.rol === 'Supervisor de Control' || currentUser.rol === 'Controlador de Mando') && (
            <button 
              onClick={() => setActiveTab('incidencias')} 
              className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'incidencias' 
                  ? 'text-secondary bg-surface-container-high' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/55'
              }`}
            >
              <span className="material-symbols-outlined mr-3">warning</span>
              <span>Incidencias</span>
            </button>
          )}

          {currentUser.rol === 'Administradores' && (
            <button 
              onClick={() => setActiveTab('roles')} 
              className={`flex items-center px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'roles' 
                  ? 'text-secondary bg-surface-container-high' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/55'
              }`}
            >
              <span className="material-symbols-outlined mr-3">badge</span>
              <span>Gestión de Roles</span>
            </button>
          )}
        </nav>

        {/* Short reporting trigger */}
        {(currentUser.rol === 'Administradores' || currentUser.rol === 'Supervisor de Control') && (
          <div className="px-4 mb-4">
            <button 
              onClick={() => setActiveTab('flota')}
              className="w-full py-2.5 bg-secondary text-on-secondary font-black text-xs rounded-xl flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-95 transition-all select-none shadow-lg shadow-secondary/15"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Nuevo Reporte</span>
            </button>
          </div>
        )}

        {/* Bottom utility rules */}
        <div className="border-t border-outline-variant/60 pt-2 px-2 space-y-0.5">
          <div className="px-4 py-1 text-[9px] font-bold text-secondary tracking-widest uppercase font-mono">
            ROL: {currentUser.rol.split(' ')[0]}
          </div>
          <button 
            onClick={() => setCurrentUser(null)} 
            className="w-full flex items-center px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined mr-3">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="ml-64 flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TopNavBar Header Component */}
        <header id="top-navbar" className="h-16 flex justify-between items-center px-6 bg-surface-container border-b border-outline-variant fixed top-0 right-0 left-64 z-40 select-none">
          
          <div className="flex items-center flex-1 max-w-sm">
            <span className="text-secondary-fixed text-xs font-black tracking-widest uppercase font-mono mr-3">
              {currentUser.rol === 'Administradores' ? 'ADMIN HUB' : currentUser.rol === 'Supervisor de Control' ? 'CONTROL HUB' : 'MANDO HUB'}
            </span>
            <div className="text-[10px] text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant font-mono truncate max-w-xs" title={dbStatusLabel}>
              {dbStatus.connected ? '● SQL Server listo' : '⚠️ Almacenamiento local'}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button 
                className="p-1.5 text-on-surface-variant hover:text-secondary transition-colors relative cursor-pointer active:opacity-85"
                title="Sincronizar Datos"
                onClick={syncWithBackendData}
              >
                <span className="material-symbols-outlined text-sm animate-spin-slow">sync</span>
              </button>
              
              <button 
                onClick={() => {
                  alert(dbStatusLabel);
                }}
                className={`p-1.5 rounded transition-colors text-xs font-semibold flex items-center gap-1 ${
                  dbStatus.connected ? 'text-green-400 bg-green-500/10' : 'text-secondary bg-secondary/10'
                }`}
                title="Detalles de Base de Datos"
              >
                <span className="material-symbols-outlined text-xs">database</span>
                <span className="text-[10px] tracking-wider font-mono">DB</span>
              </button>
            </div>

            <div className="h-6 w-px bg-outline-variant"></div>

            {/* Profile Avatar Widget */}
            <div className="flex items-center gap-2.5 select-none">
              <div className="text-right">
                <p className="text-xs font-black text-on-surface leading-tight truncate max-w-xs">{currentUser.nombre_completo}</p>
                <p className="text-[9px] uppercase tracking-wider text-on-surface-variant font-bold leading-tight mt-0.5">{currentUser.rol}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-secondary-container/20 border-2 border-secondary overflow-hidden select-none">
                <img 
                  alt="Perfil de Usuario" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
                />
              </div>
            </div>
          </div>
        </header>

        {/* 3. Dynamic content scroll container space */}
        <main className="mt-16 p-6 overflow-y-auto flex-1 h-[calc(100vh-4rem)]">
          {activeTab === 'dashboard' && (
            <DashboardView 
              monitoreos={monitoreos} 
              incidencias={incidencias} 
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'monitoreo' && (
            <MonitoringView 
              monitoreos={monitoreos} 
              vehiculos={vehiculos} 
              usuarios={usuarios} 
              onAddMonitoreo={handleAddMonitoreo}
              onUpdateEstado={handleUpdateEstado}
              dbStatusLabel={dbStatus.connected ? '' : dbStatusLabel}
            />
          )}

          {activeTab === 'flota' && (
            <FleetView 
              vehiculos={vehiculos} 
              monitoreos={monitoreos}
              onAddVehicle={handleAddVehicle}
              onReportIncident={handleReportIncident}
              onScheduleMaintenance={handleScheduleMaintenance}
            />
          )}

          {activeTab === 'incidencias' && (
            <IncidentsListView incidencias={incidencias} />
          )}

          {activeTab === 'roles' && (
            <SettingsAndRolesView 
              usuarios={usuarios} 
              onAddUsuario={handleAddUsuario}
              onUpdateUsuario={handleUpdateUsuario}
              onDeleteUsuario={handleDeleteUsuario}
              currentUser={currentUser}
            />
          )}
        </main>

        {/* Global Footer (Technical States) */}
        <footer id="system-footer" className="mt-auto py-3 px-6 bg-surface-container border-t border-outline-variant/40 flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/70 select-none">
          <div className="flex gap-4">
            <span>SISTEMA PETRO MAPI: <span className="text-green-400">ÓPTIMO</span></span>
            <span className="md:inline hidden">
              SERVIDOR: {dbStatus.connected ? `SQL Server Conectado: ${dbStatus.server}` : 'CONEXIÓN EN FALLBACK LOCAL (MEMORIA)'}
            </span>
          </div>
          <div>
            © 2026 PETRO MAPI SAC - CORE ENGINE V4.20
          </div>
        </footer>

      </div>

    </div>
  );
}
