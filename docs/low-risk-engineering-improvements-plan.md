# Low-Risk Engineering Improvements Plan

## Assumptions And Unknowns

- Scope: implementation plan for the high-ROI findings identified in the codebase audit.
- Existing architecture: Next.js App Router, MongoDB via the native driver, in-process memory cache/rate limiting, Vitest, Playwright, Cloudflare email worker path, Pakasir payment integration, mock payment for local development.
- No new services are assumed. Redis, queues, distributed tracing, and external observability platforms are out of scope unless added explicitly later.
- MongoDB deployment details are unknown. Transaction support depends on replica set/Atlas configuration. If transactions are unavailable, use optimistic conditional updates for payment stock assignment.
- Production image hosting domains are unknown. Image allowlisting requires product/ops input.
- Production runtime host/port is unknown. Local defaults can be unified without changing production behavior.

## Planning Review Corrections

- Token uniqueness needs a data rollout gate. The plan must audit duplicate `tokens.orderId` rows before creating a unique index.
- Stock concurrency is not a normal quick win. It is high-value but should land only after idempotency is in place and the fallback strategy is chosen.
- Crypto validation should avoid import-time failures during build/test setup; validate at encrypt/decrypt call time unless a separate startup check is added.
- Image hostname hardening depends on real product image sources. This should not block independent fixes.
- E2E validation should be sequenced after the local base URL mismatch is fixed.

## System Architecture Constraints

- Public UI lives under `app/(store)` and should receive serialized product data only.
- Admin UI lives under `app/admin`; admin route protection already exists in `proxy.ts`.
- Business logic should stay in `lib/`; API route handlers should remain thin.
- MongoDB collections currently used: `products`, `orders`, `tokens`, `audiences`, `broadcasts`, `settings`.
- Payment completion side effects are centralized in `lib/orders.ts`.
- Product cache invalidation currently runs through `lib/products.ts` and `lib/cache.ts`.
- Validation should use `lib/validation.ts` where practical.

## Decision Gates

- Local port: choose one local default before edits. Recommended: keep `package.json` as the authority and align Playwright/docs/default URLs to `3001`.
- Token unique index: create only after checking for existing duplicate `orderId` values in `tokens`.
- Stock assignment: choose transaction path only if deployed MongoDB supports transactions; otherwise use optimistic conditional updates.
- Image allowlist: implement only after approved hostnames are known, or use an explicit unoptimized path for arbitrary admin-entered image URLs.
- Production console stripping: confirm whether the current Next.js version supports excluding `warn`/`error`; if not, disable broad console removal.

## Phase 0: Baseline And Execution Guardrails

Objective: establish a clean baseline before behavior changes.

Scope: test/lint commands, working tree awareness, and branch-local safety.

Technical tasks:

- Record current `git status`.
- Run `npm run lint`.
- Run `npm run test:run`.
- Defer Playwright until local base URL/port drift is fixed.

Dependencies:

- Existing npm install.
- Local env values needed by test setup are already stubbed in `__tests__/setup.ts`.

Risks/blockers:

- E2E tests may currently point at the wrong port.
- Existing uncommitted user changes must not be reverted.

Deliverables:

- Baseline command results documented in implementation notes or PR description.

Validation/testing criteria:

- Lint passes.
- Vitest passes.

Exit criteria:

- Baseline status is known and no unrelated changes are introduced.

## Phase 1: Runtime URL And E2E Port Consistency

Objective: remove local `3000`/`3001` drift.

Scope: `package.json`, `playwright.config.ts`, README local URLs, and internal default base URL helpers used by email, broadcast links, and mock payment.

Technical tasks:

- Add a small base URL helper, likely in `lib/baseUrl.ts`, returning `NEXT_PUBLIC_BASE_URL` or the chosen local default.
- Keep the helper environment-only and dependency-free so it is safe for server modules and shared tests.
- Update `lib/email.ts`, `lib/broadcastTemplate.ts`, and `app/api/payment/mock/pay/route.ts` to use the helper.
- Update Playwright `baseURL` and `webServer.url` to match `npm run dev`.
- Update README local URLs.

Dependencies:

- None beyond current scripts.

Risks/blockers:

- If external tooling expects port `3000`, changing docs/config may surprise users. Prefer centralizing the default rather than spreading another literal.

Deliverables:

