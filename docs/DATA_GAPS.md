# DATA GAPS & PSYCHOMETRIC MAPPING — MENTE DE ACERO

**Document Version:** 2.1.0  
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

---

## 2. Psychometric Non-Destructive Resolution Strategy

### 2.1 The "Mental Score" Trap (Rule 9 Compliance)
- **Problem:** Many consumer apps carelessly calculate `(BarOn_CE + DISC_Diff + EMA_Raw) / 3`, producing a meaningless and scientifically invalid number.
- **Solution in Mente de Acero:**
  1. For clinical/psychometric screens: Always display the specific instrument's standardized score (e.g., "Cociente Emocional: 104 CE — Promedio Adecuado", "Asertividad Directa: 78% — Alta").
  2. For the main lifestyle dashboard gauge: Display the **Índice de Bienestar Personal**, explicitly documented as a lifestyle and self-regulation tracker derived from verified habits and daily check-ins.
  3. Radar Chart: Visualizes the user's single dataset across real dimensions (Bar-On 5 composites or DISC).

---

## 3. Database Schema Extensions for Gaps (Non-Destructive)

To resolve the data gaps without modifying or dropping any existing tables (`people`, `applications`, `responses`, `partial_results`, `final_results`, `personnel_profiles`, `user_accounts`, `assessment_assignments`), the following lightweight tables are designed for migration `008_wellness_and_tools.sql`:

```sql
-- 1. Daily Mood Tracking
create table if not exists public.daily_mood_logs (
  id text primary key default gen_random_uuid()::text,
  person_id text not null references public.people(id) on delete cascade,
  logged_date date not null default current_date,
  valence_level integer not null check (valence_level between 1 and 3),
  energy_level integer check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint daily_mood_unique_per_day unique (person_id, logged_date)
);

-- 2. Daily Wellness Habits
create table if not exists public.wellness_habit_logs (
  id text primary key default gen_random_uuid()::text,
  person_id text not null references public.people(id) on delete cascade,
  logged_date date not null default current_date,
  habit_key text not null check (habit_key in ('sleep', 'water', 'movement', 'breathing', 'journal', 'nutrition', 'stress_mgmt')),
  completed boolean not null default false,
  numeric_value numeric, -- e.g., 7.5 for hours of sleep, 2.0 for liters of water
  created_at timestamptz not null default timezone('utc', now()),
  constraint habit_unique_per_day unique (person_id, logged_date, habit_key)
);

-- 3. Tool Interaction Logs (e.g. Guided Breathing Sessions completed)
create table if not exists public.tool_sessions (
  id text primary key default gen_random_uuid()::text,
  person_id text not null references public.people(id) on delete cascade,
  tool_type text not null check (tool_type in ('breathing_478', 'cognitive_journal', 'mindfulness_pause', 'anxiety_first_aid')),
  duration_seconds integer not null default 300,
  pre_stress_rating integer check (pre_stress_rating between 1 and 10),
  post_stress_rating integer check (post_stress_rating between 1 and 10),
  created_at timestamptz not null default timezone('utc', now())
);
```
