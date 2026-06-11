# UNFILTERED

> **Brochures lie. Students don't.**
> An award-targeted, end-to-end editorial transparency platform for Indian higher-ed.
> Built for **Awwwards SOTY**, **FWA SOTY**, and **CSS Design Awards 2026**.

This is the complete frontend codebase: Next.js 15 (App Router) + React 19 + TypeScript strict, Tailwind v4 CSS-first tokens, GSAP + ScrollTrigger, Lenis smooth-scroll, PixiJS v8 (2D WebGL hero), Framer Motion 11, D3 charts, Zustand state, react-hook-form + Zod, react-masonry-css.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

> The app reads all data from Postgres. Do the **Database setup** below first,
> or pages will error with `DATABASE_URI must be set` / empty results.

## Database setup

The site has no direct-from-JSON mode — every component reads from Postgres
(`lib/db.ts` → `lib/data/index.ts`) against the `uf_*` tables. The mock content
(5 colleges, 60 reviews) lives in `lib/mock-data/` and is loaded into Postgres
by the seed script. The schema lives in `scripts/migrations/*.sql`. Both are
committed, so a fresh clone reproduces an identical database.

**1. Install & start PostgreSQL** (v16 recommended).

- Windows (winget): `winget install -e --id PostgreSQL.PostgreSQL.16 --override "--mode unattended --superpassword postgres --servicename postgresql-16 --serverport 5432"`
- Docker (any OS): `docker run --name uf-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=unfiltered_dev -p 5432:5432 -d postgres:16`
- macOS: `brew install postgresql@16 && brew services start postgresql@16`

**2. Create the `.env` file** in the project root (copy from `.env.example`):

```env
PAYLOAD_SECRET=dev-secret-change-me-in-production
DATABASE_URI=postgresql://postgres:postgres@localhost:5432/unfiltered_dev
```

`.env` is gitignored — each developer creates their own. Adjust the
user/password/host in `DATABASE_URI` to match your local Postgres.

> The TCP form above is required on Windows. The Unix-socket form in
> `.env.example` (`postgresql:///unfiltered_dev?host=/var/run/postgresql`)
> only works on Linux/macOS with peer auth.

**3. Create the database** (skip if your install/Docker already made it):

```bash
createdb unfiltered_dev
# or in psql:  CREATE DATABASE unfiltered_dev;
```

**4. Run migrations, then seed:**

```bash
npm run migrate   # creates the uf_* tables (idempotent)
npm run seed      # loads mock colleges + reviews; creates first admin user
```

Both scripts are safe to re-run. Seeding also creates an admin login for
`/admin`: **admin@unfiltered.dev** / **unfiltered**.

## Build it

```bash
npm run typecheck
npm run build
npm run start
```

## Project map

```
app/
├─ layout.tsx                ← fonts, providers, cursor, konami, nav, footer
├─ page.tsx                  ← Landing: Hero + Manifesto + Featured Exposés
├─ globals.css               ← Tailwind v4 @theme tokens + editorial helpers
├─ loading.tsx               ← Redaction-bar assembling loader
├─ not-found.tsx             ← Custom 404 ("never in the brochure")
├─ colleges/page.tsx         ← Filterable explorer with FLIP grid
├─ college/[slug]/page.tsx   ← Bespoke template (Modules A–G)
├─ submit/page.tsx           ← Multi-step animated form
├─ manifesto/page.tsx        ← Kinetic typography showcase
├─ verified/page.tsx         ← Verification explainer
├─ wall-of-receipts/page.tsx ← Konami-only easter egg
└─ api/og/route.tsx          ← @vercel/og dynamic per-college OG image

components/
├─ providers/                ← LenisProvider, ScrollTriggerProvider
├─ hero/PixiHero.tsx         ← 2D WebGL "tearing brochure" hero
├─ landing/                  ← Hero, Manifesto, FeaturedExposes (pinned-horiz),
│                              CounterStrip, SubmitTeaser
├─ college/                  ← FileHeader (A), RedactionSection (B),
│                              TruthOMeter (C), EvidenceWall (D),
│                              DataAutopsy (E), LongRead (F), SubmitCTA (G)
├─ colleges/ExplorerClient.tsx
├─ submit/MultiStepForm.tsx
├─ CustomCursor.tsx          ← Magnetic, context-morphing
├─ MarqueeStrip.tsx          ← Infinite GSAP marquee
├─ MagneticButton.tsx        ← Elastic hover
├─ RedactionBar.tsx          ← The signature 3-state interaction
├─ RevealText.tsx            ← Per-character entrance (split-text utility)
├─ Nav.tsx · Footer.tsx · ThemeToggle.tsx · SoundToggle.tsx · KonamiCode.tsx

lib/
├─ mock-data/                ← 5 colleges, 60 verified reviews, typed
├─ data/index.ts             ← The single data abstraction layer
├─ hooks/                    ← useGSAP, useLenisScroll
├─ store/                    ← Zustand filter + cursor + sound stores
└─ utils/                    ← cn, splitText, fingerprint (deterministic SVG)

cms/
└─ collections/              ← Payload CMS 3 schemas, DORMANT. Swap to live
                               data by changing lib/data/index.ts only.
```

