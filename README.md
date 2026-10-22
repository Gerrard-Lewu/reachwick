# Reachwick

**Your outreach workspace. Your data. Your infrastructure.**

Manage leads, draft campaigns, sequences, schedules, and suppression lists in a self-hosted workspace. One owner, local SQLite storage, no required cloud services.

[Quick start](#quick-start) · [Docker & cloud](docs/deployment.md) · [Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md)

![Reachwick workspace with synthetic data](docs/assets/workspace.png)

## Quick start

Requires Node.js 24 LTS and npm.

```sh
git clone https://github.com/Gerrard-Lewu/reachwick.git
cd reachwick
npm ci
npm run build
npm run owner:setup
npm start
```

Setup prompts for your email and password. Open [localhost:3000/app](http://127.0.0.1:3000/app). Start empty or load synthetic examples with `npm run seed`.

## Run it anywhere

Use your Windows, macOS, or Linux device, Docker, or an Oracle VM behind Cloudflare Tunnel. See [installation](docs/installation.md), [deployment](docs/deployment.md), and [backup & recovery](docs/backup.md).

**v0.1.0 candidate:** core workflows work locally. Email sending, mailbox sync, AI research, billing, and team accounts are planned. Container and live cloud verification remain [release gates](docs/release.md).

## Contribute

[Contribution guide](CONTRIBUTING.md) · [API](docs/api.md) · [Architecture](docs/architecture.md) · [Security](SECURITY.md)

Maintained by Gerrard Lewu. [MIT](LICENSE); dependencies retain their [licenses](THIRD_PARTY_NOTICES.md). Repository practices inspired by [REA](https://github.com/morluto/rea).

