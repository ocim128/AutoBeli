# AGENTS.md

1. Think Before Coding
   Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask. 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

2. simplicity is a flex
   code like ur getting paid per deletion, if not needed then nuke it.
   No features beyond what was asked.
   No abstractions for single-use code.
   No "flexibility" or "configurability" that wasn't requested.
   No error handling for impossible scenarios.
   If you write 200 lines and it could be 50, rewrite it.
   Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
   Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
   Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
   Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

This file is the repo-specific working guide for coding agents and contributors.

## Project summary

AutoBeli is a digital text storefront built on Next.js App Router. It supports secure text delivery after payment, quantity-aware stock items, an admin console, audience management, and product broadcast email.

## Runtime contract

- Public UI lives under `app/(store)` and is bilingual through `LanguageContext`.
- Admin UI lives under `app/admin` and is English-only.
- Admin auth is password-based and currently uses:
  - `ADMIN_PASSWORD`
  - `JWT_SECRET`
- Product content is encrypted with `CONTENT_ENCRYPTION_KEY` and must only be decrypted in secure delivery paths.
- Payment gateway is selected by `PAYMENT_GATEWAY`:
  - `PAKASIR` for real transactions
  - `MOCK` for local development only

Important: `.env.example` still contains some older auth naming. Follow the runtime code, not the stale names.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run test:run
npm run test:coverage
npm run test:e2e
npm run db:setup-indexes
npm run db:backfill-audience
```

## Repo map

- `app/`
  Route handlers, layouts, pages, and API routes.
- `components/`
  Storefront, admin, and shared UI components.
- `lib/`
  Business logic. Most behavior changes should be implemented here first.
- `scripts/`
  DB setup and migration-style utilities.
- `worker/`
  Cloudflare outbound email worker.
- `__tests__/`
  Vitest coverage.
- `e2e/`
  Playwright flows.

## Files that matter most

- `lib/orders.ts`
  Main payment-completion side effects.
- `lib/products.ts`
  Product serialization and cache invalidation.
- `lib/audience.ts`
  Audience syncing, export, and buyer exclusion logic.
- `lib/broadcast.ts`
  Broadcast caps, batching, and logging.
- `lib/email.ts`
  Cloudflare email send path and local outbox fallback.
- `lib/auth.ts`
  Admin session behavior.
- `lib/rateLimit.ts`
  Shared in-memory throttling and admin password re-check.
- `lib/validation.ts`
  Shared Zod schemas; prefer extending these over one-off validation.

## Critical invariants

- Preserve both product models:
  - legacy single-content products using `contentEncrypted`
  - stock-based products using `stockItems`
- Do not expose decrypted content in admin list APIs, storefront APIs, or client props.
- `handleSuccessfulPayment()` in `lib/orders.ts` is the canonical place for:
  - marking orders paid
  - assigning stock
  - invalidating product cache
  - creating access tokens
  - sending order email
  - syncing audience rows
- `/order/[orderId]` calls `syncOrderPaymentStatus()` before rendering. Keep that fallback intact when changing payment code.
- Audience data is derived from paid orders but stored separately. Do not treat `orders.customerContact` as the editable mailing list.
- Audience edits and deletes must not rewrite historical order records.
- Live product broadcast requires:
  - valid admin session
  - admin password re-entry
  - active product
  - available stock
- Mock payment routes must remain unusable in production.

## Data and security rules

- `CONTENT_ENCRYPTION_KEY` must be 32 characters.
- Delivery happens through `/api/delivery/[token]` and uses:
  - IP-based rate limiting
  - per-token cooldown
  - `Cache-Control: no-store`
- Recovery search only returns paid orders and is intentionally rate-limited.
- When touching API routes, keep or extend the existing Swagger annotations used by `/api-doc`.

## Change guidance

- Prefer server-side logic in `lib/` and thin route handlers in `app/api/`.
- Reuse `serializeProductForClient()` when sending product data to client components.
- Invalidate product cache after product, stock, or payment changes that affect availability.
- Reuse shared Zod schemas instead of adding route-local parsing.
- Keep broadcast copy plain text and fixed-template. Do not introduce generated marketing copy.
- Preserve the public/admin layout split:
  - `app/layout.tsx` should stay minimal
  - `app/(store)/layout.tsx` owns public shell
  - `app/admin/layout.tsx` owns admin shell

## Testing expectations

- Run targeted Vitest coverage for touched logic in `lib/` and `components/`.
- Run Playwright when changing checkout, auth, webhook, or recovery flows.
- If you change DB shape or audience behavior, run:
  - `npm run db:setup-indexes`
  - relevant tests touching `orders`, `audiences`, and `broadcasts`

## Useful docs

- `README.md`
- `worker/README.md`
- `PERFORMANCE.md`
- `DESIGN.md`
- `docs/email-audience-and-product-broadcast-plan.md`
- `docs/hybrid-tactical-ui-redesign-plan.md`
