# IMPLEMENTATION PLAN — MENTE DE ACERO PLATFORM EVOLUTION

**Document Version:** 2.0.0  
**Status:** Approved for Execution Preparation (Phase 0 Completed)  
**Target:** Safe, Non-Destructive Modernization of Mente de Acero

---

## 1. Overview & Architectural Principles

1. **Zero Downtime & Zero Data Loss:** All existing tables (`people`, `applications`, `responses`, `partial_results`, `final_results`, `user_accounts`, `personnel_profiles`, `assessment_campaigns`, `assessment_assignments`) and scoring engines (EMA, Bar-On ICE, DISC) remain intact.
2. **Strict Psychometric Compliance:** No arbitrary blending of psychometric tests (Rules 8 & 9).
3. **De-escalated Wellness Aesthetic:** Soften military framing into an empowering, confidential psychological assessment and mental conditioning sanctum for 18–33 year olds.
4. **Interactive Interventions & Tools:** Connect evaluation results to interactive actionable tools (e.g. 4-7-8 Breathing, Cognitive Journal, Mood Check-ins, Habit Trackers).

---

## 2. Phase-by-Phase Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 0: Complete Audit & Specifications (COMPLETED)                         │
│ - Comprehensive technical & UX audit (AUDIT_REPORT.md).                     │
│ - Strict metrics definition (METRICS_CATALOG.md).                           │
│ - Mockup gap analysis & psychometric resolutions (DATA_GAPS.md).             │
│ - Design tokens & system guidelines (DESIGN_TOKENS.json, DESIGN_SYSTEM.md).  │
│ - Component & route mapping (COMPONENT_MAP.md, ROUTE_MAP.md).               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Design System & CSS Foundation                                     │
│ - Implement CSS variables based on DESIGN_TOKENS.json.                      │
│ - Build modular layout shells (Sidebar, TopBar, Mobile Shell, Grid system). │
│ - De-escalate harsh military terminology across CSS and microcopy.          │
│ - Implement SVG chart rendering primitives (5-Axis Radar, Radial Gauges,   │
│   14-Day Mood Splines, Sparklines).                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Core Dashboard & Results Hub Implementation                        │
│ - Screen 1: "Evaluaciones y Resultados" (Radar comparison, Strengths/       │
│   Opportunities, Step Stepper, Report Download, Active Batteries).          │
│ - Screen 3: Desktop "Inicio / Dashboard" (Current Evaluation, Recent        │
│   Results, Wellness Score Gauge, Habit Tracker, Mood Spline, Support).      │
│ - Screen 2: Responsive Mobile Experience with touch navigation.             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Interactive Measurement & Growth Tools                             │
│ - Interactive 4-7-8 Breathing Pacer Tool with pre/post stress rating.       │
│ - Daily Mood Valence & Energy Check-in Tool.                                │
│ - 5-Pillar Wellness Habits Tracker (Sleep, Hydration, Movement, Zen, Log). │
│ - PDF Clinical Summary Report Generator with verification seal.             │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Verification, Automated Testing & Deployment Readiness             │
│ - Unit and regression test suite (`npm test`).                              │
│ - Responsive testing across mobile (375px), tablet (768px), and desktop.    │
│ - WCAG 2.1 AA accessibility validation.                                     │
│ - Zero console error verification.                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Risk Assessment & Rollback Strategies

| Component | Risk Level | Potential Impact | Mitigation & Rollback Strategy |
| :--- | :--- | :--- | :--- |
| **Participant UI Modernization** | Low | Visual regression if CSS cascades improperly | Scoped CSS classes under `.participant-app` and isolated view templates; old templates backed up. |
| **Scoring & Psychometrics** | Zero | None | Core scoring modules in `lib/scoring/` and `lib/instruments/` are completely untouched; read-only consumption. |
| **Database & Schema Extensions** | Very Low | New table creation in Supabase or local store | Non-destructive `CREATE TABLE IF NOT EXISTS`; local fallback automatically provides JSON storage. |
| **Authentication Flow** | Low | Session disruption | Existing session cookies and password validation endpoints preserved without modifying signature. |

---

## 4. Acceptance Criteria

1. **Visual Match & Modern Polish:** The desktop dashboard, results hub, and mobile views reflect the aesthetic of the reference mockups while softening military rigidity into a clinical-grade, modern wellness sanctum.
2. **Psychometric Fidelity:** Every rendered metric matches `METRICS_CATALOG.md` with zero arbitrary cross-test blending.
3. **Interactive Tools Working:** Participants can interact with the 5-minute breathing pacer, log daily habits, track mood, and download an official PDF report summary.
4. **Testing:** All 9 existing automated unit tests pass without regressions; new test cases added for habit and tool calculations.
