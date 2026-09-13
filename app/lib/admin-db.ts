export type NewsStatus = "draft" | "published";

export type NewsPost = {
  id: number;
  title_de: string;
  title_en: string;
  excerpt_de: string;
  excerpt_en: string;
  link_url: string;
  link_label_de: string;
  link_label_en: string;
  status: NewsStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminUser = {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  password_hash: string;
  password_salt: string;
  active: number;
  created_at: string;
  updated_at: string;
};

export async function ensureAdminDatabase(database: D1Database) {
  if (!database) throw new Error("Administration database is unavailable.");
  await database.batch([
    database.prepare("CREATE TABLE IF NOT EXISTS news_posts (id INTEGER PRIMARY KEY AUTOINCREMENT, title_de TEXT NOT NULL, title_en TEXT NOT NULL, excerpt_de TEXT NOT NULL, excerpt_en TEXT NOT NULL, link_url TEXT NOT NULL DEFAULT '/buchen', link_label_de TEXT NOT NULL DEFAULT 'Mehr erfahren', link_label_en TEXT NOT NULL DEFAULT 'Learn more', status TEXT NOT NULL DEFAULT 'draft', starts_at TEXT, ends_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_news_posts_publication ON news_posts(status, starts_at, ends_at)"),
    database.prepare("CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, display_name TEXT NOT NULL, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username)"),
    database.prepare("CREATE TABLE IF NOT EXISTS password_reset_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, token_hash TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)"),
    database.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)"),
    database.prepare("CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(username, expires_at)"),
  ]);
  const userColumns = await database.prepare("PRAGMA table_info(admin_users)").all<{name:string}>();
  if (!userColumns.results.some((column)=>column.name === "email")) await database.prepare("ALTER TABLE admin_users ADD COLUMN email TEXT").run();
  await database.prepare("PRAGMA optimize").run();
  return database;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export async function hashPassword(password: string, saltBase64?: string) {
  const salt = saltBase64 ? Uint8Array.from(atob(saltBase64), (character) => character.charCodeAt(0)) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 210_000 }, key, 256);
  return { hash: bytesToBase64(new Uint8Array(bits)), salt: bytesToBase64(salt) };
}

export async function verifyPassword(password: string, hash: string, salt: string) {
  const candidate = await hashPassword(password, salt);
  if (candidate.hash.length !== hash.length) return false;
  let mismatch = 0;
  for (let index = 0; index < hash.length; index += 1) mismatch |= candidate.hash.charCodeAt(index) ^ hash.charCodeAt(index);
  return mismatch === 0;
}
