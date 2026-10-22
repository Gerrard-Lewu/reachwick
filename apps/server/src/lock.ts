import { openSync, closeSync, unlinkSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
export function acquireLock(path: string) {
  mkdirSync(dirname(path), { recursive: true });
  let fd: number;
  try {
    fd = openSync(path + ".lock", "wx", 0o600);
  } catch {
    throw new Error(
      "Database in use or stale .lock exists. Stop Reachwick; remove a stale lock only after verifying no process is using the database.",
    );
  }
  return () => {
    closeSync(fd);
    unlinkSync(path + ".lock");
  };
}
