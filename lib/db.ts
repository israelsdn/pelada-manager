import mysql from "mysql2/promise";

// Em dev, o Next recarrega módulos a cada mudança de arquivo - guardamos o
// pool no objeto global para não abrir uma conexão nova a cada hot-reload.
const globalParaPool = globalThis as unknown as { poolMysql?: mysql.Pool };

function criarPool(): mysql.Pool {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error(
      "DATABASE_URL não configurada. Defina no .env.local, ex: mysql://usuario:senha@localhost:3306/pelada"
    );
  }
  return mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: false,
    // Força leitura/escrita de datas em UTC, independente do fuso horário
    // configurado no servidor MySQL - evita divergência entre "agora" no
    // Node e "agora" no banco.
    timezone: "Z",
  });
}

export const pool = globalParaPool.poolMysql ?? criarPool();

if (process.env.NODE_ENV !== "production") {
  globalParaPool.poolMysql = pool;
}
