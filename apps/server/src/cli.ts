import { acquireLock } from "./lock.js";
import { createPrivateSqliteFile, openDb, restrictSqliteFiles } from "./db.js";
import { hashPassword } from "./app.js";
import Database from "better-sqlite3";
import {
  readFileSync,
  existsSync,
  copyFileSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { z } from "zod";
async function passwordPrompt() {
  if (!process.stdin.isTTY)
    throw new Error("Set OWNER_PASSWORD_FILE for unattended setup");
  process.stdout.write("Owner password (12+ characters): ");
  process.stdin.setRawMode(true);
  process.stdin.resume();
  return new Promise<string>((accept, reject) => {
    let value = "";
    const handler = (chunk: Buffer) => {
      for (const c of chunk.toString()) {
        if (c === "\u0003") {
          cleanup();
          reject(new Error("Cancelled"));
          return;
        }
        if (c === "\r" || c === "\n") {
          cleanup();
          accept(value);
          return;
        }
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    const cleanup = () => {
      process.stdin.off("data", handler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    process.stdin.on("data", handler);
  });
}
const command = process.argv[2];
const target = process.argv[3];
if (command === "restore") {
  if (!target || !existsSync(target))
    throw new Error(
      "Provide an existing backup file; stop server before restoring",
    );
  const dest = process.env.DATABASE_PATH || "data/reachwick.sqlite";
  if (resolve(target) === resolve(dest))
    throw new Error("Backup must differ from destination");
  const release = acquireLock(dest);
  const temporary = dest + ".restore";
  try {
    if (existsSync(dest + "-wal"))
      throw new Error(
        "Database has a WAL file; cleanly stop the application before restore",
      );
    const check = new Database(target, { readonly: true, fileMustExist: true });
    try {
      if (
        check.pragma("integrity_check", { simple: true }) !== "ok" ||
        check.pragma("user_version", { simple: true }) !== 1
      )
        throw new Error("Unsupported or invalid backup");
      for (const table of [
        "owner",
        "sessions",
        "leads",
        "campaigns",
        "steps",
        "members",
        "schedules",
        "suppression",
        "settings",
        "migrations",
      ])
        check.prepare("SELECT * FROM " + table + " LIMIT 0").all();
      if ((check.pragma("foreign_key_check") as unknown[]).length)
        throw new Error("Backup contains invalid references");
    } finally {
      check.close();
    }
    if (existsSync(temporary)) unlinkSync(temporary);
    createPrivateSqliteFile(temporary);
    copyFileSync(target, temporary);
    restrictSqliteFiles(temporary);
    renameSync(temporary, dest);
    console.log("Restored database");
  } finally {
    if (existsSync(temporary)) unlinkSync(temporary);
    release();
  }
} else {
  const db = openDb();
  try {
    if (command === "owner:setup" || command === "owner:reset") {
      let email = process.env.OWNER_EMAIL;
      if (!email && process.stdin.isTTY) {
        const prompt = createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        email = await prompt.question("Owner email: ");
        prompt.close();
      }
      const validEmail = z.email().parse(email).toLowerCase();
      const password = z
        .string()
        .min(12)
        .max(1024)
        .parse(
          process.env.OWNER_PASSWORD_FILE
            ? readFileSync(process.env.OWNER_PASSWORD_FILE, "utf8").trimEnd()
            : process.env.OWNER_PASSWORD || (await passwordPrompt()),
        );
      if (command === "owner:setup" && db.prepare("SELECT 1 FROM owner").get())
        throw new Error("Owner already exists");
      db.transaction(() => {
        db.prepare("DELETE FROM owner").run();
        db.prepare("INSERT INTO owner VALUES(?,?)").run(
          validEmail,
          hashPassword(password),
        );
        db.prepare("DELETE FROM sessions").run();
      })();
      console.log("Owner configured");
    } else if (command === "backup") {
      if (
        !target?.trim() ||
        target.trim() === ":memory:" ||
        resolve(target) ===
          resolve(process.env.DATABASE_PATH || "data/reachwick.sqlite") ||
        existsSync(target)
      )
        throw new Error("Provide a new backup file path");
      createPrivateSqliteFile(target);
      await db.backup(target);
      restrictSqliteFiles(target);
      console.log("Backup created");
    } else if (command === "seed") {
      db.prepare(
        "INSERT OR IGNORE INTO leads(email,name,company,status,notes) VALUES(?,?,?,?,?)",
      ).run(
        "alex@example.test",
        "Alex Sample",
        "Example Company",
        "new",
        "Synthetic example",
      );
      console.log("Synthetic example loaded");
    } else throw new Error("Unknown command");
  } finally {
    db.close();
  }
}
