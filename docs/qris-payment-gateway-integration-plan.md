# Qris Payment Gateway Integration Plan

## Goal

Replace the current production payment-provider path with Qris while keeping
the existing AutoBeli order, stock, token, email, recovery, and mock-payment
flows intact.

The public product name is **Qris**. Code constants may use `QRIS`; no Qris API
credential may reach the browser.

`QRIS` becomes the only gateway used for new production orders. Keep the
existing `PAKASIR` types, routes, and read-only reconciliation branch for
historical orders until those orders are terminal; do not rewrite old order
records.

## Integration contract

AutoBeli calls the Qris service over HTTPS:

- `POST /payment` creates a payment.
- `GET /payment/:id` is the reconciliation fallback.
- `GET /payment/:id/qris.png` supplies the QR image.
- Qris calls `POST /api/webhooks/qris` when the payment becomes `paid` or
  `expired`.

Use the Qris API key as `Authorization: Bearer <key>`. Use a server-managed
payment amount so two AutoBeli orders with the same product price receive
different pending amounts:

```json
{
  "mode": "server_managed",
  "base_amount": 25000,
  "timeout": 300000,
  "tolerance": 0,
  "webhook_url": "https://autobeli.example.com/api/webhooks/qris?attempt=<opaque>",
  "tz": "Asia/Jakarta"
}
```

Persist the final amount returned by Qris, not only the product total.
The `attempt` query value is generated server-side for each create attempt;
clients never supply it.

Qris webhook bodies use the exact fields `payment_id`, `payment_status`
(`paid` or `expired`), and whole-Rupiah `amount`. The paid form may include
`paid_amount`, `paid_at`, and a variable `provider_transaction` object; the
expired form may include `expires_at`. `X-Signature` is lowercase-hex
HMAC-SHA256 over the raw body. `X-Event` is advisory only and must not be
trusted instead of the signed `payment_status` field.

## Runtime configuration

Add and document:

```env
PAYMENT_GATEWAY=QRIS
QRIS_API_BASE_URL=https://qris.example.com
QRIS_API_KEY=
QRIS_WEBHOOK_HMAC_KEY=
```

Rules:

- `QRIS` is the production gateway; `MOCK` remains development-only.
- In `NODE_ENV=production`, reject a missing/invalid gateway setting instead of
  silently defaulting to `MOCK`.
- Parse the gateway through one runtime helper; do not cast an arbitrary
  environment string into the `paymentGateway` union.
- `QRIS_API_BASE_URL` must be an absolute HTTPS URL in production.
- `QRIS_API_KEY` and `QRIS_WEBHOOK_HMAC_KEY` are server-only secrets.
- `QRIS_API_KEY` is a machine API key created in the Qris admin panel; it is
  not the panel's `PANEL_API_KEY`.
- `QRIS_WEBHOOK_HMAC_KEY` must equal Qris's server-side `WEBHOOK_HMAC_KEY`.
  Configure that secret on the Qris deployment; it is not set through the
  panel.
- `NEXT_PUBLIC_BASE_URL` must be configured to a public HTTPS AutoBeli URL so
  Qris can reach the webhook.
- In production, fail fast when `PAYMENT_GATEWAY=QRIS` and any Qris setting is
  missing or when `QRIS_API_BASE_URL` is not HTTPS. The Qris service must also
  have a valid Static QRIS configured.
- Reject Qris payments whose base amount is outside the Qris-supported range
  (`1000..9999000` IDR).
- Do not log credentials, authorization headers, webhook signatures, or full
  provider responses.

## Payment lifecycle

1. `POST /api/orders` stores `paymentGateway: "QRIS"` for new orders. When
   Qris is selected, reject a product total below IDR 1,000 or above
   IDR 9,999,000 before inserting the order, so an order cannot be created
   that the configured gateway can never accept.
2. `POST /api/payment/qris/create` validates the order is payable, calculates
   `priceIdr * quantity`, and creates a server-managed Qris payment.
