import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt, sign, verify } from 'hono/jwt';

const app = new Hono();

app.onError((err, c) => {
  console.error('Backend Error:', err);
  return c.json({ error: err.message || 'Internal Server Error' }, 500);
});

// ─── Helpers ───
const json = (c, data, status = 200) => c.json(data, status);
const err = (c, msg, status = 400) => c.json({ error: msg }, status);
const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const TIME_SLOTS = ['07:00','07:50','08:40','09:30','10:20','11:10','12:00','12:50','13:40','14:30','15:20','16:10','17:00'];

// Secure Password Hashing using PBKDF2
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const saltBuffer = enc.encode(salt);
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
}

// ─── Middleware ───
app.use('*', cors({ origin: '*' }));

// JWT Auth Middleware for /api/admin/*
app.use('/api/admin/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return await next();
  const authHandler = jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' });
  return authHandler(c, next);
});

// ─── Auth ───
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json();
  
  // 1. Get user from DB
  const user = await c.env.DB.prepare('SELECT * FROM admins WHERE username = ?').bind(username).first();
  
  if (!user) {
    // If no admin exists at all, allow creating the first one (Emergency Setup)
    const count = await c.env.DB.prepare('SELECT COUNT(*) as c FROM admins').first();
    if (count.c === 0 && username === 'admin') {
      const salt = crypto.randomUUID();
      const hash = await hashPassword(password, salt);
      await c.env.DB.prepare('INSERT INTO admins (username, password_hash, name, role) VALUES (?, ?, ?, ?)')
        .bind('admin', `${salt}:${hash}`, 'Administrator', 'super_admin')
        .run();
      return json(c, { message: 'Admin account created. Please login again.' });
    }
    return err(c, 'Invalid credentials', 401);
  }

  // 2. Verify password
  const [salt, storedHash] = user.password_hash.split(':');
  const computedHash = await hashPassword(password, salt);
  
  if (computedHash === storedHash) {
    const payload = {
      sub: user.username,
      name: user.name,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    };
    const token = await sign(payload, c.env.JWT_SECRET, 'HS256');
    return json(c, { token, user: { username: user.username, name: user.name, role: user.role } });
  }

  return err(c, 'Invalid credentials', 401);
});

app.get('/api/auth/verify', async (c) => {
  const payload = c.get('jwtPayload');
  if (payload) return json(c, { valid: true, user: payload });
  
  // If not using middleware yet (public endpoint), try manual verify
  const auth = c.req.header('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.slice(7);
      const decoded = await verify(token, c.env.JWT_SECRET, 'HS256');
      return json(c, { valid: true, user: decoded });
    } catch { return err(c, 'Invalid token', 401); }
  }
  return err(c, 'No token provided', 401);
});

// ─── Public: Semesters ───
app.get('/api/semesters', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM semesters ORDER BY id DESC').all();
  return json(c, rows.results);
});

// ─── Public: Programs ───
app.get('/api/programs', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM programs ORDER BY name').all();
  return json(c, rows.results);
});

// ─── Public: Rooms ───
app.get('/api/rooms', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM rooms ORDER BY building, code').all();
  return json(c, rows.results);
});

// ─── Public: Lecturers ───
app.get('/api/lecturers', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM lecturers ORDER BY name').all();
  return json(c, rows.results);
});

// ─── Public: Courses ───
app.get('/api/courses', async (c) => {
  const programId = c.req.query('program');
  let sql = `SELECT c.*, p.name as program_name, p.code as program_code FROM courses c JOIN programs p ON c.program_id = p.id`;
  const params = [];
  if (programId) { sql += ' WHERE c.program_id = ?'; params.push(programId); }
  sql += ' ORDER BY c.semester_level, c.code';
  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return json(c, rows.results);
});

