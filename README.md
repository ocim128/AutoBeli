# AutoBeli

AutoBeli is a Next.js storefront for selling text-based digital products with secure post-payment delivery, admin operations, audience management, and product broadcast email.

## What the app does

- Public storefront with localized product browsing and product detail pages
- Checkout flow that creates `PENDING` orders and supports quantity-based stock
- Payment integration with Pakasir, plus a mock gateway for local development
- Order-page-first delivery flow with recovery by email or order ID
- AES-256 encrypted product content, decrypted only at delivery time
- Admin dashboard for products, orders, analytics, audience, settings, and broadcast
- Admin inventory tools for single add, bulk stock import, bulk delete by pasted username, and unsold-only copy actions
- Audience sync from paid orders and product-specific outbound email broadcasts
- Swagger-backed API docs at `/api-doc`

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- MongoDB native driver
- Tailwind CSS v4
- Vitest + Testing Library
- Playwright
- Cloudflare Worker for outbound email delivery

## Core flow

1. Customer browses active products from `app/(store)`.
2. `POST /api/orders` creates a `PENDING` order and reserves nothing yet.
3. Customer pays through Pakasir or the local mock gateway.
4. Webhook or order-page sync marks the order `PAID`, assigns stock, creates an access token, and attempts a confirmation email.
5. Customer opens `/order/[orderId]`, which fetches the token and unlocks delivery through `/api/delivery/[token]`.
6. If email is lost, `/recover` lets customers find paid orders by email or order ID.

## Product inventory model

- Products support two storage modes:
  - legacy single-content products stored in `contentEncrypted`
  - stock-based products stored in `stockItems`
- Paid orders only consume unsold stock items.
- Admin inventory actions that copy or bulk delete by username operate on unsold stock only and do not touch sold content.

## Admin inventory tools

- `/admin/products` lets admins copy all unsold usernames for one product, copy all unsold usernames across the catalog, and copy all unsold stock content across the catalog.
- `/admin/products/[slug]/stock` supports:
  - single stock add
  - bulk stock import from raw credential lines
  - single stock edit/delete
  - bulk delete by pasted username list, scoped to matching unsold stock in that product only

## Local setup

### Prerequisites

- Node.js 20+
- MongoDB
- npm

### Install

```bash
npm install
```

### Configure environment

Copy `.env.example` to `.env`, then set the values below.

Important: the current runtime expects `ADMIN_PASSWORD` and `JWT_SECRET`. The older names shown in some legacy docs are not the active auth variables.

### Initialize indexes

```bash
npm run db:setup-indexes
```

If you already have paid orders and want to populate the audience list:

```bash
npm run db:backfill-audience
```

### Run locally

```bash
npm run dev
```

Open:

- Storefront: `http://localhost:3000`
- Admin login: `http://localhost:3000/admin/login`
- API docs: `http://localhost:3000/api-doc`

## Environment variables

### Required

- `NEXT_PUBLIC_BASE_URL`
  Public base URL used in links and mock payment flow.
- `MONGODB_URI`
  MongoDB connection string.
- `ADMIN_PASSWORD`
  Plain admin password used for login and broadcast re-auth.
- `JWT_SECRET`
  Secret for the admin session cookie.
- `CONTENT_ENCRYPTION_KEY`
  Exactly 32 characters for AES-256 content encryption.
- `PAYMENT_GATEWAY`
  `PAKASIR` or `MOCK`.

### Required when `PAYMENT_GATEWAY=PAKASIR`

- `PAKASIR_API_KEY`
- `PAKASIR_PROJECT_SLUG`

### Optional email and broadcast

- `CLOUDFLARE_EMAIL_API_URL`
- `CLOUDFLARE_EMAIL_API_KEY`
- `CLOUDFLARE_EMAIL_FROM`
- `CLOUDFLARE_EMAIL_FROM_NAME`
- `CLOUDFLARE_EMAIL_REPLY_TO`
- `EMAIL_DEV_FALLBACK`
- `EMAIL_DEV_OUTBOX_DIR`
- `BROADCAST_MAX_RECIPIENTS`
- `BROADCAST_BATCH_SIZE`

Notes:

- If Cloudflare email is not configured, local development can fall back to `.tmp/email-outbox`.
- Order delivery does not depend on email. Email is a best-effort copy and recovery aid.
- Mock payment and mock webhook routes are blocked in production.

## Common commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test:run
npm run test:coverage
npm run test:e2e
npm run db:setup-indexes
npm run db:backfill-audience
```

## Key routes

- `/` storefront home
- `/product/[slug]` product detail
- `/checkout/[orderId]` checkout
- `/order/[orderId]` order status and access
- `/recover` paid-order recovery
- `/api-doc` interactive API docs
- `/admin/login` admin auth
- `/admin/dashboard` admin overview
- `/admin/products` product management
- `/admin/products/create` product creation
- `/admin/products/[slug]/edit` product editing
- `/admin/products/[slug]/stock` stock management
- `/admin/products/[slug]/broadcast` product broadcast
- `/admin/orders` order management
- `/admin/audience` audience management

## Repo layout

```text
app/           Next.js routes, pages, and API handlers
components/    Storefront, admin, and shared UI components
context/       Language provider for public UI
docs/          Product and design planning docs
e2e/           Playwright coverage
lib/           Data, auth, payment, delivery, email, and audience logic
scripts/       MongoDB index setup and audience backfill scripts
worker/        Cloudflare outbound email worker
__tests__/     Vitest unit and component tests
```

## Email worker

Transactional and broadcast email is sent through the Cloudflare worker in [`worker/`](./worker). Deployment details live in [`worker/README.md`](./worker/README.md).

## Related docs

- [`AGENTS.md`](./AGENTS.md)
- [`DESIGN.md`](./DESIGN.md)
- [`PERFORMANCE.md`](./PERFORMANCE.md)
- [`docs/email-audience-and-product-broadcast-plan.md`](./docs/email-audience-and-product-broadcast-plan.md)
- [`docs/hybrid-tactical-ui-redesign-plan.md`](./docs/hybrid-tactical-ui-redesign-plan.md)

## License

Private.
