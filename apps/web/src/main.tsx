import React, { useState, useEffect, FormEvent } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
type Row = { id: number; [key: string]: any };
async function api(path: string, method = "GET", body?: unknown) {
  if (method !== "GET" && body === undefined) body = {};
  const r = await fetch("/api/v1/" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || e.error || `Request failed (${r.status})`);
  }
  return r.status === 204 ? null : r.json();
}
function App() {
  const [owner, setOwner] = useState<string | null>(null),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState("Overview"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [rows, setRows] = useState<Row[]>([]),
    [totals, setTotals] = useState<any>({}),
    [settings, setSettings] = useState<any>({
      workspaceName: "Reachwick",
      timezone: "UTC",
    }),
    [selected, setSelected] = useState<any>(null),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  const resource =
    page === "Leads"
      ? "leads"
      : page === "Campaigns"
        ? "campaigns"
        : "suppression";
  async function refresh() {
    setError("");
    try {
      if (page === "Overview") setTotals(await api("dashboard"));
      else if (page === "Settings") setSettings(await api("settings"));
      else setRows(await api(resource));
    } catch (e) {
      setError(String((e as Error).message));
    }
  }
  useEffect(() => {
    api("auth/me")
      .then((x) => setOwner(x.email))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (owner) {
      setSelected(null);
      setQuery("");
      setStatus("");
      void refresh();
    }
  }, [page, owner]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await action(async () => {
      await api("auth/login", "POST", Object.fromEntries(f));
      const me = await api("auth/me");
      setOwner(me.email);
    });
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    await action(async () => {
      await api(
        resource + (selected?.id ? "/" + selected.id : ""),
        selected?.id ? "PUT" : "POST",
        data,
      );
      setSelected(null);
      setNotice("Saved.");
      await refresh();
    });
  }
  if (loading)
    return (
      <main className="login">
        <p>Opening workspace…</p>
      </main>
    );
  if (!owner)
    return (
      <main className="login">
        <div className="login-intro">
          <div className="brand">◒ Reachwick</div>
          <h1>
            Good outreach starts
            <br />
            with a little order.
          </h1>
          <p>
            Your people, plans, and next steps.
            <br />
            One workspace. Yours to run.
          </p>
        </div>
        <form onSubmit={login} className="panel login-form">
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h2>Welcome back</h2>
          <p>Sign in with the owner account created on your host.</p>
          <label>
            Email
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button disabled={busy}>Sign in →</button>
          <small>
            First time? Run the owner setup command on your device or server.
          </small>
        </form>
      </main>
    );
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="/app">
          ◒ Reachwick
        </a>
        <span className="eyebrow">WORKSPACE</span>
        <nav>
          {["Overview", "Leads", "Campaigns", "Suppression", "Settings"].map(
            (p, i) => (
              <button
                className={page === p ? "active" : ""}
                onClick={() => setPage(p)}
                key={p}
              >
                <span>{["▦", "♧", "↗", "⊘", "⚙"][i]}</span>
                {p}
              </button>
            ),
          )}
        </nav>
        <div className="aside-bottom">
          <small>{owner}</small>
          <button
            onClick={() =>
              void action(async () => {
                await api("auth/logout", "POST", {});
                setOwner(null);
              })
            }
          >
            Sign out
          </button>
          <small>v0.1 · Self hosted</small>
        </div>
      </aside>
      <main>
        <header>
          <span>YOUR OUTREACH, ORGANIZED</span>
          <span className="pill">Owner workspace</span>
        </header>
        <div className="title">
          <div>
            <span className="eyebrow">WORKSPACE / {page.toUpperCase()}</span>
            <h1>
              {page === "Overview" ? "A clearer view of what’s next." : page}
            </h1>
            <p>
              {page === "Overview"
                ? "Build relationships with intention. Start with your people."
                : page === "Campaigns"
                  ? "Plan your outreach. Campaigns are drafts; no email is sent."
                  : page === "Leads"
                    ? "Keep the people you want to reach in one place."
                    : page === "Suppression"
                      ? "Maintain the addresses excluded from your outreach plans."
                      : "Make this workspace your own."}
            </p>
          </div>
          {["Leads", "Campaigns", "Suppression"].includes(page) && (
            <button onClick={() => setSelected({})}>
              +{" "}
              {page === "Leads"
                ? "Add lead"
                : page === "Campaigns"
                  ? "New campaign"
                  : "Add address"}
            </button>
          )}
        </div>
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}
        {notice && (
          <div role="status" className="notice">
            {notice}
          </div>
        )}
        {page === "Overview" && (
          <>
            <section className="metrics">
              {[
                ["leads", "Total leads"],
                ["qualified", "Qualified leads"],
                ["campaigns", "Campaigns"],
                ["suppressed", "Suppressed addresses"],
              ].map(([key, label]) => (
                <article className="panel" key={key}>
                  <span>{label}</span>
                  <strong>{totals[key] ?? 0}</strong>
                  <small>In your workspace</small>
                </article>
              ))}
            </section>
            <section className="panel welcome">
              <span className="eyebrow">MAKE YOUR NEXT MOVE</span>
              <h2>A thoughtful plan begins with a person.</h2>
              <p>
                Add your first leads, organize a campaign, and write a sequence.
                <br />
                You control the data and the pace.
              </p>
              <button onClick={() => setPage("Leads")}>Open leads →</button>
              <div className="draft-note">
                Draft planning workspace · Sending and mailbox sync are not
                available in this release.
              </div>
            </section>
          </>
        )}
        {page === "Settings" && (
          <form
            key={JSON.stringify(settings)}
            className="panel editor"
            onSubmit={(e) => {
              e.preventDefault();
              const data = Object.fromEntries(new FormData(e.currentTarget));
              void action(async () => {
                await api("settings", "PUT", data);
                setNotice("Workspace settings saved.");
                await refresh();
              });
            }}
          >
            <h2>Workspace preferences</h2>
            <label>
              Workspace name
              <input
                name="workspaceName"
                defaultValue={settings.workspaceName}
                required
                maxLength={100}
              />
            </label>
            <label>
              Default timezone
              <input
                name="timezone"
                defaultValue={settings.timezone}
                required
                placeholder="Africa/Johannesburg"
              />
            </label>
            <button disabled={busy}>Save preferences</button>
          </form>
        )}
        {["Leads", "Campaigns", "Suppression"].includes(page) && (
          <section className="panel">
            <div className="toolbar">
              <input
                aria-label="Search records"
                placeholder="Search records…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {page === "Leads" && (
                <>
                  <select
                    aria-label="Filter status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {["new", "contacted", "qualified", "archived"].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                  <a className="secondary" href="/api/v1/leads/export">
                    Export CSV
                  </a>
                  <label className="secondary upload">
                    Import CSV
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file)
                          void action(async () => {
                            if (file.size > 1000000)
                              throw Error("Choose a CSV smaller than 1 MB.");
                            const result = await api("leads/import", "POST", {
                              csv: await file.text(),
                            });
                            setNotice(JSON.stringify(result));
                            await refresh();
                          });
                        e.target.value = "";
                      }}
                    />
                  </label>
                </>
              )}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {(page === "Leads"
                      ? ["Name", "Email", "Company", "Status"]
                      : page === "Campaigns"
                        ? ["Name", "Status"]
                        : ["Email", "Reason"]
                    ).map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter(
                      (r) =>
                        (!status || r.status === status) &&
                        JSON.stringify(r)
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    )
                    .map((r) => (
                      <tr key={r.id}>
                        {(page === "Leads"
                          ? ["name", "email", "company", "status"]
                          : page === "Campaigns"
                            ? ["name", "status"]
                            : ["email", "reason"]
                        ).map((k) => (
                          <td key={k}>{r[k] || "—"}</td>
                        ))}
                        <td>
                          <button
                            className="text"
                            onClick={() =>
                              void action(async () => {
                                setSelected(
                                  page === "Campaigns"
                                    ? await api("campaigns/" + r.id)
                                    : r,
                                );
                              })
                            }
                          >
                            Edit
                          </button>
                          <button
                            className="text danger"
                            onClick={() => {
                              if (confirm("Delete this record permanently?"))
                                void action(async () => {
                                  await api(resource + "/" + r.id, "DELETE");
                                  await refresh();
                                });
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {rows.length === 0 && (
                <div className="empty">
                  <h2>Your {page.toLowerCase()} start here.</h2>
                  <p>Add a record to begin. Your installation starts empty.</p>
                </div>
              )}
            </div>
          </section>
        )}
        {selected && (
          <section className="panel editor">
            <div className="editor-heading">
              <h2>
                {selected.id ? "Edit" : "Add"}{" "}
                {page === "Leads"
                  ? "lead"
                  : page === "Campaigns"
                    ? "campaign"
                    : "suppression entry"}
              </h2>
              <button className="text" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <form onSubmit={save} key={selected.id || "new"}>
              {(page === "Leads"
                ? ["name", "email", "company", "notes"]
                : page === "Campaigns"
                  ? ["name"]
                  : ["email", "reason"]
              ).map((k) => (
                <label key={k}>
                  {k}
                  <input
                    name={k}
                    type={k === "email" ? "email" : "text"}
                    defaultValue={selected[k] || ""}
                    required={
                      k === "email" || (k === "name" && page === "Campaigns")
                    }
                    maxLength={k === "notes" ? 5000 : 500}
                  />
                </label>
              ))}
              {page !== "Suppression" && (
                <label>
                  Status
                  <select
                    name="status"
                    defaultValue={
                      selected.status ||
                      (page === "Campaigns" ? "draft" : "new")
                    }
                  >
                    {(page === "Campaigns"
                      ? ["draft", "archived"]
                      : ["new", "contacted", "qualified", "archived"]
                    ).map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              )}
              <button disabled={busy}>
                Save {page === "Campaigns" ? "campaign" : "record"}
              </button>
            </form>
            {page === "Campaigns" && selected.id && (
              <CampaignDetails
                selected={selected}
                leadsLoader={() => api("leads")}
                run={action}
                notice={setNotice}
              />
            )}
          </section>
        )}
        <footer>Your workspace. Your data. Your next step.</footer>
      </main>
    </div>
  );
}
function CampaignDetails({
  selected,
  leadsLoader,
  run,
  notice,
}: {
  selected: any;
  leadsLoader: () => Promise<Row[]>;
  run: (fn: () => Promise<void>) => Promise<void>;
  notice: (s: string) => void;
}) {
  const [steps, setSteps] = useState<any[]>(selected.steps || []),
    [leads, setLeads] = useState<Row[]>([]),
    [ids, setIds] = useState<number[]>(selected.leadIds || []);
  useEffect(() => {
    void leadsLoader().then(setLeads);
  }, []);
  return (
    <div className="campaign-detail">
      <h3>Sequence</h3>
      <p>Write the steps in order. Messages are saved as drafts.</p>
      {steps.map((s, i) => (
        <div className="step" key={i}>
          <label>
            Step {i + 1} subject
            <input
              value={s.subject}
              onChange={(e) =>
                setSteps(
                  steps.map((x, j) =>
                    j === i ? { ...x, subject: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <label>
            Message
            <textarea
              value={s.body}
              onChange={(e) =>
                setSteps(
                  steps.map((x, j) =>
                    j === i ? { ...x, body: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <button
            className="text danger"
            onClick={() => setSteps(steps.filter((_, j) => j !== i))}
          >
            Remove step
          </button>
        </div>
      ))}
      <button
        className="secondary"
        onClick={() => setSteps([...steps, { subject: "", body: "" }])}
      >
        + Add step
      </button>{" "}
      <button
        onClick={() =>
          void run(async () => {
            await api(`campaigns/${selected.id}/steps`, "PUT", { steps });
            notice("Sequence saved.");
          })
        }
      >
        Save sequence
      </button>
      <h3>Members</h3>
      {leads.length === 0 && (
        <p>Add leads before assigning campaign members.</p>
      )}
      <div className="members">
        {leads.map((l) => (
          <label key={l.id}>
            <input
              type="checkbox"
              checked={ids.includes(l.id)}
              onChange={(e) =>
                setIds(
                  e.target.checked
                    ? [...ids, l.id]
                    : ids.filter((x) => x !== l.id),
                )
              }
            />
            {l.name || l.email} <small>{l.email}</small>
          </label>
        ))}
      </div>
      <button
        onClick={() =>
          void run(async () => {
            await api(`campaigns/${selected.id}/members`, "PUT", {
              leadIds: ids,
            });
            notice("Members saved.");
          })
        }
      >
        Save members
      </button>
      <h3>Planning schedule</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void run(async () => {
            await api(`campaigns/${selected.id}/schedule`, "PUT", {
              timezone: f.get("timezone"),
              days: f.getAll("days").map(Number),
              startTime: f.get("startTime"),
              endTime: f.get("endTime"),
            });
            notice("Schedule saved. No messages will be sent.");
          });
        }}
      >
        <label>
          Timezone
          <input
            name="timezone"
            defaultValue={selected.schedule?.timezone || "UTC"}
            required
          />
        </label>
        <div className="days">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <label key={d}>
              <input
                type="checkbox"
                name="days"
                value={i + 1}
                defaultChecked={(
                  selected.schedule?.days || [1, 2, 3, 4, 5]
                ).includes(i + 1)}
              />
              {d}
            </label>
          ))}
        </div>
        <label>
          Start time
          <input
            type="time"
            name="startTime"
            required
            defaultValue={selected.schedule?.startTime || "09:00"}
          />
        </label>
        <label>
          End time
          <input
            type="time"
            name="endTime"
            required
            defaultValue={selected.schedule?.endTime || "17:00"}
          />
        </label>
        <button>Save schedule</button>
      </form>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
