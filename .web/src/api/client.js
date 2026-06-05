const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message || payload?.error || 'Ошибка запроса');
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
    this.code = payload?.error;
  }
}

async function parseResponse(response) {
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}

export async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : JSON_HEADERS),
      ...options.headers,
    },
  });
  return parseResponse(response);
}

export const api = {
  start: (body) => request('/api/start', { method: 'POST', body: JSON.stringify(body) }),
  currentSession: () => request('/api/session/current'),
  answer: (body) => request('/api/session/answer', { method: 'POST', body: JSON.stringify(body) }),
  result: () => request('/api/session/result'),
  dashboardTop: () => request('/api/dashboard/top'),

  adminLogin: (body) => request('/api/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  adminLogout: () => request('/api/admin/logout', { method: 'POST' }),
  adminMe: () => request('/api/admin/me'),
  adminSessions: () => request('/api/admin/sessions'),
  adminQuestions: () => request('/api/admin/questions'),
  adminCreateQuestion: (body) => request('/api/admin/questions', { method: 'POST', body: JSON.stringify(body) }),
  adminUpdateQuestion: (id, body) => request(`/api/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  adminToggleQuestion: (id, active) => request(`/api/admin/questions/${id}/active`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }),
  adminReorderQuestions: (ids) => request('/api/admin/questions/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  }),
  adminSetVisibility: (id, hiddenFromDashboard) => request(`/api/admin/sessions/${id}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify({ hiddenFromDashboard }),
  }),
  adminUpload: (file) => {
    const body = new FormData();
    body.append('file', file);
    return request('/api/admin/uploads', { method: 'POST', body });
  },
};
