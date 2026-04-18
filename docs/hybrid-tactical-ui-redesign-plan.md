# Hybrid Tactical UI Redesign Plan

## Purpose

Redesign AutoBeli into a darker, sharper, more premium interface inspired by the selected reference: editorial serif headlines, mono utility labels, thin control-panel borders, and restrained orange-red accents.

This is a UI execution document, not a moodboard. Another AI agent should be able to use this plan to implement the redesign without inventing the visual system or reopening major product decisions.

The goal is not a full `shadcn/ui` visual migration. The goal is a hybrid system:

- use `shadcn/ui` for accessibility, structure, and interaction primitives
- keep custom composition for branding and layout
- replace the current soft indigo kinetic look with a darker tactical editorial system
- unify storefront and admin under one design language without making the app feel like a generic dashboard starter

## Audit Resolutions

This audit found the following weaknesses in the first version of the plan and resolves them here:

1. Strategy-phase mismatch.
   The strategy said "admin first" but the phase order redesigned public pages first.
   Resolution: this plan now treats the public shell as the visual source of truth, then applies that system to transaction flows, then admin.
2. Layout split ambiguity.
   The old plan said to split shells but did not define exact route ownership.
   Resolution: this plan now defines root, public, admin, and special-route ownership explicitly.
3. `shadcn` token ambiguity.
   The old plan had brand colors but not the semantic token map needed to theme `shadcn`.
   Resolution: this plan now defines required semantic token mapping.
4. Copy and localization ambiguity.
   The old plan did not say whether admin should also be bilingual.
   Resolution: public UI remains bilingual; admin stays English-only in this redesign phase unless explicitly expanded later.
5. Incomplete route coverage.
   The old plan did not explicitly call out `api-doc`, loading, and error routes.
   Resolution: those routes are now included in shell ownership and QA scope.
6. Encoding quality issues.
   The old doc contained mojibake and copied emoji artifacts.
   Resolution: this version is normalized to plain ASCII text and explicitly requires cleanup of malformed user-facing copy.

## Core Design Direction

### Theme name

`Tactical Editorial Commerce`

### What to borrow from the reference

- near-black base surfaces
- thin grid lines and panel dividers
- serif display typography for large headlines
- mono micro-labels for metadata, price labels, section names, and status text
- sharp framed panels with corner details
- one hot accent color used sparingly for CTA and state emphasis
- restrained motion that feels instrument-like rather than playful

### What not to copy literally

- do not turn AutoBeli into fake military fiction
- do not use "surveillance", "laboratory", or defense-language jargon unless it maps cleanly to commerce
- do not copy the reference site's copy, layout, or branding verbatim

This app should feel like a premium digital commerce terminal, not a defense-tech parody.

## Problems in the Current UI

Current repo issues that this redesign must fix:

- The public storefront and admin surfaces feel like two different products.
- The visual identity is overly dependent on indigo gradients, oversized rounding, soft shadows, and orbit animations.
- Decorative inline SVGs are repeated across many pages instead of being centralized into reusable primitives.
- The current root layout forces the public shell onto admin pages because `app/layout.tsx` renders the public header, footer, and WhatsApp button for every route.
- Forms are inconsistent. `components/ui/FormInput.tsx` exists, but important flows like `components/CheckoutForm.tsx` and `app/recover/page.tsx` still hand-roll their own fields.
- Admin pages such as `app/admin/orders/page.tsx`, `app/admin/products/page.tsx`, and `app/admin/settings/page.tsx` are plain and visually disconnected from the storefront.
- User-facing copy in `lib/i18n.ts` is playful and emoji-heavy, which conflicts with the target theme.
- The current custom toast system in `components/ui/Toast.tsx` is unnecessary maintenance once `shadcn` is introduced.

## Hard Decisions Resolved By This Plan

These decisions should not be reopened during implementation unless blocked by code constraints:

