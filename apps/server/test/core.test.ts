import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
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
    await app.close();
    app = await createApp(path);
    assert.equal(
      (await app.inject({ url: "/api/v1/leads", headers })).json().length,
      1,
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
