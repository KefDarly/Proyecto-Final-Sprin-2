import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import mssql from "mssql";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS and Express body parsers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to parse environment variables safely, removing double/single quotes or spaces
const cleanEnvVar = (val: string | undefined): string => {
  if (!val) return "";
  let clean = val.trim();
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1);
  }
  if (clean.startsWith("'") && clean.endsWith("'")) {
    clean = clean.substring(1, clean.length - 1);
  }
  return clean.trim();
};

// Database configuration
const dbConfig = {
  server: cleanEnvVar(process.env.DB_SERVER),
  port: parseInt(cleanEnvVar(process.env.DB_PORT) || "1433", 10),
  user: cleanEnvVar(process.env.DB_USER),
  password: cleanEnvVar(process.env.DB_PASSWORD),
  database: cleanEnvVar(process.env.DB_NAME) || "seguimiento_carga_ancha",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 8000
  }
};

let pool: mssql.ConnectionPool | null = null;
let isLocalFallback = false;
let connectionErrorDetails = "";

// Robust Fallback In-Memory Storage
let mockPersonal = [
  { id: 1, nombre_completo: "Super Administrador", correo: "admin@petromapi.com", documento: "10443322112", telefono: "999888777", rol: "Administradores", contrasena: "petromapi123" },
  { id: 2, nombre_completo: "Ricardo Castillo Mora", correo: "castillo@petromapi.com", documento: "09887766", telefono: "900111222", rol: "Conductor de Ruta", contrasena: "petromapi123" },
  { id: 3, nombre_completo: "Juan Perez Soto", correo: "perez@petromapi.com", documento: "08776655", telefono: "922333444", rol: "Conductor de Ruta", contrasena: "petromapi123" },
  { id: 4, nombre_completo: "Maria Alva Ramos", correo: "alva@petromapi.com", documento: "07665544", telefono: "955666777", rol: "Conductor de Ruta", contrasena: "petromapi123" }
];

let mockVehiculos = [
  { placa: "V3B-981", marca: "Volvo", modelo: "FMX 460 6x4", anio: 2022, capacidad: 32.0, estado_mantenimiento: "ÓPTIMO", fecha_mantenimiento: "15 Oct 2023" },
  { placa: "B4X-112", marca: "Scania", modelo: "G410", anio: 2021, capacidad: 45.0, estado_mantenimiento: "PRÓXIMO 15D", fecha_mantenimiento: "02 Ene 2024" },
  { placa: "F9L-403", marca: "Mercedes-Benz", modelo: "Actros 2645", anio: 2023, capacidad: 30.5, estado_mantenimiento: "VENCIDO", fecha_mantenimiento: "Vencido" },
  { placa: "A1Q-772", marca: "Kenworth", modelo: "T880 Heavy Duty", anio: 2020, capacidad: 50.0, estado_mantenimiento: "ÓPTIMO", fecha_mantenimiento: "12 Dic 2023" },
  { placa: "M5T-229", marca: "International", modelo: "HV Series 6x4", anio: 2019, capacidad: 28.0, estado_mantenimiento: "ÓPTIMO", fecha_mantenimiento: "05 Mar 2024" }
];

let mockMonitoreos = [
  { id: "TRK-2048", placa: "V3B-981", tipo_carga: "Combustible 95 Oct", conductor: "Ricardo Castillo Mora", origen: "Lima", destino: "Arequipa", salida_fecha: "2026-06-14 06:45", estado: "EN RUTA" },
  { id: "TRK-3155", placa: "B4X-112", tipo_carga: "Petróleo Diésel B5", conductor: "Juan Perez Soto", origen: "Callao", destino: "Cusco", salida_fecha: "2026-06-14 04:20", estado: "INCIDENCIA" },
  { id: "TRK-1988", placa: "P8C-455", tipo_carga: "Asfalto Caliente", conductor: "Maria Alva Ramos", origen: "Piura", destino: "Chiclayo", salida_fecha: "2026-06-13 22:15", estado: "COMPLETADO" },
  { id: "TRK-2201", placa: "M7S-331", tipo_carga: "Gasolina 90 Oct", conductor: "Luis Loli", origen: "Ica", destino: "Lima", salida_fecha: "2026-06-14 09:00", estado: "EN RUTA" }
];