3. The route stores the Qris payment ID, final amount, and expiry in
   `order.paymentMetadata` before returning success. The provider-relative
   `qris_url` is not persisted; the image proxy constructs it from the payment
   ID.
4. The client goes to the order page. It does not redirect to a provider-hosted
   page because the Qris QR image endpoint is API-key protected.
5. The order page displays a same-origin AutoBeli QR image proxy and the final
   amount. It continues the existing status refresh loop.
6. A signed Qris webhook is the primary completion path.
7. `syncOrderPaymentStatus()` calls Qris `GET /payment/:id` when the webhook is
   delayed or unavailable. It must verify `paid_amount` (when present) and the
   payment amount before fulfilling.
8. Both paths call one shared order-payment processor. The existing
   `handleSuccessfulPayment()` remains the only place that assigns stock,
   marks the order paid, creates the delivery token, invalidates product cache,
   sends confirmation email, and syncs audience data.

## Order metadata and state rules

Extend the order types without exposing provider secrets:

```ts
paymentMetadata: {
  provider: "qris" | "mock" | "pakasir";
  transaction_ref?: string; // required for Qris; provider-specific otherwise
  amount?: number;         // final Qris amount
  expires_at?: number;
}

// Internal order fields; never serialize them to the browser.
paymentCreationStartedAt?: Date;
paymentCreationAttempt?: string;
```

Set the internal creation lease and opaque attempt nonce before calling Qris.
Clear both after metadata is stored or after a known-safe provider rejection.
An indeterminate timeout keeps the lease; it must not automatically create a
second provider payment.

- `transaction_ref` is the Qris payment ID and is the idempotency key.
- A `paid` event is accepted only when the order is still `PENDING`, the
  provider is `qris`, the payment ID matches, and the event amount equals the
  stored final amount.
- A duplicate `paid` event is a successful no-op.
- An `expired` event changes `PENDING` to `EXPIRED` only when the payment ID
  matches. It must not assign stock or create a token.
- A late event for an old payment ID after a retry is ignored.
- An `EXPIRED` order may retry by clearing the old Qris metadata and creating a
  new payment. The create request carries `retry: true` for this path. A
  pending order with an existing Qris payment reuses that payment instead of
  creating another one. Late events for the cleared payment ID are ignored.
- Historical orders are not rewritten. If old provider records are still live,
  keep their read-only reconciliation branch until they become terminal.

The external create call has an indeterminate-outcome case: a timeout can mean
Qris accepted the payment even when AutoBeli did not receive the response. Set
an opaque creation-attempt nonce and its lease before calling Qris, include the
nonce in that payment's webhook URL query, and do not start a second create
while the lease is indeterminate. If a webhook arrives before the create
response was persisted, it may attach the payment ID/amount/expiry to the
matching attempt nonce atomically. Clear the lease only after metadata is
stored or after a known-safe provider rejection; never clear it merely because
the network request timed out.

## Server-side Qris client

Create `lib/qris.ts` around the existing `fetchWithTimeout()` helper.

Implement:

- `isQrisConfigured()`.
- `createQrisPayment({ baseAmount, timeout, webhookUrl, timezone })`.
- `getQrisPayment(paymentId)`.
- `fetchQrisQrImage(paymentId)`.
- `verifyQrisWebhookSignature(rawBody, signature)` using HMAC-SHA256 and a
  constant-time comparison.
- Strict response validation for payment ID, status, amount, expiry, and (when
  paid) `paid_amount`.
- Safe error mapping for timeout, non-2xx, malformed JSON, and Qris error codes.
- Limit QR image responses to `image/png` and a bounded byte size.

All requests must use a bounded timeout. The client must never be imported by
client components.

## API routes

Implementation touchpoints are `lib/definitions.ts`, `lib/validation.ts`,
`lib/orders.ts`, the new `lib/qris.ts`, `app/api/orders/route.ts`, the new
Qris routes below, `components/BuyButton.tsx`, `components/CheckoutForm.tsx`,
`components/OrderPending.tsx`, the checkout/order pages, product gateway
selection, i18n strings, `.env.example`, and `scripts/setup-indexes.ts`.
Set the example default to `MOCK` for local development, document `QRIS` as
the production value, and keep Pakasir variables marked legacy rather than
using them as the default.
Keep route Swagger annotations updated when adding or changing endpoints.

