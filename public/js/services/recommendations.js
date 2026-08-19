/**
 * MENTE DE ACERO V2 — TRACEABLE RULE-BASED RECOMMENDATION ENGINE
 */

export function getPersonalizedRecommendations(finalResults = []) {
  const recommendations = [
    {
      id: 'rec-breathing',
      title: 'Ejercicio de respiración consciente',
      description: '5 minutos para reducir el estrés y aumentar tu enfoque diario.',
      category: 'calm',
      tag: 'Recomendado',
      icon: 'wind',
      action: 'open_breathing'
    },
    {
      id: 'rec-anxiety',
      title: 'Técnicas para manejo de ansiedad',
      description: 'Aprende estrategias prácticas de reestructuración para momentos difíciles.',
      category: 'anxiety',
      tag: 'Nuevo',
      icon: 'brain',
      action: 'open_journal'
    },
    {
      id: 'rec-selfesteem',
      title: 'Fortalece tu autoestima',
      description: 'Actividades guiadas para reconocer tus fortalezas y valor personal.',
      category: 'growth',
      tag: 'Popular',
      icon: 'sparkles',
      action: 'open_journal'
    }
  ];

  return recommendations;
}