let mockIncidencias = [
  { id: 1, monitoreo_id: "TRK-3155", tipo_incidencia: "Pérdida de señal GPS", fecha: "2026-06-14", hora: "04:32", descripcion: "Pérdida de señal GPS - Unidad B4X-112. Ubicación registrada: Km 450 Panamericana Sur. Hace 12 minutos.", estado_alerta: "ACTIVA" }
];

// Seed databases if SQL Server is active
async function runDbMigrations(poolConnection: mssql.ConnectionPool) {
  try {
    // 1. Personal Table
    await poolConnection.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='personal' AND xtype='U')
      CREATE TABLE personal (
        id INT IDENTITY(1,1) PRIMARY KEY,
        nombre_completo NVARCHAR(255) NOT NULL,
        correo NVARCHAR(255) NOT NULL UNIQUE,
        documento NVARCHAR(50) NOT NULL,
        telefono NVARCHAR(50) NOT NULL,
        rol NVARCHAR(100) NOT NULL,
        contrasena NVARCHAR(255) NOT NULL
      )
    `);

    // Ensure Pre-Seeded Admin User
    await poolConnection.request().query(`
      IF NOT EXISTS (SELECT * FROM personal WHERE correo='admin@petromapi.com')
      INSERT INTO personal (nombre_completo, correo, documento, telefono, rol, contrasena)
      VALUES (N'Super Administrador', N'admin@petromapi.com', N'10443322112', N'999888777', N'Administradores', N'petromapi123')
    `);

    // 2. Vehiculos Table
    await poolConnection.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='vehiculos' AND xtype='U')
      CREATE TABLE vehiculos (
        placa NVARCHAR(50) PRIMARY KEY,
        marca NVARCHAR(100) NOT NULL,
        modelo NVARCHAR(100) NOT NULL,
        anio INT NOT NULL,
        capacidad DECIMAL(10,2) NOT NULL,
        estado_mantenimiento NVARCHAR(50) DEFAULT 'ÓPTIMO',
        fecha_mantenimiento NVARCHAR(100) DEFAULT ''
      )
    `);

    // 3. Monitoreos Table
    await poolConnection.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='monitoreos' AND xtype='U')
      CREATE TABLE monitoreos (
        id NVARCHAR(50) PRIMARY KEY,
        placa NVARCHAR(50) NOT NULL,
        tipo_carga NVARCHAR(255) NOT NULL,
        conductor NVARCHAR(255) NOT NULL,
        origen NVARCHAR(100) NOT NULL,
        destino NVARCHAR(100) NOT NULL,
        salida_fecha NVARCHAR(100) NOT NULL,
        estado NVARCHAR(50) NOT NULL
      )
    `);

    // 4. Incidencias Table
    await poolConnection.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='incidencias' AND xtype='U')
      CREATE TABLE incidencias (
        id INT IDENTITY(1,1) PRIMARY KEY,
        monitoreo_id NVARCHAR(50) NOT NULL,
        tipo_incidencia NVARCHAR(100) NOT NULL,
        fecha NVARCHAR(50),
        hora NVARCHAR(50),
        descripcion NVARCHAR(MAX) NOT NULL,
        estado_alerta NVARCHAR(50) DEFAULT 'ACTIVA'
      )
    `);

    console.log("SQL Server Tables Initialized Successfully!");
  } catch (err) {
    console.error("Error running SQL Server migrations:", err);
  }
}

