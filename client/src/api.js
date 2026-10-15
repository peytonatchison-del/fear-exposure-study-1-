// Thin fetch wrapper for the study API. Every function returns parsed JSON
// and throws an Error with the server's message on failure, so screens can
// just try/catch and show err.message.

const BASE = ''; // same-origin in dev (via Vite proxy) and in production.

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('researcherToken');
  if (path.startsWith('/api/researcher') && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(BASE + path, { ...options, headers });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : await res.text();
  if (!res.ok) {
    const message = (isJson && data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Public / participant-facing
  getProtocol: () => request('/api/protocol'),
  getAppMode: () => request('/api/app-mode'),
  getSessionPlan: (sessionNumber, categoryId, demo) =>
    request(`/api/protocol/session-plan?sessionNumber=${sessionNumber}&categoryId=${encodeURIComponent(categoryId)}&demo=${demo ? '1' : '0'}`),

  createParticipant: (demo) => request('/api/participants', { method: 'POST', body: JSON.stringify({ demo }) }),
  getParticipant: (code) => request(`/api/participants/${encodeURIComponent(code)}`),
  ackConsent: (code) => request(`/api/participants/${encodeURIComponent(code)}/consent`, { method: 'POST' }),
  setCategory: (code, fearCategoryId) =>
    request(`/api/participants/${encodeURIComponent(code)}/category`, {
      method: 'PATCH',
      body: JSON.stringify({ fearCategoryId }),
    }),
  withdraw: (code) => request(`/api/participants/${encodeURIComponent(code)}/withdraw`, { method: 'POST' }),

  submitAssessment: (code, payload) =>
    request(`/api/participants/${encodeURIComponent(code)}/assessments`, { method: 'POST', body: JSON.stringify(payload) }),
  getAssessments: (code) => request(`/api/participants/${encodeURIComponent(code)}/assessments`),

  submitExposureResponse: (code, payload) =>
    request(`/api/participants/${encodeURIComponent(code)}/exposure-responses`, { method: 'POST', body: JSON.stringify(payload) }),
  uploadRecording: (code, formData) =>
    request(`/api/participants/${encodeURIComponent(code)}/recordings`, { method: 'POST', body: formData }),
  getSessionResponses: (code, sessionNumber) =>
    request(`/api/participants/${encodeURIComponent(code)}/sessions/${sessionNumber}/responses`),
  getSessionStatus: (code, sessionNumber) =>
    request(`/api/participants/${encodeURIComponent(code)}/sessions/${sessionNumber}`),
  completeSession: (code, sessionNumber) =>
    request(`/api/participants/${encodeURIComponent(code)}/sessions/${sessionNumber}/complete`, { method: 'POST' }),

  // Researcher
  researcherLogin: (username, password) =>
    request('/api/researcher/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  researcherMe: () => request('/api/researcher/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/api/researcher/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),

  getFullProtocol: () => request('/api/researcher/protocol'),
  putCategories: (categories) =>
    request('/api/researcher/categories', { method: 'PUT', body: JSON.stringify({ categories }) }),
  putQuestionnaire: (questionnaireItems) =>
    request('/api/researcher/questionnaire', { method: 'PUT', body: JSON.stringify({ questionnaireItems }) }),
  putStudySettings: (settings) => request('/api/researcher/study-settings', { method: 'PUT', body: JSON.stringify(settings) }),
  putIrbChecklist: (payload) => request('/api/researcher/irb-checklist', { method: 'PUT', body: JSON.stringify(payload) }),

  getStimuli: () => request('/api/researcher/stimuli'),
  putStimulus: (payload) => request('/api/researcher/stimuli', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadStimulus: (formData) => request('/api/researcher/stimuli/upload', { method: 'POST', body: formData }),
  deleteStimulus: (id) => request(`/api/researcher/stimuli/${id}`, { method: 'DELETE' }),
  uploadAudienceVideo: (id, formData) =>
    request(`/api/researcher/stimuli/${id}/audience-video`, { method: 'POST', body: formData }),
  // A large classroom/crowd video can take a while to upload, especially over
  // a slow connection, and plain fetch() gives no way to show progress while
  // it's in flight — from the researcher's side it just looks like clicking
  // the button did nothing for a long time. XMLHttpRequest exposes real
  // upload-progress events, so onProgress(percent) can drive a visible
  // "Uploading… 42%" indicator instead.
  uploadAudienceVideoWithProgress: (id, formData, onProgress) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/researcher/stimuli/${id}/audience-video`);
      const token = localStorage.getItem('researcherToken');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let data = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          // non-JSON response (e.g. a proxy error page) — fall through with {}
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || `Upload failed (server responded ${xhr.status}).`));
      };
      xhr.onerror = () =>
        reject(new Error('Upload failed — the connection was interrupted or the file may be too large for the server to accept.'));
      xhr.ontimeout = () => reject(new Error('Upload timed out — try a smaller file or a faster connection.'));
      xhr.timeout = 20 * 60 * 1000; // 20 minutes, generous for a large video on a slow upload
      xhr.send(formData);
    }),
  updateAudienceVideoCredit: (id, credit) =>
    request(`/api/researcher/stimuli/${id}/audience-video-credit`, { method: 'PUT', body: JSON.stringify({ credit }) }),
  clearAudienceVideo: (id) => request(`/api/researcher/stimuli/${id}/audience-video`, { method: 'DELETE' }),

  // College Admissions Session 3's rejection letter — an image the researcher
  // uploads themselves (never generated by the app). Small file, so this
  // uses the plain fetch-based `request` helper rather than the
  // progress-tracking XHR path used for large audience videos above.
  uploadRejectionLetter: (id, formData) =>
    request(`/api/researcher/stimuli/${id}/rejection-letter`, { method: 'POST', body: formData }),
  clearRejectionLetter: (id) => request(`/api/researcher/stimuli/${id}/rejection-letter`, { method: 'DELETE' }),

  getParticipants: (includeDemo = true) => request(`/api/researcher/participants?includeDemo=${includeDemo ? '1' : '0'}`),
  getParticipantDetail: (code) => request(`/api/researcher/participants/${encodeURIComponent(code)}`),
  deleteDemoData: () => request('/api/researcher/demo-data', { method: 'DELETE' }),
  getSummary: (includeDemo = true) => request(`/api/researcher/summary?includeDemo=${includeDemo ? '1' : '0'}`),

  // CSV export routes require the researcher auth header, so a plain <a href>
  // won't carry it — fetch as a blob and trigger a save instead.
  downloadExport: async (name, includeDemo = true) => {
    const token = localStorage.getItem('researcherToken');
    const res = await fetch(`/api/researcher/export/${name}?includeDemo=${includeDemo ? '1' : '0'}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Export failed (${res.status})`);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
