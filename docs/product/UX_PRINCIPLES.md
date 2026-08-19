# UX PRINCIPLES & TARGET AUDIENCE GUIDELINES — MENTE DE ACERO V2

**Document Version:** 2.0.0  
**Target Audience Sensitivity:** Young Adults (Ages 18–33)  
**Strict Architectural Rule:** The 18–33 target audience is ONLY a UX/UI, communication, and visual design guideline. It is NOT a business rule, scoring variable, database segmentation flag, or comparative benchmark.

---

## 1. Core UX Principles

### 1.1 Clarity & Low Visual Bureaucracy
- Young adult users value speed, immediate comprehension, and modern interfaces.
- Eliminate dense institutional text walls; structure information into digestible cards with clear visual hierarchy.
- Provide instant feedback (autosave indicators, step completion rings, intuitive back/forward navigation).

### 1.2 Respectful & Empowering Tone (De-escalation)
- Speak directly to the participant with empathy, confidentiality, and respect (*"Tu progreso"*, *"Conoce tu evolución"*, *"Tus fortalezas"*).
- Avoid rigid military-command language (*"Apto/No apto"*, *"Orden de evaluación"*).
- Emphasize that seeking mental wellness is an act of strength.

### 1.3 Mobile-First & Touch-Friendly Interactions
- Touch targets $\ge 44\text{px} \times 44\text{px}$ across all mobile views.
- Persistent bottom navigation bar on mobile (*Inicio, Evaluaciones, Resultados, Progreso, Perfil*).
- Zero horizontal scrolling; responsive reflow across all standard breakpoints.

### 1.4 Clear, Non-Misleading Analytics
- Data visualizations (Radar, Radial Gauges, Splines) must be immediately understandable.
- Visualizations render ONLY real user data without fake benchmarks or synthetic global averages.
- Every chart includes tooltips and accessible text equivalents (`aria-label`).

---

## 2. Separation of Concerns Matrix

```
┌────────────────────────────────────────┐     ┌────────────────────────────────────────┐
│ TARGET AUDIENCE (Ages 18–33)           │     │ BACKEND & PSYCHOMETRIC ENGINES         │
├────────────────────────────────────────┤     ├────────────────────────────────────────┤
│ • Modern, responsive interface         │     │ • Identical logic for all participants │
│ • Deep Navy, Calm Teal, Warm Amber     │     │ • Standard psychometric manuals        │
│ • Micro-interactions & animations      │     │ • Zero age conditionals in scoring     │
│ • Intuitive habit & mood check-ins     │     │ • Real user data storage               │
│ • Clear typography & card layouts      │     │ • Strict confidentiality & security    │
└────────────────────────────────────────┘     └────────────────────────────────────────┘
```