// Global Connect helper
async function getDbConnection(): Promise<mssql.ConnectionPool | null> {
  if (pool) return pool;
  if (!dbConfig.server || !dbConfig.user) {
    isLocalFallback = true;
    connectionErrorDetails = "Las variables de entorno de SQL Server no están completamente configuradas (DB_SERVER o DB_USER vacíos).";
    return null;
  }
  try {
    console.log(`[Database] Attempting connection to ${dbConfig.server}:${dbConfig.port} (database: ${dbConfig.database}, user: ${dbConfig.user}) with encrypt=true...`);
    pool = await mssql.connect(dbConfig);
    isLocalFallback = false;
    connectionErrorDetails = "";
    await runDbMigrations(pool);
    return pool;
  } catch (err: any) {
    console.log("[Database] Connection failed with encrypt=true, trying with encrypt=false... Note: This is normal when offline or behind a firewalled network.");
    try {
      const nonEncryptedConfig = {
        ...dbConfig,
        options: {
          ...dbConfig.options,
          encrypt: false
        }
      };
      pool = await mssql.connect(nonEncryptedConfig);
      isLocalFallback = false;
      connectionErrorDetails = "";
      await runDbMigrations(pool);
      return pool;
    } catch (retryErr: any) {
      console.log("[Database] Remote SQL Server connection could not be established. Running in robust Local/InMemory Fallback mode. Details: " + (retryErr?.message || String(retryErr)));
      pool = null;
      isLocalFallback = true;
      connectionErrorDetails = "Error de conexión SQL Server: " + (retryErr?.message || String(retryErr));
      return null;
    }
  }
}

// Attempt immediate connection async
import dns from "dns";
dns.lookup("dataepis.uandina.pe", (err, address) => {
  if (err) {
    console.error("[Diagnostics] DNS Lookup for dataepis.uandina.pe failed:", err.message);
  } else {
    console.log(`[Diagnostics] DNS Lookup for dataepis.uandina.pe succeeded! IP: ${address}`);
  }
});

getDbConnection();

// Status Check Endpoint (provides the user with visual indicators whether remote SQL Server is linked or in fallback Mode)
app.get("/api/db-status", async (req, res) => {
  const dynamicPool = await getDbConnection();
  res.json({
    connected: dynamicPool !== null,
    fallback: isLocalFallback,
    error: connectionErrorDetails,
    databaseName: dbConfig.database,
    server: dbConfig.server
  });
});

// -----------------------------------------------------------------
// 1. AUTH / ADMINISTRATIVE LOGIN
// -----------------------------------------------------------------
app.post("/api/auth/login", async (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ success: false, message: "Correo y contraseña requeridos" });
  }

  // Pre-seeded Admin bypass
  if (correo === "admin@petromapi.com" && contrasena === "petromapi123") {
    return res.json({
      success: true,
      user: { id: 1, nombre_completo: "Super Administrador", correo, rol: "Administradores" }
    });
  }

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      const result = await dbPool.request()
        .input("correo", mssql.NVarChar, correo)
        .input("contrasena", mssql.NVarChar, contrasena)
        .query("SELECT * FROM personal WHERE correo = @correo AND contrasena = @contrasena");

      if (result.recordset.length > 0) {
        const userRow = result.recordset[0];
        return res.json({
          success: true,
          user: {
            id: userRow.id,
            nombre_completo: userRow.nombre_completo,
            correo: userRow.correo,
            rol: userRow.rol
          }
        });
      }
    } else {
      // In-Memory Fallback validation
      const matched = mockPersonal.find(u => u.correo === correo && u.contrasena === contrasena);
      if (matched) {
        return res.json({
          success: true,
          user: {
            id: matched.id,
            nombre_completo: matched.nombre_completo,
            correo: matched.correo,
            rol: matched.rol
          }
        });
      }
    }
    return res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: "Error interno: " + error.message });
  }
});

