# Project status

Reachwick is public at https://github.com/Gerrard-Lewu/reachwick. PR #10 merged as `1529d612`; main CI passed. Manual release run `39834407710` passed and created a v0.1.0 draft release with an SPDX SBOM, image metadata, and SHA256SUMS. The public GHCR image manifest is an OCI index for Linux AMD64 and ARM64. Final release publication and Oracle/Cloudflare live verification remain pending because no VM or tunnel is provisioned.

## Plan to finish v0.1.0

1. Protect `main` with pull requests and the `check`, `secrets`, and `dependency-review` status checks. Done.
2. Merge PR #10, run the v0.1.0 workflow, and verify the multi-architecture image and draft assets. Done.
3. Test HTTPS through Cloudflare Tunnel on a user-provisioned Oracle VM and confirm direct app access is blocked. Waiting for cloud environment provisioning.
4. Publish the v0.1.0 release after deployment checks pass.

Scope remains one owner and local SQLite storage. Live sending, mailbox sync, AI research, billing, and team accounts are later milestones.

Security scan `0ff64092-e085-4b35-9a15-a00be8644edb` reviewed all 54 repository files statically and reported three low-severity findings. The local remediation candidate narrows Cloudflare client-IP trust to the pinned tunnel service, neutralizes spreadsheet formula prefixes after leading controls, and restricts SQLite data, sidecar, backup, and restore-temporary permissions on Unix. Windows relies on inherited ACLs. Linux CI and Compose validation are pending.

## Task history

### 2026-10-22 17:25 UTC — initial implementation

- Created independent application, original identity and assets, persistent core, owner authentication, maintenance CLI, deployment packaging, community documentation and release workflows. Existing prototype and research were preserved outside this repository.
- Verified: typecheck, ESLint, two API integration suites, CLI setup/reset/session revocation/seed/backup/restore, production build, formatting check, source/artifact screening, npm audit (zero reported vulnerabilities).
- Browser evidence: real Playwright session exercised login, lead creation/editing, campaign sequence/membership/schedule, persistence after reload, suppression, settings, mobile overflow and logout. Fixed settings stale defaults. Screenshot uses synthetic records; raw browser logs remain outside repository.
- Corrected vulnerable static-file dependency to patched version. Recorded installed dependency license notices. Automated CI includes full-history Gitleaks and container smoke checks; these have not run on GitHub.
- Limitations: Docker unavailable locally; AMD64/ARM64 container smoke checks and live Oracle/Cloudflare verification unrun. GitHub CLI credentials invalid; no public repository, push, tag, image or release published. Domain/trademark availability unverified. Paid 12ui generation was not used; no spending was authorized.
- Next: restore GitHub authentication; run container and actual cloud acceptance checks; review and publish the vetted initial history, then execute manual release workflow. Do not describe the candidate as a verified public release until these gates pass.

### 2026-10-22 17:29 UTC — clean checkout verification

- Initial local commit: `3dde51a` on `main`. An independent local clone completed `npm ci`, production build, API tests, CLI recovery checks, and release screening successfully. The locked installation reported zero dependency vulnerabilities.
- Added API contract documentation, expanded container secret exclusions, and required complete-history secret scanning in the manual release workflow. Final documentation/release-workflow commit follows this record; no remote synchronization claimed.

### 2026-10-22 17:38 UTC — public repository publication

- Created public Gerrard-Lewu/reachwick using the authenticated GitHub browser session. Published all 54 vetted files through the GitHub connector after command-line push authentication failed.
- Simplified README to product introduction, screenshot, quick start and documentation links. Source/artifact screening and git diff --check passed.
- Verified remote source tree 4bd474dbcb2f128d791d6c0a9c5f74fbaa95e6b7 exactly matches the prepared local tree at publication commit f76a7ec839a9e9b40b3d281fe2f235cb812bbaa7. Local prepublication history preserved on local-prepublication; main tracks origin/main.
- Public repository creation is complete. No versioned release, image publication, or cloud deployment performed. Container/cloud release gates remain unverified; GitHub CI results are separate from the prior local checks.

### 2026-10-22 17:51 UTC — release readiness