- Single source of truth for local base URL.
- Playwright configured against the actual dev server port.

Validation/testing criteria:

- `npm run lint`.
- `npm run test:run`.
- `npm run test:e2e` reaches the dev server instead of timing out on port mismatch.

Exit criteria:

- No remaining hardcoded local default conflicts for app runtime paths.

## Phase 2: Public Product Payload And Stock Count Boundaries

Objective: stop public client props from carrying stock item internals.

Scope: `lib/products.ts`, public product/home components, product serialization tests if added.

Technical tasks:

- Remove `stockItems` from `SerializedProduct`.
- Compute `availableStock` server-side without returning full `stockItems` to public clients.
- Prefer Mongo aggregation projection for active product list and product detail:
  - count unsold stock items
  - exclude `contentEncrypted`
  - exclude `stockItems`
- Keep `serializeProductForClient()` as the public boundary and make it impossible for callers to accidentally include stock item metadata.
- Keep admin stock APIs unchanged where decrypted/admin-only data is required.
- Add or update tests covering public serialization shape.

Dependencies:

- Existing product model must preserve legacy `contentEncrypted` products and stock-based products.

Risks/blockers:

- Need to confirm no public client uses `SerializedProduct.stockItems`; current code inspection shows only `availableStock` usage.

Deliverables:

- Smaller public product response shape.
- No stock item ids, `orderId`, or `soldAt` in public client props.

Validation/testing criteria:

- Vitest for serialization and availability behavior.
- Manual or component check for home/product pages displaying stock count.

Exit criteria:

- Public product payload contains only fields needed by storefront UI.

## Phase 3: Payment Completion Idempotency And Token Uniqueness

Objective: make repeated payment completion calls safe for the same order.

Scope: `lib/orders.ts`, `lib/tokens.ts`, `scripts/setup-indexes.ts`, payment/webhook tests.

Technical tasks:

- Add a token helper that accepts an existing `Db` handle and performs `findOneAndUpdate(..., { upsert: true, returnDocument: "after" })` with `$setOnInsert`.
- Make the paid-state transition conditional, e.g. update only when current status is not already `PAID`, and branch on `modifiedCount`.
- Do not reorder stock assignment in this phase; keep the behavioral change limited to idempotency and duplicate side-effect prevention.
- If an order is already `PAID`, ensure a token exists but do not reassign stock.
- Keep email retry behavior tied to `emailSent`; do not resend on every webhook replay.
- Keep audience upsert idempotent and only run it on the first successful transition, unless recovering a missing audience row is intentionally added.
- Add a preflight duplicate-token query before adding the unique `tokens.orderId` index.
- Add unique MongoDB index on `tokens.orderId` only after duplicates are resolved or confirmed absent.
- Preserve unique index on `tokens.token`.
- Add tests for repeated `handleSuccessfulPayment()` calls.

Dependencies:

- Existing tokens collection may contain duplicate `orderId` values. A one-time cleanup may be required before unique index creation.

Risks/blockers:

- Unique index creation fails if duplicate token rows already exist.
- Existing access links must remain valid during cleanup.
- If duplicate rows exist, do not auto-delete them without review. Current order pages resolve tokens server-side by order ID, but direct delivery-token URLs may still exist outside the app.

Deliverables:

- Idempotent token creation.
- Duplicate-token audit result or remediation note.
- Index script updated.
- Test coverage for duplicate completion calls.

Validation/testing criteria:

- Vitest for token upsert and payment completion idempotency.
- Manual DB check or migration note for duplicate token rows before index rollout.

Exit criteria:

- Replaying a webhook/status sync for one order does not create duplicate tokens or repeated side effects.
- The unique index can be created without data loss.

## Phase 4: Concurrent Stock Assignment Safety

Objective: reduce double-sell risk when multiple orders complete concurrently.

Scope: `lib/orders.ts` stock mutation path and targeted tests.

Technical tasks:

- For stock products, select candidate unsold stock items inside the final mutation path.
- Use either:
  - MongoDB transaction with product re-read and write conflict retry, if supported, or
  - optimistic conditional update requiring selected item IDs are still unsold.
- Optimistic fallback shape:
  - fresh-read product stock state
  - choose `quantity` unsold IDs
  - update product with a filter proving all chosen IDs are still unsold
  - use `arrayFilters` or an update pipeline to mark only chosen IDs sold
  - retry once if no document matched
