import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.DATABASE_PATH || "/app/data/viennaflight.sqlite";
mkdirSync(dirname(databasePath), { recursive: true });

const sqlite = new DatabaseSync(databasePath);
sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");

function serializable(value) {
  return typeof value === "bigint" ? Number(value) : value;
}

function row(record) {
  if (!record) return null;
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, serializable(value)]),
  );
}

class NodeD1Statement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new NodeD1Statement(this.database, this.sql, values);
  }

  async first(column) {
    const result = row(this.database.prepare(this.sql).get(...this.values));
    return column && result ? result[column] ?? null : result;
  }

  async all() {
    const results = this.database
      .prepare(this.sql)
      .all(...this.values)
      .map(row);
    return { results, success: true, meta: {} };
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return {
      success: true,
      meta: {
        changes: Number(result.changes),
        last_row_id: Number(result.lastInsertRowid),
      },
    };
  }

  async raw() {
    const statement = this.database.prepare(this.sql);
    const columns = statement.columns().map((column) => column.name);
    return statement
      .all(...this.values)
      .map((record) => columns.map((column) => serializable(record[column])));
  }
}

class NodeD1Database {
  prepare(sql) {
    return new NodeD1Statement(sqlite, sql);
  }

  async batch(statements) {
    sqlite.exec("BEGIN IMMEDIATE");
    try {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      sqlite.exec("COMMIT");
      return results;
    } catch (error) {
      sqlite.exec("ROLLBACK");
      throw error;
    }
  }

  async exec(sql) {
    sqlite.exec(sql);
    return { count: 0, duration: 0 };
  }
}

export const env = {
  DB: new NodeD1Database(),
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  BOOKING_EMAIL_FROM: process.env.BOOKING_EMAIL_FROM,
  BOOKING_REPLY_TO: process.env.BOOKING_REPLY_TO,
  ADMIN_EMAIL_FROM: process.env.ADMIN_EMAIL_FROM,
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
};
