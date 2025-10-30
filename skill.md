# skill.md — External App to Productize GHL Snapshots into SaaS Plans

> Purpose: Build a **separate external application** (your control plane) that programmatically turns your ~150+ GoHighLevel (GHL) snapshots into sellable **SaaS plans**, provisions sub‑accounts on purchase, applies the proper snapshot, and triggers onboarding—while remaining portable to other platforms later (DashClicks/Vendasta/SuiteDash).

---

## 0) Goals & Non‑Goals

**Goals**
- Create a **vendor‑neutral external app** that orchestrates: pricing, checkout, provisioning, snapshot application, onboarding, and lifecycle.
- Allow **bulk operations** over ~150+ snapshots (create plans, map to billing SKUs, update snapshots, push changes to tenants).
- Offer **SaaS enablement**: multi‑tenant model, role‑based access, audit logs, observability, error handling, idempotent retries.

**Non‑Goals**
- Replacing GHL’s internal automation/funnels; we orchestrate at a higher level.
- Hard‑coding to any single vendor’s API paths; we **wrap** vendor APIs behind our own adapters.

---

## 1) Architecture (High Level)

```
[Buyer] → [Public Website (Landing Page + Catalog)]
          → (Select plan from 150+ snapshot-backed SKUs)
          → [Checkout (Stripe, 14‑day free trial)] → [Webhook Receiver (External App)]
  → [Provisioner Service]
      → Vendor Adapter: GHL API (create sub‑account, apply snapshot)
      → Billing Adapter: Stripe (attach subscription, free trial management, entitlements)
      → Notification Adapter: Email/SMS (welcome, onboarding)
      → Portal Adapter: (optional) SuiteDash/Vendasta client portal
  → [Orchestration Queue]
  → [Observability + DB]
```

**New elements**
- **Snapshot Exporter:** reads the **imported snapshot list from GHL** and **writes to Excel (.xlsx)** for review/editing. This Excel then becomes the **source of truth** to create SaaS plans one‑by‑one and to later **append each plan’s Stripe checkout link**.
- **Trial Engine:** default **14‑day free trial** for all products (Stripe prices configured with `trial_period_days = 14`).

---

## 2) Prerequisites & Accounts

- **GoHighLevel**: Agency with SaaS Mode; **Client ID/Secret**; redirect URI set for OAuth; agency API key (for admin ops); at least one test sub‑account.
- **Stripe**: Products/Prices per plan; webhook secret.
- **Excel Source**: `.xlsx` file (one column: `Snapshot Name`; optional: `Plan Name`, `Price Monthly`, `Price Annual`, `Tags`, `Description`).
- **Domain**: `saas.yourdomain.com` for app; `www.yourdomain.com` for marketing site.
- **Email/SMS**: Provider creds (or GHL wallet).
- **Git/CI/CD**: Repo + environments (dev/stage/prod), Docker registry.

---

## 3) Data Model (External App)

**Tables (suggested)**
- `vendors` (id, type, status)
- `snapshots` (id, vendor_snapshot_id, name, niche, version, status)
- `collections` (id, name, slug, description, sort_order)
- `plans` (id, name, description, vendor_snapshot_id, collection_id, stripe_product_id, stripe_price_id_m, stripe_price_id_y, stripe_payment_link_m, stripe_payment_link_y, feature_flags JSONB, trial_days INT DEFAULT 14, is_published BOOL)
- `media_assets` (id, plan_id, type ENUM('hero','icon','gallery'), url, alt_text)
- `catalog_assets` (plan_id, hero_image_url, icon_url, slug, seo JSONB)
- `tenants` (id, vendor_account_id, plan_id, status, owner_email, created_at)
- `runs` (id, type, status, payload JSONB, error JSONB, started_at, finished_at)
- `webhook_events` (id, source, event_type, raw JSONB, processed_at)

**Excel staging**
- `xlsx_rows` (row_id, snapshot_name_raw, plan_name_raw, description_raw, collection_raw, price_m_raw, price_y_raw, trial_days_raw, tags, stripe_payment_link_m, stripe_payment_link_y, processed BOOL, error TEXT)

**Core relations**
- `plans.vendor_snapshot_id` → snapshot to apply on provision
- `plans.collection_id` → category for navigation and filters
- `media_assets.plan_id` & `catalog_assets.plan_id` → images used on landing page & plan detail