// -----------------------------------------------------------------
// 2. GESTIÓN DE ROLES / PERSONAL - ENDPOINTS
// -----------------------------------------------------------------
app.get("/api/personal", async (req, res) => {
  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      return res.json({ success: true, data: mockPersonal, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/personal", async (req, res) => {
  const { nombre_completo, correo, documento, telefono, rol, contrasena } = req.body;

  if (!nombre_completo || !correo || !documento || !telefono || !rol || !contrasena) {
    return res.status(400).json({ success: false, message: "Faltan registrar campos obligatorios" });
  }

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      // Check duplicate
      const duplicate = await dbPool.request()
        .input("correo", mssql.NVarChar, correo)
        .query("SELECT id FROM personal WHERE correo = @correo");
      
      if (duplicate.recordset.length > 0) {
        return res.status(400).json({ success: false, message: "El correo ya se encuentra registrado" });
      }

      await dbPool.request()
        .input("nombre", mssql.NVarChar, nombre_completo)
        .input("correo", mssql.NVarChar, correo)
        .input("doc", mssql.NVarChar, documento)
        .input("telf", mssql.NVarChar, telefono)
        .input("rol", mssql.NVarChar, rol)
        .input("pass", mssql.NVarChar, contrasena) // Encrypted internally / raw bypass
        .query(`INSERT INTO personal (nombre_completo, correo, documento, telefono, rol, contrasena) 
                VALUES (@nombre, @correo, @doc, @telf, @rol, @pass)`);

      const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset, message: "Personal registrado correctamente en SQL Server" });
    } else {
      // Duplicate in memory
      if (mockPersonal.some(u => u.correo === correo)) {
        return res.status(400).json({ success: false, message: "El correo ya se encuentra registrado" });
      }

      const newId = mockPersonal.length > 0 ? Math.max(...mockPersonal.map(p => p.id)) + 1 : 1;
      const newEntry = { id: newId, nombre_completo, correo, documento, telefono, rol, contrasena };
      mockPersonal.unshift(newEntry);
      return res.json({ success: true, data: mockPersonal, fallback: true, message: "Personal registrado temporalmente en memoria" });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.put("/api/personal/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, correo, documento, telefono, rol, contrasena } = req.body;

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("id", mssql.Int, parseInt(id))
        .input("nombre", mssql.NVarChar, nombre_completo)
        .input("correo", mssql.NVarChar, correo)
        .input("doc", mssql.NVarChar, documento)
        .input("telf", mssql.NVarChar, telefono)
        .input("rol", mssql.NVarChar, rol)
        .input("pass", mssql.NVarChar, contrasena)
        .query(`UPDATE personal 
                SET nombre_completo=@nombre, correo=@correo, documento=@doc, telefono=@telf, rol=@rol, contrasena=COALESCE(NULLIF(@pass, ''), contrasena)
                WHERE id=@id`);

      const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      const idx = mockPersonal.findIndex(u => u.id === parseInt(id));
      if (idx !== -1) {
        mockPersonal[idx] = {
          ...mockPersonal[idx],
          nombre_completo,
          correo,
          documento,
          telefono,
          rol,
          contrasena: contrasena || mockPersonal[idx].contrasena
        };
      }
      return res.json({ success: true, data: mockPersonal, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.delete("/api/personal/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("id", mssql.Int, parseInt(id))
        .query("DELETE FROM personal WHERE id = @id");

      const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      mockPersonal = mockPersonal.filter(u => u.id !== parseInt(id));
      return res.json({ success: true, data: mockPersonal, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------------------
// 3. GESTIÓN DE VEHÍCULOS / FLOTA
// -----------------------------------------------------------------
app.get("/api/vehiculos", async (req, res) => {
  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      const result = await dbPool.request().query("SELECT * FROM vehiculos ORDER BY placa ASC");
      return res.json({ success: true, data: result.recordset });
    } else {
      return res.json({ success: true, data: mockVehiculos, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/vehiculos", async (req, res) => {
  const { placa, marca, modelo, anio, capacidad, estado_mantenimiento, fecha_mantenimiento } = req.body;

  if (!placa || !marca || !modelo || !anio || !capacidad) {
    return res.status(400).json({ success: false, message: "Campos de vehículo incompletos" });
  }

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("placa", mssql.NVarChar, placa)
        .input("marca", mssql.NVarChar, marca)
        .input("modelo", mssql.NVarChar, modelo)
        .input("anio", mssql.Int, parseInt(anio))
        .input("capacidad", mssql.Decimal(10, 2), parseFloat(capacidad))
        .input("estado", mssql.NVarChar, estado_mantenimiento || "ÓPTIMO")
        .input("fecha", mssql.NVarChar, fecha_mantenimiento || "No Agendada")
        .query(`INSERT INTO vehiculos (placa, marca, modelo, anio, capacidad, estado_mantenimiento, fecha_mantenimiento)
                VALUES (@placa, @marca, @modelo, @anio, @capacidad, @estado, @fecha)`);

      const result = await dbPool.request().query("SELECT * FROM vehiculos ORDER BY placa ASC");
      return res.json({ success: true, data: result.recordset });
    } else {
      const existing = mockVehiculos.findIndex(v => v.placa === placa);
      if (existing !== -1) {
        return res.status(400).json({ success: false, message: "La placa ya se encuentra registrada" });
      }

      const newCar = {
        placa,
        marca,
        modelo,
        anio: parseInt(anio, 10),
        capacidad: parseFloat(capacidad),
        estado_mantenimiento: estado_mantenimiento || "ÓPTIMO",
        fecha_mantenimiento: fecha_mantenimiento || "No Agendada"
      };
      mockVehiculos.unshift(newCar);
      return res.json({ success: true, data: mockVehiculos, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Agendar Mantenimiento
app.put("/api/vehiculos/:placa/mantenimiento", async (req, res) => {
  const { placa } = req.params;
  const { fecha_mantenimiento, estado_mantenimiento } = req.body;

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("placa", mssql.NVarChar, placa)
        .input("fecha", mssql.NVarChar, fecha_mantenimiento)
        .input("estado", mssql.NVarChar, estado_mantenimiento || "PRÓXIMO 15D")
        .query(`UPDATE vehiculos SET fecha_mantenimiento = @fecha, estado_mantenimiento = @estado WHERE placa = @placa`);

      const result = await dbPool.request().query("SELECT * FROM vehiculos ORDER BY placa ASC");
      return res.json({ success: true, data: result.recordset });
    } else {
      const idx = mockVehiculos.findIndex(v => v.placa === placa);
      if (idx !== -1) {
        mockVehiculos[idx].fecha_mantenimiento = fecha_mantenimiento;
        mockVehiculos[idx].estado_mantenimiento = estado_mantenimiento || "PRÓXIMO 15D";
      }
      return res.json({ success: true, data: mockVehiculos, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------------------
// 4. MONITOREO EN VIVO
// -----------------------------------------------------------------
app.get("/api/monitoreos", async (req, res) => {
  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      const result = await dbPool.request().query("SELECT * FROM monitoreos ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      return res.json({ success: true, data: mockMonitoreos, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/monitoreos", async (req, res) => {
  const { placa, tipo_carga, conductor, origen, destino, salida_fecha } = req.body;

  if (!placa || !tipo_carga || !conductor || !origen || !destino || !salida_fecha) {
    return res.status(400).json({ success: false, message: "Campos de monitoreo incompletos" });
  }

  const generatedId = "TRK-" + Math.floor(1000 + Math.random() * 9000);

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("id", mssql.NVarChar, generatedId)
        .input("placa", mssql.NVarChar, placa)
        .input("tipo", mssql.NVarChar, tipo_carga)
        .input("cond", mssql.NVarChar, conductor)
        .input("orig", mssql.NVarChar, origen)
        .input("dest", mssql.NVarChar, destino)
        .input("fecha", mssql.NVarChar, salida_fecha)
        .input("estado", mssql.NVarChar, "EN RUTA")
        .query(`INSERT INTO monitoreos (id, placa, tipo_carga, conductor, origen, destino, salida_fecha, estado)
                VALUES (@id, @placa, @tipo, @cond, @orig, @dest, @fecha, @estado)`);

      const result = await dbPool.request().query("SELECT * FROM monitoreos ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      const newMo = {
        id: generatedId,
        placa,
        tipo_carga,
        conductor,
        origen,
        destino,
        salida_fecha: salida_fecha.replace("T", " "),
        estado: "EN RUTA" as const
      };
      mockMonitoreos.unshift(newMo);
      return res.json({ success: true, data: mockMonitoreos, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Update monitoring state (e.g. resolve to completado or update state)
app.put("/api/monitoreos/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("id", mssql.NVarChar, id)
        .input("estado", mssql.NVarChar, estado)
        .query("UPDATE monitoreos SET estado = @estado WHERE id = @id");

      const result = await dbPool.request().query("SELECT * FROM monitoreos ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      const idx = mockMonitoreos.findIndex(m => m.id === id);
      if (idx !== -1) {
        mockMonitoreos[idx].estado = estado;
      }
      return res.json({ success: true, data: mockMonitoreos, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------------------
// 5. INCIDENCIAS
// -----------------------------------------------------------------
app.get("/api/incidencias", async (req, res) => {
  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      const result = await dbPool.request().query("SELECT * FROM incidencias ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      return res.json({ success: true, data: mockIncidencias, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/incidencias", async (req, res) => {
  const { monitoreo_id, tipo_incidencia, fecha, hora, descripcion } = req.body;

  if (!monitoreo_id || !tipo_incidencia || !descripcion) {
    return res.status(400).json({ success: false, message: "Campos de incidencia incompletos" });
  }

  try {
    const dbPool = await getDbConnection();
    if (dbPool) {
      await dbPool.request()
        .input("mon_id", mssql.NVarChar, monitoreo_id)
        .input("tipo", mssql.NVarChar, tipo_incidencia)
        .input("fecha", mssql.NVarChar, fecha || new Date().toISOString().split('T')[0])
        .input("hora", mssql.NVarChar, hora || new Date().toTimeString().split(' ')[0].substring(0, 5))
        .input("desc", mssql.NVarChar, descripcion)
        .input("estado", mssql.NVarChar, "ACTIVA")
        .query(`INSERT INTO incidencias (monitoreo_id, tipo_incidencia, fecha, hora, descripcion, estado_alerta)
                VALUES (@mon_id, @tipo, @fecha, @hora, @desc, @estado)`);

      // Update monitoring status to INCIDENCIA too
      await dbPool.request()
        .input("mon_id", mssql.NVarChar, monitoreo_id)
        .query("UPDATE monitoreos SET estado = 'INCIDENCIA' WHERE id = @mon_id");

      const result = await dbPool.request().query("SELECT * FROM incidencias ORDER BY id DESC");
      return res.json({ success: true, data: result.recordset });
    } else {
      const newId = mockIncidencias.length > 0 ? Math.max(...mockIncidencias.map(i => i.id)) + 1 : 1;
      const newInc = {
        id: newId,
        monitoreo_id,
        tipo_incidencia,
        fecha: fecha || new Date().toISOString().split('T')[0],
        hora: hora || new Date().toTimeString().split(' ')[0].substring(0, 5),
        descripcion,
        estado_alerta: "ACTIVA"
      };
      mockIncidencias.unshift(newInc);

      // Force update of monitoring state to INCIDENCIA in mock as well
      const refIdx = mockMonitoreos.findIndex(m => m.id === monitoreo_id);
      if (refIdx !== -1) {
        mockMonitoreos[refIdx].estado = "INCIDENCIA";
      }

      return res.json({ success: true, data: mockIncidencias, fallback: true });
    }
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// -----------------------------------------------------------------
// VITE AND STATIC BUNDLE MIDDLEWARE SETUP
// -----------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Industrial Server] running on http://localhost:${PORT}`);
  });
}

startServer();
