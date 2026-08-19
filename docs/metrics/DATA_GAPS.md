# DATA GAPS & PSYCHOMETRIC MAPPING — MENTE DE ACERO

**Document Version:** 2.1.0  
**Location:** `/docs/metrics/DATA_GAPS.md`  
**Audit Target:** Mockup Screens 1, 2, and 3 vs. Existing Backend Database & API

---

## 1. Matrix: Mockup Features vs. Backend Reality

| Mockup Element / Metric | Mockup Screen | Backend Status | Classification | Proposed Implementation / Remediation |
| :--- | :--- | :--- | :--- | :--- |
| **Bar-On ICE CE Scores & Composites** | Screen 1 & 3 | Fully Supported | `SUPPORTED` | Read directly from `final_results.total_normalized` and `partial_results` where `scope_type='component'`. |
| **EMA Assertiveness Dimensions** | Screen 1 & 3 | Fully Supported | `SUPPORTED` | Read from `partial_results` where `scope_type='dimension'` (`asertividad_directa`, `no_asertividad`, `asertividad_indirecta`). |
| **DISC Behavioral Pattern** | Screen 1 & 3 | Fully Supported | `SUPPORTED` | Read from `final_results.profile_global` and `final_results.detail_json.difference`. |
| **RadarChart (Psychological Dimensions)** | Screen 1 | Fully Supported | `SUPPORTED` | Renders strictly the authenticated user's actual standardized scores across Bar-On 5 Composites (Intrapersonal, Interpersonal, Adaptabilidad, Manejo del Estrés, Estado de Ánimo) or DISC dimensions. No age benchmark comparison. |
| **Strengths & Opportunity Areas Cards** | Screen 1 | Fully Supported | `SUPPORTED` | Generated from `final_results.interpretation_json.observations.strengths` and `attentionAreas`. Render with accessible green/amber UI cards. |
| **5-Step Evaluation Progress Stepper** | Screen 1 | Fully Supported | `SUPPORTED` | Computed from active application status (`started_at`, answers count, `isComplete`, and final report availability). |
| **Personalized PDF Report Download** | Screen 1 | Partially Supported | `DATA_GAP` (Feature) | Client-side/server-side PDF generation template rendering the official clinical summary from `final_results` with cryptographic verification seal. |
| **Índice General de Bienestar (Radial 72/100 or 82/100 Gauge)** | Screen 2 & 3 | Schema Gap | `DATA_GAP` | **Strict Rule 9 adherence:** Do NOT average unrelated tests. Implement the non-clinical composite formula from `METRICS_CATALOG.md` (35% Habits + 35% Mood + 30% Assessment) or link directly to Bar-On CE Total scaled to 100. |
| **Daily Wellness Habits Tracker (Sleep, Water, Movement, Breathing, Journal)** | Screen 2 & 3 | Schema Gap | `DATA_GAP` | Add table `wellness_habits` (or localStorage fallback in offline driver). Endpoints: `GET /api/habits`, `POST /api/habits/log`. |
| **14-Day Mood Tracker Spline** | Screen 3 | Schema Gap | `DATA_GAP` | Add table `daily_mood_logs` (`person_id`, `logged_date`, `valence_level [1..3]`, `note`). Endpoints: `GET /api/mood/history`, `POST /api/mood/log`. |
| **Quick Action / Interactive Tools (Respiración, Ejercicios, Diario)** | Screen 2 & 3 | UI Gap | `DATA_GAP` (Tool) | Build client-side interactive tool modals (e.g. 4-7-8 Breathing visualizer with SVG animated circle, cognitive journal check-in modal, emergency 24/7 helpline modal). |
| **Recent Results Cards (Bar-On, EMA, DISC)** | Screen 3 | Fully Supported | `SUPPORTED` | Surfaces completed applications from `final_results` and `applications`. |
| **Weekly Progress Trend Chart (7-Day Line)** | Screen 2 & 3 | Computation Gap | `DATA_GAP` | Aggregate past 7 daily wellness index points into a smooth SVG sparkline curve with delta indicator ($\Delta +8\text{ pts}$). |
| **Age Group Comparison (18–33 Benchmark)** | Screen 1 | N/A | `OUT_OF_SCOPE` | **Age 18–33 is strictly a UX/UI design sensitivity reference.** It is NOT a business rule, scoring norm, or comparative benchmark. |