---

## 4) Environment Variables (.env)

```
# App
APP_ENV=dev
APP_URL=https://saas.yourdomain.com
JWT_SECRET=•••

# Postgres
DATABASE_URL=postgres://user:pass@host:5432/saas

# Queue
REDIS_URL=redis://host:6379

# Vendor: GoHighLevel OAuth (LeadConnector)
GHL_OAUTH_AUTH_URL=https://services.leadconnectorhq.com/oauth/authorize
GHL_OAUTH_TOKEN_URL=https://services.leadconnectorhq.com/oauth/token
GHL_CLIENT_ID=•••
GHL_CLIENT_SECRET=•••
GHL_OAUTH_REDIRECT_URL=https://saas.yourdomain.com/oauth/callback

# Vendor: GoHighLevel **API 2.0**
GHL_API_BASE_V2=https://rest.gohighlevel.com
GHL_API_VERSION=2.0              # align with GHL API 2.0 docs
GHL_API_ACCEPT=application/json

# Stripe
STRIPE_SECRET_KEY=sk_test_•••
STRIPE_WEBHOOK_SECRET=whsec_•••

# Content Generation (optional)
OPENAI_API_KEY=•••            # for product descriptions
IMAGE_GEN_API_KEY=•••         # for hero/icon generation
ASSETS_CDN_BASE=https://cdn.yourdomain.com
```

---

## 5) Vendor Adapter Contracts (Abstraction)

### GHL API **2.0** alignment
- **Do not hardcode paths** in business logic. Centralize in `GhlV2Routes` constants that mirror the **official GHL API 2.0** resource names.
- Always send: `Authorization: Bearer <access_token>`, `Accept: application/json`, and any **versioning/header** required by the 2.0 docs.
- Import the **OpenAPI/Swagger** spec (if provided) to generate types; validate request/response schemas.

```ts
// Example: central route map (names MUST match GHL 2.0 docs)
export const GhlV2Routes = {
  oauth: {
    authorize: process.env.GHL_OAUTH_AUTH_URL!,
    token: process.env.GHL_OAUTH_TOKEN_URL!,
  },
  snapshots: {
    list: "/v2/snapshots",                 // placeholder; replace with exact 2.0 path
    apply: (locationId: string, snapshotId: string) => `/v2/locations/${locationId}/snapshots/${snapshotId}` // placeholder
  },
  locations: {
    create: "/v2/locations",               // placeholder
  },
  workflows: {
    trigger: "/v2/workflows/trigger"       // placeholder
  }
} as const;
```

```ts
export interface VendorAdapter {
  // Snapshots & plans
  listSnapshots(): Promise<Snapshot[]>;                // name+id+meta from **v2 snapshots** resource
  applySnapshot(locationId: string, snapshotId: string): Promise<void>;

  // Tenancy
  createTenant(input: CreateTenantInput): Promise<{ locationId: string }>;  // **v2 locations**
  setPlanEntitlements(locationId: string, features: Record<string, any>): Promise<void>;
  triggerWelcome(locationId: string, context: any): Promise<void>;           // **v2 workflows** or messages
}
```

**OAuth adapter (GHL 2.0)**
- Use **Authorization Code** with your **Client ID/Secret** and **space‑separated scopes** as documented for **2.0**.
- Store `access_token`, `refresh_token`, `expires_in`, `scope` and resolved `companyId`/`locationId` per GHL’s 2.0 conventions.
- Implement refresh + backoff on 401/429.

---

## 6) Step‑By‑Step Implementation Plan

> **API naming note:** All calls that touch GHL must use the **official 2.0 resource names & paths**. Replace any placeholder routes in this document with the exact endpoints from the GHL API 2.0 documentation during implementation.

### Phase 0 — Bootstrap
1. Scaffold Node/NestJS (or Python) app.
2. Add Postgres + Prisma/TypeORM; BullMQ + Redis; Stripe SDK; simple Admin UI.
3. Implement **GHL OAuth 2.0**: `/auth/ghl/login`, `/auth/ghl/callback`, token storage & refresh.
4. Wire a typed **GhlV2Client** generated from the official OpenAPI (if available) to ensure endpoint parity.

