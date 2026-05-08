CREATE TABLE IF NOT EXISTS schedule_lecturers (schedule_id INTEGER, lecturer_id INTEGER, PRIMARY KEY (schedule_id, lecturer_id));
INSERT OR IGNORE INTO schedule_lecturers (schedule_id, lecturer_id) SELECT id, lecturer_id FROM schedules WHERE lecturer_id IS NOT NULL;
