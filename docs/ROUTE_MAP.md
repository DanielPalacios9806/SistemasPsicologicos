# ROUTE MAP — MENTE DE ACERO

**Document Version:** 2.1.0  
**Architectural Contract:** Route $\to$ Screen $\to$ Component $\to$ Data Source $\to$ Database / API

---

## 1. Full Navigation & Data Source Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROUTE: /portal.html (or /dashboard)                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SCREEN: Main Home Dashboard ("Inicio") [Mockup Screen 3]                                                         │
│                                                                                                                  │
│ COMPONENT                      DATA SOURCE                         DATABASE TABLE / API ENDPOINT                 │
│ ────────────────────────────── ─────────────────────────────────── ─────────────────────────────────────────────│
│ AppSidebar                     Session context & Person metadata   GET /api/auth/me -> people, user_accounts     │
│ ConfidentialityBanner          Static Trust Content                Design System / Client-side Config            │
│ CurrentEvaluationCard          Active assignment in progress       GET /api/auth/me -> assessment_assignments    │
│ RecentResultsList              Latest completed applications       GET /api/applications -> final_results        │
│ WellnessScoreGauge (72/100)    Calculated Wellness Index           GET /api/wellness/summary -> habit_logs+score │
│ HabitTrackerGrid (3/5)         Today's logged habits               GET /api/habits/today -> wellness_habit_logs  │
│ WeeklyProgressSparkline        7-day wellness history              GET /api/wellness/history -> habit_logs       │
│ MoodTrackerSpline (14 days)    Daily mood valence logs             GET /api/mood/history -> daily_mood_logs      │
│ PersonalizedRecommendations    Scoring interpretation engine       GET /api/recommendations -> final_results    │
│ EmergencySupportBanner         Static 24/7 Crisis Hotline Data     Design System / Client-side Config            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROUTE: /results.html (or /portal.html#results)                                                                    │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SCREEN: Evaluations & Results Hub ("Evaluaciones y Resultados") [Mockup Screen 1]                                 │
│                                                                                                                  │
│ COMPONENT                      DATA SOURCE                         DATABASE TABLE / API ENDPOINT                 │
│ ────────────────────────────── ─────────────────────────────────── ─────────────────────────────────────────────│
│ HeroEvaluationCard             Primary Battery Metadata            GET /api/instruments -> lib/instruments       │
│ AssessmentProgressStepper      Active application step progress    GET /api/applications/:id -> applications    │
│ ActiveAssessmentsList          User assignments & completion %     GET /api/auth/me -> assessment_assignments    │
│ ComparativeRadarCard           Bar-On/EMA validated dimensions     GET /api/applications/:id -> partial_results  │
│ InterpretationInsightCard      Strengths & Opportunity Areas       GET /api/applications/:id -> final_results    │
│ PersonalizedRecommendations    Tailored growth activities          GET /api/recommendations -> final_results    │
│ ReportDownloadCard             Generated PDF Clinical Report       GET /api/reports/pdf/:id -> final_results     │
│ ConfidentialityFooterBanner    Institutional privacy statement     Static Design System Config                   │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROUTE: /index.html?instrument=:code                                                                              │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SCREEN: Stepped Assessment Runner ("Evaluación Activa")                                                          │
│                                                                                                                  │
│ COMPONENT                      DATA SOURCE                         DATABASE TABLE / API ENDPOINT                 │
│ ────────────────────────────── ─────────────────────────────────── ─────────────────────────────────────────────│
│ AssessmentTopBar               Active Instrument + Progress %      GET /api/instruments/:code                   │
│ QuestionCard / ItemGroup       Item prompt, Likert/DISC choices    GET /api/instruments/:code -> items          │
│ AutosaveStatusIndicator        Save state (Saving/Saved)           POST /api/applications/:id/answers            │
│ NavigationActions (Back/Next)  Step transitions & response cache   Client State + POST /api/applications/:id/ans │
│ ResultSummaryScreen            Calculated Profile & Dimensions     POST /api/applications/:id/answers -> final_r │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROUTE: /login.html                                                                                               │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SCREEN: Secure Authentication & Password Reset                                                                   │
│                                                                                                                  │
│ COMPONENT                      DATA SOURCE                         DATABASE TABLE / API ENDPOINT                 │
│ ────────────────────────────── ─────────────────────────────────── ─────────────────────────────────────────────│
│ LoginForm                      Cédula / Username + Password        POST /api/auth/login -> user_accounts         │
│ ChangePasswordModal            Current + New + Confirm Password    POST /api/auth/change-password -> user_accs   │
│ SecurityGuaranteeCallout       Confidentiality & encryption notice Static Trust Copy                             │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ ROUTE: /mobile (Mobile Viewport < 768px on any participant route)                                                │
├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ SCREEN: Mobile Mental Fitness App [Mockup Screen 2]                                                              │
│                                                                                                                  │
│ COMPONENT                      DATA SOURCE                         DATABASE TABLE / API ENDPOINT                 │
│ ────────────────────────────── ─────────────────────────────────── ─────────────────────────────────────────────│
│ MobileAppHeader                Greeting + Eagle Logo               GET /api/auth/me -> people                    │
│ CurrentEvaluationCard (82/100) Active status + Radial gauge        GET /api/wellness/summary + final_results     │
│ QuickActionGrid (4 buttons)    Interactive Tools Launchers         Client-side Tool Modals                       │
│ MobileHabitsRow (3/5)          Today's Habit completion icons      GET /api/habits/today -> wellness_habit_logs  │
│ MobileWeeklyChart              7-Day Wellness trend curve          GET /api/wellness/history -> wellness_habits  │
│ MobileMotivationalCard         Motivational snippet                Randomized clinical encouragement catalog     │
│ MobileBottomNavBar (5 tabs)    Navigation router                   Client-side SPA tab router                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```