### Phase 1 — **Snapshot Export → Excel** (Authoritative List)
1. Admin clicks **“Export Snapshots”** → Adapter calls **v2 snapshots list**.
2. Write `.xlsx` with columns: `Snapshot Name`, `Plan Name`, `Description`, `Collection`, `Price Monthly`, `Price Annual`, `Trial Days` (default 14), `Tags`.
3. Download Excel for review/cleanup.

### Phase 2 — **Excel → Plans** (Create Plans One‑by‑One)
1. Upload Excel; parse rows; normalize & fuzzy‑match snapshot names to **v2 snapshot IDs**.
2. Map `collection_raw` to `collections` (create if missing).
3. For each row (sequential):
   - **Description**: use provided or generate via LLM.
   - **Images**: generate hero/icon from snapshot name; upload to CDN.
   - **Stripe**: create/update Product (with description & images) and Prices (Monthly/Annual) with `trial_period_days`.
   - Upsert `plans` with snapshotId, collection, product/price IDs, payment link URLs, trial_days.
   - Append Stripe payment links into the same Excel row.

### Phase 3 — Public Website (Landing Page + Catalog)
1. `/plans` grid (filters: collection, tags) showing 14‑day trial badge, images, and CTAs.
2. `/collections/:slug` pages; `/plans/:slug` detail.
3. Optional **Designed Pages** export (React/HTML) uploaded as alternative landing.

### Phase 4 — Checkout → Provisioning
1. Stripe checkout (trial = 14 days).
2. On `checkout.session.completed` webhook:
   - Create tenant via **v2 locations**.
   - Apply snapshot via **v2 snapshots apply**.
   - Set entitlements; trigger welcome workflow (v2).
   - Mark tenant active.

### Phase 5 — Bulk Ops for 150+ Snapshots
1. Admin action runs sequential idempotent batch over rows.
2. Throttle to respect v2 rate limits; resumable with dedupe keys.

### Phase 6 — Updates & Lifecycle
1. Push snapshot updates (v2) to tenants of a plan.
2. Plan changes: switch Stripe price; optionally re‑apply new snapshot.
3. Cancellations: suspend tenant; deprovision after grace period.

### Phase 7 — Observability & Governance
1. Runs log, metrics, alerts, audit trails.
2. RBAC; secret rotation; public API rate‑limit.

---

### Phase 0 — Bootstrap
1. Scaffold Node/NestJS (or Python) app.
2. Add Postgres + Prisma/TypeORM; BullMQ + Redis; Stripe SDK; simple Admin UI.
3. Implement **GHL OAuth**: `/auth/ghl/login`, `/auth/ghl/callback`, token storage & refresh.

### Phase 1 — **Snapshot Export → Excel** (Authoritative List)
1. Admin clicks **“Export Snapshots”** → Adapter calls `listSnapshots()` from GHL.
2. Write `.xlsx` file with columns: `Snapshot Name`, `Plan Name` (optional), `Price Monthly` (optional), `Price Annual` (optional), `Trial Days` (default 14), `Tags`, `Description`.
3. Download Excel for manual review/cleanup (dedupe/correct names).

### Phase 2 — **Excel → Plans** (Create Plans One‑by‑One)
1. Upload the edited Excel through Admin → parse with `sheetjs`.
2. Normalize `Snapshot Name` (trim/casefold) and **match to GHL snapshot IDs**; flag any unknown names for manual fix.
3. **Category mapping:** Resolve `collection_raw` → `collections.id` (create if not exists, slugify name).
4. For each valid row (processed **one by one**):
   - **Descriptions:** If `description_raw` present, use it; otherwise **generate** with LLM (prompt seeded by snapshot name, niche, and features) and store in `plans.description`.
   - **Stripe**: Create/Upsert **Product** (name = `plan_name` or `snapshot_name`), set description (from above), and **create Prices** (Monthly & Annual) with **`trial_period_days = row.trial_days_raw || 14`**.
   - **Images:** Generate hero/icon images **based on snapshot name** (e.g., industry cues) via `IMAGE_GEN_API_KEY`; upload to CDN; persist in `media_assets` and mirror hero/icon URLs in `catalog_assets`.
   - Upsert **plan** linking snapshotId, collection, product/price IDs, payment link URLs, `trial_days`.
5. Append the **Stripe payment link(s)** back into the **same Excel** rows and allow **download** of the updated Excel.

