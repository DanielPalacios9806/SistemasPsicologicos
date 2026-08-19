/**
 * MENTE DE ACERO V2 — MAIN PARTICIPANT ENTRY POINT
 */

import { AppShell } from './components/appShell.js';

document.addEventListener('DOMContentLoaded', () => {
  const appRoot = document.getElementById('app');
  if (appRoot) {
    const shell = new AppShell(appRoot);
    shell.init();
  }
});
