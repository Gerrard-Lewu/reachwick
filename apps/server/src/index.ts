import { createApp } from "./app.js";
let app: Awaited<ReturnType<typeof createApp>> | undefined;
try {
  if (process.env.PUBLIC_ORIGIN) {
    const origin = new URL(process.env.PUBLIC_ORIGIN);
    if (
      origin.origin !== process.env.PUBLIC_ORIGIN ||
      !["http:", "https:"].includes(origin.protocol) ||
      (origin.protocol === "http:" &&
        !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname))
    )
      throw new Error(
        "PUBLIC_ORIGIN must be an HTTPS origin or localhost HTTP origin",
      );
  }
  app = await createApp();
  await app.listen({
    host: process.env.HOST || "127.0.0.1",
    port: Number(process.env.PORT || 3000),
  });
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => void app?.close());
} catch (error) {
  await app?.close();
  console.error(
    "Reachwick could not start. Check database permissions, PUBLIC_ORIGIN, and port availability.",
    error instanceof Error ? error.message : "Unknown startup failure",
  );
  process.exitCode = 1;
}
