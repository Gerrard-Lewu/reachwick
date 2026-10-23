# Project status

Reachwick is public at https://github.com/Gerrard-Lewu/reachwick and licensed under MIT. PRs #9, #10, #11, and #13 are merged. The [v0.1.0 release](https://github.com/Gerrard-Lewu/reachwick/releases/tag/v0.1.0) is published with an SPDX SBOM, image metadata, checksums, and a public multi-architecture image. Latest main CI passed. A private maintainer deployment has an initialized owner; HTTPS health and app pages returned 200, the anonymous leads API returned 401, and direct port 3000 was unreachable. Provider and account details are omitted.

## Plan to finish v0.1.0

1. Protect `main` with pull requests and the `check`, `secrets`, and `dependency-review` status checks. Done.
2. Merge PRs #9, #10, and #11, run the v0.1.0 workflow, and verify the multi-architecture image and draft assets. Done.
3. Verify hosted HTTPS and blocked direct app access. Done on a private maintainer deployment with an initialized owner; provider and account details remain outside public deployment guidance.
4. Publish v0.1.0 after deployment checks pass. Done.

Reachwick's full product goal is an open-source workspace for both prospect generation and outreach management. The current application supports one owner and local SQLite storage, with manual/CSV lead intake, lead and campaign management, and sequence planning. The next milestone is guided, source-attributed discovery that feeds reviewed prospects into the same lead manager. Community work is tracked in the public [Reachwick Roadmap project](https://github.com/users/Gerrard-Lewu/projects/4). Issue #12 is linked with Todo status; its Board view currently shows zero cards after refresh, so card visibility remains unresolved. Public installation guidance stays provider-neutral for local use and any server that supports Docker Compose and persistent storage. Live sending, mailbox sync, billing, and team accounts remain later milestones.

Security scan `0ff64092-e085-4b35-9a15-a00be8644edb` reviewed all 54 repository files statically and reported three low-severity findings. PR #11 merged as `67f5b4b` and fixes tunnel client-IP trust, spreadsheet formula-like CSV cells, and Unix permissions for SQLite data, sidecar, backup, and restore-temporary files. Windows relies on inherited ACLs. Its CI passed Linux tests, Compose validation, container smoke, dependency review, and full-history secret scanning.

## Task history

### 2026-10-22 17:25 UTC — initial implementation

- Created independent application, original identity and assets, persistent core, owner authentication, maintenance CLI, deployment packaging, community documentation and release workflows. Existing prototype and research were preserved outside this repository.
- Verified: typecheck, ESLint, two API integration suites, CLI setup/reset/session revocation/seed/backup/restore, production build, formatting check, source/artifact screening, npm audit (zero reported vulnerabilities).
- Browser evidence: real Playwright session exercised login, lead creation/editing, campaign sequence/membership/schedule, persistence after reload, suppression, settings, mobile overflow and logout. Fixed settings stale defaults. Screenshot uses synthetic records; raw browser logs remain outside repository.
- Corrected vulnerable static-file dependency to patched version. Recorded installed dependency license notices. Automated CI includes full-history Gitleaks and container smoke checks; these have not run on GitHub.
- Limitations: Docker unavailable locally; AMD64/ARM64 container smoke checks and live hosted HTTPS/direct-port verification unrun. GitHub CLI credentials invalid; no public repository, push, tag, image or release published. Domain/trademark availability unverified. Paid 12ui generation was not used; no spending was authorized.
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
- Remaining: create main ruleset after GitHub requests passkey reauthentication; run the manual AMD64/ARM64 release workflow; verify user-provisioned hosted HTTPS before publishing a final release.

### 2026-10-22 18:26 UTC — renewed release audit