// ─── Public: Schedules ───
app.get('/api/schedules', async (c) => {
  const { semester, program, day, lecturer, room } = c.req.query();
  let sql = `SELECT s.*, c.code as course_code, c.name as course_name, c.sks, c.semester_level,
    (SELECT GROUP_CONCAT(COALESCE(l.title_front || ' ', '') || l.name || COALESCE(', ' || l.title_back, ''), ' | ') FROM schedule_lecturers sl JOIN lecturers l ON sl.lecturer_id = l.id WHERE sl.schedule_id = s.id) as lecturer_name,
    (SELECT GROUP_CONCAT(COALESCE(l.title_front, '') || ' | ' || COALESCE(l.title_back, ''), ' | ') FROM schedule_lecturers sl JOIN lecturers l ON sl.lecturer_id = l.id WHERE sl.schedule_id = s.id) as lecturer_title,
    (SELECT GROUP_CONCAT(l.id, ',') FROM schedule_lecturers sl JOIN lecturers l ON sl.lecturer_id = l.id WHERE sl.schedule_id = s.id) as lecturer_ids,
    r.code as room_code, r.name as room_name, r.building,
    p.code as program_code, p.name as program_name,
    sem.name as semester_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN rooms r ON s.room_id = r.id
    JOIN programs p ON c.program_id = p.id
    JOIN semesters sem ON s.semester_id = sem.id WHERE 1=1`;
  const params = [];
  if (semester) { sql += ' AND s.semester_id = ?'; params.push(semester); }
  if (program) { sql += ' AND c.program_id = ?'; params.push(program); }
  if (day !== undefined && day !== '') { sql += ' AND s.day = ?'; params.push(day); }
  if (lecturer) { sql += ' AND s.id IN (SELECT schedule_id FROM schedule_lecturers WHERE lecturer_id = ?)'; params.push(lecturer); }
  if (room) { sql += ' AND s.room_id = ?'; params.push(room); }
  sql += ' ORDER BY s.day, s.time_start';
  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return json(c, rows.results);
});

// ─── Public: Find Empty Slots ───
app.get('/api/find/empty-slots', async (c) => {
  const { semester, day, program } = c.req.query();
  if (!semester) return err(c, 'semester required');
  let sql = `SELECT s.day, s.time_start, s.time_end FROM schedules s
    JOIN courses c ON s.course_id = c.id WHERE s.semester_id = ?`;
  const params = [semester];
  if (day !== undefined && day !== '') { sql += ' AND s.day = ?'; params.push(day); }
  if (program) { sql += ' AND c.program_id = ?'; params.push(program); }
  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  const occupied = {};
  rows.results.forEach(r => {
    const key = r.day;
    if (!occupied[key]) occupied[key] = [];
    occupied[key].push({ start: r.time_start, end: r.time_end });
  });
  const emptySlots = [];
  const daysToCheck = (day !== undefined && day !== '') ? [parseInt(day)] : [0,1,2,3,4,5];
  daysToCheck.forEach(d => {
    const dayOccupied = occupied[d] || [];
    TIME_SLOTS.forEach((slot, i) => {
      if (i >= TIME_SLOTS.length - 1) return;
      const nextSlot = TIME_SLOTS[i + 1];
      const isFree = !dayOccupied.some(o => slot >= o.start && slot < o.end);
      if (isFree) emptySlots.push({ day: d, day_name: DAYS[d], time_start: slot, time_end: nextSlot });
    });
  });
  return json(c, emptySlots);
});

