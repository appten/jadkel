import { api } from './services/api.js';
import { registerRoute, handleRoute, navigate } from './router.js';
import { DAYS, DAY_COLORS } from './utils/constants.js';

const TIME_LABELS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

function renderFooter() {
  return `<footer class="footer"><div class="container">
    <div class="footer-brand">JadKel</div>
    <p>Platform Jadwal Kelas Kuliah &copy; ${new Date().getFullYear()}</p>
  </div></footer>`;
}

// ── Toast ──
function toast(msg, type = 'success') {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Header ──
function renderHeader() {
  const logged = api.isLoggedIn();
  return `<header class="header"><div class="header-inner">
    <a class="logo" data-href="/"><div class="logo-icon">J</div>JadKel</a>
    <button class="mobile-toggle" id="menuToggle">☰</button>
    <nav class="nav" id="mainNav">
      <a class="nav-link" data-href="/">Beranda</a>
      <a class="nav-link" data-href="/jadwal">Jadwal</a>
      <a class="nav-link" data-href="/jadwalku">Jadwalku</a>
      <a class="nav-link" data-href="/cari-slot">Cari Slot Kosong</a>
      <a class="nav-link" data-href="/cari-ruang">Cari Ruang</a>
      <a class="nav-link" data-href="/statistik">Statistik</a>
      <a class="nav-link" data-href="${logged ? '/admin' : '/login'}">${logged ? '⚙ Admin' : '🔒 Login'}</a>
    </nav>
  </div></header>`;
}

function bindHeader() {
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('mainNav')?.classList.toggle('open');
  });
}

// ── Jadwalku Storage ──
function getMySchedules() { return JSON.parse(localStorage.getItem('my_schedules') || '[]'); }
function addMySchedule(s) {
  const cur = getMySchedules();
  if(!cur.find(x => x.id === s.id)) { cur.push(s); localStorage.setItem('my_schedules', JSON.stringify(cur)); }
}
function removeMySchedule(id) {
  const cur = getMySchedules().filter(x => x.id != id);
  localStorage.setItem('my_schedules', JSON.stringify(cur));
}
function getNextDayDate(dayIndex, timeStr) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  const currentDay = d.getDay(); // 0=Sun, 1=Mon
  const targetDay = dayIndex + 1;
  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() + diff);
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d.toISOString().replace(/-|:|\.\d\d\d/g, '');
}

// ── Home Page ──
function homePage(app) {
  app.innerHTML = renderHeader() + `<div class="hero"><div class="container">
    <h1>Jadwal Kelas <span class="gradient">Kuliah</span></h1>
    <p>Eksplorasi jadwal mata kuliah, temukan slot kosong, dan cari ruangan yang tersedia dengan mudah.</p>
    <div class="btn-group" style="justify-content:center">
      <button class="btn btn-primary" data-href="/jadwal">📅 Lihat Jadwal</button>
      <button class="btn btn-secondary" data-href="/cari-ruang">🏢 Cari Ruang Kosong</button>
    </div>
  </div></div>
  <div class="page-content"><div class="container">
    <div class="section"><h2 class="section-title" style="text-align:center;margin-bottom:1.5rem">Fitur Utama</h2>
    <div class="card-grid">
      <div class="card" data-href="/jadwal" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(99,102,241,.12);color:#a5b4fc">📅</div>
        <h3>Lihat Jadwal</h3><p>Jadwal lengkap per program studi, dosen, atau ruangan.</p></div>
      <div class="card" data-href="/cari-slot" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(34,197,94,.12);color:#86efac">🕐</div>
        <h3>Cari Jadwal Kosong</h3><p>Temukan waktu yang belum terisi untuk kegiatan tambahan.</p></div>
      <div class="card" data-href="/cari-ruang" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(6,182,212,.12);color:#67e8f9">🏢</div>
        <h3>Cari Ruang Kosong</h3><p>Lihat ruangan yang tersedia pada waktu tertentu.</p></div>
      <div class="card" data-href="/statistik" style="cursor:pointer">
        <div class="card-icon" style="background:rgba(245,158,11,.12);color:#fcd34d">📊</div>
        <h3>Statistik</h3><p>Lihat distribusi jadwal, okupansi ruangan, dan beban dosen.</p></div>
    </div></div>
  </div></div>` + renderFooter();
  bindHeader();
}

