# Refined Editorial Luxury UI Plan

## Purpose

Implement a stronger, more attractive version of AutoBeli's current visual direction without changing the product model, payment flow, or route architecture.

This plan is for execution, not brainstorming. Another AI agent should be able to follow it phase by phase and implement the redesign with minimal ambiguity.

This document should be treated as the source of truth for the current redesign direction. It supersedes the older dark tactical direction in `docs/hybrid-tactical-ui-redesign-plan.md` for this workstream.

## Audit Resolutions

This audit found four concrete weaknesses in the first version of the plan and resolves them here:

1. Coverage gap for special routes and loading states.
   The first version focused on primary pages but did not explicitly pull `not-found`, `error`, `loading`, and route-level skeleton states into scope.
   Resolution: those files are now called out as required redesign coverage and added to the file map.

2. CRUD scope ambiguity.
   The phrase "any create, edit, stock, and broadcast admin pages" was too loose and could lead to incomplete implementation.
   Resolution: the exact admin CRUD routes now appear in phase scope and in the file map.

3. Accessibility and performance ambiguity.
   The first version asked for polish but did not define minimum implementation standards.
   Resolution: this version adds non-negotiable accessibility, responsive behavior, and performance guardrails.

4. Mobile table behavior ambiguity.
   The first version said to keep tables as tables, but did not say what should happen on small screens.
   Resolution: this version explicitly allows controlled horizontal scrolling on mobile instead of cardifying dense admin tables.

## Assumptions

- The target direction is light-first editorial luxury, not a dark tactical interface.
- The warm ivory / serif / mono identity is worth keeping.
- The current theme toggle stays. Light mode is the visual source of truth. Dark mode must remain coherent, but it is not the primary design reference.
- Public UI remains bilingual through `LanguageContext`.
- Admin remains English-only.
- This is primarily a UI implementation effort. Backend logic, payment rules, security invariants, and data shape are out of scope unless a visual requirement is blocked by an existing UI contract.

If any of those assumptions change, the plan should be revised before implementation starts.

## What This Redesign Must Fix

The current UI already has a premium foundation, but it still feels underpowered in the following ways:

- The homepage hero has too much empty space and not enough product presence.
- The grid background is visually louder than the content it is supposed to support.
- Product cards feel unfinished because the image area, title, price, stock, and CTA do not form a strong hierarchy.
- Storefront panels rely too heavily on borders and too little on composition, contrast, and surface depth.
- Admin pages are readable but passive. They feel like lightly styled default tables rather than a deliberate operations console.
- Important actions are sometimes visually hidden or feel disconnected from the data they act on.
- Light mode lacks enough contrast between background, surface, border, and text values, so pages can feel flat.

## Non-Goals

Do not expand scope into these areas during implementation:

- No data model changes.
- No payment gateway changes.
- No auth flow changes beyond UI presentation.
- No new business metrics endpoints unless a page is already impossible to lay out with existing data.
- No full component-library rewrite.
- No large animation system.
- No marketing-copy rewrite beyond tightening short UI strings when a layout needs it.

## Hard Decisions

These decisions are resolved by this plan and should not be reopened during implementation:

- Keep the current route split:
  - `app/layout.tsx` stays minimal.
  - `app/(store)/layout.tsx` owns the public shell.
  - `app/admin/layout.tsx` owns the admin shell.
- Reuse and refine the existing primitives before inventing new ones:
  - `Panel`
  - `PageHeader`
  - `SectionEyebrow`
  - `StatusBadge`
  - `DataTableShell`
  - `MetricCard`
  - existing form and table primitives
- The redesign is light-first and editorial, with deeper contrast and richer composition.
- Dark mode remains supported, but implementation decisions should be judged from light mode first.
- Dark mode parity means preserving the same hierarchy and interaction quality, not inventing separate layouts or decorative systems for dark mode.
- Storefront and admin should feel related, but not identical:
  - storefront = editorial commerce
  - admin = restrained operational console
- Product presentation must become more visual and more conversion-focused without becoming noisy.
- If a product has no image, the fallback should still feel designed, not like missing content.
- Special routes and loading states are part of the redesign scope and must not be left on an older visual system.
- Dense admin tables stay tables on desktop. On mobile, use controlled horizontal overflow before considering any structural change.

## Visual Direction

### Brand Character

The intended character is:

- premium
- calm
- precise
- product-led
- modern enough to convert
- distinctive enough to avoid generic template energy