// ─── Public: Find Empty Rooms ───
app.get('/api/find/empty-rooms', async (c) => {
  const { semester, day, time_start, time_end } = c.req.query();
  
  // Fallback ke logic lama jika frontend mengirim 'time' biasa (sebelum terupdate)
  const qStart = time_start || c.req.query('time');
  const qEnd = time_end || c.req.query('time');
  
  if (!semester || day === undefined || !qStart || !qEnd) return err(c, 'semester, day, time_start, time_end required');
  const allRooms = await c.env.DB.prepare('SELECT * FROM rooms ORDER BY building, code').all();
  const usedRooms = await c.env.DB.prepare(
    `SELECT DISTINCT room_id FROM schedules WHERE semester_id = ? AND day = ? AND time_start < ? AND time_end > ?`
  ).bind(semester, day, qEnd, qStart).all();
  const usedIds = new Set(usedRooms.results.map(r => r.room_id));
  const available = allRooms.results.filter(r => !usedIds.has(r.id));
  return json(c, available);
});

// ─── Public: Stats ───
app.get('/api/stats', async (c) => {
  const semester = c.req.query('semester');
  if (!semester) return err(c, 'semester required');
  const [totalSchedules, totalCourses, totalLecturers, totalRooms, byDay, byRoom] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM schedules WHERE semester_id = ?').bind(semester).first(),
    c.env.DB.prepare('SELECT COUNT(DISTINCT course_id) as count FROM schedules WHERE semester_id = ?').bind(semester).first(),
    c.env.DB.prepare('SELECT COUNT(DISTINCT sl.lecturer_id) as count FROM schedule_lecturers sl JOIN schedules s ON sl.schedule_id = s.id WHERE s.semester_id = ?').bind(semester).first(),
    c.env.DB.prepare('SELECT COUNT(DISTINCT room_id) as count FROM schedules WHERE semester_id = ?').bind(semester).first(),
    c.env.DB.prepare('SELECT day, COUNT(*) as count FROM schedules WHERE semester_id = ? GROUP BY day ORDER BY day').bind(semester).all(),
    c.env.DB.prepare(`SELECT r.code, r.name, COUNT(s.id) as usage_count FROM rooms r LEFT JOIN schedules s ON r.id = s.room_id AND s.semester_id = ? GROUP BY r.id ORDER BY usage_count DESC`).bind(semester).all(),
  ]);
  return json(c, {
    total_schedules: totalSchedules.count,
    total_courses: totalCourses.count,
    total_lecturers: totalLecturers.count,
    total_rooms: totalRooms.count,
    by_day: byDay.results.map(r => ({ ...r, day_name: DAYS[r.day] })),
    by_room: byRoom.results
  });
});

// ─── Public: Search ───
app.get('/api/search', async (c) => {
  const q = c.req.query('q');
  const semester = c.req.query('semester');
  if (!q || q.length < 2) return err(c, 'query too short');
  const like = `%${q}%`;
  let sql = `SELECT s.*, c.code as course_code, c.name as course_name, c.sks,
    (SELECT GROUP_CONCAT(COALESCE(l.title_front || ' ', '') || l.name || COALESCE(', ' || l.title_back, ''), ' | ') FROM schedule_lecturers sl JOIN lecturers l ON sl.lecturer_id = l.id WHERE sl.schedule_id = s.id) as lecturer_name,
    (SELECT GROUP_CONCAT(COALESCE(l.title_front, '') || ' | ' || COALESCE(l.title_back, ''), ' | ') FROM schedule_lecturers sl JOIN lecturers l ON sl.lecturer_id = l.id WHERE sl.schedule_id = s.id) as lecturer_title,
    r.code as room_code, r.name as room_name, r.building,
    p.code as program_code, p.name as program_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    JOIN rooms r ON s.room_id = r.id
    JOIN programs p ON c.program_id = p.id
    WHERE (c.name LIKE ? OR c.code LIKE ? OR r.code LIKE ?
      OR s.id IN (SELECT sl2.schedule_id FROM schedule_lecturers sl2 JOIN lecturers l2 ON sl2.lecturer_id = l2.id WHERE l2.name LIKE ?))`;
  const params = [like, like, like, like];
  if (semester) { sql += ' AND s.semester_id = ?'; params.push(semester); }
  sql += ' ORDER BY s.day, s.time_start LIMIT 50';
  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return json(c, rows.results);
});

