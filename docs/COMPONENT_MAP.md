# COMPONENT MAP — MENTE DE ACERO

**Document Version:** 2.1.0  
**Target:** Architecture & UI Component Taxonomy

---

## 1. Global Shell & Navigation Components

### 1.1 `AppSidebar` (Desktop Navigation)
- **Props / State:** `activeRoute`, `userProfile`, `pendingAssessmentsCount`, `collapsed`.
- **Children:**
  - `BrandLockup` (Eagle Emblem + "Mente de Acero" + Tagline).
  - `UserProfileBadge` (Avatar initials/photo, Full Name, Role/Career).
  - `NavList` (Links: Inicio, Evaluaciones, Resultados, Mi perfil, Progreso, Hábitos, Recomendaciones, Recursos, Ajustes).
  - `MotivationalSidebarCard` ("Tu bienestar mental es tu mayor fortaleza").
  - `SidebarFooter` (Ayuda, Privacidad, Términos, Cerrar sesión button).

### 1.2 `MobileBottomBar` (Mobile Navigation)
- **Props / State:** `activeTab` (`inicio`, `evaluaciones`, `resultados`, `progreso`, `perfil`).
- **Children:** 5 icon-label pairs with active pill animations and badge count.

### 1.3 `AppTopBar`
- **Props / State:** `pageTitle`, `subtitle`, `notificationsCount`, `onHelpClick`, `userDropdownOpen`.
- **Children:**
  - `GreetingHeader` ("Evaluaciones y Resultados", "Bienvenido, Andrés 👋").
  - `NotificationBell` with unread badge.
  - `HelpCenterDropdown` ("Centro de ayuda" with quick FAQs & crisis numbers).

### 1.4 `ConfidentialityBanner` & `EmergencySupportBanner`
- **Props / State:** `variant` (`confidentiality_header`, `confidentiality_footer`, `crisis_helpline`).
- **Children:** Shield/Phone icon, reassuring clinical confidentiality text, emergency hotline link (`01 800 123 4567`).

---

## 2. Assessment & Clinical Evaluation Components

### 2.1 `HeroEvaluationCard` ("Evaluación de perfil mental")
- **Props / State:** `title`, `description`, `illustrationSrc`, `ctaLabel`, `onStartClick`.
- **Visuals:** Modern silhouette illustration with glowing brain and golden CTA button.

### 2.2 `AssessmentProgressStepper`
- **Props / State:** `currentStepIndex (1..5)`, `steps = ['Información personal', 'Cuestionarios psicológicos', 'Análisis de resultados', 'Informe personalizado', 'Recomendaciones finales']`.
- **Visuals:** Horizontal numbered track with completed checkmarks and progress microcopy.

### 2.3 `ActiveAssessmentsList` & `AssessmentCard`
- **Props / State:** `assignments = [{ id, code, name, icon, percentage, status }]`.
- **Visuals:** Grid or list of active batteries (Bar-On, EMA, DISC) with progress bars, % badges, and "Continuar" CTAs.

### 2.4 `ComparativeRadarCard` (Psychological Profile Radar)
- **Props / State:** `dimensions = [{ axis, userScore }]`.
- **Visuals:** 5-axis SVG Radar polygon rendering the user's real scores across validated dimensions (e.g. Bar-On 5 composites).

### 2.5 `InterpretationInsightCard` ("¿Qué significa tu resultado?")
- **Props / State:** `strengths = []`, `opportunityAreas = []`, `motivationalNote`.
- **Visuals:** Mint-bordered card with Star icon for Fortalezas, Amber-bordered card with Target icon for Áreas de Oportunidad.

### 2.6 `ReportDownloadCard`
- **Props / State:** `generatedDate`, `reportFeatures = []`, `isReady`, `onDownloadPdf`.
- **Visuals:** Document icon with padlock badge and "Descargar informe (PDF)" amber button.

---

## 3. Wellness & Longitudinal Habit Components

### 3.1 `WellnessScoreGauge` (Radial / Donut Dial)
- **Props / State:** `scoreValue (e.g. 72 or 82)`, `maxScore = 100`, `categoryLabel = "Adecuado"`, `deltaWeek = "+8 pts"`.
- **Visuals:** Smooth radial arc gauge with centered score number and interpretive subtext.

### 3.2 `HabitTrackerGrid` & `HabitPill`
- **Props / State:** `habits = [{ key, label, target, completed, icon, progressPct }]`, `completedRatio = "3 de 5 completados"`.
- **Habits Tracked:** Dormir (Bed), Beber agua (Drop), Moverte (Shoe), Respirar (Lotus), Diario (Journal).
- **Visuals:** Rounded interactive buttons with completion checkmarks or partial circular progress rings.

### 3.3 `WeeklyProgressSparkline`
- **Props / State:** `weeklyData = [Mon..Sun]`, `averageScore`, `deltaVsLastWeek`.
- **Visuals:** 7-day smoothed SVG trend line with active day marker dot.

### 3.4 `MoodTrackerSpline`
- **Props / State:** `dailyMoodPoints = [{ date, valence (1..3), note }]`.
- **Visuals:** 14-day wave curve mapped across 3 valence tiers (Green Happy, Yellow Neutral, Rose Down) with date labels.

### 3.5 `RecommendationsList` & `RecommendationCard`
- **Props / State:** `recommendations = [{ id, title, description, category, tag, actionUrl }]`.
- **Items:** Respiración consciente (5 min), Manejo de ansiedad, Fortalece tu autoestima.
- **Visuals:** Interactive cards with category icons, "Recomendado" / "Nuevo" / "Popular" badges, and arrow click triggers.

---

## 4. Interactive Measurement & Intervention Tools (Modals / Overlays)

### 4.1 `GuidedBreathingTool` (4-7-8 & Coherence Modals)
- **Purpose:** Interactive 5-minute breathing pacer with expanding/contracting SVG circle, visual cue, and pre/post stress slider.
- **State:** `phase` (`Inhale (4s)`, `Hold (7s)`, `Exhale (8s)`), `cyclesCompleted`, `preStress`, `postStress`.

### 4.2 `CognitiveReframingJournal`
- **Purpose:** Guided 3-step reframing tool (1. Situation & automatic thought, 2. Cognitive distortion check, 3. Balanced perspective).
- **State:** `currentStep`, `promptText`, `userNotes`, `onSaveEntry`.

### 4.3 `QuickMoodCheckinModal`
- **Purpose:** One-tap daily mood and subjective energy logger accessible directly from topbar or quick actions.
