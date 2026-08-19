# IMPLEMENTATION PLAN V2 — MENTE DE ACERO

**Document Version:** 2.1.0  
**Status:** Pre-Refactor Specifications Complete (Stop Gate A)  
**Governing Rule:** Non-destructive evolution, psychometric integrity, humanized design. Age (18–33) is exclusively a UX/UI design sensitivity reference.

---

## 1. What is Preserved (100% Untouched)

1. **Psychometric Scoring Engines & Manuals:**
   - EMA 45 items, reverse item adjustments, and percentile cutoffs (`lib/instruments/ema.js`, `lib/scoring.js`).
   - Bar-On ICE 133 items, 5 composites, 15 subscales, positive/negative impression and inconsistency formulas (`lib/instruments/baron.js`, `lib/scoring/baronScoring.js`).
   - DISC 28 forced-choice quartets, most/least tallying, difference vectors ($M - L$), and pattern resolution (`lib/instruments/disc.js`, `lib/scoring/discScoring.js`).
2. **Core PostgreSQL / Supabase Schema:**
   - `people`, `personnel_profiles`, `user_accounts`, `assessment_campaigns`, `assessment_assignments`, `applications`, `responses`, `partial_results`, `final_results`.
3. **Security & Session Architecture:**
   - Cryptographically salted `scrypt-v1` passwords, mandatory password change flow, `HttpOnly` session cookies, backend-only `SUPABASE_SERVICE_ROLE_KEY` access.
4. **Administrative Back-office & Excel Export Engine:**
   - `/admin.html` and `lib/exportExcel.js` for officer/evaluator data management.

---

## 2. What is Being Refactored

1. **Visual Tone & Brand Expression (De-escalation):**
   - Soften rigid military command aesthetics into an empowering mental fitness and psychological wellness sanctuary for the 18–33 young-adult target audience.
   - Replace harsh backgrounds/badges with deep navy (`#0B192C`), calm teal (`#0B716C`), warm amber (`#D99B26`), soft slate, and clean glassmorphic cards.
2. **Participant Portal & Dashboard (`portal.html`, `participant.css`, `portal.js`):**
   - Shift from a flat card list into a multi-dimensional mental fitness hub with dedicated views for *Inicio (Home)*, *Evaluaciones (Assessments)*, *Resultados (Results)*, *Mi Perfil (Profile)*, *Progreso (Progress)*, and *Hábitos (Habits)*.
3. **Frontend Architecture & Component Library (`public/js/`, `public/css/`):**
   - Modularize vanilla JavaScript into ES modules (`core/`, `components/`, `charts/`, `pages/`, `services/`, `utils/`).
   - Modularize CSS into `tokens.css`, `base.css`, `layout.css`, `components.css`, `dashboard.css`, `assessments.css`, `results.css`, and `responsive.css`.
4. **SVG Charting Primitives:**
   - Implement interactive SVG radar polygons rendering the user's real dimension scores (e.g. Bar-On 5 composites), radial gauge score dials, 14-day continuous mood bezier splines, and 7-day trend sparklines.

---

## 3. What is Being Created (New Additions)

1. **Longitudinal Wellness & Behavioral Habit Layer (Phase 8):**
   - Daily habit tracking (Sleep, Water, Physical Movement, Mindful Breathing, Micro-journaling).
   - 14-day ecological mood valence and energy check-in.
   - 7-day subjective wellness trend indicator ($\Delta +8\text{ pts}$).
2. **Interactive Measurement & Growth Tools (Phase 3 & 8):**
   - 4-7-8 Guided Breathing Pacer with pre/post stress rating slider (1–10).
   - 3-step Cognitive Reframing Journal modal.
   - 24/7 Psychological Crisis Support & Helpline banner (`01 800 123 4567` / configured dynamically).
3. **Traceable Recommendation Engine (Phase 9):**
   - Transparent, rule-based recommendation mapping from specific subscale indicators (e.g. low stress tolerance $\to$ mindful breathing exercises; moderate anxiety $\to$ grounding techniques).
4. **Confidential Clinical PDF Report Exporter (Phase 10):**
   - Clean, standardized PDF download with cryptographic validation seal, test metadata, and strengths/opportunities breakdown.

---

## 4. Real Metrics vs. DATA_GAPs Summary

| Metric | Real Backend Source | Status |
| :--- | :--- | :--- |
| **Bar-On CE Total & Composites** | `final_results.total_normalized` + `partial_results` | `IMPLEMENTED` |
| **EMA Assertiveness Subscales** | `partial_results` (`asertividad_directa`, `no_asertividad`, `asertividad_indirecta`) | `IMPLEMENTED` |
| **DISC Pattern & Vectors** | `final_results.profile_global` + `final_results.detail_json.difference` | `IMPLEMENTED` |
| **Assessment Completion %** | `applications.percentage_complete` | `IMPLEMENTED` |
| **Strengths & Opportunity Areas** | `final_results.interpretation_json.observations` | `IMPLEMENTED` |
| **Índice General de Bienestar (72/100)** | Calculated composite (35% Habits + 35% Mood + 30% Assessment Percentile) | `DERIVED` / `DATA_GAP` (Resolved via formula) |
| **Daily Habits (Sleep, Water, Move)** | Proposed `wellness_habit_logs` | `DATA_GAP` (Non-destructive migration 008) |
| **14-Day Mood Spline** | Proposed `daily_mood_logs` | `DATA_GAP` (Non-destructive migration 008) |
| **Combined EMA+BarOn+DISC Score** | N/A — Statistically invalid | `PROHIBITED` |
| **Age Cohort Benchmark (18–33)** | N/A — 18–33 is solely a UX/UI design sensitivity reference | `OUT_OF_SCOPE` |

---

## 5. Definite Phase-by-Phase Roadmap

* **PHASE 0:** Safety baseline & environment verification (DONE).
* **PHASE 1:** Product & data specification documents (DONE — Stop Gate A).
* **PHASE 2:** Design system, tokens (`tokens.css`), and atomic component foundation.
* **PHASE 3:** AppShell, responsive sidebar, topbar, and mobile navigation bar.
* **PHASE 4:** Home Dashboard V2 (Screen 3) with real data connections & empty states.
* **PHASE 5:** Assessments Hub & Runner V2 with auto-save and stepper.
* **PHASE 6:** Results Hub V2 (Screen 1) with 5-axis radar chart and strengths/opportunity cards.
* **PHASE 7:** Mi Perfil V2 (Integrated visual overview without mathematical blending).
* **PHASE 8:** Wellness infrastructure (Habits, 14-day Mood spline, Non-destructive migration 008).
* **PHASE 9:** Traceable recommendation engine.
* **PHASE 10:** PDF Clinical Report generator.
* **PHASE 11:** Mobile UX refinement (Screen 2).
* **PHASE 12:** Visual QA (Browser screenshot capture across desktop & mobile).
* **PHASE 13:** Technical QA (Regression tests, accessibility checks, performance audit).
* **PHASE 14:** Dead-code cleanup and documentation finalization.