// ─── Admin Middleware (Internal use for routes) ───
const adminOnly = async (c, next) => {
  const user = c.get('jwtPayload');
  if (!user) return err(c, 'Unauthorized', 401);
  await next();
};

// ─── Admin: CRUD Schedules ───
app.post('/api/admin/schedules', adminOnly, async (c) => {
  const body = await c.req.json();
  const { semester_id, course_id, lecturer_ids, lecturer_id, room_id, class_group, day, time_start, time_end, force } = body;
  const l_ids = lecturer_ids || (lecturer_id ? [lecturer_id] : []);
  
  // Conflict check - room
  const roomConflict = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM schedules WHERE semester_id=? AND room_id=? AND day=? AND time_start<? AND time_end>?`
  ).bind(semester_id, room_id, day, time_end, time_start).first();
  if (roomConflict.c > 0 && !force) return json(c, { error: 'Ruangan sudah digunakan di jam tersebut. Lanjutkan simpan?', isWarning: true }, 400);
  
  // Conflict check - lecturers
  if (!force) {
    for (const lid of l_ids) {
      if (!lid) continue;
      const lecturerConflict = await c.env.DB.prepare(
        `SELECT COUNT(*) as c FROM schedule_lecturers sl JOIN schedules s ON sl.schedule_id=s.id WHERE s.semester_id=? AND sl.lecturer_id=? AND s.day=? AND s.time_start<? AND s.time_end>?`
      ).bind(semester_id, lid, day, time_end, time_start).first();
      if (lecturerConflict.c > 0) return json(c, { error: 'Salah satu dosen sudah memiliki jadwal di jam tersebut. Lanjutkan simpan?', isWarning: true }, 400);
    }
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO schedules (semester_id, course_id, lecturer_id, room_id, class_group, day, time_start, time_end) VALUES (?,?,?,?,?,?,?,?)`
  ).bind(semester_id, course_id, l_ids[0] || 0, room_id, class_group || 'A', day, time_start, time_end).run();
  
  const schedule_id = result.meta.last_row_id;
  for (const lid of l_ids) {
    if (lid) await c.env.DB.prepare(`INSERT INTO schedule_lecturers (schedule_id, lecturer_id) VALUES (?,?)`).bind(schedule_id, lid).run();
  }
  
  return json(c, { id: schedule_id, message: 'Jadwal berhasil ditambahkan' }, 201);
});

app.post('/api/admin/schedules/bulk-delete', adminOnly, async (c) => {
  const { ids } = await c.req.json();
  if (!ids || ids.length === 0) return err(c, 'Tidak ada ID yang diberikan');
  const placeholders = ids.map(() => '?').join(',');
  await c.env.DB.prepare(`DELETE FROM schedule_lecturers WHERE schedule_id IN (${placeholders})`).bind(...ids).run();
  await c.env.DB.prepare(`DELETE FROM schedules WHERE id IN (${placeholders})`).bind(...ids).run();
  return json(c, { message: `${ids.length} jadwal berhasil dihapus` });
});