- The redesign is dark-first across storefront and admin.
- There is no light/dark toggle in this phase.
- `shadcn/ui` is used for primitives, not as the final visual identity.
- The app keeps the AutoBeli brand name and business model. This is a UI redesign, not a lore rebrand.
- The public shell and admin shell must be separated.
- Public routes should own the marketing header, footer, and WhatsApp CTA. Admin routes must not render them.
- Public routes remain bilingual through `LanguageContext`.
- Admin remains English-only in this redesign phase. Do not expand full admin localization unless explicitly requested later.
- The purple/indigo-heavy theme is being removed as the main identity.
- Large orbit animations and inline orbital SVG decorations are being retired.
- Motion remains, but it becomes subtle: line reveals, panel fades, scan movement, cursor blink, and restrained hover shifts.
- Copy should become tighter, more technical, and emoji-free while staying understandable for Indonesian and English users.

## Route Ownership and Layout Strategy

Route ownership is fixed by this plan and should not be improvised during implementation.

### Root layout

`app/layout.tsx` must become minimal. It should own only:

- `html` and `body`
- fonts
- top-level providers
- global metadata and viewport config
- a skip link only if it can work safely without assuming one shell structure

It must not own:

- public header
- public footer
- WhatsApp CTA
- admin navigation

### Public shell

Preferred implementation: route group at `app/(store)/layout.tsx`.

The public shell owns:

- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/WhatsAppButton.tsx`

Public shell routes:

- `/`
- `/product/[slug]`
- `/checkout/[orderId]`
- `/order/[orderId]`
- `/recover`
- `/api-doc`

### Admin shell

`app/admin/layout.tsx` owns the admin frame only.

Admin shell must not render:

- public marketing header
- public footer
- WhatsApp CTA

Admin shell routes:

- `/admin/login`
- `/admin/dashboard`
- `/admin/products`
- `/admin/products/create`
- `/admin/products/[slug]/edit`
- `/admin/products/[slug]/stock`
- `/admin/products/[slug]/broadcast`
- `/admin/orders`
- `/admin/settings`
- `/admin/audience`

### Special routes

These routes must not be forgotten during implementation:

- `app/not-found.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/loading.tsx`

Rules:

- special routes should use a neutral dark presentation compatible with the public theme
- special routes must not depend on public-only decorative components
- if route groups require moving these files or rethinking ownership, preserve route behavior and keep the output visually aligned

## Final Visual System

### Color system

Use CSS variables for tokens. Exact values may be fine-tuned slightly, but the direction must stay stable.

Recommended base tokens:

```css
:root {
  --background: #090909;
  --foreground: #f2eee6;
  --panel: #111111;
  --panel-2: #151515;
  --panel-3: #1b1b1b;
  --text-muted: #9c9588;
  --line: rgba(255, 255, 255, 0.1);
  --line-strong: rgba(255, 255, 255, 0.18);
  --accent: #ff5a36;
  --accent-foreground: #fff3ee;
  --success: #7bc490;
  --warning: #f0b35f;
  --danger: #ff6b5f;
}
```

Rules:

- accent color is orange-red, not purple
- white is warm, not blue-white
- borders matter more than shadows
- shadows are subtle and directional, never soft and cloudy by default

### Semantic token mapping

Because the redesign uses `shadcn/ui`, the implementation must map brand tokens into semantic UI tokens instead of styling every primitive ad hoc.

Minimum semantic mapping:

```css
:root {
  --card: var(--panel);
  --card-foreground: var(--foreground);
  --popover: var(--panel-2);
  --popover-foreground: var(--foreground);
  --primary: var(--accent);
  --primary-foreground: var(--accent-foreground);
  --secondary: #1d1d1d;
  --secondary-foreground: var(--foreground);
  --muted: #121212;
  --muted-foreground: var(--text-muted);
  --accent-soft: rgba(255, 90, 54, 0.12);
  --border: var(--line);
  --input: var(--line);
  --ring: var(--accent);
  --destructive: var(--danger);
  --destructive-foreground: #fff3ee;
}
```

Rules:

- `shadcn` primitives must inherit from semantic tokens first
- page-level one-off overrides are allowed only for composed hero sections
- tables, forms, dialogs, badges, toasts, and dropdowns must not define their own disconnected color systems

### Typography

Lock typography early. Do not improvise font pairings later.

- Display font: `Cormorant Garamond`
- Body/UI font: keep `Geist Sans`
- Utility/label font: `IBM Plex Mono`

Usage rules:

- large hero, section titles, and prominent prices use the serif display font
- labels, breadcrumbs, metadata, stock/state tags, and overline text use mono
- buttons, form text, table content, and paragraph text use Geist Sans

### Shape and spacing

- reduce over-rounded corners
- public panels: `12px` to `16px`
- admin panels: `10px` to `14px`
- avoid `rounded-3xl` as the default look
- prefer flat planes with thin borders and selective corner brackets
- use consistent section gutters and panel padding instead of one-off giant containers

### Motion

Allowed:

- fade-up
- divider wipe
- subtle panel lift
- caret or cursor blink
- low-opacity scanline movement
- stat refresh shimmer

Remove:

- orbit animations
- floating blobs
- breathing dots used everywhere
- decorative spinning rings used as general-purpose branding

### Interaction states

These interaction rules are mandatory:

- hover increases contrast or border emphasis, not blur or glow spam
- focus-visible uses a clear accent ring with good contrast on dark surfaces
- disabled state lowers contrast and removes lift effects
- destructive actions use red only at the action edge, not as the default panel color
- selected state should be visible through border, fill, and label contrast together

### Copy tone

New copy should feel:

- concise
- precise
- premium
- commerce-safe

Avoid:

- emojis
- hype filler
- playful slang
- fake sci-fi system jargon

Good examples:

- `Instant Delivery Active`
- `Unit Price`
- `Access Ready`
- `Secure Checkout`
- `Order Recovery`

Avoid examples:

- `Waduh`
- `Yuk chat!`
- `Get Access Now`
- `Payment failed :(`

## Keep / Replace / Remove Matrix

| Current asset                                            | Decision          | Notes                                                        |
| -------------------------------------------------------- | ----------------- | ------------------------------------------------------------ |
| `lib/utils.ts` `cn()`                                    | Keep              | Continue using as the class merge helper.                    |
| `context/LanguageContext.tsx`                            | Keep              | Required for bilingual public UI.                            |
| `components/ui/LazyImage.tsx`                            | Keep              | Refresh styling only if needed.                              |
| `components/ui/ScrollAnimate.tsx`                        | Keep but simplify | Limit it to subtle reveal variants.                          |
| `components/ui/Spinner.tsx`                              | Keep but redesign | Re-skin as a minimal tactical loader.                        |
| `components/ui/Skeleton.tsx`                             | Replace           | Use `shadcn` skeleton or a wrapper around it.                |
| `components/ui/FormInput.tsx`                            | Replace           | Replace with `shadcn` form primitives plus a themed wrapper. |
| `components/ui/Toast.tsx`                                | Remove            | Replace with `sonner` via `shadcn`.                          |
| `components/ui/KineticBackground.tsx`                    | Remove            | Replace with CSS grid and background primitives.             |
| `components/ui/KineticOrbitalSVG.tsx`                    | Remove            | No longer matches the target theme.                          |
| Orbit and breathe animation classes in `app/globals.css` | Remove            | Delete after all usages are gone.                            |
| `components/layout/Header.tsx`                           | Replace           | Rebuild as a tactical editorial public header.               |
| `components/layout/Footer.tsx`                           | Replace           | Rebuild to match the new shell.                              |
| `components/WhatsAppButton.tsx`                          | Keep but relocate | Public-only component, not global.                           |
| `components/ContentViewer.tsx`                           | Keep but redesign | Strong candidate for a tactical secure-access panel.         |
| Inline `window.confirm` in admin components              | Replace           | Use `AlertDialog` from `shadcn`.                             |
| Emoji-heavy and playful copy in `lib/i18n.ts`            | Replace           | Rewrite both ID and EN public strings.                       |

## Migration Strategy

The correct strategy is not "convert everything to stock `shadcn` pages."

The correct strategy is:

1. set the dark tactical token system
2. install `shadcn/ui`
3. build a small layer of custom AutoBeli wrappers on top of `shadcn`
4. establish the public shell and storefront as the visual source of truth
5. apply the same system to checkout and post-purchase flows
6. migrate admin onto the now-stable system
7. remove the old orbital identity once all pages are moved

## Phase Plan

## Phase 1: Architecture Split and Theme Foundations

### Purpose

Create the structural and token foundation so the redesign can be implemented cleanly instead of layering the new style on top of the old one.

### Tasks

- Install `shadcn/ui` and initialize `components.json`.
- Generate at minimum these primitives:
  - `button`
  - `input`
  - `textarea`
  - `select`
  - `table`
  - `card`
  - `badge`
  - `dialog`
  - `alert-dialog`
  - `dropdown-menu`
  - `sheet`
  - `separator`
  - `tabs`
  - `skeleton`
  - `sonner`
- Move from one global shell to split shells:
  - keep root `app/layout.tsx` minimal
  - introduce a dedicated public/storefront layout
  - introduce `app/admin/layout.tsx`
- Relocate the public header, footer, and WhatsApp button so they render only on public pages.
- Add the new fonts using `next/font/google`.
- Rewrite `app/globals.css` around the new tokens and shared background utilities.
- Add reusable CSS utilities for:
  - section grid backgrounds
  - framed panels
  - corner accents
  - mono labels
  - divider rules
  - reduced-motion support

### Replace / Remove In This Phase

- Stop treating indigo as the primary accent.
- Start removing global assumptions that every route uses the public shell.
- Do not remove orbital components yet if they are still referenced.

### Deliverables

- `shadcn` installed and themed
- public and admin layout split in place
- fonts and CSS variables established
- app builds successfully with no page rewrite yet required

### Acceptance Criteria

- Admin routes no longer render the public footer, header, or WhatsApp CTA.
- Public routes still render correctly after the shell split.
- Global tokens support the new dark tactical palette.
- `shadcn` components inherit the new token system instead of looking default.
- Route behavior and URLs remain unchanged.

## Phase 2: Shared UI Primitives and Design System Wrappers

### Purpose

Create the reusable UI building blocks that all later pages will use.

### Tasks

- Create custom wrappers on top of `shadcn` primitives. Recommended components:
  - `Panel`
  - `SectionEyebrow`
  - `PageHeader`
  - `MetricCard`
  - `StatusBadge`
  - `Field`
  - `EmptyState`
  - `DataTableShell`
  - `CornerFrame`
- Replace the custom toast system with `sonner`.
- Update `components/Providers.tsx` to use the new toast provider.
- Standardize buttons:
  - primary CTA
  - secondary outline
  - quiet text button
  - destructive action
- Standardize forms:
  - input
  - textarea
  - select
  - inline helper text
  - error text
- Standardize panel states:
  - loading
  - empty
  - warning
  - success

### Source Of Truth Rules

After this phase:

- page code should import shared primitives from `components/ui/*` or approved wrappers
- raw `<input>`, `<select>`, `<textarea>`, dialog markup, and alert markup should not be introduced on migrated screens unless there is a documented exception
- shared actions should use the unified button variants instead of page-local CTA styling
- raw table markup is allowed only if wrapped by the shared table shell and themed consistently

### Replace / Remove In This Phase

- Replace `components/ui/FormInput.tsx` as the default field abstraction.
- Replace `components/ui/Toast.tsx`.
- Keep `components/ui/Spinner.tsx`, but rewrite its styling to match the new system.

### Deliverables

- one shared design system layer for both public and admin routes
- no page should need to invent its own form or alert styling after this phase

### Acceptance Criteria

- New pages can be built with shared tactical components instead of page-specific raw div stacks.
- Toasts, inputs, buttons, alerts, and dialogs are visually consistent.
- No new migrated screen depends on the old purple or orbit visual language.

## Phase 3: Public Shell, Home, and Product Detail

### Purpose

Move the public-facing identity from soft kinetic gradient store to premium tactical editorial commerce.

### Tasks

- Rebuild `components/layout/Header.tsx`.
- Rebuild `components/layout/Footer.tsx`.
- Redesign `components/home/HomeClient.tsx`.
- Redesign `components/product/ProductClient.tsx`.
- Redesign `components/BuyButton.tsx`.
- Use a grid-and-panel composition instead of glow-heavy cards and orbit decorations.
- Convert product cards into framed dark panels with clearer hierarchy:
  - mono metadata
  - serif title emphasis where appropriate
  - strong price block
  - hard CTA

### Public Shell Requirements

- Header should feel like a compact command bar, not a floating glass navbar.
- Footer should use separators and metadata rows, not decorative orbit badges.
- Public pages may use full-width section frames. Do not rely on one generic `container` treatment everywhere.
- Keep the logo simple. Do not invent a new brand mark unless the user asks for rebranding.

### Replace / Remove In This Phase

- Remove use of `components/ui/KineticBackground.tsx` on home and product pages.
- Remove orbital logo accents from header and footer.
- Replace soft pill badges and heavy blur treatments with harder panel framing and mono labels.

### Deliverables

- public shell and product browsing experience match the new theme
- home and product pages establish the identity for the rest of the app

### Acceptance Criteria

- The home page reads as tactical and editorial without becoming gimmicky.
- Product cards and product detail pages feel like part of the same system as the header and footer.
- There are no leftover orbit rings or purple-first gradients on these pages.
- Product cards still handle both image and no-image states cleanly.

## Phase 4: Checkout, Recovery, Order Status, and Secure Delivery

### Purpose

Apply the new design system to the conversion and post-purchase flow, where clarity matters more than decoration.

### Tasks

- Redesign `app/checkout/[orderId]/page.tsx`.
- Redesign `components/CheckoutForm.tsx`.
- Redesign `app/recover/page.tsx`.
- Redesign `app/order/[orderId]/page.tsx`.
- Redesign `components/ContentViewer.tsx`.
- Update loading and status treatments for:
  - pending payment
  - successful payment
  - delivery error
  - recover results

### UI Rules For This Phase

- Status states should use a consistent system:
  - success uses green
  - warning and pending use amber
  - destructive uses red
- Order and checkout layouts should use split panels with clear metadata blocks.
- Use technical but customer-safe labels such as `Order Status`, `Recovery Input`, `Access Token Ready`, `Payment Verification`, and `Delivery Error`.
- Quantity controls should feel mechanical and precise, not playful.
- Public conversion flows must keep bilingual coverage. Do not replace translated strings with hardcoded English.

### Replace / Remove In This Phase

- Remove orbital SVG backgrounds and floating icon treatments from checkout and order pages.
- Replace duplicated field markup in checkout and recovery with shared form primitives.
- Remove emoji-based visual cues in conversion surfaces.

### Deliverables

- conversion flow becomes visually consistent and easier to scan
- post-purchase state pages feel intentional instead of page-specific experiments

### Acceptance Criteria

- Checkout is cleaner and more trustworthy than the current version.
- Recovery is easier to use and visually aligned with the rest of the app.
- Content delivery feels secure and premium without relying on old kinetic motifs.
- No migrated public flow falls back to untranslated hardcoded English.

## Phase 5: Admin Console Redesign

### Purpose

Turn admin from a plain CRUD area into a denser operator console built on the same tactical system.

### Tasks

- Build a dedicated admin shell in `app/admin/layout.tsx`.
- Redesign:
  - `app/admin/login/page.tsx`
  - `app/admin/dashboard/page.tsx`
  - `app/admin/products/page.tsx`
  - `app/admin/orders/page.tsx`
  - `app/admin/settings/page.tsx`
  - `app/admin/audience/page.tsx`
  - `app/admin/products/[slug]/broadcast/page.tsx`
- Redesign admin support components:
  - `components/admin/AnalyticsChart.tsx`
  - `components/admin/RecentSales.tsx`
  - `components/admin/AudienceManager.tsx`
  - `components/admin/ProductBroadcastPanel.tsx`

### Admin-Specific Rules

- Admin should be denser than the storefront.
- Tables should use `shadcn` table primitives with custom tactical styling.
- Destructive actions must use `AlertDialog`, not `window.confirm`.
- Detail overlays should use `Dialog` or `Sheet`.
- Charts may keep `recharts`, but cards, headers, tooltips, and legends must match the new tokens.
- Remove emojis from admin UI entirely.
- Admin may remain English-only in this phase. Do not force admin strings into the storefront translation layer unless there is a clear reuse benefit.

### Replace / Remove In This Phase

- Replace `window.confirm` in audience and broadcast panels.
- Replace the current modal styling in `RecentSales` with themed `Dialog`.
- Replace plain white admin cards with dark panel frames.

### Deliverables

- admin feels like part of the same product as the storefront
- data-heavy screens are more structured and easier to scan

### Acceptance Criteria

- Admin no longer looks like a different template pasted into the app.
- Tables, badges, dialogs, and forms are visually unified.
- Admin login, dashboard, and data tables all use the same tactical system.

## Phase 6: Copy Rewrite, Translation Cleanup, and Deletion Pass

### Purpose

Remove the old identity completely and align all user-facing language with the new theme.

### Tasks

- Rewrite relevant strings in `lib/i18n.ts`.
- Keep Indonesian and English copy aligned in meaning.
- Remove emojis and slang from both languages.
- Fix any mojibake or malformed encoded characters in user-facing copy and touched docs.
- Rewrite the public namespaces at minimum:
  - `common`
  - `error`
  - `home`
  - `product`
  - `checkout`
  - `contentViewer`
- Delete old decorative components once usage reaches zero:
  - `components/ui/KineticBackground.tsx`
  - `components/ui/KineticOrbitalSVG.tsx`
  - `components/ui/Toast.tsx`
- Remove unused animation keyframes and classes from `app/globals.css`.
- Audit the repo for leftover purple or orbit identity fragments.

### Replace / Remove In This Phase

- Remove `animate-orbit-*`, `animate-breathe`, and related old-brand classes once they have zero references.
- Remove old gradient-heavy CTA treatments where they survive after earlier phases.

### Deliverables

- the repo no longer contains two competing visual systems
- copy tone matches the intended product identity

### Acceptance Criteria

- No user-facing public copy contains leftover emoji styling unless deliberately retained for business reasons.
- No page imports retired orbital background components.
- The codebase no longer references the old toast provider.

## Phase 7: QA, Accessibility, and Rollout Verification

### Purpose

Ship the redesign safely and confirm the implementation actually reflects the plan.

### Tasks

- Run `npm run lint`.
- Run relevant unit tests and UI tests.
- Perform manual visual QA on:
  - home
  - product
  - checkout
  - order
  - recovery
  - api-doc
  - admin login
  - admin dashboard
  - products
  - orders
  - settings
  - audience
  - product broadcast
- Check keyboard and focus behavior for:
  - dialogs
  - dropdowns
  - tables
  - form fields
- Verify `prefers-reduced-motion` behavior still works.
- Verify contrast on text, borders, and status colors.
- Confirm mobile and desktop layouts both preserve the theme cleanly.
- Verify special routes:
  - not-found
  - loading
  - error
  - global-error

### Acceptance Criteria

- No broken routes after the layout split.
- Admin and public shells are distinct and intentional.
- Motion never blocks usability.
- The redesign reads as one system end-to-end.
- No migrated public screen falls back to untranslated hardcoded English by accident.

## Explicit Replace / Remove Checklist

The implementation agent should treat this as mandatory cleanup work, not optional polish.

### Replace

- Replace `components/ui/FormInput.tsx` with a `shadcn`-based field abstraction.
- Replace `components/ui/Toast.tsx` with `sonner`.
- Replace public header and footer composition.
- Replace admin modal and confirm interactions with `Dialog` and `AlertDialog`.
- Replace playful public copy in `lib/i18n.ts`.
- Replace page-level inline decorative SVG systems with reusable CSS or panel primitives.

### Remove

- Remove `components/ui/KineticBackground.tsx` after migrating all usages.
- Remove `components/ui/KineticOrbitalSVG.tsx` after migrating all usages.
- Remove orbit and breathe keyframes from `app/globals.css` after usage reaches zero.
- Remove public shell elements from admin routes.
- Remove emoji-only visual cues from admin and commerce-critical surfaces.

### Keep

- Keep business logic, payment, auth, and data APIs unchanged unless UI implementation requires a small shape extension.
- Keep `LanguageContext`.
- Keep `LazyImage`.
- Keep `ScrollAnimate`, but simplify its role.
- Keep `Spinner` as a component boundary if it is convenient, even if the visual is rewritten.

## Suggested File Plan

### Likely new files

- `docs/hybrid-tactical-ui-redesign-plan.md`
- `app/admin/layout.tsx`
- `app/(store)/layout.tsx` if route groups are used
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/table.tsx`
- `components/ui/card.tsx`
- `components/ui/dialog.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/badge.tsx`
- `components/ui/separator.tsx`
- `components/ui/sonner.tsx`
- `components/ui/panel.tsx`
- `components/ui/section-eyebrow.tsx`
- `components/ui/page-header.tsx`
- `components/ui/status-badge.tsx`
- `components/ui/metric-card.tsx`
- `components/ui/field.tsx`

### Likely modified files

- `package.json`
- `app/layout.tsx`
- `app/globals.css`
- `components/Providers.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/WhatsAppButton.tsx`
- `components/home/HomeClient.tsx`
- `components/product/ProductClient.tsx`
- `components/BuyButton.tsx`
- `components/CheckoutForm.tsx`
- `components/ContentViewer.tsx`
- `app/checkout/[orderId]/page.tsx`
- `app/order/[orderId]/page.tsx`
- `app/recover/page.tsx`
- `app/api-doc/page.tsx`
- `app/not-found.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/loading.tsx`
- `app/admin/login/page.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/products/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/audience/page.tsx`
- `app/admin/products/[slug]/broadcast/page.tsx`
- `components/admin/AnalyticsChart.tsx`
- `components/admin/RecentSales.tsx`
- `components/admin/AudienceManager.tsx`
- `components/admin/ProductBroadcastPanel.tsx`
- `lib/i18n.ts`

### Likely deleted files

- `components/ui/KineticBackground.tsx`
- `components/ui/KineticOrbitalSVG.tsx`
- `components/ui/Toast.tsx`

## Out Of Scope

These items are not part of this redesign unless explicitly requested later:

- changing payment gateway behavior
- rewriting business logic or database structure
- introducing a theme switcher
- introducing a mobile native app feel
- full logo rebrand beyond UI polish
- changing URLs or route semantics for business reasons
- full admin localization

## Final Guidance For The Execution Agent

- Do not mix the old purple kinetic system and the new tactical system on the same screen.
- Do not stop after installing `shadcn`. The value comes from themed composition and cleanup.
- Prefer deleting obsolete UI once the replacement is live instead of keeping both systems indefinitely.
- If a page is migrated, migrate its copy, states, badges, and actions fully. Partial reskins will make the product feel inconsistent.
- The visual benchmark is not "looks more modern." The benchmark is "looks like one intentional dark tactical commerce product from header to admin console."
