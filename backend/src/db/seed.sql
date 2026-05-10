-- JadKel Seed Data (Sample)

-- Semesters
INSERT INTO semesters (name, academic_year, period, is_active) VALUES
('Ganjil 2025/2026', '2025/2026', 'ganjil', 0),
('Genap 2025/2026', '2025/2026', 'genap', 1);

-- Programs
INSERT INTO programs (code, name, faculty) VALUES
('TI', 'Teknik Informatika', 'Fakultas Teknik'),
('SI', 'Sistem Informasi', 'Fakultas Teknik'),
('MI', 'Manajemen Informatika', 'Fakultas Teknik'),
('AK', 'Akuntansi', 'Fakultas Ekonomi');

-- Rooms
INSERT INTO rooms (code, name, building, floor, capacity, type) VALUES
('R101', 'Ruang 101', 'Gedung A', 1, 40, 'kelas'),
('R102', 'Ruang 102', 'Gedung A', 1, 40, 'kelas'),
('R201', 'Ruang 201', 'Gedung A', 2, 35, 'kelas'),
('R202', 'Ruang 202', 'Gedung A', 2, 35, 'kelas'),
('R301', 'Ruang 301', 'Gedung A', 3, 30, 'kelas'),
('R302', 'Ruang 302', 'Gedung A', 3, 30, 'kelas'),
('LAB-1', 'Lab Komputer 1', 'Gedung B', 1, 30, 'lab'),
('LAB-2', 'Lab Komputer 2', 'Gedung B', 1, 30, 'lab'),
('LAB-3', 'Lab Jaringan', 'Gedung B', 2, 25, 'lab'),
('AUD-1', 'Auditorium Utama', 'Gedung C', 1, 200, 'auditorium');

-- Lecturers
INSERT INTO lecturers (nip, name, title_front, title_back, email) VALUES
('198501012010011001', 'Ahmad Rizal', 'Dr.', 'S.Kom., M.Cs.', 'ahmad.rizal@univ.ac.id'),
('198702152011021002', 'Budi Santoso', '', 'S.T., M.Kom.', 'budi.santoso@univ.ac.id'),
('199003202012031003', 'Citra Dewi', 'Dr.', 'S.Si., M.Sc.', 'citra.dewi@univ.ac.id'),
('198805102013041004', 'Dian Purnama', '', 'S.Kom., M.T.', 'dian.purnama@univ.ac.id'),
('199201082014051005', 'Eko Prasetyo', '', 'S.T., M.Eng.', 'eko.prasetyo@univ.ac.id'),
('198607122010011006', 'Fitri Handayani', 'Dr.', 'S.Kom., M.Kom.', 'fitri.h@univ.ac.id'),
('199105032015061007', 'Gunawan Wibowo', '', 'S.Kom., M.Cs.', 'gunawan.w@univ.ac.id'),
('198904222011021008', 'Hendra Wijaya', '', 'S.T., M.Kom.', 'hendra.w@univ.ac.id');

-- Courses (Teknik Informatika)
INSERT INTO courses (code, name, sks, semester_level, program_id) VALUES
('TI101', 'Algoritma & Pemrograman', 3, 1, 1),
('TI102', 'Matematika Diskrit', 3, 1, 1),
('TI103', 'Pengantar Teknologi Informasi', 2, 1, 1),
('TI201', 'Struktur Data', 3, 2, 1),
('TI202', 'Basis Data', 3, 2, 1),
('TI203', 'Arsitektur Komputer', 2, 2, 1),
('TI301', 'Pemrograman Web', 3, 3, 1),
('TI302', 'Jaringan Komputer', 3, 3, 1),
('TI303', 'Sistem Operasi', 3, 3, 1),
('TI401', 'Rekayasa Perangkat Lunak', 3, 4, 1),
('TI402', 'Kecerdasan Buatan', 3, 4, 1),
('TI403', 'Pemrograman Mobile', 3, 4, 1);

-- Courses (Sistem Informasi)
INSERT INTO courses (code, name, sks, semester_level, program_id) VALUES
('SI101', 'Pengantar Sistem Informasi', 2, 1, 2),
('SI102', 'Logika & Algoritma', 3, 1, 2),
('SI201', 'Analisis & Desain Sistem', 3, 2, 2),
('SI202', 'Manajemen Basis Data', 3, 2, 2),
('SI301', 'E-Business', 3, 3, 2),
('SI302', 'Data Mining', 3, 3, 2);

-- Schedules (Semester Genap 2025/2026 - semester_id=2)
INSERT INTO schedules (semester_id, course_id, lecturer_id, room_id, class_group, day, time_start, time_end) VALUES
-- Senin (day=0)
(2, 1, 1, 1, 'A', 0, '08:00', '10:30'),
(2, 2, 3, 2, 'A', 0, '08:00', '10:30'),
(2, 4, 2, 3, 'A', 0, '10:30', '12:10'),
(2, 7, 4, 7, 'A', 0, '13:00', '15:30'),
(2, 13, 6, 4, 'A', 0, '08:00', '09:40'),
-- Selasa (day=1)
(2, 3, 5, 1, 'A', 1, '08:00', '09:40'),
(2, 5, 1, 7, 'A', 1, '08:00', '10:30'),
(2, 8, 7, 5, 'A', 1, '10:30', '13:00'),
(2, 10, 8, 2, 'A', 1, '13:00', '15:30'),
(2, 14, 3, 3, 'A', 1, '10:30', '13:00'),
-- Rabu (day=2)
(2, 1, 1, 1, 'B', 2, '08:00', '10:30'),
(2, 6, 5, 4, 'A', 2, '08:00', '09:40'),
(2, 9, 2, 3, 'A', 2, '10:30', '13:00'),
(2, 11, 6, 7, 'A', 2, '13:00', '15:30'),
(2, 15, 4, 5, 'A', 2, '08:00', '10:30'),
-- Kamis (day=3)
(2, 2, 3, 2, 'B', 3, '08:00', '10:30'),
(2, 4, 2, 3, 'B', 3, '10:30', '12:10'),
(2, 12, 7, 8, 'A', 3, '08:00', '10:30'),
(2, 16, 8, 4, 'A', 3, '13:00', '15:30'),
(2, 17, 1, 5, 'A', 3, '10:30', '13:00'),
-- Jumat (day=4)
(2, 5, 1, 7, 'B', 4, '08:00', '10:30'),
(2, 7, 4, 8, 'B', 4, '08:00', '10:30'),
(2, 3, 5, 1, 'B', 4, '10:30', '12:10'),
(2, 18, 6, 2, 'A', 4, '08:00', '10:30'),
-- Sabtu (day=5)
(2, 10, 8, 2, 'B', 5, '08:00', '10:30'),
(2, 8, 7, 5, 'B', 5, '08:00', '10:30'),
(2, 11, 6, 7, 'B', 5, '10:30', '13:00');
