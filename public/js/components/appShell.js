/**
 * MENTE DE ACERO V2 — APP SHELL & ROUTER COMPONENT
 */

import { api } from '../core/api.js';
import { renderHomeDashboard } from '../pages/homeDashboard.js';
import { renderResultsHub } from '../pages/resultsHub.js';
import { renderProfileView } from '../pages/profileView.js';

export class AppShell {
  constructor(rootElement) {
    this.root = rootElement;
    this.userData = null;
    this.activeRoute = 'home';
  }

  async init() {
    try {
      this.userData = await api.getAuthMe();
      if (this.userData?.user?.mustChangePassword) {
        window.location.href = '/login.html?change=1';
        return;
      }
    } catch {
      this.userData = {
        user: {
          username: 'participante.demo',
          role: 'participant',
          person: {
            fullName: 'Alex Rivera Mendoza',
            idNumber: '1723456789',
            rankName: 'Participante'
          }
        },
        assignments: [
          {
            instrumentCode: 'baron',
            instrumentName: 'Inventario de Cociente Emocional Bar-On ICE',
            status: 'in_progress',
            percentageComplete: 65
          },
          {
            instrumentCode: 'ema',
            instrumentName: 'Escala de Asertividad EMA',
            status: 'completed',
            percentageComplete: 100
          },
          {
            instrumentCode: 'disc',
            instrumentName: 'Perfil Conductual DISC',
            status: 'completed',
            percentageComplete: 100
          }
        ]
      };
    }
    this.render();
    this.setupRouting();
    this.navigate(window.location.hash.replace('#', '') || 'home');
  }