## Animation rationale (what each choice serves)

Every visual decision serves the **brochures-lie/students-reveal-truth** narrative:

| Device | Where | Why |
| --- | --- | --- |
| **Redaction bar** | Everywhere | The brochure conceals. The user must *act* to expose. Three states (covered → claim → truth) make the gap legible, not binary. |
| **PixiJS tearing hero** | Landing | The cover "rips" as the user scrolls — the literal act of unbinding the marketing PDF. 2D displacement filter, no Three.js needed. |
| **Truth-O-Meter** | College pages | Mouse-look needle = user "auditing" honesty. Spring physics on settle. Replaceable with Rive when a .riv is authored. |
| **Magazine long-read** | College pages | Editorial pacing forces the reader to slow down. Drop caps, marginalia, scroll-linked active paragraph. |
| **FLIP grid (Framer Motion)** | Colleges explorer | Filter changes feel like a newspaper re-typesetting itself, not a re-render. |
| **Pinned horizontal scroll** | Landing | Comparative rhythm — claim ↔ truth ↔ claim ↔ truth — the user *feels* the gap. |
| **Magnetic cursor + buttons** | Site-wide | Affordance: every interactive element is alive. Cursor morphs by context (READ / PLAY / TRUTH). |
| **Marquee strips** | Between sections | Newspaper "stop strips" — separators that re-state the thesis. |
| **Custom 404 + Konami egg** | Edges | Reward for the curious — Awwwards judges look for these. |

## Reduced-motion respected

`prefers-reduced-motion: reduce` short-circuits:
- PixiJS hero (falls back to a CSS gradient)
- Lenis (skips initialisation entirely)
- RedactionBar (still cycles state on click, but no transform animation)
- RevealText (chars rendered visible immediately)

## Print stylesheet

`@media print` rewrites college pages into a single-column newspaper article — drop caps preserved, redaction bars rendered as gray, nav/cursor/canvas hidden.

## Where the CMS lives

The Payload CMS 3 collection definitions are in `cms/collections/`. They are **dormant** — not registered with a Payload instance, not running. They exist as typed schemas so that the eventual cut-over is one file change:

```ts
// lib/data/index.ts
// BEFORE: const colleges = await import("@/lib/mock-data/colleges")
// AFTER:  const colleges = await payload.find({ collection: "colleges" })
```

Every component reads from `lib/data/index.ts` only.

## Easter eggs

- Konami code (↑ ↑ ↓ ↓ ← → ← → B A) anywhere → `/wall-of-receipts`
- Theme toggle morphs (not flips) between ink and paper
- Press the 404 redaction bar to expose the hidden line
- Print-preview a college page to see the newspaper article it becomes

## License

MIT — but the editorial concept ("UNFILTERED · brochures lie · students don't") is asserted by the author. Reuse the code, credit the concept.
