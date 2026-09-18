import pg from "pg";
import { env } from "../config.js";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export async function query<T = unknown>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}