### Create payment

Add `app/api/payment/qris/create/route.ts`.

- Validate `{ orderId, retry?: boolean }` with a shared Zod schema. `retry: true`
  is required when the order is `EXPIRED`.
- Rate-limit using the existing order/payment limit.
- Load the order and product from MongoDB.
- Allow only `PENDING` or an explicitly retried `EXPIRED` order.
- Return the stored Qris payment when a pending order already has one, unless
  its stored expiry has passed; reconcile that provider payment first and
  transition the order to `EXPIRED` instead of returning a stale QR.
- Use a short conditional database lock before calling Qris so concurrent
  checkout requests cannot create multiple provider payments for one order.
- Persist provider metadata with a conditional update. If another request won,
  return its stored metadata.
- Return `{ success, paymentId, amount, expiresAt }`; do not return the API key
  or a direct provider image URL to the browser.
- Build the per-payment webhook URL from `NEXT_PUBLIC_BASE_URL` and the opaque
  creation-attempt nonce. Return a distinct `409` for an active/indeterminate
  creation lease instead of creating a second provider payment.
- The existing Pakasir and mock create routes must reject orders whose stored
  gateway does not match that route; this prevents a caller from bypassing the
  selected production gateway by invoking an old endpoint directly.

### QR image proxy

Add `app/api/payment/qris/image/route.ts`.

- Accept only an AutoBeli order ID (for example, `?orderId=...`); never accept
  a provider URL or payment ID supplied by the browser.
- Load the order server-side and require a matching pending Qris payment.
- Fetch the image from Qris with the server-side API key and stream it as
  `image/png`.
- Use `Cache-Control: private, no-store` and return generic errors.
- Never proxy an arbitrary URL supplied by the client.

### Webhook

Add `app/api/webhooks/qris/route.ts`.

- Read the raw request bytes before parsing JSON.
- Verify `X-Signature` against `QRIS_WEBHOOK_HMAC_KEY` with a constant-time
  comparison.
- Validate the signed body and accept only `paid` and `expired` events. Ignore
  `X-Event` for authorization and routing because it is not signed.
- Find the order by `paymentMetadata.provider: "qris"` and
  `paymentMetadata.transaction_ref: payment_id`.
- If no transaction reference is stored yet, use the signed request's opaque
  attempt nonce to recover the create operation; never attach an event to an
  order that has a different stored payment ID.
- Verify the event amount against the stored final amount.
- Route the event through the shared order-payment processor.
- Return 2xx for valid duplicates, unknown/stale payment IDs, and rejected
  amount mismatches so Qris does not retry permanent data errors.
- Return a transient 5xx only when AutoBeli cannot safely determine the result.
- Reject missing/invalid signatures with 401 and bound the raw request body
  size before parsing it. Await the settlement update; do not fire-and-forget
  fulfillment work from a serverless route.

## Order-page and UI changes

- Use `QRIS` for new production orders and keep `MOCK` for local development.
  Retain the `PAKASIR` type/labels needed to render and reconcile historical
  orders.
- Update the product-page environment mapping and all gateway prop types to
  recognize `QRIS`; the current code maps only `PAKASIR` to a real gateway and
  would otherwise silently render Qris orders as mock.
- Update `CheckoutForm` to call `/api/payment/qris/create` and then navigate to
  `/order/:id` instead of expecting `payment_url`; send `retry: true` only for
  an explicitly retried expired order.
- Extend `OrderPending` to show the Qris QR image, final payable amount, expiry,
  refresh guidance, and a retry action.
- Tell the customer that server-managed pricing may add a unique IDR 0–999
  suffix; after creation, display the exact final amount returned by Qris.
- Add an expired-order state with a clear retry link; do not show it as still
  processing.
- Pass the stored final Qris amount and expiry to `OrderPending`; do not use
  the pending order's `amountPaid` (which remains zero).
