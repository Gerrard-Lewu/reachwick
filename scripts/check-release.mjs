import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
const banned = [
  new RegExp("ex" + "plee", "i"),
  new RegExp("auto" + "gtm", "i"),
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /AKIA[0-9A-Z]{16}/,
];
const skip = new Set(["node_modules", ".git", "data", "backups", "coverage"]);
const failures = [];
async function visit(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (skip.has(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isSymbolicLink()) {
      failures.push(`${f}: symlink requires review`);
      continue;
    }
    if (e.isDirectory()) {
      await visit(f);
      continue;
    }
    if (
      /\.env$|\.(?:db|sqlite)(?:-|$)|capture|screenshot|journal/i.test(e.name)
    )
      failures.push(`${f}: private material requires review`);
    const bytes = await readFile(f);
    if (
      banned.some(
        (pattern) => pattern.test(f) || pattern.test(bytes.toString("utf8")),
      )
    )
      failures.push(`${f}: prohibited branding or secret pattern`);
  }
}
await visit(process.cwd());
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("Release source and artifact screening passed.");