The UI should feel like a curated digital boutique with disciplined operational tooling behind it.

### Color Strategy

Use the existing token structure in `app/globals.css`, but strengthen the light theme.

Recommended light-mode direction:

- `--background`: warm ivory paper
- `--panel`: clean cream surface
- `--panel-2`: slightly darker paper step
- `--panel-3`: stronger structural fill for media frames, hover layers, and table emphasis
- `--foreground`: near-black brown, not gray
- `--text-muted`: warm muted brown with better readability than the current value
- `--line`: subtle hairline
- `--line-strong`: clearly visible border for active or elevated surfaces
- `--accent`: coral-orange
- `--success`: muted emerald or green for stock and paid states

Target effect:

- less washed out
- more depth between page and card
- more authority in headings and prices
- accent used with intent, not everywhere

### Typography

Keep the existing font stack already loaded in `app/layout.tsx`:

- display: `Cormorant Garamond`
- body/UI: `Geist`
- utility: `IBM Plex Mono`

Typography rules:

- serif only for major headlines, section titles, big prices, and select product titles
- mono only for utility text: labels, breadcrumbs, stock, IDs, tags, status, helper metadata
- sans for body copy, controls, table cells, and dense admin content

Do not let serif leak into dense admin tables or form labels where scan speed matters more than personality.

### Composition Rules

- Use the grid texture only where it supports the composition. It should not sit behind every large surface by default.
- Surfaces need three levels:
  - page background
  - default paper panel
  - emphasized or inset panel
- Use spacing and grouped alignment to create hierarchy before adding more borders.
- Prefer inset highlights, paper layering, and subtle shadow direction over soft cloud shadows.
- Public surfaces can keep slightly softer rounding than admin.
- Admin surfaces should feel tighter and more controlled.

### Motion Rules

Allowed:

- subtle fade-up on section entry
- short hover lift on cards
- controlled image scale on hover
- divider or underline reveal
- restrained button and focus transitions

Avoid:

- decorative motion with no information value
- large floating ornaments
- constant ambient animation

### Accessibility Rules

These are minimum implementation requirements, not suggestions:

- Body text, labels, controls, and status indicators must maintain readable contrast in both light and dark themes.
- Primary interactive controls on mobile should target at least `44px` in one dimension unless an existing compact admin control has a strong reason to be smaller.
- Focus-visible states must remain obvious on every interactive element, including icon-only controls, menu triggers, and theme/language toggles.
- Status must not rely on color alone. Pair color with text, iconography, or both.
- Heading scale must remain readable without causing destructive overflow on mobile widths.
- Dense tables may scroll horizontally on smaller screens, but the scroll container must make that behavior visually obvious and usable.

### Performance Rules

These guardrails exist to prevent the redesign from adding visual debt:

- Preserve stable media ratios to avoid layout shift, especially on homepage cards and product detail media.
- Reuse existing image-loading patterns such as `LazyImage` instead of adding decorative media systems.
- Do not introduce autoplay video, heavy canvas effects, or large background media.
- Prefer CSS and existing primitives over new client-side animation logic where possible.
- Keep transitions short and controlled. Motion should support hierarchy, not create latency.

## Implementation Strategy

Implement in phases. Do not jump across all surfaces at once.

Each phase has four parts:

- purpose
- scope
- implementation details
- exit criteria

The next phase should not start until the current phase has passed its exit criteria.

## Phase 1: Strengthen the Visual Foundation

### Purpose

Create a more convincing editorial luxury system at the token and primitive level so later page work does not devolve into page-specific overrides.

### Scope

Primary files:

- `app/globals.css`
- `components/ui/panel.tsx`
- `components/ui/page-header.tsx`
- `components/ui/section-eyebrow.tsx`
- `components/ui/status-badge.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/field.tsx`
- `components/ui/Skeleton.tsx`
- `components/ui/data-table-shell.tsx`
- `components/ui/table.tsx`
- `components/ui/metric-card.tsx`
- `components/layout/ThemeToggle.tsx`

### Implementation Details

- Tighten light-mode contrast first.
- Keep the current token names. Do not invent a second parallel token system.
- Refine `Panel` so it can carry more of the brand weight:
  - clearer surface elevation
  - cleaner border behavior
  - more consistent padding rhythm
  - optional stronger visual treatment for feature panels
- Refine `PageHeader` so storefront and admin can share structure while differing in scale and density.
- Make utility labels more deliberate:
  - eyebrow spacing
  - mono tracking
  - muted text contrast
