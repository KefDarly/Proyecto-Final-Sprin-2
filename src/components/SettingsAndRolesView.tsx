import React, { useState } from 'react';
import { Usuario } from '../types';

interface SettingsAndRolesViewProps {
  usuarios: Usuario[];
  onAddUsuario: (userData: any) => Promise<boolean>;
  onUpdateUsuario: (id: number, userData: any) => Promise<boolean>;
  onDeleteUsuario: (id: number) => Promise<boolean>;
  currentUser: { id: number; nombre_completo: string; correo: string; rol: string } | null;
}

export default function SettingsAndRolesView({
  usuarios,
  onAddUsuario,
  onUpdateUsuario,
  onDeleteUsuario,
  currentUser
}: SettingsAndRolesViewProps) {
  
  // Form states for creating/editing users
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rol, setRol] = useState<'Administradores' | 'Supervisor de Control' | 'Controlador de Mando' | 'Conductor de Ruta'>('Administradores');
  const [contrasena, setContrasena] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const resetFormState = () => {
    setEditingId(null);
    setNombreCompleto('');
    setCorreo('');
    setDocumento('');
    setTelefono('');
    setRol('Administradores');
    setContrasena('');
    setFormError('');
    setFormSuccess('');
  };

  const handleEditClick = (user: Usuario) => {
    setEditingId(user.id);
    setNombreCompleto(user.nombre_completo);
    setCorreo(user.correo);
    setDocumento(user.documento);
    setTelefono(user.telefono);
    setRol(user.rol);
    setContrasena(''); // Keep blank to not change password unless typed in
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!nombreCompleto || !correo || !documento || !telefono || !rol) {
      setFormError('Por favor llene todos los campos requeridos.');
      return;
    }

    setLoading(true);

    if (editingId !== null) {
      // Logic for editing existing personal user
      const success = await onUpdateUsuario(editingId, {
        nombre_completo: nombreCompleto,
        correo,
        documento,
        telefono,
        rol,
        contrasena: contrasena // If empty, backend retains previous
      });
      setLoading(false);
      
      if (success) {
        setFormSuccess('¡Datos del personal actualizados correctamente!');
        setTimeout(() => {
          resetFormState();
        }, 1200);
      } else {
        setFormError('No se pudo actualizar los datos. Verifique si el correo ya existe.');
      }
    } else {
      // Logic for creating new operational role
      if (!contrasena) {
        setFormError('Debe ingresar una contraseña para el nuevo personal.');
        setLoading(false);
        return;
      }

      const success = await onAddUsuario({
        nombre_completo: nombreCompleto,
        correo,
        documento,
        telefono,
        rol,
        contrasena
      });
      setLoading(false);

      if (success) {
        setFormSuccess('¡Personal registrado exitosamente en el sistema!');
        setTimeout(() => {
          resetFormState();
        }, 1200);
      } else {
        setFormError('No se pudo registrar el personal. Verifique si el correo ya existe.');
      }
    }
  };

  const handleDeleteClick = async (id: number, nombre: string) => {
    if (id === currentUser?.id) {
      alert('No puedes eliminar tu propio usuario con sesión activa.');
      return;
    }

    if (confirm(`¿Está seguro de eliminar a "${nombre}" del sistema logístico?`)) {
      setLoading(true);
      const success = await onDeleteUsuario(id);
      setLoading(false);
      if (success) {
        alert('Personal removido con éxito.');
      } else {
        alert('Error al intentar eliminar el registro.');
      }
    }
  };

  return (
    <div className="space-y-6 select-none">
      
      {/* View Header */}
      <div className="mb-2">
        <h2 className="text-3xl font-black text-on-surface text-on-surface">Gestión de Roles y Personal Operativo</h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Cree, liste, actualice y elimine cuentas operativas autorizadas para la coordinación de despacho, supervisión y logística vial de Petro Mapi SAC.
        </p>
      </div>

      {/* Main Grid: left Form split, right dynamic lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-5 bg-surface-container-low border border-outline-variant rounded-xl p-6 shadow-xl h-fit">
          <h3 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4 flex items-center gap-1.5 border-b border-outline-variant/30 pb-3">
            <span className="material-symbols-outlined text-sm">badge</span>
            <span>{editingId !== null ? `Editar Rol: ID ${editingId}` : 'Registrar Nuevo Personal'}</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {formError && (
              <div className="p-3 bg-error-container/20 border-l-4 border-error text-error text-xs rounded-r">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-green-500/10 border-l-4 border-green-500 text-green-400 text-xs rounded-r">
                {formSuccess}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Nombre Completo</label>
              <input
                type="text"
                required
                placeholder="Ej: Julio César Meléndez"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="ej: nombre@petromapi.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">RUC / DNI</label>
                <input
                  type="text"
                  required
                  placeholder="Doc. Identidad"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface font-mono"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface-variant uppercase">Teléfono Móvil</label>
                <input
                  type="text"
                  required
                  placeholder="999-999-999"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">Rol Asignado Operativo</label>
              <select
                value={rol}
                onChange={(e: any) => setRol(e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
              >
                <option value="Administradores">Administradores (Full Acceso)</option>
                <option value="Supervisor de Control">Supervisor de Control</option>
                <option value="Controlador de Mando">Controlador de Mando (Despachador)</option>
                <option value="Conductor de Ruta">Conductor de Ruta (Chofer de unidad)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant uppercase">
                {editingId !== null ? 'Configurar Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
              </label>
              <input
                type="password"
                placeholder={editingId !== null ? 'Dejar en blanco para conservar actual' : 'Mínimo 6 caracteres'}
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="bg-surface-container border border-outline-variant rounded-lg p-2.5 text-xs text-on-surface"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetFormState}
                  className="px-4 py-2 border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-lg font-bold"
                >
                  Cancelar Edición
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-secondary text-on-secondary hover:brightness-110 active:scale-95 transition-all rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">save</span>
                <span>{loading ? 'Procesando...' : editingId !== null ? 'Actualizar Personal' : 'Registrar'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* List Personal Column */}
        <div className="lg:col-span-7 bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-xl flex flex-col justify-between">
          <div>
            <div className="p-4 bg-surface-container-high border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider px-2">Cuentas y Personal Registrado</h3>
              <span className="text-[10px] font-mono font-bold bg-surface/80 px-2 py-0.5 border border-outline-variant rounded">
                Personal: {usuarios.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead className="bg-surface-container uppercase text-[9px] text-on-surface-variant font-black tracking-wider border-b border-outline-variant">
                  <tr>
                    <th className="px-5 py-3.5">Nombre</th>
                    <th className="px-5 py-3.5">Contacto / Documento</th>
                    <th className="px-5 py-3.5">Rol Logístico</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface bg-surface-container-lowest/15">
                  {usuarios.map((user) => {
                    const initials = user.nombre_completo ? user.nombre_completo.split(' ').map(n=>n[0]).join('').substring(0, 2).toUpperCase() : 'PE';
                    return (
                      <tr key={user.id} className="hover:bg-surface-container-highest/10 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-secondary-container/10 border border-secondary/25 text-secondary flex items-center justify-center font-bold text-[10px]">
                              {initials}
                            </div>
                            <div>
                              <span className="font-bold text-on-surface block">{user.nombre_completo}</span>
                              <span className="text-[10px] text-on-surface-variant font-mono">{user.correo}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="block font-mono text-on-surface text-[10px]">{user.documento}</span>
                          <span className="text-[10px] text-on-surface-variant block">Cel: {user.telefono}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                            user.rol === 'Administradores' 
                              ? 'bg-secondary/10 text-secondary border border-secondary/20' 
                              : user.rol === 'Supervisor de Control'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : user.rol === 'Controlador de Mando'
                              ? 'bg-blue-500/10 text-primary border border-primary/20'
                              : 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/50'
                          }`}>
                            {user.rol}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-primary hover:text-white transition-colors p-1"
                              title="Editar Datos"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user.id, user.nombre_completo)}
                              className="text-error hover:text-red-400 transition-colors p-1"
                              title="Eliminar Personal"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
