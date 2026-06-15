export interface Usuario {
  id: number;
  nombre_completo: string;
  correo: string;
  documento: string; // DNI/RUC
  telefono: string;
  rol: 'Administradores' | 'Supervisor de Control' | 'Controlador de Mando' | 'Conductor de Ruta';
  contrasena: string;
}

export interface Vehiculo {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  estado_mantenimiento: 'ÓPTIMO' | 'PRÓXIMO 15D' | 'VENCIDO';
  fecha_mantenimiento: string;
}

export interface Monitoreo {
  id: string; // e.g. TRK-2048
  placa: string;
  tipo_carga: string;
  conductor: string;
  origen: string;
  destino: string;
  salida_fecha: string;
  estado: 'EN RUTA' | 'INCIDENCIA' | 'COMPLETADO';
}

export interface Incidencia {
  id: number;
  monitoreo_id: string;
  tipo_incidencia: string;
  fecha: string;
  hora: string;
  descripcion: string;
  estado_alerta?: string;
}
