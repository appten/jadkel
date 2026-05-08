import { api } from '../services/api.js';
import { renderHeader, renderFooter, bindHeader } from '../components.js';

export async function homePage(app) {
  // Load stats asynchronously for the hero counter
  let quickStats = { schedules: '—', rooms: '—', lecturers: '—' };
  
  app.innerHTML = renderHeader() + `
  <div class="hero">
    <div class="hero-glow"></div>
    <div class="container">
      <div class="hero-badge">📚 Platform Jadwal Akademik</div>
      <h1>Jadwal Kelas<br><span class="gradient">Kuliah</span></h1>
      <p>Eksplorasi jadwal mata kuliah, temukan slot kosong, dan cari ruangan yang tersedia dengan mudah dan cepat.</p>
      <div class="btn-group" style="justify-content:center;gap:1rem">
        <button class="btn btn-primary btn-lg" data-href="/jadwal">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Lihat Jadwal
        </button>
        <button class="btn btn-secondary btn-lg" data-href="/cari-ruang">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
          Cari Ruang Kosong
        </button>
      </div>
    </div>
  </div>
  
  <div class="page-content"><div class="container">
    <!-- Quick Stats -->
    <div class="stat-grid stat-grid-home fade-in" id="homeStats">
      <div class="stat-card stat-card-glow">
        <div class="stat-icon" style="background:rgba(99,102,241,.12);color:var(--primary-light)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div class="stat-value" id="hStatSchedules">—</div>
        <div class="stat-label">Total Jadwal</div>
      </div>
      <div class="stat-card stat-card-glow">
        <div class="stat-icon" style="background:rgba(6,182,212,.12);color:var(--accent)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
        </div>
        <div class="stat-value" id="hStatRooms">—</div>
        <div class="stat-label">Ruangan</div>
      </div>
      <div class="stat-card stat-card-glow">
        <div class="stat-icon" style="background:rgba(34,197,94,.12);color:var(--success)">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div class="stat-value" id="hStatLecturers">—</div>
        <div class="stat-label">Dosen Aktif</div>
      </div>
    </div>
    
    <!-- Feature Cards -->
    <div class="section"><h2 class="section-title" style="text-align:center;margin-bottom:1.5rem">Fitur Utama</h2>
    <div class="card-grid">
      <div class="card feature-card" data-href="/jadwal" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(99,102,241,.12);color:#a5b4fc">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <h3>Lihat Jadwal</h3><p>Jadwal lengkap per program studi, dosen, atau ruangan dengan tampilan tabel & timeline.</p>
        <span class="card-arrow">→</span>
      </div>
      <div class="card feature-card" data-href="/cari-slot" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(34,197,94,.12);color:#86efac">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3>Cari Jadwal Kosong</h3><p>Temukan waktu yang belum terisi untuk kegiatan tambahan atau belajar mandiri.</p>
        <span class="card-arrow">→</span>
      </div>
      <div class="card feature-card" data-href="/cari-ruang" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(6,182,212,.12);color:#67e8f9">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
        </div>
        <h3>Cari Ruang Kosong</h3><p>Lihat ruangan yang tersedia pada waktu tertentu beserta detail kapasitas.</p>
        <span class="card-arrow">→</span>
      </div>
      <div class="card feature-card" data-href="/statistik" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(245,158,11,.12);color:#fcd34d">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        </div>
        <h3>Statistik</h3><p>Lihat distribusi jadwal, okupansi ruangan, dan beban dosen dalam angka.</p>
        <span class="card-arrow">→</span>
      </div>
    </div></div>
  </div></div>` + renderFooter();
  bindHeader();

  // Load stats in background
  try {
    const semesters = await api.getSemesters();
    const activeSem = semesters.find(s => s.is_active) || semesters[0];
    if (activeSem) {
      const stats = await api.getStats(activeSem.id);
      document.getElementById('hStatSchedules').textContent = stats.total_schedules;
      document.getElementById('hStatRooms').textContent = stats.total_rooms;
      document.getElementById('hStatLecturers').textContent = stats.total_lecturers;
    }
  } catch(e) { /* ignore on home page */ }
}
