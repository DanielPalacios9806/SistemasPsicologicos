# DESIGN SYSTEM — MENTE DE ACERO

**Document Version:** 2.1.0  
**Design Philosophy:** Humanized Clinical Wellness & Mental Fitness (Target Audience: 18–33)  
**Core Mantra:** *Strength + Self-Knowledge + Confidentiality + Well-Being + Progress*

---

## 1. Brand Philosophy & Tone of Voice

### 1.1 De-escalating the Military Tone
The legacy interface felt like an institutional command terminal. The updated Mente de Acero design language preserves the disciplined concept of mental resilience and character strength while transforming the interface into a private, welcoming, and empowering mental gym.

```
❌ AVOID (Old Military Metaphors)           ✅ ADOPT (Modern Mental Wellness)
----------------------------------------    -------------------------------------------
"Soldado Profesional", "Unidad Militar"     "Participante", "Mi Perfil", "Desarrollo Personal"
"Campaña de Evaluación Obligatoria"         "Evaluación de Perfil Mental", "Autoconocimiento"
"Falla en Batería", "Apto / No Apto"       "Área de Oportunidad", "Nivel Adecuado / En Desarrollo"
Harsh camo green, combat badges             Deep Navy, Calm Teal, Warm Amber, Soft Slate
Monolithic wall of 133 questions            Stepped modular cards, autosave, breathing pauses
```

---

## 2. Color Palette & Visual Architecture

### 2.1 Primary & Neutral Colors
- **Deep Navy (`#0B192C`):** Used for primary sidebars, prominent brand marks, and high-trust anchors. Evokes stability, depth, and clinical seriousness.
- **Calm Teal (`#0B716C`):** Used for active states, positive progression, and mental clarity cues.
- **Warm Gold / Amber (`#D99B26` / `#F59E0B`):** Used for primary CTAs ("Iniciar evaluación", "Descargar informe"), active milestones, and streak highlights. Evokes energy, value, and warmth.
- **Canvas Soft White / Off-White (`#F4F7F9`):** Soothing background reducing eye fatigue during 15–20 minute assessment batteries.
- **Surface Cards (`#FFFFFF`):** Crisp, elevated cards with subtle borders (`#E2E8F0`) and smooth rounded corners (`16px`).

### 2.2 Semantic & Feedback System
- **Strengths / High Wellness (`#065F46` / `#10B981`):** Mint/emerald backgrounds with dark green text for verified strengths and completed milestones.
- **Growth / Opportunities (`#92400E` / `#F59E0B`):** Warm amber accents for areas that can benefit from training and mindful attention.
- **Confidentiality / Trust (`#1E40AF` / `#3B82F6`):** Soft blue for security assurances and privacy protection notices.
- **Crisis / Emergency Support (`#991B1B` / `#EF4444`):** Compassionate, calm rose/red for the 24/7 psychological helpline banner.

---

## 3. Typography & Hierarchy

- **Primary Font Family:** `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `sans-serif`.
- **Headings Font Family:** `Plus Jakarta Sans` or clean geometric sans.
- **Typographic Scale:**
  - **Hero Titles (H1):** `28px - 32px`, `font-weight: 700`, `letter-spacing: -0.02em`.
  - **Section Titles (H2):** `20px - 24px`, `font-weight: 700`.
  - **Card Headers (H3):** `16px - 18px`, `font-weight: 600`.
  - **Body Text:** `15px - 16px`, `line-height: 1.55`, `color: #475569`.
  - **Eyebrows / Badges:** `11px - 12px`, `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.05em`.

---

## 4. Visual Components & Chart Specifications

### 4.1 5-Axis Radar Chart (User Psychological Profile)
- **Geometry:** Regular pentagon with 5 concentric benchmark rings ($20, 40, 60, 80, 100$).
- **Series:** Solid blue stroke (`#2563EB`, $2.5\text{px}$), filled with `rgba(37, 99, 235, 0.18)`, circular markers at vertices with tooltip on hover. Renders the user's real dimension scores (e.g. Bar-On 5 composites: Intrapersonal, Interpersonal, Adaptabilidad, Manejo del Estrés, Estado de Ánimo).

### 4.2 Radial Gauge / Donut Dial (Índice de Bienestar)
- **Geometry:** $240^\circ$ or $360^\circ$ circular progress track with rounded caps.
- **Inner Content:** Big numerical score (e.g. `72 / 100`) + interpretive chip (`Adecuado`).
- **Color Progression:** Gradient from Calm Teal (`#0B716C`) to Royal Blue (`#2563EB`) or Amber depending on score band.

### 4.3 Longitudinal 14-Day Mood Spline & 7-Day Trend
- **Canvas:** Smooth cubic bezier curve ($C$ control points in SVG) connecting daily data points.
- **Area Fill:** Vertical linear gradient from `rgba(59, 130, 246, 0.22)` to `transparent`.
- **Interactive Points:** Circular SVG nodes showing tooltip with date, valence, and qualitative tag on hover/tap.

### 4.4 5-Step Evaluation Stepper
- **Layout:** Horizontal sequence connected by a segmented progress track.
- **States:**
  1. `completed`: Solid amber/green circle with checkmark.
  2. `current`: Highlighted circle with glowing ring and step number.
  3. `upcoming`: Soft slate circle with disabled step number.

---

## 5. Accessibility (WCAG 2.1 AA Compliance)

1. **Color Contrast:** All text against background exceeds $4.5:1$ contrast ratio; large headings exceed $3:1$.
2. **Keyboard Navigation:** Every card, button, tab, and slider is fully focusable with an accessible `:focus-visible` ring (`2px solid #2563EB`, offset `2px`).
3. **Screen Readers:** Semantic `<main>`, `<nav>`, `<header>`, `<section>`, `<article>`, and `aria-live="polite"` regions for autosave alerts and progress notifications.
4. **Motion Preference:** Honors `prefers-reduced-motion: reduce` by disabling smooth bezier transitions and scale micro-animations.