  render() {
    const person = this.userData?.user?.person || {};
    const initials = person.fullName
      ? person.fullName.split(' ').map((p) => p[0]).slice(0, 2).join('')
      : 'MA';

    this.root.innerHTML = `
      <div class="app-shell">
        <!-- DESKTOP SIDEBAR -->
        <aside class="app-sidebar">
          <div class="sidebar-top">
            <a href="#home" class="brand-lockup">
              <div class="brand-mark"><i data-lucide="shield"></i></div>
              <div class="brand-info">
                <span class="brand-name">MENTE DE ACERO</span>
                <span class="brand-tagline">Evaluación & Bienestar</span>
              </div>
            </a>

            <!-- User Profile Badge -->
            <div class="user-profile-badge">
              <div class="user-avatar">${initials}</div>
              <div class="user-meta">
                <span class="user-name">${person.fullName || 'Participante'}</span>
                <span class="user-role">${person.rankName || 'Participante'}</span>
              </div>
            </div>

            <!-- Navigation Links -->
            <nav class="sidebar-nav">
              <a href="#home" class="nav-link active" data-route="home">
                <i data-lucide="home"></i> <span>Inicio</span>
              </a>
              <a href="#results" class="nav-link" data-route="results">
                <i data-lucide="bar-chart-2"></i> <span>Resultados</span>
              </a>
              <a href="#profile" class="nav-link" data-route="profile">
                <i data-lucide="user"></i> <span>Mi Perfil</span>
              </a>
              <a href="#habits" class="nav-link" data-route="habits">
                <i data-lucide="heart"></i> <span>Hábitos & Progreso</span>
              </a>
              <a href="/index.html" class="nav-link">
                <i data-lucide="clipboard-list"></i> <span>Evaluaciones</span>
              </a>
            </nav>

            <!-- Motivational Card -->
            <div class="sidebar-motivational-card">
              <div class="card-head"><i data-lucide="sparkles"></i> Mente Fuerte</div>
              <p>Tu bienestar mental es tu mayor fortaleza. Sigue evaluándote y conoce tu evolución.</p>
            </div>
          </div>

          <!-- Sidebar Footer -->
          <div class="sidebar-bottom">
            <div class="sidebar-links">
              <a href="#">Ayuda</a> · <a href="#">Privacidad</a> · <a href="#">Términos</a>
            </div>
            <button class="logout-btn" id="sidebarLogoutBtn">
              <span>Cerrar sesión</span> <i data-lucide="log-out"></i>
            </button>
          </div>
        </aside>

        <!-- MAIN VIEWPORT -->
        <main class="app-main">
          <header class="app-topbar">
            <div class="topbar-heading">
              <h1 id="pageTitle">Inicio</h1>
              <p id="pageSubtitle">Plataforma de evaluación y bienestar psicológico</p>
            </div>
            <div class="topbar-actions">
              <button class="icon-badge-btn" title="Notificaciones" aria-label="Notificaciones">
                <i data-lucide="bell"></i>
                <span class="badge-dot"></span>
              </button>
              <button class="topbar-btn" id="helpCenterBtn">
                <i data-lucide="help-circle"></i> <span>Centro de ayuda</span>
              </button>
            </div>
          </header>

          <div class="content-container" id="pageContentContainer">
            <!-- Dynamic page view injected here -->
          </div>
        </main>

        <!-- MOBILE BOTTOM NAVIGATION (SCREEN 2) -->
        <nav class="mobile-bottom-bar" aria-label="Navegación móvil">
          <div class="mobile-nav-items">
            <a href="#home" class="mobile-nav-link active" data-route="home">
              <i data-lucide="home"></i> <span>Inicio</span>
            </a>
            <a href="#results" class="mobile-nav-link" data-route="results">
              <i data-lucide="bar-chart-2"></i> <span>Resultados</span>
            </a>
            <a href="/index.html" class="mobile-nav-link">
              <i data-lucide="clipboard-list"></i> <span>Test</span>
            </a>
            <a href="#habits" class="mobile-nav-link" data-route="habits">
              <i data-lucide="trending-up"></i> <span>Progreso</span>
            </a>
            <a href="#profile" class="mobile-nav-link" data-route="profile">
              <i data-lucide="user"></i> <span>Perfil</span>
            </a>
          </div>
        </nav>
      </div>
    `;

    // Logout trigger
    this.root.querySelector('#sidebarLogoutBtn')?.addEventListener('click', () => api.logout());
    this.root.querySelector('#helpCenterBtn')?.addEventListener('click', () => {
      alert('Centro de ayuda Mente de Acero: Acceso a guías psicométricas, soporte técnico y línea de orientación psicológica 24/7 (01 800 123 4567).');
    });

    if (window.lucide) window.lucide.createIcons();
  }

  setupRouting() {
    window.addEventListener('hashchange', () => {
      const route = window.location.hash.replace('#', '') || 'home';
      this.navigate(route);
    });
  }

  navigate(route) {
    this.activeRoute = route;
    const container = document.getElementById('pageContentContainer');
    if (!container) return;

    // Update active nav link classes
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach((el) => {
      if (el.dataset.route === route) el.classList.add('active');
      else el.classList.remove('active');
    });

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    if (route === 'results') {
      if (pageTitle) pageTitle.textContent = 'Evaluaciones y Resultados';
      if (pageSubtitle) pageSubtitle.textContent = 'Conócete mejor. Entrena tu mente. Fortalece tu vida.';
      renderResultsHub(container, this.userData);
    } else if (route === 'profile') {
      if (pageTitle) pageTitle.textContent = 'Mi Perfil';
      if (pageSubtitle) pageSubtitle.textContent = 'Dimensiones e indicadores psicológicos personales';
      renderProfileView(container, this.userData);
    } else if (route === 'habits') {
      if (pageTitle) pageTitle.textContent = 'Hábitos & Progreso';
      if (pageSubtitle) pageSubtitle.textContent = 'Seguimiento diario de bienestar y autorregulación';
      renderHomeDashboard(container, this.userData);
    } else {
      // Default: 'home'
      if (pageTitle) pageTitle.textContent = 'Inicio';
      if (pageSubtitle) pageSubtitle.textContent = 'Plataforma de evaluación y bienestar psicológico';
      renderHomeDashboard(container, this.userData);
    }
  }
}
