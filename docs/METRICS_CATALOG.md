# METRICS CATALOG — MENTE DE ACERO

**Document Version:** 2.1.0  
**Source of Truth:** Psychometric Standards & Backend Implementation  
**Strict Compliance Rule:** No metric may be rendered in the user interface unless explicitly specified, categorized, and calculated according to this catalog. Arbitrary combination or mathematical averaging of disparate psychological instruments is strictly prohibited. Age (18–33) is strictly a UX/UI design sensitivity reference and MUST NEVER be used as a backend scoring rule, metric, or comparative benchmark.

---

## 1. Catalog Taxonomy & Core Principles

Metrics in Mente de Acero are divided into three distinct methodological categories:
1. **Category A — Standardized Psychometric Instruments:** Scientifically validated instruments with standardized scoring norms, validity indexes, and specific clinical/developmental interpretations.
2. **Category B — Longitudinal Well-Being & Habit Trackers:** Self-reported behavioral tracking (sleep, hydration, physical movement, mindful breathing, micro-journaling) evaluated against objective lifestyle targets.
3. **Category C — Ecological Mood & Affect Monitoring:** Daily ecological momentary assessments tracking emotional valence and subjective energy over a 7-to-14 day window.

---

## 2. Category A: Standardized Psychometric Instruments

### 2.1 Bar-On Emotional Quotient Inventory (Bar-On ICE)
- **Metric ID:** `METRIC_BARON_CE_TOTAL`
  - **Status:** `IMPLEMENTED`
  - **Label:** Cociente Emocional Total (CE Total)
  - **Type:** Standardized Composite Score ($M = 100, SD = 15$)
  - **Source:** `applications` + `final_results.total_normalized`
  - **Valid Range:** $50 - 150$
  - **Classification Bands:**
    - $\ge 120$: Capacidad emocional atípicamente bien desarrollada.
    - $110 - 119$: Capacidad emocional bien desarrollada.
    - $90 - 109$: Capacidad emocional adecuada / promedio.
    - $80 - 89$: Capacidad emocional que requiere enriquecimiento.
    - $\le 79$: Capacidad emocional que requiere atención y desarrollo prioritario.
  - **Validity Pre-requisite:** Inconsistency Score $\le 12$, Positive Impression $\le 130$, Negative Impression $\ge 70$.

