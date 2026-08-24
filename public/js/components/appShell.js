/**
 * MENTE DE ACERO V2 - APP SHELL & ROUTER
 */

import { api } from '../core/api.js';
import { escapeHtml, getFirstName } from '../core/assessmentData.mjs';
import { renderHomeDashboard } from '../pages/homeDashboard.js';
import { renderResultsHub } from '../pages/resultsHub.js';
import { renderProfileView } from '../pages/profileView.js';
import { renderProgressView } from '../pages/progressView.js';

const ROUTES = {
  home: {
    title: 'Inicio',
    subtitle: 'Tu espacio de evaluación y desarrollo personal',
    render: renderHomeDashboard,
  },
  results: {
    title: 'Evaluaciones y resultados',
    subtitle: 'Consulta tus avances y resultados disponibles',
    render: renderResultsHub,
  },
  progress: {
    title: 'Mi progreso',
    subtitle: 'Seguimiento de evaluaciones asignadas',
    render: renderProgressView,
  },
  profile: {
    title: 'Mi perfil',
    subtitle: 'Tus perfiles psicológicos, separados por instrumento',
    render: renderProfileView,
  },
};

export class AppShell {
  constructor(rootElement) {
    this.root = rootElement;
    this.userData = null;
    this.activeRoute = 'home';
  }

  async init() {
    this.renderLoading();
    try {
      const auth = await api.getAuthMe();
      if (auth?.user?.role === 'admin' || auth?.user?.role === 'psychologist') {
        window.location.replace('/admin.html');
        return;
      }
      if (auth?.user?.mustChangePassword) {
        window.location.replace('/login.html?change=1');
        return;
      }
      const applicationPayload = await api.getMyApplications();
      this.userData = {
        ...auth,
        applications: applicationPayload?.applications || [],
      };
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        window.location.replace('/login.html');
        return;
      }
      this.renderFatalError(error);
      return;
    }

