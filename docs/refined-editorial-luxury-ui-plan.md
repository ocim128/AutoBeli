# Refined Editorial Luxury UI Plan

## Purpose

Execute a stronger version of AutoBeli's current UI without changing business logic, route structure, payment flow, or security behavior.

Keep the existing light-first editorial identity. Improve hierarchy, trust, product presentation, and admin usability.

This document is the source of truth for this redesign workstream. It replaces `docs/hybrid-tactical-ui-redesign-plan.md` for this direction.

## Assumptions

- Keep the current light-first editorial direction.
- Keep the warm ivory, serif headline, and mono utility system.
- Keep the theme toggle. Light mode is the design reference.
- Public routes remain bilingual through `LanguageContext`.
- Admin remains English-only.
- This is a UI workstream. Do not change payment, auth, delivery, or data-model behavior unless a page is blocked by an existing UI contract.

If any assumption changes, revise this plan before implementation starts.

## Architecture Invariants

- `app/layout.tsx` stays minimal. It owns fonts, providers, metadata, viewport, and global CSS only.
- `app/(store)/layout.tsx` owns the public shell: header, footer, main wrapper, and WhatsApp CTA.
- `app/admin/layout.tsx` owns the admin shell only.
- Admin must not render public header, public footer, or WhatsApp CTA.
- Do not move routes between public and admin shells as part of this redesign.

## Success Criteria

- The homepage explains what the store sells and why it is safe within the first viewport.
- Product cards feel finished with and without images.
- Product detail, checkout, order, recovery, and delivery feel like one purchase system.
- Admin feels like a deliberate operator console, not lightly styled CRUD.
- Loading, empty, sold-out, and error states follow the same visual system.
- Light and dark themes preserve the same hierarchy and usability.

## Design Rules

### Hierarchy

- Reduce empty hero space that does not support comprehension.
- Let products carry more visual weight than decorative frames.
- Use composition, spacing, and contrast before adding more borders.
- Above the fold, prioritize value proposition, trust, and visible product context.

### Color And Surfaces

- Keep the current token structure in `app/globals.css`.
- Strengthen contrast between page background, default panel, inset panel, border, and text.
- Use accent color for CTA, active state, and key numbers only.
- Keep shadows restrained. Prefer hairlines, layered paper surfaces, and inset depth.

### Typography

- `Cormorant Garamond` for major headlines and large prices.
- `Geist` for body text, forms, tables, and dense admin content.
- `IBM Plex Mono` for labels, stock, tags, status, nav items, and small metadata.
- Do not use serif for dense admin tables or form labels.

### Product Media

- Standardize media ratio on cards and product pages.
- If a product image is weak or missing, wrap it in a branded frame or use a designed typographic fallback.
- Reuse `LazyImage` and existing image-loading patterns.
- Do not allow poor source images to collapse the perceived quality of the page.

### Interaction

- Make CTA hierarchy obvious without oversizing every button.
- Status must use text plus color.
- Row actions, filters, and menus must feel anchored to the data they control.
- Focus-visible must remain obvious on all controls.

### Motion

- Keep motion short and useful: hover lift, image scale, divider reveal, fade-up.
- Do not add decorative ambient animation, floating ornaments, or motion that delays interaction.

### Responsive Rules

- Product cards, hero, checkout, and admin tables must stay readable on mobile.
- Dense admin tables remain tables. Use horizontal overflow on smaller screens before changing structure.
- Touch targets must remain usable on mobile.

### Accessibility And Performance

- Keep readable text and control contrast in both themes.
- Preserve media aspect ratios to avoid layout shift.
- Keep status readable without color dependence.
- Do not add autoplay video, heavy canvas effects, or large background media.

## Guardrails

- Do not refactor `lib/` for visual polish.
- Do not invent testimonials, ratings, categories, or marketing claims.
- Do not add sections that need new backend data unless current data makes the layout impossible.
- Do not split public and admin into unrelated visual systems.
- Do not ship a surface redesign without its loading, empty, and error states.
- Public copy changes must go through `lib/i18n.ts`. Do not hardcode translated strings in page components.
- If touched UI strings contain malformed encoding, normalize them.

## Phase 1: Foundation And Primitives

### Purpose

Build a stronger shared UI system so later page work does not rely on page-specific fixes.

### Scope

- `app/layout.tsx`
- `app/globals.css`
- `components/Providers.tsx`
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
- `components/ui/Skeleton.tsx`
- `components/layout/ThemeToggle.tsx`

