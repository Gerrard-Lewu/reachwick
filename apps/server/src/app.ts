import { acquireLock } from "./lock.js";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import staticPlugin from "@fastify/static";
import {
  z,
  leadSchema,
  campaignSchema,
  scheduleSchema,
} from "../../../packages/shared/src/index.js";
import { openDb } from "./db.js";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { isIP } from "node:net";
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const normalizeIp = (ip: string) =>
  ip.toLowerCase().startsWith("::ffff:") ? ip.slice(7) : ip.toLowerCase();
export function quoteCsvCell(value: string) {
  const formulaLike = /^[\s\p{Cc}]*[=+\-@＝＋－＠]/u.test(value);
  const safeValue = formulaLike ? "'" + value : value;
  return '"' + safeValue.replaceAll('"', '""') + '"';
}
export async function createApp(
  databasePath?: string,
  options: { trustedTunnelProxyIp?: string } = {},
) {
  const configuredProxyIp =
    options.trustedTunnelProxyIp ?? process.env.TRUSTED_TUNNEL_PROXY_IP ?? "";
  const trustedTunnelProxyIp = normalizeIp(configuredProxyIp.trim());
  if (trustedTunnelProxyIp && isIP(trustedTunnelProxyIp) === 0)
    throw new Error("TRUSTED_TUNNEL_PROXY_IP must be a valid IP address");
  const release = acquireLock(
    databasePath || process.env.DATABASE_PATH || "data/reachwick.sqlite",
  );
  let db: ReturnType<typeof openDb>;
  try {
    db = openDb(databasePath);
  } catch (error) {
    release();
    throw error;
  }
  const app = Fastify({ bodyLimit: 1048576, logger: false });
  await app.register(cookie);
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    keyGenerator: (req) => {
      const peerIp = normalizeIp(req.raw.socket.remoteAddress || "");
      const cloudflareClientIp = req.headers["cf-connecting-ip"];
      if (
        trustedTunnelProxyIp &&
        peerIp === trustedTunnelProxyIp &&
        typeof cloudflareClientIp === "string" &&
        isIP(cloudflareClientIp.trim()) !== 0
      )
        return normalizeIp(cloudflareClientIp.trim());
      return req.ip;
    },
  });
  app.addHook("onClose", async () => {
    db.close();
    release();
  });
  app.setErrorHandler((error: any, _req, reply) => {
    reply
      .code(
        error instanceof z.ZodError
          ? 400
          : error.code === "SQLITE_CONSTRAINT_UNIQUE"
            ? 409
            : error.code?.startsWith("SQLITE_CONSTRAINT")
              ? 400
              : error.statusCode || 500,
      )
      .send({
        error:
          error instanceof z.ZodError
            ? "Invalid input"
            : error.code === "SQLITE_CONSTRAINT_UNIQUE"
              ? "Record already exists"
              : error.statusCode
                ? error.message
                : "Unable to complete request",
      });
  });
  app.addHook("onRequest", async (req, reply) => {
    if (!(req.routeOptions.url || req.url).startsWith("/api/")) return;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (
        origin &&
        origin !== (process.env.PUBLIC_ORIGIN || `http://${req.headers.host}`)
      )
        return reply.code(403).send({ error: "Origin rejected" });
      if (!req.headers["content-type"]?.startsWith("application/json"))
        return reply.code(415).send({ error: "JSON required" });
    }
    if (req.routeOptions.url === "/api/v1/auth/login") return;
    const token = req.cookies.session;
    if (
      !token ||
      !db
        .prepare("SELECT token FROM sessions WHERE token=? AND expires>?")
        .get(digest(token), Date.now())
    )
      return reply.code(401).send({ error: "Authentication required" });
  });
  app.addHook("onSend", async (_req, reply, payload) => {
    reply
      .header("X-Content-Type-Options", "nosniff")
      .header("X-Frame-Options", "DENY")
      .header("Referrer-Policy", "no-referrer")
      .header(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      );
    return payload;
  });
  app.get("/healthz", async () => ({ status: "ok" }));
  app.post(
    "/api/v1/auth/login",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = z
        .object({ email: z.email(), password: z.string().max(1024) })
        .parse(req.body);
      const owner = db
        .prepare("SELECT * FROM owner WHERE email=?")
        .get(body.email.toLowerCase()) as any;
      const [salt, hash] = (owner?.password || "none:" + "00".repeat(64)).split(
        ":",
      );
      if (
        !timingSafeEqual(
          scryptSync(body.password, salt, 64),
          Buffer.from(hash, "hex"),
        )
      )
        return reply.code(401).send({ error: "Invalid credentials" });
      db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
      const token = randomBytes(32).toString("hex");
      db.prepare("INSERT INTO sessions VALUES(?,?)").run(
        digest(token),
        Date.now() + 86400000,
      );
      reply.setCookie("session", token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.PUBLIC_ORIGIN?.startsWith("https:") || false,
        path: "/",
        maxAge: 86400,
      });
      return { email: owner.email };
    },
  );
  app.get("/api/v1/auth/me", async () =>
    db.prepare("SELECT email FROM owner").get(),
  );
  app.post("/api/v1/auth/logout", async (req, reply) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(
      digest(req.cookies.session || ""),
    );
    reply.clearCookie("session", { path: "/" });
    return { ok: true };
  });
  const id = (v: any) => z.coerce.number().int().positive().parse(v);
  const requireRecord = (table: string, i: number) => {
    if (!db.prepare("SELECT id FROM " + table + " WHERE id=?").get(i))
      throw Object.assign(new Error("Not found"), { statusCode: 404 });
  };
  app.get("/api/v1/leads", async (req) => {
    const q = z
      .object({
        q: z.string().max(200).default(""),
        status: z.string().max(30).default(""),
      })
      .parse(req.query);
    return db
      .prepare(
        "SELECT * FROM leads WHERE (name LIKE ? OR email LIKE ? OR company LIKE ?) AND (?='' OR status=?) ORDER BY id DESC LIMIT 10000",
      )
      .all(...Array(3).fill("%" + q.q + "%"), q.status, q.status);
  });
  app.post("/api/v1/leads", async (req) => {
    const v = leadSchema.parse(req.body);
    const r = db
      .prepare(
        "INSERT INTO leads(email,name,company,status,notes) VALUES(?,?,?,?,?)",
      )
      .run(v.email, v.name, v.company, v.status, v.notes);
    return { id: Number(r.lastInsertRowid), ...v };
  });
  app.put("/api/v1/leads/:id", async (req) => {
    const v = leadSchema.parse(req.body);
    const i = id((req.params as any).id);
    requireRecord("leads", i);
    db.prepare(
      "UPDATE leads SET email=?,name=?,company=?,status=?,notes=? WHERE id=?",
    ).run(v.email, v.name, v.company, v.status, v.notes, i);
    return { id: i, ...v };
  });
  for (const resource of ["leads", "campaigns", "suppression"])
    app.delete("/api/v1/" + resource + "/:id", async (req) => {
      const i = id((req.params as any).id);
      requireRecord(resource, i);
      db.prepare(`DELETE FROM ${resource} WHERE id=?`).run(i);
      return { ok: true };
    });
  app.get("/api/v1/leads/export", async (_req, reply) => {
    const rows = db
      .prepare("SELECT email,name,company,status,notes FROM leads ORDER BY id")
      .all() as any[];
    reply
      .type("text/csv")
      .header("Content-Disposition", 'attachment; filename="leads.csv"');
    return (
      "email,name,company,status,notes\r\n" +
      rows
        .map((r) =>
          Object.values(r)
            .map((v) => quoteCsvCell(String(v)))
            .join(","),
        )
        .join("\r\n")
    );
  });
  app.post("/api/v1/leads/import", async (req) => {
    const { csv } = z.object({ csv: z.string().max(900000) }).parse(req.body);
    const rows = parseCsv(csv);
    const headers = rows.shift() || [];
    if (!headers.includes("email"))
      throw Object.assign(new Error("email header required"), {
        statusCode: 400,
      });
    if (rows.length > 5000)
      throw Object.assign(new Error("5000 rows maximum"), { statusCode: 400 });
    let imported = 0;
    const errors: any[] = [];
    db.transaction(() =>
      rows.forEach((row, i) => {
        try {
          const v = leadSchema.parse(
            Object.fromEntries(headers.map((h, j) => [h, row[j] || ""])),
          );
          db.prepare(
            "INSERT INTO leads(email,name,company,status,notes) VALUES(?,?,?,?,?)",
          ).run(v.email, v.name, v.company, v.status, v.notes);
          imported++;
        } catch {
          errors.push({ row: i + 2, error: "Invalid or duplicate lead" });
        }
      }),
    )();
    return { imported, errors };
  });
  app.get("/api/v1/campaigns", async () =>
    db.prepare("SELECT * FROM campaigns ORDER BY id DESC").all(),
  );
  app.post("/api/v1/campaigns", async (req) => {
    const v = campaignSchema.parse(req.body);
    const r = db
      .prepare("INSERT INTO campaigns(name,status) VALUES(?,?)")
      .run(v.name, v.status);
    return { id: Number(r.lastInsertRowid), ...v };
  });
  app.put("/api/v1/campaigns/:id", async (req) => {
    const v = campaignSchema.parse(req.body);
    const i = id((req.params as any).id);
    requireRecord("campaigns", i);
    db.prepare("UPDATE campaigns SET name=?,status=? WHERE id=?").run(
      v.name,
      v.status,
      i,
    );
    return { id: i, ...v };
  });
  app.get("/api/v1/campaigns/:id", async (req, reply) => {
    const i = id((req.params as any).id);
    const c = db.prepare("SELECT * FROM campaigns WHERE id=?").get(i) as any;
    if (!c) return reply.code(404).send({ error: "Not found" });
    return {
      ...c,
      steps: db
        .prepare(
          "SELECT subject,body FROM steps WHERE campaign_id=? ORDER BY position",
        )
        .all(i),
      schedule: JSON.parse(
        (
          db
            .prepare("SELECT value FROM schedules WHERE campaign_id=?")
            .get(i) as any
        )?.value || "null",
      ),
      leadIds: (
        db
          .prepare("SELECT lead_id FROM members WHERE campaign_id=?")
          .all(i) as any[]
      ).map((r) => r.lead_id),
    };
  });
  app.put("/api/v1/campaigns/:id/steps", async (req) => {
    const i = id((req.params as any).id);
    requireRecord("campaigns", i);
    const v = z
      .object({
        steps: z
          .array(
            z.object({
              subject: z.string().max(500),
              body: z.string().max(20000),
            }),
          )
          .max(50),
      })
      .parse(req.body);
    db.transaction(() => {
      db.prepare("DELETE FROM steps WHERE campaign_id=?").run(i);
      v.steps.forEach((s, p) =>
        db
          .prepare(
            "INSERT INTO steps(campaign_id,position,subject,body) VALUES(?,?,?,?)",
          )
          .run(i, p, s.subject, s.body),
      );
    })();
    return v;
  });
  app.put("/api/v1/campaigns/:id/schedule", async (req) => {
    const v = scheduleSchema.parse(req.body);
    db.prepare("INSERT OR REPLACE INTO schedules VALUES(?,?)").run(
      id((req.params as any).id),
      JSON.stringify(v),
    );
    return v;
  });
  app.put("/api/v1/campaigns/:id/members", async (req) => {
    const i = id((req.params as any).id);
    requireRecord("campaigns", i);
    const v = z
      .object({ leadIds: z.array(z.number().int().positive()).max(10000) })
      .parse(req.body);
    db.transaction(() => {
      db.prepare("DELETE FROM members WHERE campaign_id=?").run(i);
      for (const lead of new Set(v.leadIds))
        db.prepare("INSERT INTO members VALUES(?,?)").run(i, lead);
    })();
    return v;
  });
  app.get("/api/v1/suppression", async () =>
    db.prepare("SELECT * FROM suppression").all(),
  );
  app.post("/api/v1/suppression", async (req) => {
    const v = z
      .object({
        email: z.email().transform((s) => s.toLowerCase()),
        reason: z.string().max(1000).default(""),
      })
      .parse(req.body);
    const r = db
      .prepare("INSERT INTO suppression(email,reason) VALUES(?,?)")
      .run(v.email, v.reason);
    return { id: Number(r.lastInsertRowid), ...v };
  });
  app.get("/api/v1/settings", async () =>
    JSON.parse((db.prepare("SELECT value FROM settings").get() as any).value),
  );
  app.put("/api/v1/settings", async (req) => {
    const v = z
      .object({
        workspaceName: z.string().trim().min(1).max(100),
        timezone: scheduleSchema.shape.timezone,
      })
      .parse(req.body);
    db.prepare("UPDATE settings SET value=?").run(JSON.stringify(v));
    return v;
  });
  app.get("/api/v1/dashboard", async () => ({
    leads: (db.prepare("SELECT count(*) n FROM leads").get() as any).n,
    campaigns: (db.prepare("SELECT count(*) n FROM campaigns").get() as any).n,
    suppressed: (db.prepare("SELECT count(*) n FROM suppression").get() as any)
      .n,
    qualified: (
      db
        .prepare("SELECT count(*) n FROM leads WHERE status='qualified'")
        .get() as any
    ).n,
  }));
  const frontend = resolve(process.env.FRONTEND_DIST || "../web/dist");
  if (existsSync(frontend)) {
    await app.register(staticPlugin, { root: frontend });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith("/api/")
        ? reply.code(404).send({ error: "Not found" })
        : reply.sendFile("index.html"),
    );
  }
  return app;
}
export function parseCsv(input: string) {
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (c === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (c === "\n" && !quoted) {
      row.push(field.replace(/\r$/, ""));
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted)
    throw Object.assign(new Error("Unclosed CSV quote"), { statusCode: 400 });
  row.push(field.replace(/\r$/, ""));
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
