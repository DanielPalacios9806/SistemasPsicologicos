# Auditoría de Datos de Pantallas y Widgets: Mente de Acero V2

| Pantalla | Componente / Widget | Estado | Fuente de Datos | Tabla en Base de Datos | Observaciones |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Home** | `UserWelcomeHeader` | **REAL** | `GET /api/auth/me` | `user_accounts`, `people` | Muestra nombre real autenticado y rol. |
| **Home** | `CurrentEvaluationCard` | **REAL** | `GET /api/auth/me` | `assessment_assignments`, `applications` | Muestra la evaluación asignada activa y su % de avance. |
| **Home** | `RecentResultsCard` | **REAL** | `GET /api/auth/me` | `final_results`, `applications` | Lista evaluaciones completadas por el usuario. |
| **Home** | `HabitAdherenceGauge` | **DERIVED** | `GET /api/wellness/summary` | `wellness_habit_logs` | Ratio de hábitos completados en la semana (0–100%). |
| **Home** | `HabitsList` | **REAL** | `GET /api/habits/today` | `wellness_habit_logs` | Hábitos interactivos con toggle en tiempo real. |
| **Home** | `WeeklyProgressSparkline` | **DERIVED** | `GET /api/wellness/summary` | `wellness_habit_logs` | Tendencia de los últimos 7 días. |
| **Home** | `MoodSplineChart` | **REAL** | `GET /api/mood/history` | `daily_mood_logs` | Historial de 14 días de valencia afectiva. |
| **Home** | `RecommendationsList` | **DERIVED** | `getPersonalizedRecommendations()` | Motor de reglas local | Recomendaciones formativas sin diagnóstico clínico. |
| **Home** | `SupportHelplineBanner` | **REAL** | `GET /api/support-resources` | Configuración / Constante institucional | Línea telefónica 24/7 de orientación psicológica. |
| **Resultados** | `HeroEvaluationCard` | **REAL** | `GET /api/instruments/:code` | Catálogo de instrumentos | Permite iniciar la evaluación asignada. |
| **Resultados** | `EvaluationStepper` | **REAL** | `GET /api/applications/:id` | `applications` | Muestra el paso actual del flujo de respuesta (1 al 5). |
| **Resultados** | `ActiveEvaluationsList` | **REAL** | `GET /api/auth/me` | `assessment_assignments` | Muestra avance porcentual por instrumento. |
| **Resultados** | `RadarChart` | **REAL** | `GET /api/applications/:id` | `final_results` (Bar-On / EMA / DISC) | 5 ejes con las puntuaciones normalizadas reales del participante. |
| **Resultados** | `InsightsBlocks` | **REAL** | `finalResult.interpretationJson` | `final_results` | Fortalezas y áreas de oportunidad calculadas por el scoring psicométrico. |
| **Resultados** | `PdfReportDownload` | **REAL** | `generateReportPdf()` | Datos de la aplicación evaluada | Genera documento imprimible con ID de reporte. |
| **Mi Perfil** | `DecoupledEmaCard` | **REAL** | `GET /api/applications/:id` | `final_results` | 3 dimensiones EMA (Directa, No Asertiva, Indirecta). |
| **Mi Perfil** | `DecoupledBaronCard` | **REAL** | `GET /api/applications/:id` | `final_results` | 5 componentes de Cociente Emocional Bar-On. |
| **Mi Perfil** | `DecoupledDiscCard` | **REAL** | `GET /api/applications/:id` | `final_results` | Patrón conductual DISC sin mezclar con tests clínicos. |

---

## Directriz de Producción
1. **Cero valores fabricados:** Si un participante no cuenta con resultados previos, el sistema presenta un estado vacío (*Empty State*) invitándolo a iniciar su primera evaluación.
2. **Cero mezclas no autorizadas:** La puntuación de hábitos y el estado de ánimo no contaminan la trazabilidad de los instrumentos psicométricos estandarizados.