### Phase 3 — Public Website (Landing Page + Catalog)
1. Build `/plans` that reads `GET /catalog/plans?published=1` with **collection filters** & search.
2. Cards show: plan name, collection, short description, **“Free 14‑day trial”** badge, price M/Y, hero/icon, CTA → Stripe link.
3. Collection pages: `/collections/:slug` render filtered grids (SSR/ISR) with SEO meta from `collections.description`.
4. Plan detail page: show generated imagery, features, FAQs; secondary CTAs.

### Phase 3b — Optional “Designed Pages” Export
1. WYSIWYG/Page Builder inside Admin to design richer landing pages per plan or collection.
2. Export as static **React/Next** or **HTML/CSS** bundle; publish to CDN or upload into your primary marketing site as an alternative.
3. Wire canonical URLs so `/plans/:slug` can redirect to the custom-designed page if present.
 — Public Website (Landing Page + Catalog)
1. Build `/plans` page that reads from `GET /catalog/plans?published=1`.
2. Each card shows: Plan name, tags, short description, **“14‑day free trial”** badge, price M/Y, and **CTA → Stripe Payment Link**.
3. Add filters/search; pre‑render static (SSR/ISR) for SEO.
4. Plan detail page: snapshot highlights + features + FAQ about free trial.

### Phase 4 — Checkout → Provisioning
1. Stripe hosts checkout with **14‑day trial** (no immediate charge unless extra fees apply).
2. On `checkout.session.completed` webhook:
   - Create `tenants` row (status=`provisioning`).
   - Enqueue `ProvisionTenantJob { planId, ownerEmail, companyName }`.
3. Job runner:
   - **GHL.createTenant** → returns `locationId`.
   - **GHL.applySnapshot(locationId, snapshotId)`**.
   - **GHL.setPlanEntitlements** (seats, features).
   - **GHL.triggerWelcome** (email/SMS or GHL workflow start).
   - Mark `tenants.status=active`.

### Phase 5 — Bulk Ops for 150+ Snapshots
1. Admin action **“Generate Plans from Excel”** runs an **idempotent batch** over rows.
2. Throttle API calls; show progress/errors per row; allow resume.
3. Re‑run safely (dedupe by `snapshotId` + `plan_name`).

### Phase 6 — Updates & Lifecycle
1. **Snapshot update push**: pick a plan → enqueue apply‑update to all active tenants.
2. **Plan change**: move subscription to new Stripe price; (optional) re‑apply different snapshot.
3. **Cancellation**: on Stripe event, suspend tenant; deprovision after grace period.

### Phase 7 — Observability & Governance
1. Runs log, metrics, alerts, and audit trails.
2. Role‑based admin; secret rotation; rate‑limit public endpoints.

---

## 7) External App Endpoints (Proposed)

```
# Auth
GET    /auth/ghl/login                        # start OAuth (company/location/combined)
GET    /auth/ghl/callback                     # exchange code; store tokens

# Snapshot Export
GET    /admin/snapshots/export                # fetch snapshots from GHL → return .xlsx

# Collections
GET    /admin/collections                     # list/create/update/delete collections
POST   /admin/collections                     # create collection (name, description)

# Excel → Plans (one-by-one creation)
POST   /admin/excel/upload                    # upload .xlsx; stage rows
POST   /admin/excel/process                   # sequential: create plans, descriptions, images, prices (trial), payment links
GET    /admin/excel/download                  # download same Excel with appended Stripe links & statuses
GET    /admin/excel/report                    # mismatches, duplicates, conflicts

# Image Generation & Assets
POST   /admin/images/generate                 # generate hero/icon by snapshot name
POST   /admin/assets/upload                   # upload to CDN; return URL

# Catalog
GET    /catalog/plans                         # public list of published plans (with collections)
GET    /catalog/collections/:slug             # public list for a collection
GET    /catalog/plans/:slug                   # public plan detail
POST   /admin/plans                           # create/update single plan
POST   /admin/plans/:id/publish               # toggle publish flag

# Checkout & Provisioning
POST   /checkout/session                      # (optional) create Checkout Session if not using Payment Links
POST   /webhook/stripe                        # handle subscription events
POST   /admin/tenants/provision               # manual provision (test)

# Page Designer (optional)
POST   /admin/pages                           # save designed page json/schema
POST   /admin/pages/:id/export                # export static React/HTML bundle
POST   /admin/pages/:id/upload                # upload bundle to CDN/marketing site