- **Metric ID:** `METRIC_BARON_COMPOSITES`
  - **Status:** `IMPLEMENTED`
  - **Label:** Compuestos Bar-On ICE
  - **Source:** `partial_results` where `scope_type = 'component'`
  - **Components:**
    1. `INTRA` (Intrapersonal): Autoconcepto, Autoconciencia Emocional, Asertividad, Autoactualización, Independencia.
    2. `INTER` (Interpersonal): Empatía, Relaciones Interpersonales, Responsabilidad Social.
    3. `ADAPT` (Adaptabilidad): Solución de Problemas, Prueba de Realidad, Flexibilidad.
    4. `STRESS` (Manejo del Estrés): Tolerancia al Estrés, Control de Impulsos.
    5. `MOOD` (Estado de Ánimo General): Felicidad, Optimismo.
  - **Display:** 5-Axis RadarChart (showing strictly the user's standardized scores) or categorized progress bars.

---

### 2.2 Escala Multidimensional de Asertividad (EMA)
- **Metric ID:** `METRIC_EMA_DIMENSIONS`
  - **Status:** `IMPLEMENTED`
  - **Label:** Dimensiones de Asertividad
  - **Source:** `partial_results` where `scope_type = 'dimension'`
  - **Dimensions:**
    1. `EMA_DIR` (Asertividad Directa): $15\text{ items} \times [1..5] = \text{Raw } 15 - 75$. (Direct expression of opinions, rights, and constructive boundaries).
    2. `EMA_NO_ASERT` (No Asertividad): $17\text{ items} \times [1..5] = \text{Raw } 17 - 85$. (Interpersonal inhibition, avoidance, fear of conflict).
    3. `EMA_INDIR` (Asertividad Indirecta): $13\text{ items} \times [1..5] = \text{Raw } 13 - 65$. (Reliance on mediated channels over direct interaction).
  - **Percentile Normalization:**
    $$\text{Normalized \%} = \frac{\text{Raw Score} - \text{Min Score}}{\text{Max Score} - \text{Min Score}} \times 100$$
  - **Classification Bands:** Bajo ($< 35\%$), Medio ($35\% - 65\%$), Alto ($> 65\%$).

---

### 2.3 Personal Profile System (DISC)
- **Metric ID:** `METRIC_DISC_PROFILE`
  - **Status:** `IMPLEMENTED`
  - **Label:** Perfil Conductual DISC
  - **Source:** `final_results.profile_global` + `final_results.detail_json.difference`
  - **Vectors:**
    - $D$ (Dominancia): Most ($M$), Least ($L$), Difference ($D = M - L$, range $-28 \dots +28$).
    - $I$ (Influencia): Most ($M$), Least ($L$), Difference ($I = M - L$, range $-28 \dots +28$).
    - $S$ (Estabilidad): Most ($M$), Least ($L$), Difference ($S = M - L$, range $-28 \dots +28$).
    - $C$ (Conciencia): Most ($M$), Least ($L$), Difference ($C = M - L$, range $-28 \dots +28$).
  - **Classification:** Qualitative primary & secondary behavioral pattern (e.g., "Orientado a Resultados", "Promotor", "Especialista", "Perfeccionista"). *Note: DISC never generates pass/fail scores.*

---

## 3. Category B: Longitudinal Well-Being & Habit Metrics

### 3.1 Composite Well-Being Index (Índice General de Bienestar)
- **Metric ID:** `METRIC_WELLNESS_INDEX`
  - **Status:** `DERIVED` / `DATA_GAP`
  - **Label:** Índice General de Bienestar
  - **Nature:** Non-clinical composite index calculated from verified self-reported habits and pulse check-ins. (Does NOT blend unweighted clinical scales).
  - **Display Range:** $0 - 100$ pts.
  - **Formula:**
    $$\text{Index} = (0.35 \times \text{HabitAdherence}_{\text{7d}}) + (0.35 \times \text{MoodValenceAvg}_{\text{7d}}) + (0.30 \times \text{LatestValidAssessmentPercentile})$$
  - **Bands:**
    - $80 - 100$: Excelente nivel de bienestar y consistencia.
    - $65 - 79$: Buen nivel de bienestar / Adecuado.
    - $50 - 64$: Nivel moderado con áreas de fortalecimiento.
    - $< 50$: Nivel vulnerable / Sugiere activación de recursos de apoyo.

### 3.2 Daily Behavioral Habits
- **`METRIC_HABIT_SLEEP`:** Daily restful sleep hours (Target: $7.0 - 8.5\text{ h/day}$).
- **`METRIC_HABIT_WATER`:** Daily hydration compliance (Target: $\ge 2.0\text{ L/day}$).
- **`METRIC_HABIT_MOVEMENT`:** Physical activity compliance ($\ge 30\text{ min/day}$, weekly goal $3-5\text{ days}$).
- **`METRIC_HABIT_BREATHING`:** Mindful respiration session completed ($\ge 1\text{ session/day}$, $5\text{ min}$).
- **`METRIC_HABIT_JOURNAL`:** Emotional check-in / gratitude log completed ($\ge 1\text{ entry/day}$).

---

## 4. Category C: Ecological Momentary Affect (Mood Tracker)

- **Metric ID:** `METRIC_MOOD_14D_SERIES`
  - **Status:** `DATA_GAP` (Requires `daily_mood_logs`)
  - **Label:** Evolución del Estado de Ánimo (14 días)
  - **Input Values:**
    - 3: Positivo / Enérgico / Optimista (Green `#10B981`)
    - 2: Neutro / Estable / En equilibrio (Amber `#F59E0B`)
    - 1: Desafiante / Agotado / Ansioso (Rose `#F43F5E`)
  - **Output:** Smoothed bezier spline timeline with 14 daily discrete points.

---

## 5. Scope Boundaries: Prohibited & Out of Scope Metrics

### 5.1 Prohibited Metrics
- `psychological_global_score` (`PROHIBITED`): Statistically invalid cross-battery average.
- `EMA_BARON_DISC_combined_score` (`PROHIBITED`): Blending unrelated psychological dimensions is strictly forbidden.
- `overall_mental_strength_score` (`PROHIBITED`): Invented synthetic score.

### 5.2 Out of Scope (Age Cohort Benchmarks)
- `age_group_benchmark` (`OUT_OF_SCOPE`): The 18–33 age reference represents ONLY the UX/UI target audience and visual design sensitivity. It is NOT a business rule, scoring variable, or statistical normative group.
- `age_group_percentile` (`OUT_OF_SCOPE`): No age-based norming exists or is authorized.
- `18_33_reference_radar` (`OUT_OF_SCOPE`): The RadarChart displays ONLY the authenticated user's actual dimension scores (e.g., Bar-On 5 composites).
