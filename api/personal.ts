import mssql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const dbConfig = {
  server: process.env.DB_SERVER || "",
  port: parseInt(process.env.DB_PORT || "1433", 10),
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "seguimiento_carga_ancha",
  options: {
    encrypt: true,
    trustServerCertificate: true,
    connectTimeout: 8000
  }
};

let pool: mssql.ConnectionPool | null = null;

async function getDbConnection(): Promise<mssql.ConnectionPool | null> {
  if (pool) return pool;
  if (!dbConfig.server || !dbConfig.user) {
    return null;
  }
  try {
    pool = await mssql.connect(dbConfig);
    return pool;
  } catch (err) {
    console.error("Vercel Function fail connecting to SQL Server:", err);
    return null;
  }
}

// Memory fallback for standalone demo
let mockPersonal = [
  { id: 1, nombre_completo: "Super Administrador", correo: "admin@petromapi.com", documento: "10443322112", telefono: "999888777", rol: "Administradores", contrasena: "petromapi123" },
  { id: 2, nombre_completo: "Ricardo Castillo Mora", correo: "castillo@petromapi.com", documento: "09887766", telefono: "900111222", rol: "Conductor de Ruta", contrasena: "petromapi123" },
  { id: 3, nombre_completo: "Juan Perez Soto", correo: "perez@petromapi.com", documento: "08776655", telefono: "922333444", rol: "Conductor de Ruta", contrasena: "petromapi123" },
  { id: 4, nombre_completo: "Maria Alva Ramos", correo: "alva@petromapi.com", documento: "07665544", telefono: "955666777", rol: "Conductor de Ruta", contrasena: "petromapi123" }
];

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Handle potential path params from query or body
  const id = req.query?.id || req.body?.id;

  try {
    const dbPool = await getDbConnection();

    if (req.method === 'GET') {
      if (dbPool) {
        const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
        return res.status(200).json({ success: true, data: result.recordset });
      } else {
        return res.status(200).json({ success: true, data: mockPersonal, fallback: true });
      }
    }

    if (req.method === 'POST') {
      const { nombre_completo, correo, documento, telefono, rol, contrasena } = req.body || {};
      if (!nombre_completo || !correo || !documento || !telefono || !rol || !contrasena) {
        return res.status(400).json({ success: false, message: "Faltan registrar campos obligatorios" });
      }

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
          .input("pass", mssql.NVarChar, contrasena)
          .query(`INSERT INTO personal (nombre_completo, correo, documento, telefono, rol, contrasena) 
                  VALUES (@nombre, @correo, @doc, @telf, @rol, @pass)`);

        const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
        return res.status(200).json({ success: true, data: result.recordset, message: "Personal registrado correctamente en SQL Server" });
      } else {
        if (mockPersonal.some(u => u.correo === correo)) {
          return res.status(400).json({ success: false, message: "El correo ya se encuentra registrado" });
        }
        const newId = mockPersonal.length > 0 ? Math.max(...mockPersonal.map(p => p.id)) + 1 : 1;
        const newEntry = { id: newId, nombre_completo, correo, documento, telefono, rol, contrasena };
        mockPersonal.unshift(newEntry);
        return res.status(200).json({ success: true, data: mockPersonal, fallback: true, message: "Personal registrado temporalmente en memoria" });
      }
    }

    if (req.method === 'PUT') {
      if (!id) {
        return res.status(400).json({ success: false, message: "ID de personal requerido para actualizar" });
      }
      const targetId = parseInt(id, 10);
      const { nombre_completo, correo, documento, telefono, rol, contrasena } = req.body || {};

      if (dbPool) {
        await dbPool.request()
          .input("id", mssql.Int, targetId)
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
        return res.status(200).json({ success: true, data: result.recordset });
      } else {
        const idx = mockPersonal.findIndex(u => u.id === targetId);
        if (idx !== -1) {
          mockPersonal[idx] = {
            ...mockPersonal[idx],
            nombre_completo: nombre_completo || mockPersonal[idx].nombre_completo,
            correo: correo || mockPersonal[idx].correo,
            documento: documento || mockPersonal[idx].documento,
            telefono: telefono || mockPersonal[idx].telefono,
            rol: rol || mockPersonal[idx].rol,
            contrasena: contrasena || mockPersonal[idx].contrasena
          };
        }
        return res.status(200).json({ success: true, data: mockPersonal, fallback: true });
      }
    }

    if (req.method === 'DELETE') {
      if (!id) {
        return res.status(400).json({ success: false, message: "ID de personal requerido para eliminar" });
      }
      const targetId = parseInt(id, 10);

      if (dbPool) {
        await dbPool.request()
          .input("id", mssql.Int, targetId)
          .query("DELETE FROM personal WHERE id = @id");

        const result = await dbPool.request().query("SELECT * FROM personal ORDER BY id DESC");
        return res.status(200).json({ success: true, data: result.recordset });
      } else {
        mockPersonal = mockPersonal.filter(u => u.id !== targetId);
        return res.status(200).json({ success: true, data: mockPersonal, fallback: true });
      }
    }

    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || String(error) });
  }
}