### Implementation

- Tighten light-mode tokens first.
- Keep existing token names. Do not add a second token system.
- Refine `Panel` to carry more surface depth and more consistent spacing.
- Standardize control heights, radii, borders, and label rhythm.
- Improve table header separation, row hover states, and data density.
- Make badges and status treatments more readable at a glance.
- Keep dark mode coherent by updating shared tokens and primitives, not page-level overrides.

### Exit Criteria

- Panels, fields, tables, badges, and buttons feel like one system.
- Light mode has clearer hierarchy without feeling heavy.
- Dark mode still renders correctly.
- No business logic files are changed.

## Phase 2: Public Shell And Homepage

### Purpose

Make the storefront landing experience feel complete, trustworthy, and product-led.

### Scope

- `app/(store)/layout.tsx`
- `app/(store)/page.tsx`
- `app/(store)/loading.tsx`
- `components/home/HomeClient.tsx`
- `components/layout/Header.tsx`
- `components/layout/Footer.tsx`
- `components/WhatsAppButton.tsx`
- `components/skeletons/ProductGridSkeleton.tsx`
- `lib/i18n.ts`

### Implementation

- Recompose the hero so it includes a headline, concise value proposition, primary CTA, trust signals, and visible product context.
- Reduce the dominance of the grid background. It should frame the content, not compete with it.
- Redesign homepage product cards instead of lightly tweaking them.
- Give cards a fixed media ratio, tighter content grouping, faster description scan, and clearer price-stock-action hierarchy.
- Add a designed no-image fallback so missing media still feels intentional.
- Make the header calmer and clearer, with better separation between navigation and utility controls.
- Rework the footer into a trust and utility surface that supports recovery, contact, payment, and delivery context.
- Make the WhatsApp button feel integrated with the rest of the UI.

### Exit Criteria

- The first viewport explains what AutoBeli sells and why it is trustworthy.
- The hero feels product-led rather than frame-led.
- Product cards look finished with and without images.
- Mobile layout stays clean in the hero, header, and CTA areas.

## Phase 3: Product Detail And Purchase Entry

### Purpose

Carry the stronger storefront system into product detail so buyers reach checkout with more confidence and less visual friction.

### Scope

- `app/(store)/product/[slug]/page.tsx`
- `app/(store)/product/[slug]/loading.tsx`
- `components/product/ProductClient.tsx`
- `components/BuyButton.tsx`
- `lib/i18n.ts`

### Implementation

- Build a stronger relationship between media, title, trust signals, price, stock, and buy action.
- Turn the purchase area into a clear decision panel instead of a loose collection of controls.
- Keep the buy action visually strong, but let price and stock remain easy to scan.
- Use short proof rows such as instant delivery, secure payment, and live stock where that data already exists.
- Keep long descriptions under control with better sectioning and visual rhythm.
- Make sold-out and low-stock states obvious without relying on color alone.

### Exit Criteria

- The product page feels more premium and more decisive than the homepage card view.
- Purchase entry is visually obvious without looking aggressive.
- Long titles, missing images, and sold-out states still look designed.

## Phase 4: Checkout, Order, Recovery, And Delivery

### Purpose

Make the transaction flow feel as polished and trustworthy as the browsing flow.

### Scope

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
- `components/ContentViewer.tsx`
- `components/skeletons/CheckoutSkeleton.tsx`
- `lib/i18n.ts`

### Implementation

- Rebuild checkout as a matched two-panel layout: order brief on one side, payment action on the other.
- Make trust and payment clarity stronger than decorative styling.
- Tighten spacing, field grouping, and summary hierarchy so the checkout reads faster.
- Redesign pending and paid order states so they feel like polished delivery states, not generic status pages.
- Make `ContentViewer` feel secure and premium without becoming visually noisy.
- Redesign recovery so the input method, search action, and results hierarchy are immediately clear.
- Keep bilingual public copy intact across all touched flows.

### Functional Constraints

- Preserve `syncOrderPaymentStatus()` in `app/(store)/order/[orderId]/page.tsx`.
- Preserve current checkout-to-order route behavior.
- Preserve secure delivery through the token-based content viewer.
- Do not change request payloads or API contracts for UI-only work.

### Exit Criteria

- Checkout, order, recovery, and delivery feel like one family.
- Purchase actions are easy to find and trust.
- No transaction logic regressions are introduced.

