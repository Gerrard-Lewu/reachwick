# Architecture

An npm workspace separates React/Vite UI, Fastify API, and shared TypeScript validation. One Node process serves the UI and authenticated /api/v1 endpoints on the same origin. SQLite stores owner credentials, revocable sessions, leads, campaign drafts, steps, memberships, schedules, suppressions, and settings.

Use one process per database on local disk. Network filesystems and horizontal replicas are unsupported. Back up before upgrades and versioned migrations. Schedules are planning records and never trigger delivery.
