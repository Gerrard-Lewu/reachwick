# Project status

Reachwick is public at https://github.com/Gerrard-Lewu/reachwick. The v0.1.0 application remains an unreleased candidate. An active ruleset protects `main`; private vulnerability reporting, the dependency graph, Dependabot alerts and security updates, secret scanning, and push protection are enabled. Manual release run `39832775772` passed application checks and dependency audit, then failed while generating the SPDX SBOM before publishing an image or draft release. The workspace-version and SBOM-validation fix is in draft PR #10; its `check`, `secrets`, and `dependency-review` jobs all passed in run `39833658407`. Oracle/Cloudflare live verification remains.

## Plan to finish v0.1.0

1. Protect `main` with pull requests and the `check`, `secrets`, and `dependency-review` status checks. Done.
2. After PR #10 is approved and merged, rerun the manual v0.1.0 release workflow and verify AMD64/ARM64 images, SBOM, checksums, and draft release.
3. Test HTTPS through Cloudflare Tunnel on a user-provisioned Oracle VM and confirm direct app access is blocked.
4. Publish the release after deployment checks pass.

Scope remains one owner and local SQLite storage. Live sending, mailbox sync, AI research, billing, and team accounts are later milestones.

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