# Ops
POST   /admin/plans/:id/push-update           # push snapshot updates to tenants
GET    /admin/runs                            # job history
```

---

## 8) Job Design & Idempotency

- Each job carries a **dedupe key** (`tenant_id` + `action`).
- Use **outbox pattern** for webhook → job handoff.
- Implement **exponential backoff** with max attempts.
- Classify failures: **Transient** (retry) vs **Permanent** (park & alert).

---

## 9) Security & Keys

- Store agency API keys in **env** for dev; move to **Secrets Manager** in prod.
- Use **scoped keys** if vendor supports (least privilege).
- Rotate credentials and maintain an **access inventory**.
- Log only hashed identifiers; never log full tokens.

---

## 10) Testing Strategy

- **API 2.0 parity**: Ensure every GHL call uses the **official v2 path** and resource names; add contract tests using the OpenAPI spec.
- **OAuth 2.0**: Company/location scopes; refresh logic; 401/429 retries.
- **Snapshot export**: v2 list returns all imported snapshots; Excel fidelity.
- **Excel ingestion**: Deterministic name matching; robust error reporting.
- **Descriptions & Images**: Generated when missing; uploaded; alt text present.
- **Stripe plan setup**: Product description & images populated; Prices created with **trial_days**; Payment Links generated; links written back to Excel.
- **Landing pages**: Collections filter works; SEO tags present; 14‑day badge shows.
- **Provisioning**: E2E from checkout to active tenant in GHL with snapshot applied (all via **v2** endpoints).
- **Load**: Batch 150+ rows; confirm v2 rate‑limit handling, duration, and Excel round‑trip accuracy.

---

## 11) Deployment

- **Dockerize** app, workers.
- **Compose** for dev; **Kubernetes**/ECS for prod.
- Use **migrations** (Prisma/TypeORM) on deploy.
- Blue/green or canary for breaking adapter changes.

---

## 12) Vendor‑Specific Notes (GHL **API 2.0**)

- Use **OAuth 2.0 Authorization Code** with **Client ID/Secret** and **space‑separated scopes** per **GHL v2**.
- Respect the official **v2 resource names** and paths; keep route constants in one place (`GhlV2Routes`).
- Headers: `Authorization: Bearer <token>`, `Accept: application/json` (and any versioning header required by **2.0**).
- Implement backoff for **429**; idempotency keys for create operations where available.
- First‑wave endpoints to wire (verify exact paths in docs): **List snapshots**, **Create location (sub‑account)**, **Apply snapshot to location**, **Trigger workflow / onboarding** (all **v2**).

---

## 12b) GHL API 2.0 — Company & Location Scopes (Complete)

> The app must request only the scopes it actually needs. Below are the consolidated **Company‑level** and **Location‑level** scope sets aligned to the v2 model. Use these to build selectable presets (Company / Location / Combined) and to validate tokens at runtime.

### Company (Agency‑level) scopes
- `companies.readonly`
- `users.readonly`
- `locations.readonly`
- `oauth.readonly`
- `oauth.write` *(required for company→location token exchange)*
- `snapshots.readonly` *(Agency Pro)*
- `snapshots.write` *(Agency Pro)*
- `saas/company.read` *(Agency Pro)*
- `saas/company.write` *(Agency Pro)*
- `saas/location.read` *(Agency Pro)*
- `saas/location.write` *(Agency Pro)*
- `locations.write` *(Agency Pro)*
- `marketplace-installer-details.readonly`
- `numberpools.read`
- `phonenumbers.read`
- `twilioaccounts.read`
- `documents_contracts/*` *(if using Contracts at company scope)*

> **Note:** On the **$297 Agency** plan, certain company scopes are restricted (e.g., snapshots.*, saas.*, locations.write). Use feature flags to gray out unavailable scopes per plan.

### Location (Sub‑account) scopes
- **Associations & Custom Objects**
  - `associations.readonly`, `associations.write`
  - `associations/relation.readonly`, `associations/relation.write`
  - `objects/schema.readonly`, `objects/schema.write`, `objects/record.readonly`, `objects/record.write`
- **Blogs**: `blogs/list.readonly`, `blogs/posts.readonly`, `blogs/post.write`, `blogs/post-update.write`, `blogs/author.readonly`, `blogs/category.readonly`, `blogs/check-slug.readonly`
- **Businesses**: `businesses.readonly`, `businesses.write`
- **Calendars**: `calendars.readonly`, `calendars.write`, `calendars/groups.readonly`, `calendars/groups.write`, `calendars/events.readonly`, `calendars/events.write`, `calendars/resources.readonly`, `calendars/resources.write`
- **Campaigns**: `campaigns.readonly`
- **Contacts & Conversations**: `contacts.readonly`, `contacts.write`, `conversations.readonly`, `conversations.write`, `conversations/message.readonly`, `conversations/message.write`, `conversations/livechat.write`, `conversations/reports.readonly`, `conversation-ai.*`
- **Courses**: `courses.readonly`, `courses.write`
- **Documents & Contracts**: `documents_contracts/*`
- **Email**: `lc-email.readonly`, `emails/builder.readonly`, `emails/builder.write`, `emails/schedule.readonly`
- **Forms**: `forms.readonly`, `forms.write`
- **Funnels/Websites**: `funnels/funnel.readonly`, `funnels/page.readonly`, `funnels/redirect.readonly`, `funnels/redirect.write`, `funnels/pagecount.readonly`
- **Invoices**: `invoices.readonly`, `invoices.write`, `invoices/schedule.readonly`, `invoices/schedule.write`, `invoices/template.readonly`, `invoices/template.write`
- **Knowledge Bases**: `knowledge-bases.*`
- **Links**: `links.readonly`, `links.write`
- **Location Configuration**: `locations/customValues.readonly`, `locations/customValues.write`, `locations/customFields.readonly`, `locations/customFields.write`, `locations/tags.readonly`, `locations/tags.write`, `locations/templates.readonly`, `locations/tasks.readonly`, `locations/tasks.write`
- **Media**: `medias.readonly`, `medias.write`
- **OAuth (location context)**: `oauth.*`
- **Opportunities (Pipelines)**: `opportunities.readonly`, `opportunities.write`
- **Payments (Orders/Transactions/Integrations)**: `payments/orders.readonly`, `payments/orders.write`, `payments/transactions.readonly`, `payments/integration.readonly`, `payments/integration.write`, `payments/custom-provider.readonly`, `payments/custom-provider.write`
- **Products & Storefront**: `products.readonly`, `products.write`, `products/prices.readonly`, `products/prices.write`, `products/collection.readonly`, `products/collection.write`, `store/shipping.readonly`, `store/shipping.write`, `store/setting.readonly`, `store/setting.write`
- **Recurring Tasks**: `recurring-tasks.*`
- **SaaS (location)**: `saas/location.*` *(Agency Pro when applicable)*
- **Social Planner**: `socialplanner/oauth.readonly`, `socialplanner/oauth.write`, `socialplanner/post.readonly`, `socialplanner/post.write`, `socialplanner/account.readonly`, `socialplanner/account.write`, `socialplanner/category.readonly`, `socialplanner/category.write`, `socialplanner/tag.readonly`, `socialplanner/tag.write`, `socialplanner/csv.readonly`, `socialplanner/csv.write`
- **Subscriptions**: `payments/subscriptions.readonly`
- **Surveys**: `surveys.readonly`
- **Users**: `users.readonly`, `users.write`
- **Voice/Agent Studio**: `voice-ai-*`, `agent-studio.write`
- **WordPress**: `wordpress.site.readonly`
- **Workflows**: `workflows.readonly`

> **Preset bundles in the Admin UI**
> - **Company preset (17)**: the company list above.
> - **Location preset (169)**: all location scopes above.
> - **Combined preset (186)**: union of both (ensure scope separator = space).

**Runtime validation**
- On incoming tokens, parse `scope` and **assert required scopes** before executing an action.
- For Company→Location flows, require `oauth.write` and validate `companyId` & `locationId` context.

---

## 13) Pricing & Margins (Ops View)

- Track **COGS per tenant**: GHL seat cost (your agency plan), comms credits (SMS/email/voice), your infra, support time.
- Define **tiers**: Basic (core automations), Pro (extra workflows + support), Premium (concierge + integrations).
- Automate **in‑app upsells** (extra credits, premium snapshots, audits).

---

## 14) Future Enhancements

- **Snapshot Composer**: UI to merge/compose multiple snapshots into a master before plan creation.
- **Auto‑A/B seeding**: Seed two workflow variants per tenant for fast testing.
- **Telemetry**: Per‑workflow success rate & time‑to‑value metrics surfaced to clients.
- **Multi‑vendor**: Add DashClicks/Vendasta/SuiteDash adapters using the same interface.

---

## 15) Cut‑and‑Paste Checklists

**A) One‑time Setup**
- [ ] Enter **GHL Client ID/Secret**, set redirect URI, test OAuth.
- [ ] Connect Stripe; configure default taxes and **trial = 14 days**.
- [ ] Define **Collections** (categories) you want to show on the site.
- [ ] **Export snapshots** from GHL → Excel; review/clean names; assign collections.
- [ ] Upload Excel; process sequentially to **create plans + descriptions + images + Stripe links**.
- [ ] Publish selected plans → live on **/plans** and **/collections/:slug**.
- [ ] Stand up queue & worker; set retries/alerts.

