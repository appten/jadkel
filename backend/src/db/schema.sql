-- JadKel Database Schema
-- Cloudflare D1 (SQLite)

-- Semester
CREATE TABLE IF NOT EXISTS semesters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('ganjil', 'genap')),
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Program Studi
CREATE TABLE IF NOT EXISTS programs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  faculty TEXT NOT NULL
);

-- Ruangan
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  building TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 30,
  type TEXT NOT NULL DEFAULT 'kelas' CHECK(type IN ('kelas', 'lab', 'auditorium'))
);

-- Dosen
CREATE TABLE IF NOT EXISTS lecturers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nip TEXT UNIQUE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT
);

-- Mata Kuliah
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sks INTEGER NOT NULL DEFAULT 2,
  semester_level INTEGER NOT NULL DEFAULT 1,
  program_id INTEGER NOT NULL,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

-- Jadwal
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  lecturer_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  class_group TEXT NOT NULL DEFAULT 'A',
  day INTEGER NOT NULL CHECK(day >= 0 AND day <= 5),
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Admin
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('super_admin', 'admin')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Team Teaching (junction table)
CREATE TABLE IF NOT EXISTS schedule_lecturers (
  schedule_id INTEGER NOT NULL,
  lecturer_id INTEGER NOT NULL,
  PRIMARY KEY (schedule_id, lecturer_id),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_semester ON schedules(semester_id);
CREATE INDEX IF NOT EXISTS idx_schedules_day ON schedules(day);
CREATE INDEX IF NOT EXISTS idx_schedules_room ON schedules(room_id);
CREATE INDEX IF NOT EXISTS idx_schedules_lecturer ON schedules(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_course ON schedules(course_id);
CREATE INDEX IF NOT EXISTS idx_courses_program ON courses(program_id);
CREATE INDEX IF NOT EXISTS idx_schedule_lecturers_schedule ON schedule_lecturers(schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_lecturers_lecturer ON schedule_lecturers(lecturer_id);
