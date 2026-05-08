import { api } from './services/api.js';
import { DAYS } from './utils/constants.js';

// ── Toast ──
export function toast(msg, type = 'success') {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-exit'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Confirmation Modal (replaces native confirm) ──
export function showConfirm(message, { title = 'Konfirmasi', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal', danger = false } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `<div class="modal confirm-modal">
      <div class="confirm-icon ${danger ? 'danger' : ''}">${danger ? '⚠' : '?'}</div>
      <h3>${title}</h3>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;font-size:.9rem">${message}</p>
      <div class="btn-group" style="justify-content:stretch;gap:.75rem">
        <button class="btn btn-secondary" style="flex:1;justify-content:center" id="confirmCancel">${cancelText}</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" style="flex:1;justify-content:center" id="confirmOk">${confirmText}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('#confirmOk').addEventListener('click', () => { overlay.remove(); resolve(true); });
    overlay.querySelector('#confirmCancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
    overlay.addEventListener('click', e => { if (e.target === overlay) { overlay.remove(); resolve(false); } });
  });
}

// ── Header ──
export function renderHeader() {
  const logged = api.isLoggedIn();
  return `<header class="header"><div class="header-inner">
    <a class="logo" data-href="/"><div class="logo-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="10" y1="14" x2="14" y2="14"/><line x1="10" y1="18" x2="14" y2="18"/></svg></div><span>JadKel</span></a>
    <button class="mobile-toggle" id="menuToggle" aria-label="Toggle menu">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
    <nav class="nav" id="mainNav">
      <a class="nav-link" data-href="/">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
        Beranda
      </a>
      <a class="nav-link" data-href="/jadwal">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Jadwal
      </a>
      <a class="nav-link" data-href="/jadwalku">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        Jadwalku
      </a>
      <a class="nav-link" data-href="/cari-slot">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Cari Slot
      </a>
      <a class="nav-link" data-href="/cari-ruang">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><line x1="9" y1="9" x2="9" y2="9.01"/><line x1="9" y1="13" x2="9" y2="13.01"/><line x1="9" y1="17" x2="9" y2="17.01"/></svg>
        Cari Ruang
      </a>
      <a class="nav-link" data-href="/statistik">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Statistik
      </a>
      <a class="nav-link nav-link-admin" data-href="${logged ? '/admin' : '/login'}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">${logged
          ? '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
          : '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'}
        </svg>
        ${logged ? 'Admin' : 'Login'}
      </a>
    </nav>
  </div></header>`;
}

export function renderFooter() {
  return `<footer class="footer"><div class="container">
    <div class="footer-brand">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:.5rem;opacity:.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      JadKel
    </div>
    <p>Platform Jadwal Kelas Kuliah &copy; ${new Date().getFullYear()}</p>
  </div></footer>`;
}

export function bindHeader() {
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('mainNav')?.classList.toggle('open');
  });
}

// ── Jadwalku Storage ──
export function getMySchedules() { return JSON.parse(localStorage.getItem('my_schedules') || '[]'); }
export function addMySchedule(s) {
  const cur = getMySchedules();
  if(!cur.find(x => x.id === s.id)) { cur.push(s); localStorage.setItem('my_schedules', JSON.stringify(cur)); }
}
export function removeMySchedule(id) {
  const cur = getMySchedules().filter(x => x.id != id);
  localStorage.setItem('my_schedules', JSON.stringify(cur));
}

// ── Google Calendar Helper ──
export function getNextDayDate(dayIndex, timeStr) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  const currentDay = d.getDay();
  const targetDay = dayIndex + 1;
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

// ── Loading skeleton ──
export function skeleton(rows = 5) {
  return `<div class="skeleton-wrap">${Array(rows).fill('').map(() => '<div class="skeleton-row"><div class="skeleton-line w60"></div><div class="skeleton-line w40"></div></div>').join('')}</div>`;
}