    this.render();
    this.setupRouting();
    this.navigate(window.location.hash.replace('#', '') || 'home');
  }

  renderLoading() {
    this.root.innerHTML = `
      <div class="portal-loading" role="status">
        <img src="/assets/mente-de-acero-logo-institucional.png" alt="" />
        <span>Cargando tu espacio seguro...</span>
      </div>
    `;
  }

  renderFatalError(error) {
    this.root.innerHTML = `
      <main class="portal-error-state">
        <img src="/assets/mente-de-acero-logo-institucional.png" alt="Mente de Acero" />
        <h1>No pudimos cargar tu portal</h1>
        <p>${escapeHtml(error?.message || 'Inténtalo nuevamente en unos momentos.')}</p>
        <button class="btn btn-navy" type="button" id="retryPortalBtn">
          <i data-lucide="refresh-cw"></i> Reintentar
        </button>
      </main>
    `;
    this.root.querySelector('#retryPortalBtn')?.addEventListener('click', () => window.location.reload());
    window.lucide?.createIcons();
  }

  render() {
    const person = this.userData?.user?.person || {};
    const safeName = escapeHtml(person.fullName || 'Participante');
    const initials = escapeHtml(
      person.fullName
        ? person.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
        : 'MA'
    );

    this.root.innerHTML = `
      <div class="app-shell">
        <aside class="app-sidebar">
          <div class="sidebar-top">
            <a href="#home" class="brand-lockup" aria-label="Ir al inicio">
              <img class="brand-emblem" src="/assets/mente-de-acero-logo-institucional.png" alt="" />
              <div class="brand-info">
                <span class="brand-name">MENTE <small>DE</small> ACERO</span>
                <span class="brand-tagline">Mente · Cuerpo · Espíritu</span>
              </div>
            </a>

            <div class="user-profile-badge">
              <div class="user-avatar">${initials}</div>
              <div class="user-meta">
                <span class="user-name">${safeName}</span>
                <span class="user-role">${escapeHtml(person.rankName || person.personnelCategory || 'Participante')}</span>
              </div>
            </div>

            <nav class="sidebar-nav" aria-label="Navegación principal">
              ${this.renderNavLinks('nav-link')}
            </nav>

            <div class="sidebar-motivational-card">
              <div class="card-head"><i data-lucide="shield-check"></i> Información protegida</div>
              <p>Tus respuestas son confidenciales y se muestran únicamente dentro de tu sesión.</p>
            </div>
          </div>

          <div class="sidebar-bottom">
            <p class="sidebar-privacy">Evaluación orientativa y de uso institucional.</p>
            <button class="logout-btn" id="sidebarLogoutBtn" type="button">
              <span>Cerrar sesión</span> <i data-lucide="log-out"></i>
            </button>
          </div>
        </aside>

        <main class="app-main">
          <header class="app-topbar">
            <a href="#home" class="mobile-brand" aria-label="Mente de Acero">
              <img src="/assets/mente-de-acero-logo-institucional.png" alt="" />
              <span>MENTE <strong>DE ACERO</strong></span>
            </a>
            <div class="topbar-heading">
              <h1 id="pageTitle">Inicio</h1>
              <p id="pageSubtitle">Tu espacio de evaluación y desarrollo personal</p>
            </div>
            <div class="topbar-user" title="Sesión activa">
              <div class="user-avatar">${initials}</div>
              <div>
                <span>Hola, ${escapeHtml(getFirstName(person.fullName))}</span>
                <small>Sesión segura</small>
              </div>
            </div>
          </header>

          <div class="content-container" id="pageContentContainer" aria-live="polite"></div>
        </main>

        <nav class="mobile-bottom-bar" aria-label="Navegación móvil">
          <div class="mobile-nav-items">
            ${this.renderNavLinks('mobile-nav-link', true)}
          </div>
        </nav>
      </div>
    `;

    this.root.querySelector('#sidebarLogoutBtn')?.addEventListener('click', () => api.logout());
    window.lucide?.createIcons();
  }

  renderNavLinks(className, mobile = false) {
    const links = [
      ['home', 'home', 'Inicio'],
      ['evaluations', 'clipboard-list', mobile ? 'Evaluar' : 'Evaluaciones'],
      ['results', 'bar-chart-3', 'Resultados'],
      ['progress', 'trending-up', 'Progreso'],
      ['profile', 'user-round', 'Perfil'],
    ];
    return links.map(([route, icon, label]) => {
      const href = route === 'evaluations' ? '/index.html' : `#${route}`;
      const routeAttribute = route === 'evaluations' ? '' : ` data-route="${route}"`;
      return `
        <a href="${href}" class="${className}${route === 'home' ? ' active' : ''}"${routeAttribute}>
          <i data-lucide="${icon}"></i><span>${label}</span>
        </a>
      `;
    }).join('');
  }

  setupRouting() {
    window.addEventListener('hashchange', () => {
      this.navigate(window.location.hash.replace('#', '') || 'home');
    });
  }

  async navigate(requestedRoute) {
    const route = ROUTES[requestedRoute] ? requestedRoute : 'home';
    this.activeRoute = route;
    const container = document.getElementById('pageContentContainer');
    if (!container) return;

    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach((element) => {
      element.classList.toggle('active', element.dataset.route === route);
    });

    const config = ROUTES[route];
    document.getElementById('pageTitle').textContent = config.title;
    document.getElementById('pageSubtitle').textContent = config.subtitle;
    container.innerHTML = '<div class="view-loading"><span></span> Cargando información...</div>';

    try {
      await config.render(container, this.userData);
    } catch (error) {
      container.innerHTML = `
        <div class="empty-state page-error">
          <i data-lucide="triangle-alert"></i>
          <h2>No pudimos mostrar esta sección</h2>
          <p>${escapeHtml(error?.message || 'Actualiza la página para volver a intentarlo.')}</p>
        </div>
      `;
      window.lucide?.createIcons();
    }
  }
}
