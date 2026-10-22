import Database from "better-sqlite3";
import { chmodSync, closeSync, mkdirSync, openSync } from "node:fs";
import { dirname } from "node:path";

export function createPrivateSqliteFile(path: string) {
  const fd = openSync(path, "wx", 0o600);
  closeSync(fd);
}

export function restrictSqliteFiles(path: string) {
  if (process.platform === "win32" || path === ":memory:") return;
  for (const file of [path, `${path}-wal`, `${path}-shm`, `${path}-journal`]) {
    try {
      chmodSync(file, 0o600);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new Error("Unable to restrict SQLite file permissions", {
          cause: error,
        });
    }
  }
}

function prepareDatabaseFile(path: string) {
  if (path === ":memory:") return;
  try {
    createPrivateSqliteFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST")
      throw new Error("Unable to create a private SQLite database file", {
        cause: error,
      });
  }
  restrictSqliteFiles(path);
}

export function openDb(
  path = process.env.DATABASE_PATH || "data/reachwick.sqlite",
) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  prepareDatabaseFile(path);
  const db = new Database(path);
  try {
    const version = db.pragma("user_version", { simple: true }) as number;
    if (version > 1)
      throw new Error("Database version is newer than this application");
    db.pragma("foreign_keys = ON");
    db.pragma("journal_mode = WAL");
    db.exec(
      `BEGIN;CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);CREATE TABLE IF NOT EXISTS owner(email TEXT PRIMARY KEY,password TEXT NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS leads(id INTEGER PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,company TEXT NOT NULL,status TEXT NOT NULL,notes TEXT NOT NULL);CREATE TABLE IF NOT EXISTS campaigns(id INTEGER PRIMARY KEY,name TEXT NOT NULL,status TEXT NOT NULL);CREATE TABLE IF NOT EXISTS steps(id INTEGER PRIMARY KEY,campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,position INTEGER,subject TEXT,body TEXT);CREATE TABLE IF NOT EXISTS schedules(campaign_id INTEGER PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,value TEXT);CREATE TABLE IF NOT EXISTS members(campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,PRIMARY KEY(campaign_id,lead_id));CREATE TABLE IF NOT EXISTS suppression(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,reason TEXT NOT NULL);CREATE TABLE IF NOT EXISTS settings(id INTEGER PRIMARY KEY CHECK(id=1),value TEXT NOT NULL);INSERT OR IGNORE INTO migrations VALUES(1);INSERT OR IGNORE INTO settings VALUES(1,'{"workspaceName":"Reachwick","timezone":"UTC"}');PRAGMA user_version=1;COMMIT;`,
    );
    restrictSqliteFiles(path);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}
