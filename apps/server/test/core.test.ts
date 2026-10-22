import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, hashPassword } from "../src/app.js";
import { openDb } from "../src/db.js";
test("owner session, origin protection, CSV validation and persistence", async () => {
  const dir = mkdtempSync(join(tmpdir(), "reachwick-"));
  const path = join(dir, "db.sqlite");
  const db = openDb(path);
  db.prepare("INSERT INTO owner VALUES(?,?)").run(
    "owner@example.test",
    hashPassword("a strong password"),
  );
  db.close();
  let app = await createApp(path);
  try {
    assert.equal((await app.inject("/api/v1/leads")).statusCode, 401);
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "owner@example.test", password: "a strong password" },
    });
    assert.equal(login.statusCode, 200);
    const cookie = login.cookies[0].name + "=" + login.cookies[0].value;
    const headers = { cookie };
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/v1/leads",
          headers: { ...headers, origin: "https://evil.example" },
          payload: { email: "test@example.test" },
        })
      ).statusCode,
      403,
    );
    const imported = await app.inject({
      method: "POST",
      url: "/api/v1/leads/import",
      headers,
      payload: { csv: "email,name\na@example.test,A\na@example.test,B\nbad,C" },
    });
    assert.equal(imported.json().imported, 1);
    assert.equal(imported.json().errors.length, 2);
    const formulaImported = await app.inject({
      method: "POST",
      url: "/api/v1/leads/import",
      headers,
      payload: { csv: "email,name\nformula@example.test,\t=1+1" },
    });
    assert.equal(formulaImported.json().imported, 1);
    const directFormula = await app.inject({
      method: "POST",
      url: "/api/v1/leads/import",
      headers,
      payload: { csv: "email,name\ndirect@example.test,=1+1" },
    });
    assert.equal(directFormula.json().imported, 1);
    const fullWidthFormula = await app.inject({
      method: "POST",
      url: "/api/v1/leads/import",
      headers,
      payload: { csv: "email,name\nfullwidth@example.test,＝1+1" },
    });
    assert.equal(fullWidthFormula.json().imported, 1);
    const exported = await app.inject({
      url: "/api/v1/leads/export",
      headers,
    });
    assert.ok(exported.body.includes('"\'\t=1+1"'));
    assert.ok(exported.body.includes("a@example.test"));
    assert.ok(exported.body.includes(`"'=1+1"`));
    assert.ok(exported.body.includes(`"'＝1+1"`));
    await app.close();
    app = await createApp(path);
    assert.equal(
      (await app.inject({ url: "/api/v1/leads", headers })).json().length,
      4,
    );
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers,
      payload: {},
    });
    assert.equal(
      (await app.inject({ url: "/api/v1/leads", headers })).statusCode,
      401,
    );
  } finally {
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("login throttling separates trusted tunnel clients and ignores spoofed headers", async () => {
  const dir = mkdtempSync(join(tmpdir(), "reachwick-rate-limit-"));
  const path = join(dir, "db.sqlite");
  const previousProxy = process.env.TRUSTED_TUNNEL_PROXY_IP;
  process.env.TRUSTED_TUNNEL_PROXY_IP = "127.0.0.1";
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    app = await createApp(path);
    const login = (clientIp: string, remoteAddress = "127.0.0.1") =>
      app!.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        remoteAddress,
        headers: { "cf-connecting-ip": clientIp },
        payload: { email: "owner@example.test", password: "wrong password" },
      });
    for (let i = 0; i < 5; i++)
      assert.equal((await login("198.51.100.10")).statusCode, 401);
    assert.equal((await login("198.51.100.10")).statusCode, 429);
    assert.equal((await login("198.51.100.11")).statusCode, 401);
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await login(`203.0.113.${i + 1}`, "127.0.0.2")).statusCode,
        401,
      );
    assert.equal((await login("203.0.113.6", "127.0.0.2")).statusCode, 429);
  } finally {
    await app?.close();
    if (previousProxy === undefined) delete process.env.TRUSTED_TUNNEL_PROXY_IP;
    else process.env.TRUSTED_TUNNEL_PROXY_IP = previousProxy;
    rmSync(dir, { recursive: true, force: true });
  }
});
test("SQLite data files stay private under a permissive Unix umask", (t) => {
  if (process.platform === "win32") {
    t.skip("Windows file access is governed by inherited ACLs");
    return;
  }
  const dir = mkdtempSync(join(tmpdir(), "reachwick-permissions-"));
  const path = join(dir, "db.sqlite");
  const previousUmask = process.umask(0);
  let db;
  try {
    db = openDb(path);
  } finally {
    process.umask(previousUmask);
  }
  try {
    db.prepare("INSERT INTO owner VALUES(?,?)").run(
      "owner@example.test",
      "synthetic-hash",
    );
    assert.equal(statSync(path).mode & 0o777, 0o600);
    const wal = path + "-wal";
    if (existsSync(wal)) assert.equal(statSync(wal).mode & 0o777, 0o600);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("campaign composition, validation, suppression, settings and migrations", async () => {
  const dir = mkdtempSync(join(tmpdir(), "reachwick-"));
  const path = join(dir, "db.sqlite");
  const db = openDb(path);
  db.prepare("INSERT INTO owner VALUES(?,?)").run(
    "owner@example.test",
    hashPassword("a strong password"),
  );
  db.close();
  const app = await createApp(path);
  try {
    const login = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "owner@example.test", password: "a strong password" },
    });
    const headers = { cookie: "session=" + login.cookies[0].value };
    const request = (method: any, url: string, payload?: any) =>
      app.inject({ method, url: "/api/v1" + url, headers, payload });
    const lead = (
      await request("POST", "/leads", { email: "person@example.test" })
    ).json();
    const campaign = (
      await request("POST", "/campaigns", { name: "Test" })
    ).json();
    assert.equal(
      (
        await request("PUT", `/campaigns/${campaign.id}/steps`, {
          steps: [
            { subject: "First", body: "Hello" },
            { subject: "Second", body: "Again" },
          ],
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await request("PUT", `/campaigns/${campaign.id}/members`, {
          leadIds: [lead.id],
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (
        await request("PUT", `/campaigns/${campaign.id}/schedule`, {
          timezone: "Invalid/Zone",
          days: [1],
          startTime: "09:00",
          endTime: "17:00",
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await request("PUT", `/campaigns/${campaign.id}/schedule`, {
          timezone: "Africa/Johannesburg",
          days: [1, 2],
          startTime: "09:00",
          endTime: "17:00",
        })
      ).statusCode,
      200,
    );
    const detail = (await request("GET", `/campaigns/${campaign.id}`)).json();
    assert.equal(detail.steps[1].subject, "Second");
    assert.deepEqual(detail.leadIds, [lead.id]);
    assert.equal(
      (await request("PUT", "/leads/9999", { email: "missing@example.test" }))
        .statusCode,
      404,
    );
    assert.equal(
      (await request("DELETE", "/campaigns/9999", {})).statusCode,
      404,
    );
    assert.equal(
      (
        await request("PUT", `/campaigns/${campaign.id}/members`, {
          leadIds: [9999],
        })
      ).statusCode,
      400,
    );
    assert.equal(
      (
        await request("POST", "/suppression", {
          email: "person@example.test",
          reason: "Opted out",
        })
      ).statusCode,
      200,
    );
    assert.equal((await request("GET", "/dashboard")).json().suppressed, 1);
    await request("PUT", "/settings", {
      workspaceName: "Test workspace",
      timezone: "UTC",
    });
    assert.equal(
      (await request("GET", "/settings")).json().workspaceName,
      "Test workspace",
    );
    const other = openDb(path);
    other.prepare("DELETE FROM sessions").run();
    other.close();
    assert.equal((await request("GET", "/dashboard")).statusCode, 401);
  } finally {
    await app.close();
  }
  const future = openDb(path);
  future.pragma("user_version = 99");
  future.close();
  assert.throws(() => openDb(path), /newer/);
  rmSync(dir, { recursive: true, force: true });
});