**B) New Customer Flow (expected)**
- [ ] Visitor opens **/plans** → selects plan → **Stripe payment link (14‑day trial)**.
- [ ] Stripe webhook received → tenant row created → job queued.
- [ ] Sub‑account created in GHL → **snapshot applied**.
- [ ] Welcome workflow triggered; credentials emailed.
- [ ] Run status recorded; admin notified.

**C) Excel Round‑Trip**
- [ ] After processing, **download updated Excel** with Stripe links & status per row.
- [ ] Keep as human‑readable catalog backup.

**D) Designed Pages (optional)**
- [ ] Use Page Designer to build custom collection/plan pages.
- [ ] Export static bundle; upload to CDN/site; set canonical URLs.

**E) Update Push**
- [ ] Validate snapshot in staging tenant.
- [ ] Push update to plan’s active tenants.
- [ ] Monitor failures; auto‑rollback where defined.

---

## 16) Minimal Payload Sketches (Pseudo)

```http
# 1) Export snapshots → Excel (server generates .xlsx)
GET /admin/snapshots/export
Response: binary .xlsx with columns
  Snapshot Name | Plan Name | Price Monthly | Price Annual | Trial Days (default 14) | Tags | Description | stripe_payment_link_m | stripe_payment_link_y
```

```http
# 2) Process Excel rows sequentially → create plans & Stripe links
POST /admin/excel/process
{
  "strategy": "sequential",
  "defaults": { "trial_days": 14 }
}
Response: { processed: 150, created: 150, updated: 0, errors: [] }
```