- For legacy single-content products, condition product update on `isSold !== true`.
- Refactor the sequence so an order is marked paid only after stock assignment is confirmed, or use a transaction so order/product updates commit together.
- Keep email and audience sync outside the critical stock transaction where possible.
- If payment is completed externally but stock assignment cannot be completed, log the order ID/product ID clearly and avoid issuing a delivery token for missing content.

Dependencies:

- MongoDB transaction support is unknown.
- Phase 3 idempotency should land first.

Risks/blockers:

- Payment path is high value and needs focused regression tests.
- Local MongoDB may not support transactions if not running as a replica set.
- There is no current order status for "paid but stock assignment failed"; adding one would be a schema/API change and should be avoided unless required after testing.

Deliverables:

- Conflict-safe stock assignment path.
- Tests for two simulated completions competing for limited stock.

Validation/testing criteria:

- Vitest or integration-style tests for stock products with quantity > 1.
- Test legacy single-content product behavior.
- Test replayed webhook after a successful stock assignment.
- Existing webhook and checkout E2E after port fix.

Exit criteria:

- Concurrent completion cannot assign the same stock item to two paid orders.

## Phase 5: Admin Query Performance Indexes

Objective: keep dashboard queries index-backed as orders grow.

Scope: `scripts/setup-indexes.ts`, admin analytics/recent-sales query patterns.

Technical tasks:

- Add `orders` index for recent paid order lookup: `{ status: 1, paidAt: -1 }`.
- Add `orders` index for top product grouping/filtering: `{ status: 1, productId: 1 }`.
- Prefer explicit index names, e.g. `idx_paid_orders_recent` and `idx_paid_orders_by_product`.
- Keep existing indexes intact.
- Document any index creation expectations in README or implementation notes.

Dependencies:

- MongoDB index creation permission in target environment.

Risks/blockers:

- Index creation can consume resources on large collections.
- The analytics filters include `$ne` and email-shape predicates, so the index improves the leading paid-order scan but does not make every predicate fully selective.

Deliverables:

- Updated index setup script.

Validation/testing criteria:

- Run `npm run db:setup-indexes` in an appropriate environment.
- Verify analytics and recent-sales routes still return the same shape.

Exit criteria:

- Admin dashboard paid-order filters and recent-sales sorting have matching indexes.

## Phase 6: External Fetch Failure Bounds

Objective: prevent external providers from hanging request lifecycles.

Scope: `lib/pakasir.ts`, `lib/email.ts`, `lib/broadcast.ts`, tests for failure handling.

Technical tasks:

- Add a small fetch timeout helper using `AbortSignal.timeout` when available, with `AbortController` fallback if needed.
- Apply timeout to Pakasir transaction status lookup.
- Apply timeout to Cloudflare email API calls.
- For Pakasir status GET, consider one short retry because the operation is idempotent.
- Keep email failure best-effort and do not fail paid delivery solely because email failed.
- Ensure broadcast batch processing counts timeout failures as failed recipients.
- Do not add timeouts to local outbox file writes unless a concrete hang is observed.

Dependencies:

- Runtime must support `AbortSignal.timeout`; otherwise use `AbortController`.

Risks/blockers:

- Too-short timeout can create false failures on slow provider responses.
- Retrying email sends can duplicate emails if the provider accepted the request but the response timed out; do not retry non-idempotent email POSTs without a provider idempotency key.

Deliverables:

- Bounded external call duration.
- Tests for timeout/error normalization.

Validation/testing criteria:

- Vitest mocking fetch timeout/rejection.
- Existing email and Pakasir tests pass.

Exit criteria:

- Provider latency cannot hold a webhook, sync, or broadcast request indefinitely.

## Phase 7: Admin Auth Flow Simplification

Objective: remove redundant client-side admin auth checks.

Scope: `app/admin/layout.tsx`, `proxy.ts`, `app/api/auth/check/route.ts` usage.

Technical tasks:

- Treat `proxy.ts` as route-access enforcement for `/admin`.
- Remove layout-level `fetch("/api/auth/check")` and related `authed/checking` state.
- Keep logout behavior.
- Keep server-side page guards only where they protect data fetching or improve clarity.
- Retain `/api/auth/check` for one release if uncertain; delete it later only after `rg "/api/auth/check"` shows no callers.

