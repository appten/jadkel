const API_BASE = 'https://jadkel-api.appten.workers.dev/api';

function getToken() { return localStorage.getItem('jadkel_token'); }
function setToken(t) { localStorage.setItem('jadkel_token', t); }
function clearToken() { localStorage.removeItem('jadkel_token'); }

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}): ${text.slice(0, 100)}`);
    }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (e) {
    console.error('API Error:', e);
    throw e;
  }
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  verify: () => request('/auth/verify'),
  logout: () => { clearToken(); },
  setToken, getToken, clearToken,
  isLoggedIn: () => !!getToken(),

  // Public
  getSemesters: () => request('/semesters'),
  getPrograms: () => request('/programs'),
  getRooms: () => request('/rooms'),
  getLecturers: () => request('/lecturers'),
  getCourses: (programId) => request(`/courses${programId ? `?program=${programId}` : ''}`),
  getSchedules: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/schedules${q ? `?${q}` : ''}`);
  },
  search: (query, semester) => request(`/search?q=${encodeURIComponent(query)}${semester ? `&semester=${semester}` : ''}`),
  findEmptySlots: (params) => request(`/find/empty-slots?${new URLSearchParams(params)}`),
  findEmptyRooms: (params) => request(`/find/empty-rooms?${new URLSearchParams(params)}`),
  getStats: (semester) => request(`/stats?semester=${semester}`),

  // Admin CRUD
  createSchedule: (data) => request('/admin/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) => request(`/admin/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/admin/schedules/${id}`, { method: 'DELETE' }),

  bulkDeleteSchedules: (ids) => request('/admin/schedules/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),

  createEntity: (entity, data) => request(`/admin/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
  updateEntity: (entity, id, data) => request(`/admin/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEntity: (entity, id) => request(`/admin/${entity}/${id}`, { method: 'DELETE' }),
  bulkDeleteEntity: (entity, ids) => request(`/admin/${entity}/bulk-delete`, { method: 'POST', body: JSON.stringify({ ids }) }),
};