// ── Jadwal Page ──
async function jadwalPage(app) {
  let viewMode = 'table';
  app.innerHTML = renderHeader() + `<div class="page-content"><div class="container">
    <div class="section-header"><div><h1 class="section-title">📅 Jadwal Kelas</h1>
    <p class="section-subtitle">Lihat jadwal mata kuliah per semester</p></div>
    <div class="view-toggle" id="viewToggle">
      <button class="active" data-view="table">📋 Tabel</button>
      <button data-view="timeline">🗓 Timeline</button>
    </div></div>
    <div class="filters-bar" id="filters">
      <div class="form-group"><label class="form-label">Semester</label><select class="form-select" id="fSemester"><option value="">Memuat...</option></select></div>
      <div class="form-group"><label class="form-label">Program Studi</label><select class="form-select" id="fProgram"><option value="">Semua Prodi</option></select></div>
      <div class="form-group"><label class="form-label">Hari</label><select class="form-select" id="fDay"><option value="">Semua Hari</option>${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Cari</label><input class="form-input" id="fSearch" placeholder="Nama MK / Dosen..."></div>
    </div>
    <div id="scheduleResult"><div class="spinner"></div></div>
    
    <div class="modal-overlay" id="detailModal"><div class="modal">
      <div class="modal-header"><h2 id="dTitle">Detail Jadwal</h2><button class="modal-close" id="closeDModal">✕</button></div>
      <div id="dContent" style="margin-bottom:1.5rem; line-height: 1.6;"></div>
      <div class="btn-group" style="justify-content:stretch">
        <button class="btn btn-primary" id="btnJadwalku" style="flex:1"></button>
        <a class="btn btn-secondary" id="btnGCal" target="_blank" style="flex:1;text-align:center">📅 Google Calendar</a>
      </div>
    </div></div>
  </div></div>` + renderFooter();
  bindHeader();

  const [semesters, programs] = await Promise.all([api.getSemesters(), api.getPrograms()]);
  const selSem = document.getElementById('fSemester');
  const selProg = document.getElementById('fProgram');
  selSem.innerHTML = semesters.map(s => `<option value="${s.id}" ${s.is_active?'selected':''}>${s.name}</option>`).join('');
  selProg.innerHTML = `<option value="">Semua Prodi</option>` + programs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  let currentSchedules = [];

  async function loadSchedules() {
    const params = {};
    if (selSem.value) params.semester = selSem.value;
    if (selProg.value) params.program = selProg.value;
    const dayVal = document.getElementById('fDay').value;
    if (dayVal !== '') params.day = dayVal;
    const searchVal = document.getElementById('fSearch').value;

    if (searchVal && searchVal.length >= 2) {
      currentSchedules = await api.search(searchVal, params.semester);
    } else {
      currentSchedules = await api.getSchedules(params);
    }
    renderScheduleTable(currentSchedules);
  }

  function renderScheduleTable(data) {
    const el = document.getElementById('scheduleResult');
    if (!data.length) { el.innerHTML = '<p class="loading-text">Tidak ada jadwal ditemukan.</p>'; return; }
    if (viewMode === 'timeline') { renderTimeline(data, el); return; }
    el.innerHTML = `<p style="margin-bottom:.75rem;color:var(--text-muted);font-size:.8rem">${data.length} jadwal ditemukan</p>
    <div class="schedule-table-wrap"><table class="schedule-table table-hover">
      <thead><tr><th>Hari</th><th>Waktu</th><th>Kode</th><th>Mata Kuliah</th><th>Kelas</th><th>SKS</th><th>Dosen</th><th>Ruang</th><th>Prodi</th></tr></thead>
      <tbody>${data.map(s => `<tr class="clickable-row" data-id="${s.id}" style="cursor:pointer" title="Klik untuk detail">
        <td><span class="day-badge day-${s.day}">${DAYS[s.day]}</span></td>
        <td><span class="time-badge">${s.time_start} - ${s.time_end}</span></td>
        <td>${s.course_code}</td><td><strong>${s.course_name}</strong></td>
        <td>${s.class_group}</td><td>${s.sks}</td>
        <td>${s.lecturer_title ? s.lecturer_title + ' ' : ''}${s.lecturer_name}</td>
        <td>${s.room_code}</td><td><span class="day-badge day-${(s.course_code||'').charCodeAt(0)%6}">${s.program_code}</span></td>
      </tr>`).join('')}</tbody></table></div>`;
  }

  function renderTimeline(data, el) {
    const header = `<div class="timeline-header"></div>` + DAYS.map((d,i) => `<div class="timeline-header"><span class="day-badge day-${i}">${d}</span></div>`).join('');
    let rows = '';
    TIME_LABELS.forEach(time => {
      rows += `<div class="timeline-time">${time}</div>`;
      for (let d = 0; d < 6; d++) {
        const ev = data.find(s => s.day === d && s.time_start <= time && s.time_end > time);
        if (ev) {
          rows += `<div class="timeline-cell"><div class="timeline-event clickable-row" data-id="${ev.id}" data-day="${d}" style="cursor:pointer" title="Klik untuk detail"><div class="ev-course">${ev.course_code}</div><div class="ev-detail">${ev.room_code} • ${ev.class_group}</div></div></div>`;
        } else {
          rows += `<div class="timeline-cell"></div>`;
        }
      }
    });
    el.innerHTML = `<div class="timeline-grid">${header}${rows}</div>`;
  }

  selSem.addEventListener('change', loadSchedules);
  selProg.addEventListener('change', loadSchedules);
  document.getElementById('fDay').addEventListener('change', loadSchedules);
  let debounce;
  document.getElementById('fSearch').addEventListener('input', () => { clearTimeout(debounce); debounce = setTimeout(loadSchedules, 300); });
  document.getElementById('viewToggle')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-view]');
    if (!btn) return;
    viewMode = btn.dataset.view;
    document.querySelectorAll('#viewToggle button').forEach(b => b.classList.toggle('active', b === btn));
    loadSchedules();
  });
  
  app.addEventListener('click', e => {
    const row = e.target.closest('.clickable-row');
    if (row && row.dataset.id && app.contains(row)) {
      const s = currentSchedules.find(x => x.id == row.dataset.id);
      if(!s) return;
      document.getElementById('dTitle').textContent = s.course_name;
      document.getElementById('dContent').innerHTML = `
        <p><strong>Dosen:</strong> ${s.lecturer_title ? s.lecturer_title + ' ' : ''}${s.lecturer_name}</p>
        <p><strong>Waktu:</strong> ${DAYS[s.day]}, ${s.time_start} - ${s.time_end}</p>
        <p><strong>Ruang:</strong> ${s.room_code}</p>
        <p><strong>Kelas / SKS:</strong> ${s.class_group} / ${s.sks} SKS</p>
        <p><strong>Program Studi:</strong> ${s.program_name || s.program_code}</p>
      `;
      const btnJadwalku = document.getElementById('btnJadwalku');
      const isSaved = getMySchedules().find(x => x.id == s.id);
      btnJadwalku.textContent = isSaved ? 'Hapus dari Jadwalku' : '+ Tambah ke Jadwalku';
      btnJadwalku.className = isSaved ? 'btn btn-danger' : 'btn btn-primary';
      btnJadwalku.onclick = () => {
        if(isSaved) { removeMySchedule(s.id); toast('Dihapus dari Jadwalku'); }
        else { addMySchedule(s); toast('Ditambahkan ke Jadwalku!'); }
        document.getElementById('detailModal').classList.remove('active');
      };
      
      const year = new Date().getFullYear();
      const gcalDetails = `Mata Kuliah: ${s.course_name}\nKelas: ${s.class_group}\nSKS: ${s.sks}\nDosen: ${s.lecturer_title ? s.lecturer_title + ' ' : ''}${s.lecturer_name}\nRuangan: ${s.room_code}\nProgram Studi: ${s.program_name || s.program_code}\n\n© JadKel - ${year}`;
      const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(s.course_name + ' (Kelas ' + s.class_group + ')')}&dates=${getNextDayDate(s.day, s.time_start)}/${getNextDayDate(s.day, s.time_end)}&details=${encodeURIComponent(gcalDetails)}&location=${encodeURIComponent(s.room_code)}`;
      document.getElementById('btnGCal').href = gcalUrl;
      
      document.getElementById('detailModal').classList.add('active');
    }
  });
  document.getElementById('closeDModal')?.addEventListener('click', () => document.getElementById('detailModal').classList.remove('active'));

  loadSchedules();
}

// ── Cari Slot Kosong ──
async function cariSlotPage(app) {
  app.innerHTML = renderHeader() + `<div class="page-content"><div class="container">
    <div class="section-header"><div><h1 class="section-title">🕐 Cari Slot Kosong</h1>
    <p class="section-subtitle">Temukan waktu yang belum terisi jadwal</p></div></div>
    <div class="filters-bar">
      <div class="form-group"><label class="form-label">Semester</label><select class="form-select" id="sSemester"><option>Memuat...</option></select></div>
      <div class="form-group"><label class="form-label">Hari</label><select class="form-select" id="sDay"><option value="">Semua Hari</option>${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Program Studi</label><select class="form-select" id="sProgram"><option value="">Semua</option></select></div>
      <div class="form-group" style="display:flex;align-items:end"><button class="btn btn-primary" id="sSearch">🔍 Cari</button></div>
    </div>
    <div id="slotResult"><p class="loading-text">Pilih filter lalu klik Cari.</p></div>
  </div></div>`;
  bindHeader();

  const [semesters, programs] = await Promise.all([api.getSemesters(), api.getPrograms()]);
  document.getElementById('sSemester').innerHTML = semesters.map(s => `<option value="${s.id}" ${s.is_active?'selected':''}>${s.name}</option>`).join('');
  document.getElementById('sProgram').innerHTML = `<option value="">Semua</option>` + programs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  document.getElementById('sSearch').addEventListener('click', async () => {
    const params = { semester: document.getElementById('sSemester').value };
    const day = document.getElementById('sDay').value;
    const prog = document.getElementById('sProgram').value;
    if (day !== '') params.day = day;
    if (prog) params.program = prog;
    document.getElementById('slotResult').innerHTML = '<div class="spinner"></div>';
    const slots = await api.findEmptySlots(params);
    if (!slots.length) { document.getElementById('slotResult').innerHTML = '<p class="loading-text">Tidak ada slot kosong ditemukan.</p>'; return; }
    // Group by day
    const grouped = {};
    slots.forEach(s => { if (!grouped[s.day]) grouped[s.day] = []; grouped[s.day].push(s); });
    document.getElementById('slotResult').innerHTML = Object.entries(grouped).map(([day, items]) =>
      `<div class="section"><h3 style="margin-bottom:.75rem"><span class="day-badge day-${day}">${DAYS[day]}</span></h3>
      <div class="slot-grid">${items.map(s => `<div class="slot-card available">✓ ${s.time_start} - ${s.time_end}</div>`).join('')}</div></div>`
    ).join('');
  });
}

// ── Statistik Page ──
async function statistikPage(app) {
  app.innerHTML = renderHeader() + `<div class="page-content"><div class="container">
    <div class="section-header"><div><h1 class="section-title">📊 Statistik</h1>
    <p class="section-subtitle">Insight jadwal semester aktif</p></div>
    <select class="form-select" id="stSemester" style="width:auto"><option>Memuat...</option></select></div>
    <div id="statsContent"><div class="spinner"></div></div>
  </div></div>` + renderFooter();
  bindHeader();
  const semesters = await api.getSemesters();
  const sel = document.getElementById('stSemester');
  sel.innerHTML = semesters.map(s => `<option value="${s.id}" ${s.is_active?'selected':''}>${s.name}</option>`).join('');
  async function load() {
    document.getElementById('statsContent').innerHTML = '<div class="spinner"></div>';
    const stats = await api.getStats(sel.value);
    const maxDay = Math.max(...(stats.by_day||[]).map(d=>d.count), 1);
    const maxRoom = Math.max(...(stats.by_room||[]).map(r=>r.usage_count), 1);
    document.getElementById('statsContent').innerHTML = `
      <div class="stat-grid fade-in">
        <div class="stat-card"><div class="stat-value">${stats.total_schedules}</div><div class="stat-label">Total Jadwal</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_courses}</div><div class="stat-label">Mata Kuliah</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_lecturers}</div><div class="stat-label">Dosen Aktif</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_rooms}</div><div class="stat-label">Ruangan Terpakai</div></div>
      </div>
      <div class="section fade-in fade-in-delay-1"><h3 style="margin-bottom:1rem">📅 Distribusi per Hari</h3>
      <div class="card" style="padding:1.5rem"><div class="bar-chart">
        ${(stats.by_day||[]).map((d,i) => `<div class="bar-item">
          <div class="bar-value">${d.count}</div>
          <div class="bar-fill" style="height:${(d.count/maxDay)*100}%;background:${DAY_COLORS[d.day]}"></div>
          <div class="bar-label">${d.day_name}</div>
        </div>`).join('')}
      </div></div></div>
      <div class="section fade-in fade-in-delay-2"><h3 style="margin-bottom:1rem">🏢 Penggunaan Ruangan</h3>
      <div class="card" style="padding:1.5rem"><div class="bar-chart">
        ${(stats.by_room||[]).slice(0,10).map((r,i) => `<div class="bar-item">
          <div class="bar-value">${r.usage_count}</div>
          <div class="bar-fill" style="height:${(r.usage_count/maxRoom)*100}%;background:${DAY_COLORS[i%6]}"></div>
          <div class="bar-label">${r.code}</div>
        </div>`).join('')}
      </div></div></div>`;
  }
  sel.addEventListener('change', load);
  load();
}

// ── Cari Ruang Kosong ──
async function cariRuangPage(app) {
  app.innerHTML = renderHeader() + `<div class="page-content"><div class="container">
    <div class="section-header"><div><h1 class="section-title">🏢 Cari Ruang Kosong</h1>
    <p class="section-subtitle">Temukan ruangan yang tersedia pada waktu tertentu</p></div></div>
    <div class="filters-bar">
      <div class="form-group"><label class="form-label">Semester</label><select class="form-select" id="rSemester"><option>Memuat...</option></select></div>
      <div class="form-group"><label class="form-label">Hari</label><select class="form-select" id="rDay">${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">Jam Mulai</label><input class="form-input" type="time" id="rTimeStart" value="08:00"></div>
      <div class="form-group"><label class="form-label">Jam Selesai</label><input class="form-input" type="time" id="rTimeEnd" value="10:00"></div>
      <div class="form-group" style="display:flex;align-items:end"><button class="btn btn-primary" id="rSearch">🔍 Cari</button></div>
    </div>
    <div id="roomResult"><p class="loading-text">Pilih waktu lalu klik Cari.</p></div>
    
    <div class="modal-overlay" id="roomDetailModal"><div class="modal">
      <div class="modal-header"><h2 id="rdTitle">Detail Ruangan</h2><button class="modal-close" id="closeRModal">✕</button></div>
      <div id="rdContent" style="margin-bottom:1.5rem; line-height: 1.6;"></div>
    </div></div>
  </div></div>`;
  bindHeader();

  const semesters = await api.getSemesters();
  document.getElementById('rSemester').innerHTML = semesters.map(s => `<option value="${s.id}" ${s.is_active?'selected':''}>${s.name}</option>`).join('');

  document.getElementById('rSearch').addEventListener('click', async () => {
    const params = { semester: document.getElementById('rSemester').value, day: document.getElementById('rDay').value, time_start: document.getElementById('rTimeStart').value, time_end: document.getElementById('rTimeEnd').value };
    document.getElementById('roomResult').innerHTML = '<div class="spinner"></div>';
    const rooms = await api.findEmptyRooms(params);
    if (!rooms.length) { document.getElementById('roomResult').innerHTML = '<p class="loading-text">Semua ruangan terpakai pada waktu tersebut.</p>'; return; }
    document.getElementById('roomResult').innerHTML = `<p style="margin-bottom:1rem;color:var(--success);font-weight:600">✓ ${rooms.length} ruangan tersedia</p>
    <div class="card-grid">${rooms.map(r => `<div class="room-card clickable-room" data-id="${r.id}" data-name="${r.code} — ${r.name}" style="cursor:pointer" title="Klik untuk lihat jadwal ruangan ini">
      <div class="room-icon">${r.type === 'lab' ? '🖥' : r.type === 'auditorium' ? '🎭' : '🏫'}</div>
      <div class="room-info"><h4>${r.code} — ${r.name}</h4><p>${r.building} • Lt. ${r.floor} • ${r.capacity} kursi • ${r.type}</p></div>
    </div>`).join('')}</div>`;
  });

  app.addEventListener('click', async (e) => {
    const card = e.target.closest('.clickable-room');
    if (card && app.contains(card)) {
      document.getElementById('rdTitle').textContent = card.dataset.name;
      document.getElementById('rdContent').innerHTML = '<div class="spinner"></div>';
      document.getElementById('roomDetailModal').classList.add('active');
      
      const dayVal = document.getElementById('rDay').value;
      const params = {
        semester: document.getElementById('rSemester').value,
        day: dayVal,
        room: card.dataset.id
      };
      
      try {
        const schedules = await api.getSchedules(params);
        let html = `<h4 style="margin-bottom: 1rem;">Jadwal Penggunaan (Hari ${DAYS[dayVal]})</h4>`;
        
        if (schedules.length === 0) {
          html += `<div style="padding:1rem; background:rgba(34,197,94,.1); color:var(--success); border-radius:8px; border:1px solid rgba(34,197,94,.2);">✅ Ruangan kosong seharian penuh!</div>`;
        } else {
          html += `<ul style="list-style:none; padding:0;">`;
          let lastTime = '07:00';
          schedules.forEach(s => {
            if (s.time_start > lastTime) {
              html += `<li style="padding:.5rem; margin-bottom:.5rem; background:rgba(34,197,94,.1); border-left:4px solid var(--success); border-radius:4px;">
                <strong style="color:var(--success)">${lastTime} - ${s.time_start}</strong> : KOSONG
              </li>`;
            }
            html += `<li style="padding:.5rem; margin-bottom:.5rem; background:rgba(239,68,68,.1); border-left:4px solid var(--danger); border-radius:4px;">
              <strong style="color:var(--danger)">${s.time_start} - ${s.time_end}</strong> : Dipakai (${s.course_code} - ${s.course_name})
            </li>`;
            lastTime = s.time_end > lastTime ? s.time_end : lastTime;
          });
          if (lastTime < '18:00') {
             html += `<li style="padding:.5rem; margin-bottom:.5rem; background:rgba(34,197,94,.1); border-left:4px solid var(--success); border-radius:4px;">
                <strong style="color:var(--success)">${lastTime} - 18:00+</strong> : KOSONG
              </li>`;
          }
          html += `</ul>`;
        }
        document.getElementById('rdContent').innerHTML = html;
      } catch (err) {
        document.getElementById('rdContent').innerHTML = '<p class="loading-text" style="color:var(--danger)">Gagal memuat jadwal ruangan.</p>';
      }
    }
  });

  app.addEventListener('click', e => {
    if (e.target.closest('#closeRModal') && app.contains(e.target)) {
      document.getElementById('roomDetailModal').classList.remove('active');
    }
  });
}

// ── Footer for cari-ruang ──
// (already added via renderFooter in each page)

// ── Login Page ──
function loginPage(app) {
  app.innerHTML = renderHeader() + `<div class="login-page"><div class="login-card">
    <h2>🔐 Login Admin</h2><p>Masuk untuk mengelola jadwal</p>
    <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="lUser" value="admin"></div>
    <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="lPass" type="password" value="admin123"></div>
    <button class="btn btn-primary" style="width:100%;justify-content:center" id="lBtn">Masuk</button>
    <p id="lErr" style="color:var(--danger);text-align:center;margin-top:1rem;font-size:.85rem"></p>
  </div></div>`;
  bindHeader();

  document.getElementById('lBtn').addEventListener('click', async () => {
    try {
      const res = await api.login(document.getElementById('lUser').value, document.getElementById('lPass').value);
      api.setToken(res.token);
      toast('Login berhasil!');
      navigate('/admin');
    } catch (e) { document.getElementById('lErr').textContent = e.message; }
  });
}

// ── Admin Dashboard ──
async function adminPage(app) {
  if (!api.isLoggedIn()) { navigate('/login'); return; }

  function adminShell(activeTab, content) {
    return renderHeader() + `<div class="admin-layout">
      <aside class="admin-sidebar"><div class="sidebar-nav">
        <a class="sidebar-link ${activeTab==='dashboard'?'active':''}" data-href="/admin">📊 Dashboard</a>
        <a class="sidebar-link ${activeTab==='schedules'?'active':''}" data-href="/admin/schedules">📆 Jadwal</a>
        <a class="sidebar-link ${activeTab==='courses'?'active':''}" data-href="/admin/courses">📚 Mata Kuliah</a>
        <a class="sidebar-link ${activeTab==='lecturers'?'active':''}" data-href="/admin/lecturers">👨‍🏫 Dosen</a>
        <a class="sidebar-link ${activeTab==='rooms'?'active':''}" data-href="/admin/rooms">🏢 Ruangan</a>
        <a class="sidebar-link ${activeTab==='semesters'?'active':''}" data-href="/admin/semesters">📅 Semester</a>
        <a class="sidebar-link ${activeTab==='programs'?'active':''}" data-href="/admin/programs">🎓 Program Studi</a>
        <hr style="border-color:var(--border);margin:.5rem 0">
        <a class="sidebar-link" id="logoutBtn">🚪 Logout</a>
      </div></aside>
      <main class="admin-main">${content}</main>
    </div>`;
  }

  const path = location.pathname;
  let editScheduleId = null;
  let editEntityId = null;
  let currentAdminData = []; // Shared data for generic CRUD
  let currentAdminCfg = null; // Shared config for generic CRUD
  let currentAdminEntityName = '';
  let currentAdminSchedules = []; // Shared schedules data

  
  // Shared UI Update for Bulk Delete
  const updateBulkUI = () => {
    const isSched = path.startsWith('/admin/schedules');
    const selector = isSched ? '.sched-cb-row' : '.e-cb-row';
    const btnId = isSched ? 'bulkDeleteBtn' : 'bulkDeleteEBtn';
    const countId = isSched ? 'bulkDelCount' : 'bulkDelECount';
    
    const checked = document.querySelectorAll(`${selector}:checked`);
    const btn = document.getElementById(btnId);
    if (btn) {
      if (checked.length > 0) {
        btn.style.display = 'inline-flex';
        const countEl = document.getElementById(countId);
        if (countEl) countEl.textContent = checked.length;
      } else {
        btn.style.display = 'none';
      }
    }
  };

  if (path === '/admin' || path === '/admin/') {
    // ─── Dashboard ───
    const semesters = await api.getSemesters();
    const activeSem = semesters.find(s => s.is_active) || semesters[0];
    let stats = { total_schedules: 0, total_courses: 0, total_lecturers: 0, total_rooms: 0, by_day: [], by_room: [] };
    if (activeSem) { try { stats = await api.getStats(activeSem.id); } catch(e) {} }

    app.innerHTML = adminShell('dashboard', `
      <h1 class="section-title" style="margin-bottom:.5rem">Dashboard</h1>
      <p class="section-subtitle" style="margin-bottom:1.5rem">${activeSem?.name || 'Tidak ada semester aktif'}</p>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-value">${stats.total_schedules}</div><div class="stat-label">Total Jadwal</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_courses}</div><div class="stat-label">Mata Kuliah</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_lecturers}</div><div class="stat-label">Dosen</div></div>
        <div class="stat-card"><div class="stat-value">${stats.total_rooms}</div><div class="stat-label">Ruangan</div></div>
      </div>
      <div class="section"><h3 style="margin-bottom:1rem">Distribusi per Hari</h3>
      <div class="card-grid" style="grid-template-columns:repeat(6,1fr)">
        ${(stats.by_day||[]).map(d => `<div class="card" style="text-align:center;padding:1rem">
          <span class="day-badge day-${d.day}" style="font-size:.9rem">${d.day_name}</span>
          <div style="font-size:1.5rem;font-weight:800;margin-top:.5rem">${d.count}</div>
        </div>`).join('')}
      </div></div>
    `);

  } else if (path.startsWith('/admin/schedules')) {
    // ─── Manage Schedules ───
    const [semesters, courses, lecturers, rooms] = await Promise.all([
      api.getSemesters(), api.getCourses(), api.getLecturers(), api.getRooms()
    ]);
    const activeSem = semesters.find(s => s.is_active) || semesters[0];
    const schedules = activeSem ? await api.getSchedules({ semester: activeSem.id }) : [];
    currentAdminSchedules = schedules;


    app.innerHTML = adminShell('schedules', `
      <div class="section-header"><h1 class="section-title">📆 Kelola Jadwal</h1>
      <div class="btn-group">
        <button class="btn btn-danger" id="bulkDeleteBtn" style="display:none">🗑️ Hapus (<span id="bulkDelCount">0</span>)</button>
        <button class="btn btn-secondary" id="exportBtn">⬇️ Export CSV</button>
        <button class="btn btn-secondary" style="position:relative;overflow:hidden;">
          ⬆️ Import CSV
          <input type="file" id="importFile" accept=".csv" style="position:absolute;left:0;top:0;opacity:0;cursor:pointer;width:100%;height:100%;">
        </button>
        <button class="btn btn-primary" id="addScheduleBtn">+ Tambah</button>
      </div></div>
      <div style="margin-bottom: 1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
        <input type="text" class="form-input" id="searchSchedInput" placeholder="🔍 Cari jadwal (MK, Ruang, Dosen, Kelas)..." style="flex:1; min-width:250px; max-width:350px;">
        <select class="form-select" id="filterSchedDay" style="width:auto;">
          <option value="">Semua Hari</option>
          ${DAYS.map(d => `<option value="${d}">${d}</option>`).join('')}
        </select>
      </div>
      <div class="schedule-table-wrap"><table class="schedule-table"><thead><tr>
        <th style="width:40px;text-align:center"><input type="checkbox" id="selectAllScheds"></th>
        <th>Hari</th><th>Waktu</th><th>Mata Kuliah</th><th>Kelas</th><th>Dosen</th><th>Ruang</th><th>Aksi</th>
      </tr></thead><tbody id="schedTbody">
        ${schedules.map(s => `<tr><td style="text-align:center"><input type="checkbox" class="sched-cb-row" value="${s.id}"></td>
          <td><span class="day-badge day-${s.day}">${DAYS[s.day]}</span></td>
          <td class="time-badge">${s.time_start}-${s.time_end}</td>
          <td><strong>${s.course_name}</strong><br><small style="color:var(--text-dim)">${s.course_code}</small></td>
          <td>${s.class_group}</td><td>${s.lecturer_name}</td><td>${s.room_code}</td>
          <td><button class="btn btn-secondary btn-sm" style="margin-right:4px" data-edit="${s.id}">Edit</button><button class="btn btn-danger btn-sm" data-delete="${s.id}">Hapus</button></td></tr>`).join('')}
      </tbody></table></div>
      
      <div class="modal-overlay" id="schedModal"><div class="modal">
        <div class="modal-header"><h2 id="sModalTitle">Tambah Jadwal</h2><button class="modal-close" id="closeModal">✕</button></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Mata Kuliah</label>
          <input list="dlCourses" class="form-input" id="mCourseInput" placeholder="Ketik kode/nama MK..." autocomplete="off">
          <datalist id="dlCourses">${courses.map(c=>`<option data-id="${c.id}" value="${c.code} - ${c.name}"></option>`).join('')}</datalist>
        </div>
        <div class="form-group"><label class="form-label">Kelas</label>
          <input list="dlClasses" class="form-input" id="mGroup" value="A" placeholder="Contoh: A, B, Ext">
          <datalist id="dlClasses"><option value="A"><option value="B"><option value="C"><option value="D"><option value="E"></datalist>
        </div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Dosen (Bisa pilih >1)</label>
          <input type="text" class="form-input" id="searchLecturer" placeholder="Cari dosen..." style="margin-bottom:.5rem; padding:.3rem .5rem; font-size:.85rem">
          <div class="form-select" style="height:120px;overflow-y:auto;padding:.5rem;display:flex;flex-direction:column;gap:.5rem" id="mLecturers">
            ${lecturers.map(l=>{
              const fullName = (l.title_front ? l.title_front + ' ' : '') + l.name + (l.title_back ? ', ' + l.title_back : '');
              return `<label class="lec-item" style="display:flex;align-items:center;gap:.5rem;cursor:pointer"><input type="checkbox" value="${l.id}" class="lecturer-cb"> <span class="lec-name" style="font-size:.9rem">${fullName}</span></label>`;
            }).join('')}
          </div></div>
        <div class="form-group"><label class="form-label">Ruangan</label>
          <input list="dlRooms" class="form-input" id="mRoomInput" placeholder="Ketik kode/nama ruang..." autocomplete="off">
          <datalist id="dlRooms">${rooms.map(r=>`<option data-id="${r.id}" value="${r.code} - ${r.name}"></option>`).join('')}</datalist>
        </div></div>
        <div class="form-row"><div class="form-group"><label class="form-label">Hari</label>
          <select class="form-select" id="mDay">${DAYS.map((d,i)=>`<option value="${i}">${d}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">Jam Mulai</label><input class="form-input" id="mStart" type="time" value="08:00"></div>
        <div class="form-group"><label class="form-label">Jam Selesai</label><input class="form-input" id="mEnd" type="time" value="10:30"></div></div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1rem" id="saveSchedule">💾 Simpan</button>
        <p id="mErr" style="color:var(--danger);text-align:center;margin-top:.5rem;font-size:.85rem"></p>
      </div></div>

      <div class="modal-overlay" id="importPreviewModal"><div class="modal" style="max-width:800px">
        <div class="modal-header"><h2>Preview Import CSV</h2><button class="modal-close" id="closePreviewModal">✕</button></div>
        <p style="margin-bottom:1rem">Berikut adalah pratinjau data. Baris dengan status ❌ (invalid/tidak ditemukan) akan dilewati.</p>
        <div class="schedule-table-wrap" style="max-height:400px;overflow:auto;"><table class="schedule-table">
          <thead><tr><th>Status</th><th>Mata Kuliah</th><th>Kls</th><th>Dosen</th><th>Ruang</th><th>Hari</th><th>Waktu</th></tr></thead>
          <tbody id="previewTbody"></tbody>
        </table></div>
        <div style="display:flex; gap:1rem; margin-top:1.5rem;">
          <button class="btn btn-secondary" style="flex:1; justify-content:center" id="cancelImportBtn">Batal</button>
          <button class="btn btn-primary" style="flex:1; justify-content:center" id="confirmImportBtn">Jalankan Import</button>
        </div>
      </div></div>
    `);

    // --- Schedule Listeners ---
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      if (schedules.length === 0) return toast('Tidak ada data untuk diexport', 'error');
      let csv = 'course_code,course_name,class_group,lecturer_name,room_code,day_name,time_start,time_end\n';
      schedules.forEach(s => {
        const lName = s.lecturer_name.includes(',') ? `"${s.lecturer_name}"` : s.lecturer_name;
        const cName = s.course_name.includes(',') ? `"${s.course_name}"` : s.course_name;
        csv += `${s.course_code},${cName},${s.class_group},${lName},${s.room_code},${DAYS[s.day]},${s.time_start},${s.time_end}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const semName = activeSem.name ? activeSem.name.replace(/[^a-zA-Z0-9]/g, '_') : activeSem.id;
      a.download = `Jadwal_${semName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    const applySchedFilter = () => {
      const v = document.getElementById('searchSchedInput').value.toLowerCase();
      const fDay = document.getElementById('filterSchedDay').value;
      document.querySelectorAll('#schedTbody tr').forEach(tr => {
        const text = tr.textContent.toLowerCase();
        const dayBadge = tr.querySelector('.day-badge')?.textContent || '';
        const matchSearch = text.includes(v);
        const matchDay = fDay === '' || dayBadge === fDay;
        const isVisible = matchSearch && matchDay;
        tr.style.display = isVisible ? '' : 'none';
        if (!isVisible) {
          const cb = tr.querySelector('.sched-cb-row');
          if (cb) cb.checked = false;
        }
      });
      updateBulkUI();
    };
    document.getElementById('searchSchedInput')?.addEventListener('input', applySchedFilter);
    document.getElementById('filterSchedDay')?.addEventListener('change', applySchedFilter);

    document.getElementById('addScheduleBtn')?.addEventListener('click', () => {
      editScheduleId = null;
      document.getElementById('mCourseInput').value = '';
      document.getElementById('mRoomInput').value = '';
      document.getElementById('searchLecturer').value = '';
      document.getElementById('searchLecturer').dispatchEvent(new Event('input'));
      document.getElementById('sModalTitle').textContent = 'Tambah Jadwal';
      document.querySelectorAll('.lecturer-cb').forEach(cb => cb.checked = false);
      document.getElementById('schedModal').classList.add('active');
    });

    document.getElementById('saveSchedule')?.addEventListener('click', async () => {
      try {
        const checkedLecs = Array.from(document.querySelectorAll('.lecturer-cb:checked')).map(cb => +cb.value);
        if (checkedLecs.length === 0) throw new Error('Pilih minimal satu dosen');

        const courseVal = document.getElementById('mCourseInput').value;
        const courseOpt = Array.from(document.querySelectorAll('#dlCourses option')).find(o => o.value === courseVal);
        if (!courseOpt) throw new Error('Mata kuliah tidak valid. Pilih dari daftar yang muncul.');
        
        const roomVal = document.getElementById('mRoomInput').value;
        const roomOpt = Array.from(document.querySelectorAll('#dlRooms option')).find(o => o.value === roomVal);
        if (!roomOpt) throw new Error('Ruangan tidak valid. Pilih dari daftar yang muncul.');
        
        const payload = {
          semester_id: activeSem.id, course_id: +courseOpt.dataset.id,
          lecturer_ids: checkedLecs, room_id: +roomOpt.dataset.id,
          class_group: document.getElementById('mGroup').value, day: +document.getElementById('mDay').value,
          time_start: document.getElementById('mStart').value, time_end: document.getElementById('mEnd').value
        };
        
        const saveReq = async (force=false) => {
          if(force) payload.force = true;
          if (editScheduleId) await api.updateSchedule(editScheduleId, payload);
          else await api.createSchedule(payload);
        };

        try {
          await saveReq(false);
        } catch (e) {
          if (e.message.includes('Lanjutkan simpan?')) {
            if (confirm(e.message)) await saveReq(true);
            else return;
          } else throw e;
        }
        
        toast(editScheduleId ? 'Jadwal berhasil diperbarui!' : 'Jadwal berhasil ditambahkan!');
        document.getElementById('schedModal').classList.remove('active');
        navigate('/admin/schedules');
      } catch (e) { document.getElementById('mErr').textContent = e.message; }
    });

    document.getElementById('bulkDeleteBtn')?.addEventListener('click', async () => {
      const checked = Array.from(document.querySelectorAll('.sched-cb-row:checked')).map(cb => +cb.value);
      if (!confirm(`Yakin ingin menghapus ${checked.length} jadwal terpilih?`)) return;
      try {
        await api.bulkDeleteSchedules(checked);
        toast(`${checked.length} Jadwal dihapus`);
        navigate('/admin/schedules');
      } catch (e) { toast(e.message, 'error'); }
    });

    // --- Import Schedules ---
    let pendingImports = [];
    document.getElementById('importFile')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const text = await file.text();
      e.target.value = '';
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return toast('File CSV kosong atau tidak valid', 'error');
      const headers = lines[0].split(',');
      const required = ['course_code', 'class_group', 'lecturer_name', 'room_code', 'day_name', 'time_start', 'time_end'];
      if (!required.every(r => headers.includes(r))) return toast('Format CSV tidak valid', 'error');

      pendingImports = [];
      let previewHtml = '';
      for (let i = 1; i < lines.length; i++) {
        const rowText = lines[i];
        const values = []; let inQuotes = false, val = '';
        for (let char of rowText) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { values.push(val); val = ''; }
          else val += char;
        }
        values.push(val);
        const rowObj = {}; headers.forEach((h, idx) => { if (required.includes(h)) rowObj[h] = values[idx]; });
        
        const course = courses.find(c => c.code === rowObj.course_code);
        const lecturerNames = (rowObj.lecturer_name || '').split('|').map(n => n.trim()).filter(n => n);
        const matchedLecturers = lecturerNames.map(n => lecturers.find(l => l.name === n)).filter(l => l);
        const room = rooms.find(r => r.code === rowObj.room_code);
        const dayIdx = DAYS.indexOf(rowObj.day_name);

        const errs = [];
        if (!course) errs.push('MK tidak ada');
        if (matchedLecturers.length === 0) errs.push('Dosen tidak ada');
        if (!room) errs.push('Ruang tidak ada');
        if (dayIdx === -1) errs.push('Hari tidak valid');

        const isValid = errs.length === 0;
        previewHtml += `<tr><td>${isValid ? '✅' : '❌'}</td><td>${rowObj.course_code}</td><td>${rowObj.class_group}</td><td>${rowObj.lecturer_name}</td><td>${rowObj.room_code}</td><td>${rowObj.day_name}</td><td>${rowObj.time_start}-${rowObj.time_end}</td></tr>`;
        if (isValid) pendingImports.push({ semester_id: activeSem.id, course_id: course.id, class_group: rowObj.class_group, lecturer_ids: matchedLecturers.map(l => l.id), room_id: room.id, day: dayIdx, time_start: rowObj.time_start, time_end: rowObj.time_end });
      }
      document.getElementById('previewTbody').innerHTML = previewHtml;
      document.getElementById('confirmImportBtn').textContent = `Jalankan Import (${pendingImports.length} Valid)`;
      document.getElementById('importPreviewModal').classList.add('active');
    });

    document.getElementById('confirmImportBtn')?.addEventListener('click', async () => {
      document.getElementById('importPreviewModal').classList.remove('active');
      toast('Memproses import...');
      let success = 0;
      for (const p of pendingImports) { try { await api.createSchedule(p); success++; } catch (e) {} }
      toast(`Import selesai: ${success} sukses.`);
      setTimeout(() => navigate('/admin/schedules'), 1000);
    });

    document.getElementById('searchLecturer')?.addEventListener('input', e => {
      const v = e.target.value.toLowerCase();
      document.querySelectorAll('.lec-item').forEach(item => {
        const name = item.querySelector('.lec-name').textContent.toLowerCase();
        item.style.display = name.includes(v) ? 'flex' : 'none';
      });
    });

    document.getElementById('closeModal')?.addEventListener('click', () => document.getElementById('schedModal').classList.remove('active'));
    document.getElementById('closePreviewModal')?.addEventListener('click', () => document.getElementById('importPreviewModal').classList.remove('active'));
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => document.getElementById('importPreviewModal').classList.remove('active'));

  } else {
    // ─── Generic Admin CRUD (Courses, Lecturers, Rooms, etc.) ───
    const tab = path.replace('/admin/', '').replace(/\/$/, '');
    const configs = {
      courses: { title: '📚 Mata Kuliah', entity: 'courses', fetch: () => api.getCourses(), cols: ['code','name','sks','semester_level','program_id'], filterCol: 'program_name', filterLabel: 'Program Studi' },
      lecturers: { title: '👨‍🏫 Dosen', entity: 'lecturers', fetch: () => api.getLecturers(), cols: ['nip','name','title_front','title_back','email'] },
      rooms: { title: '🏢 Ruangan', entity: 'rooms', fetch: () => api.getRooms(), cols: ['code','name','building','floor','capacity','type'], filterCol: 'building', filterLabel: 'Gedung' },
      semesters: { title: '📅 Semester', entity: 'semesters', fetch: () => api.getSemesters(), cols: ['name','academic_year','period','is_active'] },
      programs: { title: '🎓 Program Studi', entity: 'programs', fetch: () => api.getPrograms(), cols: ['code','name','faculty'], filterCol: 'faculty', filterLabel: 'Fakultas' },
    };
    const cfg = configs[tab];
    if (!cfg) { app.innerHTML = adminShell('dashboard', '<p>Halaman tidak ditemukan</p>'); return; }
    
    const data = await cfg.fetch();
    currentAdminData = data;
    currentAdminCfg = cfg;
    const entityName = cfg.title.split(' ').slice(1).join(' ');
    currentAdminEntityName = entityName;
    let allPrograms = cfg.entity === 'courses' ? await api.getPrograms() : [];


    app.innerHTML = adminShell(tab, `
      <div class="section-header"><h1 class="section-title">${cfg.title}</h1>
      <div class="btn-group">
        <button class="btn btn-danger" id="bulkDeleteEBtn" style="display:none">🗑️ Hapus (<span id="bulkDelECount">0</span>)</button>
        <button class="btn btn-secondary" id="exportEBtn">⬇️ Export CSV</button>
        <button class="btn btn-secondary" style="position:relative;overflow:hidden;">
          ⬆️ Import CSV
          <input type="file" id="importEFile" accept=".csv" style="position:absolute;left:0;top:0;opacity:0;cursor:pointer;width:100%;height:100%;">
        </button>
        <button class="btn btn-primary" id="addEntityBtn">+ Tambah ${entityName}</button>
      </div></div>
      <div style="margin-bottom: 1rem; display:flex; gap:1rem; align-items:center; flex-wrap:wrap;">
        <input type="text" class="form-input" id="searchEntityInput" placeholder="🔍 Cari data..." style="flex:1; min-width:250px; max-width:350px;">
        ${cfg.filterCol ? `<select class="form-select" id="filterEntitySelect" style="width:auto;"><option value="">Semua ${cfg.filterLabel}</option>${[...new Set(data.map(d => d[cfg.filterCol]).filter(Boolean))].map(val => `<option value="${val}">${val}</option>`).join('')}</select>` : ''}
      </div>
      <div class="schedule-table-wrap"><table class="schedule-table"><thead><tr>
        <th style="width:40px;text-align:center"><input type="checkbox" id="selectAllE"></th>
        ${cfg.cols.map(c => `<th>${c === 'program_id' ? 'Program Studi' : c.replace(/_/g,' ')}</th>`).join('')}<th>Aksi</th>
      </tr></thead><tbody id="eTbody">
        ${data.map(row => `<tr data-filter-val="${row[cfg.filterCol] || ''}"><td style="text-align:center"><input type="checkbox" class="e-cb-row" value="${row.id}"></td>
          ${cfg.cols.map(c => `<td>${c === 'program_id' ? (row.program_name || row[c]) : (row[c] ?? '-')}</td>`).join('')}
        <td><button class="btn btn-secondary btn-sm" style="margin-right:4px" data-edit-id="${row.id}">Edit</button><button class="btn btn-danger btn-sm" data-del-entity="${cfg.entity}" data-del-id="${row.id}">Hapus</button></td></tr>`).join('')}
      </tbody></table></div>
      
      <div class="modal-overlay" id="entityModal"><div class="modal">
        <div class="modal-header"><h2 id="eModalTitle">Tambah ${entityName}</h2><button class="modal-close" id="closeEModal">✕</button></div>
        <div id="eFormFields">
          ${cfg.cols.map(c => {
            if (c === 'program_id') return `<div class="form-group"><label class="form-label">Program Studi</label><select class="form-select" id="ef_${c}">${allPrograms.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}</select></div>`;
            return `<div class="form-group"><label class="form-label" style="text-transform:capitalize">${c.replace(/_/g,' ')}</label><input class="form-input" id="ef_${c}"></div>`;
          }).join('')}
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:1rem" id="saveEntity">💾 Simpan</button>
        <p id="eErr" style="color:var(--danger);text-align:center;margin-top:.5rem;font-size:.85rem"></p>
      </div></div>
    `);

    // --- Generic Listeners ---
    document.getElementById('addEntityBtn')?.addEventListener('click', () => {
      editEntityId = null;
      document.getElementById('eModalTitle').textContent = 'Tambah ' + entityName;
      cfg.cols.forEach(c => { const el = document.getElementById(`ef_${c}`); if(el) el.value = ''; });
      document.getElementById('entityModal').classList.add('active');
    });

    document.getElementById('saveEntity')?.addEventListener('click', async () => {
      try {
        const payload = {};
        cfg.cols.forEach(c => payload[c] = document.getElementById(`ef_${c}`).value);
        if (editEntityId) await api.updateEntity(cfg.entity, editEntityId, payload);
        else await api.createEntity(cfg.entity, payload);
        toast('Data berhasil disimpan!');
        navigate(location.pathname);
      } catch (e) { document.getElementById('eErr').textContent = e.message; }
    });

    document.getElementById('bulkDeleteEBtn')?.addEventListener('click', async () => {
      const checked = Array.from(document.querySelectorAll('.e-cb-row:checked')).map(cb => +cb.value);
      if (!confirm(`Yakin ingin menghapus ${checked.length} data terpilih?`)) return;
      try {
        await api.bulkDeleteEntity(cfg.entity, checked);
        toast(`${checked.length} data dihapus`);
        navigate(location.pathname);
      } catch (e) { toast(e.message, 'error'); }
    });

    const applyEntityFilter = () => {
      const v = document.getElementById('searchEntityInput').value.toLowerCase();
      const fVal = document.getElementById('filterEntitySelect')?.value || '';
      document.querySelectorAll('#eTbody tr').forEach(tr => {
        const text = tr.textContent.toLowerCase();
        const matchSearch = text.includes(v);
        const matchFilter = fVal === '' || (tr.dataset.filterVal === fVal);
        const isVisible = matchSearch && matchFilter;
        tr.style.display = isVisible ? '' : 'none';
        if (!isVisible) { const cb = tr.querySelector('.e-cb-row'); if (cb) cb.checked = false; }
      });
      updateBulkUI();
    };
    document.getElementById('searchEntityInput')?.addEventListener('input', applyEntityFilter);
    document.getElementById('filterEntitySelect')?.addEventListener('change', applyEntityFilter);

    document.getElementById('closeEModal')?.addEventListener('click', () => document.getElementById('entityModal').classList.remove('active'));
    
    document.getElementById('exportEBtn')?.addEventListener('click', () => {
      if (data.length === 0) return toast('Tidak ada data untuk diexport', 'error');
      let csv = cfg.cols.join(',') + '\n';
      data.forEach(row => { csv += cfg.cols.map(c => { let val = c === 'program_id' ? (row.program_code || row.program_id) : row[c]; val = val == null ? '' : String(val); if (val.includes(',')) val = `"${val}"`; return val; }).join(',') + '\n'; });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${cfg.entity}_export.csv`; a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('importEFile')?.addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const text = await file.text(); e.target.value = '';
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) return toast('File CSV kosong', 'error');
      const headers = lines[0].split(',');
      toast('Memproses import...');
      let success = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const payload = {};
        headers.forEach((h, idx) => { if (cfg.cols.includes(h)) payload[h] = values[idx]; });
        try { await api.createEntity(cfg.entity, payload); success++; } catch(err) {}
      }
      toast(`Import selesai: ${success} sukses.`);
      setTimeout(() => navigate(location.pathname), 1000);
    });
  }

  // --- Central Admin Event Delegation ---
  app.addEventListener('change', e => {
    if (e.target.classList.contains('sched-cb-row') || e.target.classList.contains('e-cb-row')) {
      updateBulkUI();
    }
    if (e.target.id === 'selectAllScheds' || e.target.id === 'selectAllE') {
      const selector = e.target.id === 'selectAllScheds' ? '.sched-cb-row' : '.e-cb-row';
      document.querySelectorAll(selector).forEach(cb => {
        if (cb.closest('tr').style.display !== 'none') cb.checked = e.target.checked;
      });
      updateBulkUI();
    }
  });

  app.addEventListener('click', async e => {
    // Sidebar Links
    if (e.target.classList.contains('sidebar-link') && e.target.dataset.href) {
      e.preventDefault();
      navigate(e.target.dataset.href);
    }
    // Logout
    if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
      api.logout(); toast('Logged out'); navigate('/');
    }
    // Delete Single
    const delBtn = e.target.closest('[data-delete]');
    if (delBtn) {
      if (!confirm('Hapus jadwal ini?')) return;
      await api.deleteSchedule(delBtn.dataset.delete);
      toast('Jadwal dihapus');
      navigate('/admin/schedules');
    }
    const delEBtn = e.target.closest('[data-del-id]');
    if (delEBtn) {
      if (!confirm('Hapus data ini?')) return;
      await api.deleteEntity(delEBtn.dataset.delEntity, delEBtn.dataset.delId);
      toast('Data dihapus');
      navigate(location.pathname);
    }
    // Edit Schedules
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn) {
      const id = editBtn.dataset.edit;
      const s = currentAdminSchedules.find(x => x.id == id);
      if(!s) return;
      editScheduleId = id;
      document.getElementById('sModalTitle').textContent = 'Edit Jadwal';
      document.getElementById('mCourseInput').value = `${s.course_code} - ${s.course_name}`;
      document.getElementById('mGroup').value = s.class_group;
      const l_ids = (s.lecturer_ids || '').split(',').filter(x=>x);
      document.querySelectorAll('.lecturer-cb').forEach(cb => cb.checked = l_ids.includes(cb.value));
      document.getElementById('mRoomInput').value = `${s.room_code} - ${s.room_name}`;
      document.getElementById('mDay').value = s.day;
      document.getElementById('mStart').value = s.time_start;
      document.getElementById('mEnd').value = s.time_end;
      document.getElementById('schedModal').classList.add('active');
    }
    // Edit Generic Entities
    const editEBtn = e.target.closest('[data-edit-id]');
    if (editEBtn) {
      const id = editEBtn.dataset.editId;
      const row = currentAdminData.find(x => x.id == id);
      if (!row || !currentAdminCfg) return;
      editEntityId = id;
      document.getElementById('eModalTitle').textContent = 'Edit ' + currentAdminEntityName;
      currentAdminCfg.cols.forEach(c => { const el = document.getElementById(`ef_${c}`); if(el) el.value = row[c] || ''; });
      document.getElementById('entityModal').classList.add('active');
    }

  });

  bindHeader();
}


// ── Jadwalku Page ──
function jadwalkuPage(app) {
  const data = getMySchedules();
  app.innerHTML = renderHeader() + `<div class="page-content"><div class="container">
    <div class="section-header"><h1 class="section-title">⭐ Jadwalku</h1>
    <p class="section-subtitle">Jadwal kelas tersimpan untuk Anda</p></div>
    <div id="jadwalkuResult"></div>
  </div></div>` + renderFooter();
  bindHeader();
  
  const el = document.getElementById('jadwalkuResult');
  if (!data.length) { el.innerHTML = '<p class="loading-text">Anda belum menyimpan jadwal apapun. Pergi ke halaman Jadwal untuk menambahkannya.</p>'; return; }
  
  el.innerHTML = `<p style="margin-bottom:.75rem;color:var(--text-muted);font-size:.8rem">${data.length} jadwal tersimpan</p>
  <div class="schedule-table-wrap"><table class="schedule-table">
    <thead><tr><th>Hari</th><th>Waktu</th><th>Mata Kuliah</th><th>Kelas</th><th>Ruang</th><th>Aksi</th></tr></thead>
    <tbody>${data.map(s => `<tr>
      <td><span class="day-badge day-${s.day}">${DAYS[s.day]}</span></td>
      <td><span class="time-badge">${s.time_start} - ${s.time_end}</span></td>
      <td><strong>${s.course_name}</strong></td>
      <td>${s.class_group}</td>
      <td>${s.room_code}</td>
      <td><button class="btn btn-danger btn-sm" data-remove="${s.id}">Hapus</button></td>
    </tr>`).join('')}</tbody></table></div>`;
    
  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      removeMySchedule(btn.dataset.remove);
      jadwalkuPage(app); // re-render
      toast('Jadwal dihapus');
    });
  });
}

// ── Register Routes ──
registerRoute('/', homePage);
registerRoute('/jadwal', jadwalPage);
registerRoute('/jadwalku', jadwalkuPage);
registerRoute('/cari-slot', cariSlotPage);
registerRoute('/cari-ruang', cariRuangPage);
registerRoute('/statistik', statistikPage);
registerRoute('/login', loginPage);
registerRoute('/admin', adminPage);

// ── Start ──
handleRoute();