- Verified main CI run `39824530759` for `ca2e87af0ead770aba12204af4f91fb714f56991`: application checks and secret scan passed; dependency-review was correctly skipped on a push. CI built and smoke-tested the AMD64 container.
- Enabled private vulnerability reporting, GitHub dependency graph, Dependabot alerts, and Dependabot security updates. Secret scanning and push protection were already enabled.
- Local validation: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:release`, and `npm audit --omit=dev --audit-level=high` all passed; 0 reported vulnerabilities.
- Remaining: create main ruleset after GitHub requests passkey reauthentication; run the manual AMD64/ARM64 release workflow; verify user-provisioned Oracle/Cloudflare deployment before publishing a final release.

### 2026-10-22 18:26 UTC — renewed release audit

- Re-ran typecheck, lint, API/CLI tests, production build, release screening, formatting, and full `npm audit --audit-level=high`; all passed, with zero reported vulnerabilities. The first format check found trailing blank lines in this file and `SECURITY.md`; both are now formatted. `git diff --check` passed.
- GitHub run `39826470952` passed `check` and `secrets`; `dependency-review` was skipped because this was a push. Verified the dependency graph is enabled. Its earlier pull-request checks failed while GitHub reported the graph unavailable; retried the check on all eight open Dependabot PRs, and all eight retries passed. PR #8's TypeScript 7 update still fails `npm ci` because `typescript-eslint@8.72.0` requires TypeScript `<6.1.0`; it remains unmerged.
- GitHub reports no rulesets and no releases. The branch ruleset is fully configured in the browser but GitHub requires passkey reauthentication before it can be saved. Do not treat branch protection as active until the ruleset is visible in repository settings.
- Docker is unavailable locally. The successful GitHub CI run covers AMD64 only. No Oracle VM or Cloudflare Tunnel is provisioned, and no v0.1.0 release, tag, image, or live cloud verification exists.
- The documentation audit is proposed in PR #9 and is not merged. Its `check`, `secrets`, and `dependency-review` jobs passed. GitHub still reports main run `39826470952` as `in_progress` although its `check` and `secrets` jobs completed successfully and `dependency-review` was skipped on push; earlier complete main run `39824530759` succeeded.
- Next: complete GitHub passkey authentication and verify the active ruleset; run the manual multi-architecture release workflow and inspect its image, SBOM, checksums, and draft release; test the user-provisioned Oracle/Cloudflare deployment; publish v0.1.0 only after those gates pass.

### 2026-10-22 18:42 UTC — SBOM release workflow remediation

- Active `Protect main` ruleset requires PRs, resolved conversations, and up-to-date `check`, `secrets`, and `dependency-review`; it blocks deletion and force-pushes.
- Dispatched manual release run `39832775772` on `main` commit `08afd9a`. Full-history secret scan, version validation, typecheck, lint, API/CLI tests, build, release screening, and production dependency audit passed. `npm sbom` failed because `@reachwick/server` and `@reachwick/shared` had no versions; the image publishing step was skipped, so no image or draft release was created.
- Added `0.1.0` versions for both workspaces and updated `package-lock.json`. Added a workflow validation step for the generated SPDX document. Local typecheck, lint, tests, build, release screening, format check, diff check, production audit, and SPDX generation/validation passed; the SBOM contains 225 packages and uses SPDX-2.3.
- Draft remediation PR #10 is open. Its `secrets` and `dependency-review` checks passed; `check` is still running. PR #9 remains the separate documentation audit.
- Next: wait for PR #10's required checks, then rerun the release workflow after it reaches `main`; inspect the multi-architecture image and draft-release artifacts; test the user-provisioned Oracle/Cloudflare deployment; publish only after all gates pass. No cloud VM or tunnel is available in this workspace.

### 2026-10-22 18:43 UTC — release remediation checks complete

- PR #10's `check`, `secrets`, and `dependency-review` jobs all passed in workflow run `39833658407`, including the AMD64 container smoke check. The draft PR remains open and unmerged. Main is protected, and no merge was performed.
- Local SPDX generation validated 225 packages in an SPDX-2.3 document; local formatting and release checks passed. The first release run stopped before image publication and release creation.
- Next: obtain maintainer approval to merge PR #10, rerun the manual release on `main`, verify the image/SBOM/checksums/draft release, and complete Oracle/Cloudflare live testing on a user-provisioned VM before publishing v0.1.0.

### 2026-10-22 18:59 UTC — v0.1.0 release candidate built

- PR #10 was merged with maintainer approval as `1529d612778a6a26c5d9152846d8dd904c1575d5`. Main CI run `39834131357` succeeded; its `check` and `secrets` jobs passed, and dependency review was skipped on the push event.
- Manual release run `39834407710` succeeded on that commit. Full-history secret scanning, version validation, typecheck, lint, API/CLI tests, build, release screening, production dependency audit, SBOM generation/validation, and both AMD64 and ARM64 container smoke checks passed.
- The release created public image `ghcr.io/gerrard-lewu/reachwick:v0.1.0`. An anonymous registry request returned an OCI image index at `sha256:cd832ce87d12ce07ac5532d4a92f75d84c031f2cda99ab2f8b230b9549f7069e` with `linux/amd64` and `linux/arm64` manifests.
- GitHub has a v0.1.0 draft with `image-metadata.json` (22.4 KB), `sbom.spdx.json` (262 KB, SPDX-2.3 with 225 packages), and `SHA256SUMS` (167 bytes). The tag remains attached to the draft; no public GitHub release was published.
- Oracle VM/Cloudflare Tunnel live validation remains outstanding because the environment is not provisioned. Keep v0.1.0 as a draft until the live HTTPS and blocked-direct-port checks pass. PR #9 now contains the updated release status and normalized formatting; its `check`, `secrets`, and `dependency-review` jobs passed in run `39836410375`.

### 2026-10-22 23:17 UTC — security remediation candidate

- Added regression coverage for shared tunnel login throttling, CSV formula cells, and Unix database/backup permissions. API and CLI setup/reset/seed/backup/restore tests pass on Windows; the POSIX permission assertion is skipped on this host.
- Checks passed: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:release`, `npm run format:check`, and `npm audit --omit=dev` (zero vulnerabilities). Release source screening passed.
- `docker compose config --quiet` could not run because Docker is not installed. Compose validation was added to CI; formatting parsed the YAML locally. Linux CI still needs to validate Compose and the Unix permission assertions.
- The security audit was static-only. No live spreadsheet, Oracle VM, or Cloudflare Tunnel was available; keep v0.1.0 in draft until cloud HTTPS and blocked-direct-port checks pass.