- Re-ran typecheck, lint, API/CLI tests, production build, release screening, formatting, and full `npm audit --audit-level=high`; all passed, with zero reported vulnerabilities. The first format check found trailing blank lines in this file and `SECURITY.md`; both are now formatted. `git diff --check` passed.
- GitHub run `39826470952` passed `check` and `secrets`; `dependency-review` was skipped because this was a push. Verified the dependency graph is enabled. Its earlier pull-request checks failed while GitHub reported the graph unavailable; retried the check on all eight open Dependabot PRs, and all eight retries passed. PR #8's TypeScript 7 update still fails `npm ci` because `typescript-eslint@8.72.0` requires TypeScript `<6.1.0`; it remains unmerged.
- GitHub reports no rulesets and no releases. The branch ruleset is fully configured in the browser but GitHub requires passkey reauthentication before it can be saved. Do not treat branch protection as active until the ruleset is visible in repository settings.
- Docker is unavailable locally. The successful GitHub CI run covers AMD64 only. No hosted VM or tunnel is provisioned, and no v0.1.0 release, tag, image, or live hosted verification exists.
- The documentation audit is proposed in PR #9 and is not merged. Its `check`, `secrets`, and `dependency-review` jobs passed. GitHub still reports main run `39826470952` as `in_progress` although its `check` and `secrets` jobs completed successfully and `dependency-review` was skipped on push; earlier complete main run `39824530759` succeeded.
- Next: complete GitHub passkey authentication and verify the active ruleset; run the manual multi-architecture release workflow and inspect its image, SBOM, checksums, and draft release; test a user-provisioned HTTPS deployment; publish v0.1.0 only after those gates pass.

### 2026-10-22 18:42 UTC — SBOM release workflow remediation

- Active `Protect main` ruleset requires PRs, resolved conversations, and up-to-date `check`, `secrets`, and `dependency-review`; it blocks deletion and force-pushes.
- Dispatched manual release run `39832775772` on `main` commit `08afd9a`. Full-history secret scan, version validation, typecheck, lint, API/CLI tests, build, release screening, and production dependency audit passed. `npm sbom` failed because `@reachwick/server` and `@reachwick/shared` had no versions; the image publishing step was skipped, so no image or draft release was created.
- Added `0.1.0` versions for both workspaces and updated `package-lock.json`. Added a workflow validation step for the generated SPDX document. Local typecheck, lint, tests, build, release screening, format check, diff check, production audit, and SPDX generation/validation passed; the SBOM contains 225 packages and uses SPDX-2.3.
- Draft remediation PR #10 is open. Its `secrets` and `dependency-review` checks passed; `check` is still running. PR #9 remains the separate documentation audit.
- Next: wait for PR #10's required checks, then rerun the release workflow after it reaches `main`; inspect the multi-architecture image and draft-release artifacts; test a user-provisioned HTTPS deployment; publish only after all gates pass. No cloud VM or tunnel is available in this workspace.

### 2026-10-22 18:43 UTC — release remediation checks complete

- PR #10's `check`, `secrets`, and `dependency-review` jobs all passed in workflow run `39833658407`, including the AMD64 container smoke check. The draft PR remains open and unmerged. Main is protected, and no merge was performed.
- Local SPDX generation validated 225 packages in an SPDX-2.3 document; local formatting and release checks passed. The first release run stopped before image publication and release creation.
- Next: obtain maintainer approval to merge PR #10, rerun the manual release on `main`, verify the image/SBOM/checksums/draft release, and complete live HTTPS/direct-port testing on a user-provisioned server before publishing v0.1.0.

### 2026-10-22 18:59 UTC — v0.1.0 release candidate built

- PR #10 was merged with maintainer approval as `1529d612778a6a26c5d9152846d8dd904c1575d5`. Main CI run `39834131357` succeeded; its `check` and `secrets` jobs passed, and dependency review was skipped on the push event.
- Manual release run `39834407710` succeeded on that commit. Full-history secret scanning, version validation, typecheck, lint, API/CLI tests, build, release screening, production dependency audit, SBOM generation/validation, and both AMD64 and ARM64 container smoke checks passed.
- The release created public image `ghcr.io/gerrard-lewu/reachwick:v0.1.0`. An anonymous registry request returned a multi-architecture container index at `sha256:cd832ce87d12ce07ac5532d4a92f75d84c031f2cda99ab2f8b230b9549f7069e` with `linux/amd64` and `linux/arm64` manifests.
- GitHub has a v0.1.0 draft with `image-metadata.json` (22.4 KB), `sbom.spdx.json` (262 KB, SPDX-2.3 with 225 packages), and `SHA256SUMS` (167 bytes). The tag remains attached to the draft; no public GitHub release was published.
- Hosted HTTPS/direct-port validation remains outstanding because the environment is not provisioned. Keep v0.1.0 as a draft until those checks pass. PR #9 now contains the updated release status and normalized formatting; its `check`, `secrets`, and `dependency-review` jobs passed in run `39836410375`.

### 2026-10-22 23:17 UTC — security remediation candidate

