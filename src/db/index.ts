import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";

export const createPool = () => {
  const host = process.env.SQL_HOST;
  const dbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_USER;
  const password = process.env.SQL_PASSWORD;

  if (!host || !dbName || !user || !password) {
    console.warn("Database connection environment variables are missing. Database client is inactive.");
  }

  return new Pool({
    host: host || "localhost",
    user: user || "postgres",
    password: password || "postgres",
    database: dbName || "postgres",
    connectionTimeoutMillis: 15000,
  });
};

const pool = createPool();

pool.on("error", (err) => {
  console.error("Unexpected error on idle SQL pool client:", err);
});

export const db = drizzle(pool, { schema });