app.put('/api/admin/schedules/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const { semester_id, course_id, lecturer_ids, lecturer_id, room_id, class_group, day, time_start, time_end, force } = body;
  const l_ids = lecturer_ids || (lecturer_id ? [lecturer_id] : []);

  const roomConflict = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM schedules WHERE semester_id=? AND room_id=? AND day=? AND time_start<? AND time_end>? AND id!=?`
  ).bind(semester_id, room_id, day, time_end, time_start, id).first();
  if (roomConflict.c > 0 && !force) return json(c, { error: 'Ruangan sudah digunakan di jam tersebut. Lanjutkan simpan?', isWarning: true }, 400);
  
  if (!force) {
    for (const lid of l_ids) {
      if (!lid) continue;
      const lecturerConflict = await c.env.DB.prepare(
        `SELECT COUNT(*) as c FROM schedule_lecturers sl JOIN schedules s ON sl.schedule_id=s.id WHERE s.semester_id=? AND sl.lecturer_id=? AND s.day=? AND s.time_start<? AND s.time_end>? AND s.id!=?`
      ).bind(semester_id, lid, day, time_end, time_start, id).first();
      if (lecturerConflict.c > 0) return json(c, { error: 'Salah satu dosen sudah memiliki jadwal di jam tersebut. Lanjutkan simpan?', isWarning: true }, 400);
    }
  }

  await c.env.DB.prepare(
    `UPDATE schedules SET semester_id=?, course_id=?, lecturer_id=?, room_id=?, class_group=?, day=?, time_start=?, time_end=?, updated_at=datetime('now') WHERE id=?`
  ).bind(semester_id, course_id, l_ids[0] || 0, room_id, class_group, day, time_start, time_end, id).run();
  
  await c.env.DB.prepare(`DELETE FROM schedule_lecturers WHERE schedule_id=?`).bind(id).run();
  for (const lid of l_ids) {
    if (lid) await c.env.DB.prepare(`INSERT INTO schedule_lecturers (schedule_id, lecturer_id) VALUES (?,?)`).bind(id, lid).run();
  }

  return json(c, { message: 'Jadwal berhasil diperbarui' });
});



app.delete('/api/admin/schedules/:id', adminOnly, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM schedule_lecturers WHERE schedule_id = ?').bind(id).run();
  await c.env.DB.prepare('DELETE FROM schedules WHERE id = ?').bind(id).run();
  return json(c, { message: 'Jadwal berhasil dihapus' });
});

// ─── Admin: CRUD generic for other entities ───
const crudRoutes = [
  { path: 'semesters', table: 'semesters', fields: ['name','academic_year','period','is_active'] },
  { path: 'programs', table: 'programs', fields: ['code','name','faculty'] },
  { path: 'rooms', table: 'rooms', fields: ['code','name','building','floor','capacity','type'] },
  { path: 'lecturers', table: 'lecturers', fields: ['nip','name','title_front','title_back','email'] },
  { path: 'courses', table: 'courses', fields: ['code','name','sks','semester_level','program_id'] },
];

crudRoutes.forEach(({ path, table, fields }) => {
  app.post(`/api/admin/${path}`, adminOnly, async (c) => {
    const body = await c.req.json();
    const vals = fields.map(f => body[f]);
    const placeholders = fields.map(() => '?').join(',');
    const result = await c.env.DB.prepare(`INSERT INTO ${table} (${fields.join(',')}) VALUES (${placeholders})`).bind(...vals).run();
    return json(c, { id: result.meta.last_row_id, message: 'Data berhasil ditambahkan' }, 201);
  });

  app.post(`/api/admin/${path}/bulk-delete`, adminOnly, async (c) => {
    const { ids } = await c.req.json();
    if (!ids || ids.length === 0) return err(c, 'Tidak ada ID yang diberikan');
    const placeholders = ids.map(() => '?').join(',');
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id IN (${placeholders})`).bind(...ids).run();
    return json(c, { message: `${ids.length} data berhasil dihapus` });
  });

  app.put(`/api/admin/${path}/:id`, adminOnly, async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const sets = fields.map(f => `${f}=?`).join(',');
    const vals = fields.map(f => body[f]);
    await c.env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id=?`).bind(...vals, id).run();
    return json(c, { message: 'Data berhasil diperbarui' });
  });

  app.delete(`/api/admin/${path}/:id`, adminOnly, async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare(`DELETE FROM ${table} WHERE id=?`).bind(id).run();
    return json(c, { message: 'Data berhasil dihapus' });
  });
});

// ─── Init DB (dev only) ───
app.post('/api/init-db', async (c) => {
  return json(c, { message: 'Use wrangler d1 execute to init the database' });
});

export default app;
