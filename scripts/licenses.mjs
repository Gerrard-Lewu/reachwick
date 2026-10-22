import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
const records = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (
      entry.name.startsWith(".") ||
      entry.isSymbolicLink() ||
      !entry.isDirectory()
    )
      continue;
    const folder = path.join(dir, entry.name);
    if (entry.name.startsWith("@")) {
      await scan(folder);
      continue;
    }
    const pkg = JSON.parse(
      await readFile(path.join(folder, "package.json"), "utf8"),
    );
    const names = await readdir(folder);
    const license = names.find((n) => /^licen[sc]e(?:[.-]|$)/i.test(n));
    const text = license
      ? await readFile(path.join(folder, license), "utf8")
      : "License expression: " +
        JSON.stringify(pkg.license || "REVIEW REQUIRED");
    records.push(`${pkg.name}@${pkg.version}\n${text.trim()}\n`);
    if (names.includes("node_modules"))
      await scan(path.join(folder, "node_modules"));
  }
}
await scan("node_modules");
records.sort();
await writeFile(
  "THIRD_PARTY_LICENSES.txt",
  "Installed dependency notices (runtime and development tools). Regenerate after npm ci.\n\n" +
    records.join("\n----------------------------------------\n\n"),
);
console.log(`Recorded ${records.length} dependency notices.`);
