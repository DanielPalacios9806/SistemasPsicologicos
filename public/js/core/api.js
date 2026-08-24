/**
 * MENTE DE ACERO V2 - API CLIENT
 */

async function request(url, options) {
  const response = await fetch(url, options);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.error || 'No se pudo completar la solicitud.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

export const api = {
  getAuthMe() {
    return request('/api/auth/me');
  },

  getMyApplications() {
    return request('/api/me/applications');
  },

  async logout() {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.replace('/login.html');
    }
  },

  getInstruments() {
    return request('/api/instruments');
  },

  getInstrument(code) {
    return request(`/api/instruments/${encodeURIComponent(code)}`);
  },

  getApplication(id) {
    return request(`/api/applications/${encodeURIComponent(id)}`);
  },
};
