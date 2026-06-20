# ADR 0001 — Rămânem pe Next.js 14 (advisory-uri framework cu exposure scăzut)

- **Status:** Acceptat
- **Data:** 2026-06-20
- **Decident:** Roland Petrila
- **Context tehnic:** commit `0f49d4b`, Next.js `14.2.35`

## Context

La mentenanța de dependențe din 2026-06-20 (`npm update` + `npm audit fix`), `npm audit`
raportează **2 vulnerabilități rămase**:

1. **HIGH** — cumul de advisory-uri în `next@14.2.35` (DoS image optimizer, SSRF pe WebSocket
   upgrade, cache poisoning RSC, XSS App Router cu CSP nonces, request smuggling în rewrites,
   bypass middleware/i18n etc.).
2. **MODERATE** — `postcss` tranzitiv prin `next` (XSS via unescaped `</style>` la stringify CSS).

**Constatare cheie:** `14.2.35` este **cea mai patch-uită versiune de pe linia 14**
(dist-tag `next-14` = `14.2.35`, nu există `14.2.36+`). Next.js **nu a făcut backport** la aceste
fix-uri pe linia 14. `npm audit fix` le rezolvă doar prin `next@16` — **breaking**, ce ar trage și
React 19 + retestare PWA/Recharts/Leaflet/teste. Asta contrazice decizia de arhitectură „Next 14".

## Analiza de exposure (verificată în cod)

Config minimal: `next.config.js` conține doar `reactStrictMode` + security headers. App Router.
Hosting: **Vercel** (managed).

| Clasă advisory                              | Feature vizat                    | Folosim?         | Aplicabil     |
| ------------------------------------------- | -------------------------------- | ---------------- | ------------- |
| Image Optimizer DoS / cache (×3)            | `next/image`, `remotePatterns`   | NU               | **NU**        |
| Middleware/Proxy bypass & cache poison (×2) | `middleware.ts`, i18n            | NU               | **NU**        |
| Request smuggling în rewrites               | `rewrites()`                     | NU               | **NU**        |
| SSRF via WebSocket upgrade                  | WebSocket / custom server        | NU               | **NU**        |
| XSS cu CSP nonces                           | nonce / CSP                      | NU               | **NU**        |
| XSS în `beforeInteractive`                  | `next/script`                    | NU               | **NU**        |
| RSC DoS (×3)                                | Server Components                | DA (App Router)  | posibil (DoS) |
| RSC cache poisoning (×2)                    | RSC cached pe CDN                | DA (App Router)  | posibil, mic  |
| postcss XSS (moderate)                      | procesare CSS untrusted la build | NU (CSS propriu) | **NU**        |

**~10 din ~14 advisory-uri nu ne ating.** Cele ~4 rămase (clasă RSC: DoS + cache poisoning) sunt
atenuate de:

- **Vercel** (rate limiting, timeouts pe funcții, scaling, cache managed) → DoS-ul de framework e
  absorbit la nivel de platformă;
- aplicație **read-only, fără auth, fără date personale**, fără input untrusted dincolo de `lat/lon`
  (deja validate);
- randare preponderent **client-side** (PWA cu client components + API routes) → suprafața RSC
  cache-poisoning e mică.

## Decizie

**Rămânem pe Next.js 14.2.35.** Upgrade-ul breaking la 15/16 NU se justifică prin exposure-ul real.

## Consecințe

- ✅ Zero efort/risc de regresie acum; aplicația rămâne stabilă pe arhitectura confirmată.
- ⚠️ `npm audit` / `/doctor` vor raporta în continuare cele 2 advisory — sunt **cunoscute și
  acceptate**. **A NU se forța `next@16`.**
- 📌 **TODO non-urgent:** planificare migrare la **Next 15** ca enhancement separat (branch dedicat,
  retestare completă), nu sub presiune de securitate. Next 15.3.x e un salt mai mic decât 16.

## Revizuire

De reevaluat dacă: (a) apar advisory-uri framework care ating vectori pe care chiar îi folosim
(ex. dacă adăugăm `next/image`, middleware, i18n, WebSocket), sau (b) aplicația capătă auth/date
personale. În oricare caz → re-deschide acest ADR.