## Phase 5: Admin Shell And Dashboard

### Purpose

Turn admin into a deliberate operator console while keeping it visually related to the storefront.

### Scope

- `app/admin/layout.tsx`
- `app/admin/login/page.tsx`
- `app/admin/dashboard/page.tsx`
- `components/admin/AnalyticsChart.tsx`
- `components/admin/RecentSales.tsx`
- `components/ui/page-header.tsx`
- `components/ui/metric-card.tsx`

### Implementation

- Tighten the admin shell with clearer navigation structure, cleaner top-bar behavior, and less dead space.
- Make the dashboard useful above the fold: header, key metrics, chart, top products, and recent orders must read in that order.
- Keep admin denser than storefront by using smaller radii, tighter spacing, and stronger panel structure.
- Make the login page feel part of the same product instead of a detached utility screen.
- Keep loading states inside panels instead of leaving them in open space.

### Exit Criteria

- Sidebar, top bar, dashboard panels, and login all feel like one system.
- Dashboard communicates store health quickly.
- Admin feels premium and controlled, not blank or passive.

## Phase 6: Admin Data Pages And CRUD Surfaces

### Purpose

Make list, filter, form, and settings surfaces easier to scan and more reliable to operate.

### Scope

- `app/admin/products/page.tsx`
- `app/admin/products/create/page.tsx`
- `app/admin/products/[slug]/edit/page.tsx`
- `app/admin/products/[slug]/stock/page.tsx`
- `app/admin/products/[slug]/broadcast/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/audience/page.tsx`
- `app/admin/settings/page.tsx`
- `components/admin/AudienceManager.tsx`
- `components/admin/ProductBroadcastPanel.tsx`
- `components/ui/data-table-shell.tsx`
- `components/ui/table.tsx`

### Implementation

- Standardize list-page anatomy: page header, toolbar, main table, and inline empty or error state.
- Make rows easier to scan by separating primary and secondary values more clearly.
- Anchor row actions so they feel attached to the data they affect.
- Improve filter, search, and bulk-action spacing so controls do not feel scattered.
- Make the products table easier to read at a glance for title, slug, price, stock, and state.
- Make audience and settings feel like management surfaces, not loose forms on a page.
- Apply the same field density, section rhythm, and CTA hierarchy to create, edit, stock, and broadcast pages.

### Rules

- Keep dense data pages as tables on desktop.
- On mobile, prefer horizontal overflow, column prioritization, and tighter density before changing structure.
- Reuse existing data and form logic.

### Exit Criteria

- Products, orders, audience, and settings all feel like the same admin system.
- Dense pages remain readable on desktop and mobile.
- Filters, row actions, and dialogs feel predictable and refined.

## Phase 7: Special Routes, States, And QA

### Purpose

Finish the redesign cleanly and verify it across edge cases, themes, and route boundaries.

### Scope

- `app/(store)/api-doc/page.tsx`
- `app/(store)/api-doc/api-doc-client.tsx`
- `app/(store)/api-doc/react-swagger.tsx`
- `app/not-found.tsx`
- `app/error.tsx`
- `app/global-error.tsx`
- `app/loading.tsx`
- all touched route-level loading, empty, sold-out, and error states

### Implementation

- Align special routes with the same visual system used by the storefront shell.
- Review all touched pages in light and dark mode.
- Review public pages in both languages.
- Review edge cases: no image, long title, long description, zero stock, single stock, empty tables, and inline errors.
- Verify keyboard navigation and focus treatment across buttons, menus, dialogs, and forms.
- Confirm no public shell elements leak into admin and no admin patterns leak into storefront.

### Verification

Minimum:

- `npm run lint`

Targeted:

- `npm run test:run`
- `npm run test:e2e`

Run E2E when checkout, order, recovery, or admin auth-related surfaces are materially changed.

### Exit Criteria

- No obvious visual regressions remain across major routes.
- Public and admin both feel intentionally redesigned.
- Required lint and targeted tests pass, or gaps are documented clearly.

## Delivery Order

Implement in this order:

1. Phase 1 foundation and primitives
2. Phase 2 public shell and homepage
3. Phase 3 product detail and purchase entry
4. Phase 4 checkout, order, recovery, and delivery
5. Phase 5 admin shell and dashboard
6. Phase 6 admin data pages and CRUD surfaces
7. Phase 7 special routes, states, and QA

Do not start a later phase until the current phase meets its exit criteria.