- Standardize control heights and radii so buttons, inputs, selects, and badges feel like one system.
- Improve table shells:
  - stronger header separation
  - cleaner row hover behavior
  - more useful density
  - less empty chrome
- Preserve dark mode support by updating only the existing token bridge. Do not create separate one-off dark styles per page.

### Phase 1 Rules

- Prefer extending current primitives over adding new base components.
- Add a new primitive only if it will be reused across at least two major surfaces.
- Avoid page-specific CSS hacks in this phase.

### Exit Criteria

- Light mode has noticeably stronger hierarchy without feeling heavier or muddy.
- Panels, tables, badges, buttons, and fields feel like one design language.
- Dark mode still renders coherently after token updates.
- No business logic files are touched.

## Phase 2: Rebuild the Storefront Landing Experience

### Purpose

Make the homepage feel intentional, conversion-oriented, and visually complete.

### Scope

Primary files:

- `components/home/HomeClient.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/WhatsAppButton.tsx`
- `app/(store)/loading.tsx`
- `components/skeletons/ProductGridSkeleton.tsx`
- optionally `components/ui/empty-state.tsx` if the empty storefront state needs alignment

### Implementation Details

- Recompose the hero so it has real structure, not just centered type in a large empty box.
- The hero should include:
  - headline
  - concise value proposition
  - primary CTA
  - trust or service signals
  - visible product context, such as a featured card strip or a product preview block
- Reduce the dominance of the grid background. It should frame the hero, not overpower it.
- Make the header feel more premium and less crowded:
  - cleaner spacing
  - clearer separation between navigation and utility controls
  - calmer active state treatment
- Product cards must be redesigned, not lightly tweaked.

For product cards:

- Keep a strong image or poster area.
- If `imageUrl` is missing, render a designed typographic poster using product title or slug fragments.
- Group price, title, stock, and CTA more tightly.
- Clamp descriptions aggressively so cards scan faster.
- Make hover states feel tactile but restrained.
- Ensure cards remain attractive with very long titles and with no image.

Footer and floating contact CTA:

- Keep them useful, but reduce the feeling of generic utility clutter.
- The footer should support the brand tone instead of reading as a default four-column site map.
- The WhatsApp button should feel integrated into the visual system.

### Phase 2 Rules

- Do not add extra homepage sections unless they clearly strengthen trust or conversion.
- Do not invent categories, testimonials, or marketing claims that are not backed by current product reality.
- Reuse current product data only.

### Exit Criteria

- Above the fold clearly communicates what AutoBeli sells and why it is trustworthy.
- The homepage feels product-led rather than frame-led.
- Product cards look finished with and without images.
- Mobile layout remains clean, especially in hero, header, and card CTA areas.

## Phase 3: Align Product Detail and Transaction Flows

### Purpose

Carry the refined storefront language into the purchase journey so the product page, checkout, paid order, pending order, and recovery flow feel like one experience.

### Scope

Primary files:

- `components/product/ProductClient.tsx`
- `app/(store)/checkout/[orderId]/page.tsx`
- `app/(store)/checkout/[orderId]/loading.tsx`
- `components/CheckoutHeader.tsx`
- `components/CheckoutBreadcrumb.tsx`
- `components/CheckoutSummary.tsx`
- `components/CheckoutForm.tsx`
- `app/(store)/order/[orderId]/page.tsx`
- `app/(store)/order/[orderId]/loading.tsx`
- `components/OrderPending.tsx`
- `components/OrderPaid.tsx`
- `app/(store)/recover/page.tsx`
- `app/(store)/product/[slug]/loading.tsx`
- `components/skeletons/CheckoutSkeleton.tsx`

### Implementation Details

- The product page should feel more premium and more decisive:
  - stronger relationship between media, title, price, and buy action
  - more deliberate separation between overview, features, and purchase area
  - sticky purchase panel that feels elegant rather than merely boxed
- Checkout should become a matched two-column editorial purchase layout:
  - summary panel as a designed order brief
  - payment form as the primary action surface
  - clearer flow from trust to payment
- Pending and paid order states should feel like polished delivery states, not generic status screens.
- Recovery should inherit the same premium experience:
  - tighter form composition
  - cleaner result cards
  - better hierarchy between search mode, input, and results

### Critical Functional Constraints

These must remain intact during UI work:

- `syncOrderPaymentStatus()` call in `app/(store)/order/[orderId]/page.tsx`
- current redirect behavior between checkout and order routes
- secure delivery through the token-based content viewer
- bilingual public copy flow

### Phase 3 Rules

- UI changes must not alter request payloads or API contracts.
- Payment and delivery logic stay where they already live.
- If a transaction component needs visual reuse, prefer extending `Panel`, `Field`, `Button`, or `PageHeader` rather than creating parallel versions.

### Exit Criteria

- Product page, checkout, order paid, order pending, and recovery read as one family.
- Purchase actions are visually obvious.
- Sensitive delivery content remains visually clear without exposing anything new.
- No transaction logic regressions are introduced.

## Phase 4: Turn Admin Into a Deliberate Operations Console

### Purpose

Make admin feel intentional, dense, and useful while staying visually connected to the storefront brand.

### Scope

Primary files:

- `app/admin/layout.tsx`
- `app/admin/login/page.tsx`
- `app/admin/dashboard/page.tsx`
- `components/admin/AnalyticsChart.tsx`
- `components/admin/RecentSales.tsx`
- `components/ui/metric-card.tsx`
- `components/ui/page-header.tsx`

### Implementation Details

- Tighten the admin shell:
  - more disciplined sidebar spacing
  - stronger active navigation state
  - cleaner top bar
  - less dead air around page content
- Dashboard should feel useful above the fold.
- Use the existing analytics and recent-sales payloads first. Do not expand data requirements unless a layout is impossible otherwise.
- Recompose the dashboard so the top area has a strong read order:
  - page header
  - key summary metrics
  - revenue chart
  - top products
  - recent orders
- Loading states should sit inside panels in a polished way, not float in open space.
- Keep admin surfaces tighter than storefront surfaces:
  - slightly smaller radii
  - denser spacing
  - stronger row and panel structure

### Phase 4 Rules

- Do not give admin the same decorative treatment as marketing surfaces.
- Do not use large hero-style empty space in admin.
- Keep English copy concise and operational.

### Exit Criteria

- Sidebar, dashboard panels, and top bar feel like one system.
- Dashboard communicates the most important store information quickly.
- Admin feels premium and calm, not soft or unfinished.

## Phase 5: Polish Admin Data Pages and CRUD Surfaces

### Purpose

Make list, filter, form, and settings pages feel high quality and easy to scan without changing their underlying behavior.

### Scope

Primary files:

- `app/admin/products/page.tsx`
- `app/admin/products/create/page.tsx`
- `app/admin/products/[slug]/edit/page.tsx`
- `app/admin/products/[slug]/stock/page.tsx`
- `app/admin/products/[slug]/broadcast/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/audience/page.tsx`
- `components/admin/AudienceManager.tsx`
- `app/admin/settings/page.tsx`
- `components/admin/ProductBroadcastPanel.tsx`
- `components/ui/data-table-shell.tsx`
- `components/ui/table.tsx`
- relevant dialog, dropdown, input, textarea, and button primitives already in use

### Implementation Details

- Standardize list page anatomy:
  - page header
  - toolbar / filters
  - main table or collection view
  - inline error or empty state
- Make tables easier to scan:
  - stronger typographic hierarchy inside rows
  - better spacing between primary and secondary values
  - cleaner status placement
  - more predictable action affordance
- Fix visually awkward action behavior:
  - row actions should feel anchored and intentional
  - avoid menus or triggers that visually float without context
- Audience page should feel less form-heavy and more like a proper management surface.
- Settings should become quieter and more structured:
  - notice panel less visually overpowering
  - delivery and recovery cards more balanced
- Product list should make title, slug, price, stock, and state readable at a glance.
- Any touched create/edit/stock/broadcast pages should use the same field density, sectioning, and button hierarchy as the rest of admin.

### Phase 5 Rules

- Keep tables as tables. Do not convert dense admin data pages into oversized cards on desktop.
- On mobile, prefer horizontal overflow containers, column prioritization, and tighter density before redesigning a table into a card list.
- Do not hide critical information behind tabs unless the current page is genuinely overloaded.
- Reuse existing API responses and form logic.

### Exit Criteria

- Products, orders, audience, and settings all look like part of the same admin system.
- Dense pages remain readable on desktop and mobile.
- Row actions, filters, and dialogs feel predictable and refined.

## Phase 6: Final Integration, Accessibility, and QA

### Purpose

Finish the redesign with enough polish and verification that it can ship without introducing UI regressions.