Dependencies:

- `JWT_SECRET` must be configured because `proxy.ts` imports session verification.

Risks/blockers:

- Client layout currently renders different shells for login/authed/unauthenticated states; simplify carefully around `/admin/login`.

Deliverables:

- Admin layout without auth-loading flash on every route change.

Validation/testing criteria:

- Admin auth E2E after Playwright port fix.
- Manual check: unauthenticated `/admin/dashboard` redirects to `/admin/login`.
- Manual check: authenticated admin navigation does not flash a full-page auth loader.

Exit criteria:

- Admin navigation does not perform redundant auth-check API calls.

## Phase 8: Crypto Configuration And Test Coverage

Objective: fail fast on invalid content encryption configuration.

Scope: `lib/crypto.ts`, `__tests__/lib/crypto.test.ts`, test setup.

Technical tasks:

- Validate encryption key byte length, not string character count.
- Move key-buffer creation behind a small `getEncryptionKeyBuffer()` helper used by `encryptContent()` and `decryptContent()`.
- Throw on invalid key when encryption/decryption is attempted, rather than at module import time.
- Keep tests setting a valid 32-byte key.
- Refactor crypto tests to import the actual module instead of duplicating implementation.
- Add test for invalid key behavior using module isolation.

Dependencies:

- Existing encrypted content assumes the same AES-256-CBC format.

Risks/blockers:

- If local `.env` has invalid key, development will fail earlier.
- Tests that import `lib/crypto.ts` before stubbing env must be isolated or updated.

Deliverables:

- Runtime config validation.
- Tests covering the real crypto module.

Validation/testing criteria:

- `npm run test:run`.
- Manual boot with valid key.

Exit criteria:

- Invalid `CONTENT_ENCRYPTION_KEY` cannot silently reach first purchase/delivery operation.

## Phase 9: Next.js Security And Observability Guardrails

Objective: reduce image proxy abuse risk and preserve useful production errors.

Scope: `next.config.ts`, product image URL expectations, production logging behavior.

Technical tasks:

- Replace wildcard image hostname pattern with an allowlist once approved image hosts are known.
- If arbitrary admin-entered URLs must remain supported, consider using unoptimized images for those URLs instead of proxying through Next image optimization.
- Change `compiler.removeConsole` to preserve `warn` and `error` if supported by the installed Next.js version; otherwise remove broad console stripping.
- Keep current security headers unless a concrete integration requires changes.

Dependencies:

- Approved image hostnames are unknown.

Risks/blockers:

- Tight image allowlist can break existing products with externally hosted images.
- Changing console stripping affects production bundle/log behavior.

Deliverables:

- Safer image optimization policy.
- Production warnings/errors retained.
- Explicit list of allowed image hostnames, or a documented decision to avoid proxy optimization for arbitrary URLs.

Validation/testing criteria:

- Build succeeds.
- Product images from approved hosts render.
- Server route errors still emit logs in production-like build if tested.

Exit criteria:

- Image host policy is explicit, and production error/warn logs are not removed.

## Rollback Strategy

- Config-only changes: revert individual file edits.
- Serializer/payload changes: restore prior `SerializedProduct` shape if a hidden client dependency appears.
- Index changes: additive indexes can remain; if necessary, drop by explicit index name after confirming query impact.
- Unique token index: do not roll back by deleting data. Drop only the index if the write path shows compatibility issues.
- Payment changes: keep Phase 3 and Phase 4 isolated so idempotency can ship independently of concurrency changes.
- Crypto validation: revert validation strictness only if environment remediation is blocked.
- Admin layout changes: restore client auth check if middleware behavior is insufficient.

## Execution Order

1. Phase 0 baseline.
2. Phase 1 URL/port consistency.
3. Phase 2 public product payload.
4. Phase 3 payment idempotency code and duplicate-token audit.
5. Phase 3 unique token index after duplicate audit passes or remediation is complete.
6. Phase 4 concurrent stock assignment after idempotency is in place and the MongoDB strategy is chosen.
7. Phase 5 admin indexes.
8. Phase 6 external fetch timeouts.
9. Phase 8 crypto config and real-module tests.
10. Phase 7 admin auth simplification.
11. Phase 9 Next.js guardrails after image-host input is available.
