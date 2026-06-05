const BASE = '/api'

async function req(method, path, body) {
  const opts = { method, credentials: 'include', headers: {} }
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, opts)
  const json = await res.json()
  if (!res.ok) throw Object.assign(new Error(json.message || 'Ошибка'), { code: json.error, status: res.status })
  return json
}

export const api = {
  start: (body) => req('POST', '/start', body),
  current: () => req('GET', '/session/current'),
  answer: (body) => req('POST', '/session/answer', body),
  result: () => req('GET', '/session/result'),
  sessionHistory: () => req('GET', '/session/history'),
  dashboardTop: () => req('GET', '/dashboard/top'),

  adminLogin: (body) => req('POST', '/admin/login', body),
  adminLogout: () => req('POST', '/admin/logout'),
  adminMe: () => req('GET', '/admin/me'),

  questions: () => req('GET', '/admin/questions'),
  createQuestion: (body) => req('POST', '/admin/questions', body),
  updateQuestion: (id, body) => req('PATCH', `/admin/questions/${id}`, body),
  setQuestionActive: (id, active) => req('PATCH', `/admin/questions/${id}/active`, { active }),
  deleteQuestion: (id) => req('DELETE', `/admin/questions/${id}`),
  questionStats: (id) => req('GET', `/admin/questions/${id}/stats`),
  reorderQuestions: (ids) => req('PUT', '/admin/questions/reorder', { ids }),

  sessions: () => req('GET', '/admin/sessions'),
  sessionResults: (id) => req('GET', `/admin/sessions/${id}/results`),
  updateAnswer: (answerId, body) => req('PATCH', `/admin/answers/${answerId}`, body),
  setVisibility: (id, hidden) => req('PATCH', `/admin/sessions/${id}/visibility`, { hiddenFromDashboard: hidden }),
  clearPlayers: () => req('DELETE', '/admin/data/players'),

  getQuizSettings: () => req('GET', '/admin/settings/quiz'),
  setQuizSettings: (body) => req('PATCH', '/admin/settings/quiz', body),

  uploadFile: async (file) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/admin/uploads', { method: 'POST', credentials: 'include', body: fd })
    const json = await res.json()
    if (!res.ok) throw Object.assign(new Error(json.message || 'Ошибка'), { code: json.error })
    return json
  },
}