### Scope

Cross-cutting verification over all touched surfaces, plus special routes and shared loading/error states.

### Implementation Details

- Review all touched pages in both light and dark mode.
- Review public pages in both languages.
- Review admin login and all touched admin CRUD screens.
- Review special routes and global states:
  - `app/not-found.tsx`
  - `app/error.tsx`
  - `app/global-error.tsx`
  - `app/loading.tsx`
- Review edge cases:
  - no product image
  - long product title
  - long description
  - zero stock
  - single stock
  - empty tables
  - loading states
  - inline error states
- Validate keyboard navigation and focus treatment on:
  - header controls
  - buttons
  - menus
  - forms
  - dialogs
- Verify visual consistency of radii, borders, control heights, and spacing.
- Confirm no public/admin shell leakage.

### Verification Commands

Minimum:

- `npm run lint`

Targeted verification based on touched surfaces:

- `npm run test:run`
- `npm run test:e2e`

E2E coverage matters if checkout, order, recovery, or admin auth-related pages are materially changed.

### Exit Criteria

- No obvious visual regressions remain across major routes.
- Public and admin both feel intentionally redesigned.
- Lint passes.
- Required tests for touched flows pass, or any gaps are documented clearly.

## Surface-by-Surface File Map

This file map is here to reduce guesswork during implementation.

### Foundation

- `app/globals.css`
- `app/layout.tsx`
- `components/ui/panel.tsx`
- `components/ui/page-header.tsx`
- `components/ui/section-eyebrow.tsx`
- `components/ui/status-badge.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/field.tsx`
- `components/ui/table.tsx`
- `components/ui/data-table-shell.tsx`
- `components/ui/metric-card.tsx`

### Public Shell and Storefront

- `app/(store)/layout.tsx`
- `app/(store)/loading.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/layout/ThemeToggle.tsx`
- `components/WhatsAppButton.tsx`
- `components/home/HomeClient.tsx`
- `components/product/ProductClient.tsx`
- `components/skeletons/ProductGridSkeleton.tsx`

### Transaction Flow

- `app/(store)/checkout/[orderId]/page.tsx`
- `app/(store)/checkout/[orderId]/loading.tsx`
- `components/CheckoutHeader.tsx`
- `components/CheckoutBreadcrumb.tsx`
- `components/CheckoutSummary.tsx`
- `components/CheckoutForm.tsx`
- `app/(store)/order/[orderId]/page.tsx`
- `app/(store)/order/[orderId]/loading.tsx`
- `components/OrderPending.tsx`
- `components/OrderPaid.tsx`
- `app/(store)/recover/page.tsx`
- `app/(store)/product/[slug]/loading.tsx`
- `components/skeletons/CheckoutSkeleton.tsx`

### Admin

- `app/admin/layout.tsx`
- `app/admin/login/page.tsx`
- `app/admin/dashboard/page.tsx`
- `app/admin/products/page.tsx`
- `app/admin/products/create/page.tsx`
- `app/admin/products/[slug]/edit/page.tsx`
- `app/admin/products/[slug]/stock/page.tsx`
- `app/admin/products/[slug]/broadcast/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/audience/page.tsx`
- `app/admin/settings/page.tsx`
- `components/admin/AnalyticsChart.tsx`
- `components/admin/RecentSales.tsx`
- `components/admin/AudienceManager.tsx`
- `components/admin/ProductBroadcastPanel.tsx`

### Special Routes

- `app/not-found.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/loading.tsx`

## Guardrails For The Implementing AI

- Stay inside the current architecture unless blocked.
- Do not refactor `lib/` logic for a UI-only phase.
- Treat `Panel`, `PageHeader`, `DataTableShell`, and existing form primitives as the first place to concentrate improvements.
- Prefer improving one shared primitive over patching five individual pages.
- If a page needs a one-off hero or special composition, keep that one-off local to the page.
- Do not invent product metadata, categories, ratings, or testimonial content.
- Do not remove bilingual support from public routes.
- Do not move admin to bilingual mode.
- Keep delivery and security invariants intact.

## Recommended Delivery Sequence

Implement in this exact order:

1. Phase 1 foundation
2. Phase 2 homepage and public shell
3. Phase 3 product and transaction flows
4. Phase 4 admin shell and dashboard
5. Phase 5 admin data pages
6. Phase 6 QA and cleanup

This order matters because the primitive layer must stabilize before broad surface polish begins.