- Added regression coverage for shared tunnel login throttling, CSV formula cells, and Unix database/backup permissions. API and CLI setup/reset/seed/backup/restore tests pass on Windows; the POSIX permission assertion is skipped on this host.
- Checks passed: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run check:release`, `npm run format:check`, and `npm audit --omit=dev` (zero vulnerabilities). Release source screening passed.
- `docker compose config --quiet` could not run because Docker is not installed. Compose validation was added to CI; formatting parsed the YAML locally. Linux CI still needs to validate Compose and the Unix permission assertions.
- The security audit was static-only. No live spreadsheet or hosted deployment was available; keep v0.1.0 in draft until HTTPS and blocked-direct-port checks pass.

### 2026-10-22 23:25 UTC — security hardening submitted

- Published commit `0a139db` in PR #11. CI run `39871451951` passed `check`, `secrets`, and `dependency-review`; the check job passed typecheck, lint, tests, build, release screening, dependency audit, Compose configuration, Docker build, and container smoke.
- Local typecheck, lint, tests, production build, release screening, formatting, and production dependency audit passed. The local Windows run skipped the POSIX permission assertion; Linux CI passed the test suite.
- PR #11 remains open for maintainer review. Live hosted HTTPS and direct-port verification remain pending provisioning; keep v0.1.0 in draft.

### 2026-10-23 00:25 UTC — provider-neutral scope and community board

- The maintainer clarified that the product should support personal lead generation and management while public hosting guidance stays provider-neutral. Updated the README, roadmap, deployment guide, release gates, and changelog. Current v0.1 capabilities are described as manual/CSV lead intake and management; guided lead discovery and research is the next milestone.
- Created the public [Reachwick Roadmap project](https://github.com/users/Gerrard-Lewu/projects/4), set Reachwick as its default repository, and documented how contributors should use it. The repository had no open issues to import, so I added design issue [#12](https://github.com/Gerrard-Lewu/reachwick/issues/12) and verified GitHub linked it to the board's Todo column.
- Confirmed the GitHub repository remains public and PRs #9 and #11 remain open. The connected cloud-management interface supports read-only inventory but exposes no VM/network provisioning operation; no cloud resources were created. Hosted deployment verification remains pending.
- Validation: reviewed repository/PR/issue state and project visibility; no application tests were run for this documentation and project-setup change.

### 2026-10-23 00:28 UTC — documentation checks complete

- PR #11 head `d7e048f` contains the provider-neutral deployment and lead-discovery scope updates. CI run `39878115433` passed; `git diff --check` passed locally. No application tests were run locally.
- PR #11 remains open and unmerged. Live hosted HTTPS validation is still pending.

### 2026-10-23 00:31 UTC — project board display check

- Issue #12 shows the public Reachwick Roadmap project and Todo status in its metadata and activity. After refresh, the project board still shows zero cards and its repository picker remains loading; card visibility is unverified.
- PR #11 head `7068aa9` passed CI run `39878346297`. No cloud host or tunnel is provisioned.

### 2026-10-23 00:39 UTC — product goal clarified

- Clarified the full product goal as lead generation plus lead management; guided discovery must produce source-attributed prospects for owner review and then feed the existing lead workflow. The maintainer's hosting choice stays separate from provider-neutral community instructions.
- Kept discovery tracked in issue [#12](https://github.com/Gerrard-Lewu/reachwick/issues/12) and community priorities in the public Project board. Issue metadata shows Todo; the board view still does not render its card reliably.
- Validation: confirmed the README, roadmap, contribution guide, and deployment docs keep server guidance provider-neutral. No application tests run for this documentation-only clarification. PR #11 remains open at `136efacf`; CI passed on that head. Hosted HTTPS/direct-port checks and final release remain pending.

### 2026-10-23 00:53 UTC — data-directory permissions finding fixed

- PR #11 commit `625d8ff` makes `acquireLock` create new database directories with mode `0700` before writing the lock, and adds a fresh nested-path regression test under umask `0`.
- Node.js 24 local typecheck, lint, full tests, production build, release screening, and format check passed. The two POSIX permission tests are skipped on Windows; Linux CI run `39880202821` passed typecheck, lint, tests, build, release screening, audit, Compose validation, Docker build/smoke, secrets, and dependency review.
- PR #11 remains open and unmerged. Hosted HTTPS/direct-port checks are still pending; keep v0.1.0 as a draft.

### 2026-10-23 01:04 UTC — GitHub Project board display check

- Reconfirmed issue [#12](https://github.com/Gerrard-Lewu/reachwick/issues/12) is linked to the public [Reachwick Roadmap project](https://github.com/users/Gerrard-Lewu/projects/4) with status Todo. The board has no filters but still displays zero items in Todo, In Progress, and Done.
- Refreshed the issue’s project membership and reloaded the board; it remained empty. The board’s add-item search offered to create a new issue with the same title, so no duplicate was created. Board display remains unresolved; the issue stays linked.
- No application code changed and no application tests ran. Provider-neutral deployment guidance, the broader prospect-generation and management goal, and the draft-release / hosted-verification gates remain as recorded above.

### 2026-10-23 10:33 UTC — cloud access and container restart validation

- Authenticated calls through the configured cloud-management MCP succeeded. A temporary network create/rename/delete check passed and the test network was removed.
- The production container now starts Node directly so Docker stop reaches the shutdown handler and releases the SQLite lock. The CI smoke refreshes the ephemeral host port after restart; the rebuilt app passed stop/restart against SQLite.
- Hosted checks passed: HTTPS health returned 200, unauthenticated lead API returned 401, and direct app port 3000 was unreachable. The temporary tunnel URL is omitted because it changes on restart.
- CI run `39939862496` passed all jobs on PR #11 head `c71ed1f`. PR #9 and PR #11 remain open; v0.1.0 remains a draft. No maintainer owner account or stable hostname has been initialized. Lead discovery remains tracked in issue #12 and the public Roadmap project.

### 2026-10-23 10:46 UTC — hosted and release checks

- Repeated hosted smoke: HTTPS health returned 200 and the unauthenticated lead API returned 401. The direct application port was previously verified as unreachable; the tunnel URL is temporary and omitted.
- CI run #93 (`39940956052`) passed on PR #9 head `31e223f`. PR #11 run #91 (`39940177616`) passed all jobs on head `c3521be`.
- PR #9 and PR #11 remain open and unmerged. v0.1.0 remains a draft. The owner account and stable hostname are not initialized. Guided lead discovery remains tracked in issue #12.

### 2026-10-23 10:54 UTC — roadmap project visibility check

- Issue #12 is open and its issue page links it to Reachwick Roadmap with Status Todo. The project's Board and Table views both show zero items, while Archive is empty; the view discrepancy remains unresolved.

### 2026-10-23 11:03 UTC — security merge and release audit reconciliation

- PR #11 merged to `main` as `67f5b4b`. PR #9 was behind the protected base, so its branch now includes the current main tree while preserving the hosted-check and roadmap visibility audit entries.
- PR #9’s updated head requires fresh `check`, `secrets`, and `dependency-review` results before merge. The v0.1.0 release remains a draft; ongoing personal hosting still needs an initialized owner and stable hostname.

### 2026-10-23 11:15 UTC — approved release audit and security merges

- PR #11 merged as `67f5b4b` and PR #9 as `1eb736c` after maintainer authorization. PR #9's refreshed `check`, `secrets`, and `dependency-review` jobs passed; post-merge main CI run `39943877646` passed.
- v0.1.0 remains an unpublished draft with its SBOM, image metadata, and checksums. HTTPS and blocked-direct-port checks used a temporary tunnel; owner initialization and a stable hostname remain open for continuous personal hosting.


### 2026-10-23 14:30 UTC — v0.1.0 published and private-host validation

- Published [GitHub release v0.1.0](https://github.com/Gerrard-Lewu/reachwick/releases/tag/v0.1.0), marked Latest. Release assets include image metadata, an SPDX SBOM, and SHA256SUMS. Manual release workflow run 39945855937 succeeded; latest main CI run 39946731348 passed.
- The release image `ghcr.io/gerrard-lewu/reachwick:v0.1.0` is anonymously retrievable and advertises `linux/amd64` and `linux/arm64`. The two commits after the release workflow changed only this status record; application code was unchanged.
- Owner setup succeeded on the private maintainer instance. The app and tunnel containers are running, the app health check is healthy, HTTPS health/app returned 200, unauthenticated leads returned 401, direct port 3000 was unreachable, and the temporary password file is absent.
- Limits: the owner’s interactive login/logout was not rechecked remotely; the password was entered by the maintainer and was not observed. Issue #12 remains linked to the Roadmap with Todo status, but its Board view displays zero cards after refresh. Public hosting guidance remains provider-neutral; personal provider and account details are omitted.