```ts
// Inside processor (per row)
const snap = matchByName(row.snapshotName)
const product = await stripe.products.create({ name: row.planName ?? row.snapshotName })
const priceM = await stripe.prices.create({ unit_amount: cents(row.priceMonthly), currency: 'usd', recurring: { interval: 'month', trial_period_days: row.trialDays ?? 14 }, product: product.id })
const priceY = row.priceAnnual ? await stripe.prices.create({ unit_amount: cents(row.priceAnnual), currency: 'usd', recurring: { interval: 'year', trial_period_days: row.trialDays ?? 14 }, product: product.id }) : null
const payLinkM = await stripe.paymentLinks.create({ line_items: [{ price: priceM.id, quantity: 1 }] })
const payLinkY = priceY ? await stripe.paymentLinks.create({ line_items: [{ price: priceY.id, quantity: 1 }] }) : null
await upsertPlan({ snapshotId: snap.id, productId: product.id, priceM: priceM.id, priceY: priceY?.id, linkM: payLinkM.url, linkY: payLinkY?.url, trialDays: row.trialDays ?? 14 })
appendLinksToExcelRow(row, { linkM: payLinkM.url, linkY: payLinkY?.url })
```

```http
# 3) Provision tenant after checkout (Stripe webhook)
POST /webhook/stripe   # handle checkout.session.completed
→ queue ProvisionTenantJob { planId, ownerEmail, companyName }
```

```ts
// ProvisionTenantJob
const loc = await GHL.createTenant({ companyName, email: ownerEmail })
await GHL.applySnapshot(loc.id, plan.vendor_snapshot_id)
await GHL.setPlanEntitlements(loc.id, plan.feature_flags)
await GHL.triggerWelcome(loc.id, { ownerEmail })
```

