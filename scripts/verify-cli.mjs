import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  statSync,
  chmodSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
const dir = mkdtempSync(join(tmpdir(), "reachwick-cli-"));
const database = join(dir, "app.sqlite");
const password = join(dir, "owner.secret");
writeFileSync(password, "Synthetic-test-password-2026", { mode: 0o600 });
const env = {
  ...process.env,
  DATABASE_PATH: database,
  OWNER_EMAIL: "owner@example.test",
  OWNER_PASSWORD: "",
  OWNER_PASSWORD_FILE: password,
};
function cli(command, ...args) {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", resolve("apps/server/src/cli.ts"), command, ...args],
    { env, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
}
try {
  const previousUmask =
    process.platform === "win32" ? undefined : process.umask(0);
  try {
    cli("owner:setup");
    cli("seed");
    if (process.platform !== "win32")
      assert.equal(statSync(database).mode & 0o777, 0o600);
    const backup = join(dir, "backup.sqlite");
    cli("backup", backup);
    if (process.platform !== "win32")
      assert.equal(statSync(backup).mode & 0o777, 0o600);
    if (process.platform !== "win32") chmodSync(backup, 0o644);
    let db = new Database(database);
    assert.equal(db.prepare("SELECT count(*) AS n FROM leads").get().n, 1);
    db.prepare("DELETE FROM leads").run();
    db.prepare("INSERT INTO sessions VALUES(?,?)").run(
      "synthetic-token",
      Date.now() + 10000,
    );
    db.close();
    cli("owner:reset");
    db = new Database(database);
    assert.equal(db.prepare("SELECT count(*) AS n FROM sessions").get().n, 0);
    db.close();
    cli("restore", backup);
    if (process.platform !== "win32") {
      assert.equal(statSync(database).mode & 0o777, 0o600);
      assert.equal(existsSync(database + ".restore"), false);
    }
    db = new Database(database);
    assert.equal(db.prepare("SELECT count(*) AS n FROM leads").get().n, 1);
    assert.equal(db.pragma("integrity_check", { simple: true }), "ok");
    db.close();
    console.log(
      "CLI setup, seed, reset/revocation, backup and restore passed.",
    );
  } finally {
    if (previousUmask !== undefined) process.umask(previousUmask);
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