- Poll until the provider expiry plus a short grace period, rather than the
  existing fixed three-minute cutoff (the default Qris payment lasts five
  minutes).
- Display the user-facing label `Qris`, not an internal provider identifier.
- Remove provider-specific method labels that do not describe the Qris flow.
- Add only the required Indonesian and English checkout/error strings.

## Shared order processing

Update `lib/orders.ts`:

- Add a processor for a verified Qris status event that loads the current order
  and product, checks the payment ID and amount, and calls
  `handleSuccessfulPayment()` for `paid`.
- Add a conditional `PENDING -> EXPIRED` update for `expired`.
- Add the Qris branch to `syncOrderPaymentStatus()`.
- Keep the existing paid-order token/email recovery behavior.
- Never fulfill from client input, an unverified webhook, or an amount that was
  not recorded when the Qris payment was created.
- Keep the Pakasir sync branch for historical orders, while preventing new
  orders from selecting Pakasir once `PAYMENT_GATEWAY=QRIS`.

Add a MongoDB index for the lookup used by webhooks and reconciliation:

```js
{ "paymentMetadata.provider": 1, "paymentMetadata.transaction_ref": 1 }
```

Make it a unique partial index for Qris records with a non-empty transaction
reference, so one provider payment cannot be assigned to two orders.

## Tests

Add or update tests for:

- Qris request headers, timeout behavior, response validation, and safe errors.
- HMAC verification over the exact raw webhook body, including invalid and
  replayed signatures.
- Server-managed final amount persistence and amount-mismatch rejection.
- Qris amount-boundary rejection at order creation and create-payment time.
- Existing pending payment reuse and expired-order retry.
- Concurrent create attempts for one order resulting in one stored provider
  payment reference.
- Timed-out/indeterminate provider creation does not create a second payment;
  an attempt-nonce webhook can recover metadata.
- Paid webhook and status-poll fallback both invoking completion once.
- Duplicate paid events not duplicating stock assignment, tokens, emails, or
  audience rows.
- Expired events, stale payment IDs, unknown IDs, and late paid events.
- QR image proxy authorization and arbitrary-URL rejection.
- Checkout and order-page rendering of Qris amount, QR image, pending, paid,
  expired, and retry states.
- Production rejection of the mock gateway.
- Historical Pakasir orders still render and reconcile without allowing new
  Pakasir orders under the Qris gateway.

Run:

```bash
npm run lint
npm run test:run
npm run test:e2e
npm run build
npm run db:setup-indexes
```

Run the index command against the intended AutoBeli database after deploying
the schema change; never point it at the Qris database.

## Rollout

1. Deploy the code with `PAYMENT_GATEWAY=MOCK` and verify the unchanged local
   checkout flow.
2. In the Qris deployment, configure Static QRIS, `WEBHOOK_HMAC_KEY`, and
   outbound access. Create a machine API key in the Qris panel.
3. Configure AutoBeli with that API key, the same HMAC value, and
   `QRIS_API_BASE_URL` (for the current service, `https://qris.onrender.com`).
   Allow Qris outbound access to the public AutoBeli webhook URL. The two apps
   do not need to run on the same hosting account.
4. Run one end-to-end payment with a controlled amount, confirm the signed
   webhook, and verify stock, token, email, audience, and order status.
5. Switch production to `PAYMENT_GATEWAY=QRIS` only after webhook and status
   fallback tests pass.
6. Monitor Qris API failures, webhook verification failures, payment-expiry
   counts, and completion errors. Do not expose payment credentials in logs.

## Completion criteria

- New production orders use Qris and show a usable QR inside AutoBeli.
- The final Qris amount is the amount shown to the customer and verified on
  settlement.
- No Qris secret is sent to the browser or logged.
- Webhook and polling paths are both idempotent and converge on one paid order.
- Expiry and retry behavior is clear and safe.
- Existing stock delivery, access-token, email, audience, recovery, and mock
  flows remain green in automated and end-to-end tests.
- Historical Pakasir orders remain readable and reconcilable, while no new
  Pakasir orders are created under the Qris gateway.
