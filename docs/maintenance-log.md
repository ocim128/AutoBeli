# Repository maintenance log

Read this log before choosing maintenance work. Record the evidence, bounded
change, checks, and useful follow-ups for each completed improvement.

## 2026-10-01: Prevent stale queries from undoing cache invalidation

- Evidence: `getOrFetch()` retained pending queries after invalidation and cached
  their results unconditionally. Stock updates and payment completion invalidate
  product keys, so a query started before a sale could restore outdated stock for
  60 seconds (catalog) or 120 seconds (detail). Six new regression cases failed
  before the fix, covering key deletion, prefix invalidation, and full clearing.
- Change: invalidation retires matching pending queries. Only the current query
  can populate the cache or remove its pending entry. Existing callers still
  receive their result; subsequent callers fetch fresh data. Added ten cache tests
  and documented the contract in `PERFORMANCE.md`. No database or API changes.
- Checks: focused Vitest coverage passed (11 tests across cache and product
  serialization); the current checkout's full suite passed (334 tests, 30 files)
  with `npm.cmd run test:run -- --exclude "**/.kilo/**"`. Lint passed with
  `npm.cmd run lint -- --ignore-pattern ".kilo/**" --ignore-pattern "coverage/**"`.
  `git diff --check` passed. Playwright was not needed: checkout, auth, webhook,
  and recovery flows were unchanged.
- Baseline: default Vitest also scans the nested `.kilo/worktrees/glowing-weaver`
  checkout (648 tests passed before changes). Default lint fails on that checkout's
  `scripts/test-connection.js` (`no-require-imports`). Existing worktree preserved.
- Follow-up: exclude nested worktrees and generated coverage from normal lint and
  test discovery so default checks describe the checkout being maintained.
- Limit: invalidation remains local to the Node process; cross-instance cache
  coordination remains a separate deployment concern.

## 2026-10-01: Enforce the delivery cooldown under concurrent requests

- Evidence: delivery checked `lastAccessedAt` before reading/decrypting content,
  then updated the token without a cooldown predicate. A regression test returned
  two HTTP 200 responses for simultaneous requests from different IPs. A second
  failing test showed a slow product lookup could consume the entire cooldown
  before content was returned.
- Change: the final MongoDB token update now atomically checks and claims the
  two-second cooldown while incrementing usage. A lost race returns HTTP 429
  without content. The timestamp is captured after content preparation. Existing
  IP limits, paid-order checks, stock/legacy delivery, templates, and successful
  response cache headers remain intact. Added eight route tests and documented
  the contract in README and Swagger. No schema or index changes.
- Checks: focused coverage passed (32 tests across delivery, rate limiting, and
  ContentViewer). Full current-checkout Vitest passed (342 tests, 31 files) using
  the nested-worktree exclusion recorded above. Lint and `git diff --check` passed;
  generated Swagger includes the delivery endpoint and its 429 response.
- Validation limit: concurrency tests use a stateful token collection mock with
  conditional-update semantics. `npm.cmd run test:e2e -- e2e/qris-checkout.spec.ts`
  could not start because `E2E_MONGODB_URI` is unset; the production database was
  not used. Re-run against a dedicated E2E database for live MongoDB/browser checks.
- Existing uncommitted cache changes from the previous run were preserved.
