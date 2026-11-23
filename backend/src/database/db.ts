import 'dotenv/config';
import { randomBytes } from 'crypto';
import pg from 'pg';


const pool = new pg.Pool({
  connectionString: process.env['DATABASE_URL'],
  // Render/Neon/Supabase normalmente exigem SSL. Defina DATABASE_SSL=true no .env se precisar.
  ssl: process.env['DATABASE_SSL'] === 'true' ? { rejectUnauthorized: false } : undefined,
});

export const db = {
  /** Executa uma query e devolve todas as linhas. */
  async many<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
    const result = await pool.query(sql, params);
    return result.rows as T[];
  },

  /** Executa uma query e devolve a primeira linha (ou null se não houver). */
  async one<T = any>(sql: string, params: unknown[] = []): Promise<T | null> {
    const result = await pool.query(sql, params);
    return (result.rows[0] as T) ?? null;
  },

  /** Fecha o pool (útil em scripts e testes). */
  async close() {
    await pool.end();
  },
};

/** Gera um UUID v7 (ordenável por tempo), igual ao que o Prisma gerava. */
export function uuidv7(): string {
  const bytes = randomBytes(16);
  const ts = BigInt(Date.now());
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // versão 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC 4122
  const h = bytes.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
