# BASELINE REPORT — MENTE DE ACERO V2

**Date:** 2026-08-19  
**Branch:** `main` (Remote: `origin/main`)  
**Initial SHA:** `9f9068d8e71f3a5546a755755b1323df377d9353`  
**Execution Context:** Safety Baseline & Non-Destructive Pre-Refactor Verification

---

## 1. Git Status & Repository State

- **Active Branch:** `main` (synchronous with `origin/main`).
- **Working Tree:**
  - Modified files from previous security/auth/disc sprint:
    - `package.json`, `package-lock.json`
    - `server.js` (942 lines)
    - `public/index.html`, `public/app.js`
    - `public/portal.html`, `public/portal.js`
    - `public/login.html`, `public/login.js`
  - Uncommitted new assets preserved:
    - `public/participant.css` (Dedicated participant styling)
    - `public/ui.js` (Lucide icon helper)
    - `lib/instruments/disc.js`, `lib/scoring/discScoring.js`
    - `lib/auth/password.js`, `lib/auth/session.js`
    - `lib/personnel/rules.js`, `lib/personnel/excel.js`
    - `tests/disc.test.js`, `tests/password.test.js`, `tests/personnel-rules.test.js`
    - `supabase/migrations/` (001 through 007)

---

## 2. Automated Test Suite Execution

```text
> evaluacion-multiinstrumento@1.0.0 test
> node --test

✔ DISC definition exposes 28 forced-choice groups (0.7907ms)
✔ DISC answer requires different MAS and MENOS choices (0.3111ms)
✔ DISC scoring produces MAS, MENOS and difference totals (0.8396ms)
✔ passwords are stored as salted scrypt hashes (98.9066ms)
✔ new password policy rejects cedula, repeated and short passwords (0.4815ms)
✔ normalizeCedula preserves valid 10 digit IDs (1.2346ms)
✔ normalizeCedula pads Ecuadorian 9 digit imports (0.1678ms)
✔ senior officers only receive DISC in promotions 48-59 (0.812ms)
✔ SGOP through SUBM receive DISC (0.222ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ duration_ms 218.9ms
```
**Conclusion:** 100% of existing unit tests pass cleanly with zero regressions.

---

## 3. Verified Psychological Instruments Baseline

### 3.1 EMA (Escala Multidimensional de Asertividad)
- **Source:** `lib/instruments/ema.js`, `lib/instrument.js` (45 Likert items 1–5).
- **Scoring Engine:** `lib/scoring.js`.
- **Dimensions:** Direct Assertiveness (15 items), Non-Assertiveness (17 items), Indirect Assertiveness (13 items).
- **Status:** Verified working; supports direct/inverse scoring.

### 3.2 Bar-On ICE (Inventario de Cociente Emocional)
- **Source:** `lib/instruments/baron.js` (133 Likert items 1–5).
- **Scoring Engine:** `lib/scoring/baronScoring.js`, `lib/interpretation/baronInterpretation.js`.
- **Dimensions:** 5 Composites (Intrapersonal, Interpersonal, Adaptability, Stress Management, General Mood) + 15 Subscales + Validity checks (Inconsistency, Positive/Negative Impression).
- **Status:** Verified working; standard CE scores ($M=100, SD=15$).

### 3.3 DISC (Personal Profile System)
- **Source:** `lib/instruments/disc.js` (28 forced-choice quartets).
- **Scoring Engine:** `lib/scoring/discScoring.js`.
- **Dimensions:** Dominance (D), Influence (I), Steadiness (S), Conscientiousness (C). Most ($M$), Least ($L$), Difference ($M - L$).
- **Status:** Verified working; enforces $M \neq L$ selection per item.

---

## 4. Verification of Runtime Flows

1. **Authentication Flow:**
   - `POST /api/auth/login`: Rate limited (5 attempts = 15m lock), validates salted scrypt hashes.
   - `must_change_password`: Forces password reset via `POST /api/auth/change-password` before grant of application access.
   - `GET /api/auth/me`: Delivers authenticated person data and active assignments.
2. **Assessment Lifecycle Flow:**
   - `POST /api/applications/start` $\to$ Creates session in `applications`.
   - `POST /api/applications/:id/answers` $\to$ Real-time auto-saving with incremental scoring calculation.
   - `GET /api/applications/:id` $\to$ Returns current progress snapshot.
3. **Storage Dual-Driver:**
   - Supabase driver active when configured via environment keys.
   - Local JSON fallback (`data/instrument_store.json`) for seamless zero-cloud local development.
