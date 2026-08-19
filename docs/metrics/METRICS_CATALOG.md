# METRICS CATALOG — MENTE DE ACERO

**Document Version:** 2.1.0  
**Location:** `/docs/metrics/METRICS_CATALOG.md`  
**Source of Truth:** Psychometric Standards & Backend Implementation  
**Strict Compliance Rule:** No metric may be rendered in the user interface unless explicitly specified, categorized, and calculated according to this catalog. Arbitrary combination or mathematical averaging of disparate psychological instruments is strictly prohibited. Age (18–33) is strictly a UX/UI design sensitivity reference and MUST NEVER be used as a backend scoring rule, metric, or comparative benchmark.

---

## 1. Catalog Taxonomy & Core Principles

Metrics in Mente de Acero are divided into three distinct methodological categories:
1. **Category A — Standardized Psychometric Instruments:** Scientifically validated instruments with standardized scoring norms, validity indexes, and specific clinical/developmental interpretations.
2. **Category B — Longitudinal Well-Being & Habit Trackers:** Self-reported behavioral tracking (sleep, hydration, physical movement, mindful breathing, micro-journaling) evaluated against objective lifestyle targets.
3. **Category C — Ecological Mood & Affect Monitoring:** Daily ecological momentary assessments tracking emotional valence and subjective energy over a 7-to-14 day window.

---

## 2. Standardized Metrics

### 2.1 Bar-On Emotional Quotient Inventory (Bar-On ICE)
- `METRIC_BARON_CE_TOTAL` (Status: `IMPLEMENTED`, Range: 50–150, Mean: 100, SD: 15)
- `METRIC_BARON_COMPOSITES` (Status: `IMPLEMENTED`, Intrapersonal, Interpersonal, Adaptability, Stress Management, General Mood)

### 2.2 Escala Multidimensional de Asertividad (EMA)
- `METRIC_EMA_DIRECTA` (Status: `IMPLEMENTED`, Raw: 15–75, Normalized %)
- `METRIC_EMA_NO_ASERT` (Status: `IMPLEMENTED`, Raw: 17–85, Normalized %)
- `METRIC_EMA_INDIRECTA` (Status: `IMPLEMENTED`, Raw: 13–65, Normalized %)

### 2.3 Personal Profile System (DISC)
- `METRIC_DISC_VECTORS` (Status: `IMPLEMENTED`, D, I, S, C Most/Least/Difference counts, Range: -28 to +28)
- `METRIC_DISC_PATTERN` (Status: `IMPLEMENTED`, Qualitative Behavioral Profile)

### 2.4 Lifestyle & Longitudinal Metrics
- `METRIC_WELLNESS_INDEX` (Status: `DERIVED`, Formula: 35% Habits + 35% Mood + 30% Assessment Percentile, Range: 0–100)
- `METRIC_HABIT_ADHERENCE` (Status: `DATA_GAP`, Tracking Sleep, Water, Movement, Breathing, Journaling)
- `METRIC_MOOD_14D_SERIES` (Status: `DATA_GAP`, 14-day continuous smoothed valence curve)

---

## 3. Scope Boundaries: Prohibited & Out of Scope Metrics
- `psychological_global_score` (`PROHIBITED`): Statistically invalid cross-battery average.
- `EMA_BARON_DISC_combined_score` (`PROHIBITED`): Blending unrelated psychological dimensions is strictly forbidden.
- `overall_mental_strength_score` (`PROHIBITED`): Invented synthetic score.
- `age_group_benchmark` (`OUT_OF_SCOPE`): The 18–33 age reference represents ONLY the UX/UI target audience and visual design sensitivity. It is NOT a business rule, scoring variable, or statistical normative group.
- `age_group_percentile` (`OUT_OF_SCOPE`): No age-based norming exists or is authorized.
- `18_33_reference_radar` (`OUT_OF_SCOPE`): The RadarChart displays ONLY the authenticated user's actual dimension scores.
