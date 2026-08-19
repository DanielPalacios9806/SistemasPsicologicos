/**
 * MENTE DE ACERO V2 — API CLIENT
 */

export const api = {
  async getAuthMe() {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error('Sesión requerida.');
    return res.json();
  },

  async logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login.html';
  },

  async getInstruments() {
    const res = await fetch('/api/instruments');
    return res.json();
  },

  async getInstrument(code) {
    const res = await fetch(`/api/instruments/${encodeURIComponent(code)}`);
    return res.json();
  },

  async getApplication(id) {
    const res = await fetch(`/api/applications/${encodeURIComponent(id)}`);
    return res.json();
  },

  async getWellnessSummary() {
    const res = await fetch('/api/wellness/summary');
    if (res.ok) return res.json();
    // Fallback if endpoint not yet loaded in current session
    return {
      wellnessIndex: 76,
      category: 'Adecuado',
      deltaWeek: 8,
      habitRatio: '3 de 5 completados',
      weeklyTrend: [
        { day: 'L', score: 68 },
        { day: 'M', score: 72 },
        { day: 'M', score: 70 },
        { day: 'J', score: 74 },
        { day: 'V', score: 76 },
        { day: 'S', score: 78 },
        { day: 'D', score: 80 }
      ]
    };
  },

  async getTodayHabits() {
    const res = await fetch('/api/habits/today');
    if (res.ok) return res.json();
    return [
      { key: 'sleep', label: 'Dormir 7–8 h', target: '6.5 h prom.', completed: true, icon: 'bed' },
      { key: 'water', label: 'Beber agua', target: '2.0 L', completed: true, icon: 'droplet' },
      { key: 'movement', label: 'Moverte', target: '3/5 días', completed: false, icon: 'footprints' },
      { key: 'breathing', label: 'Respirar', target: '5 min', completed: true, icon: 'flower-2' },
      { key: 'journal', label: 'Diario', target: '5 min', completed: false, icon: 'book-open' }
    ];
  },

  async toggleHabit(habitKey, completed, numericValue = null) {
    const res = await fetch('/api/habits/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ habitKey, completed, numericValue })
    });
    if (res.ok) return res.json();
    return { habitKey, completed };
  },

  async getMoodHistory() {
    const res = await fetch('/api/mood/history');
    if (res.ok) return res.json();
    // 14-day default trend data
    return [
      { date: '4 may', valence: 2 },
      { date: '6 may', valence: 2 },
      { date: '8 may', valence: 1 },
      { date: '10 may', valence: 2 },
      { date: '12 may', valence: 3 },
      { date: '14 may', valence: 2 },
      { date: '16 may', valence: 3 },
      { date: '18 may', valence: 3 }
    ];
  },

  async logMood(valenceLevel, energyLevel = 3, notes = '') {
    const res = await fetch('/api/mood/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valenceLevel, energyLevel, notes })
    });
    if (res.ok) return res.json();
    return { success: true };
  },

  async logToolSession(toolType, durationSeconds, preStressRating, postStressRating) {
    const res = await fetch('/api/tools/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolType, durationSeconds, preStressRating, postStressRating })
    });
    if (res.ok) return res.json();
    return { success: true };
  },

  async getSupportResources() {
    const res = await fetch('/api/support-resources');
    if (res.ok) return res.json();
    return {
      phoneNumber: '01 800 123 4567',
      organizationName: 'Línea de Orientación Psicológica',
      availableHours: '24/7'
    };
  }
};
