/** Use /api in dev (Vite proxy) and production (nginx proxy). Override with VITE_API_URL if needed. */
export const API = import.meta.env.VITE_API_URL || '/api';

async function parseJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function authRegister(payload) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || data.error || 'பதிவு தோல்வியடைந்தது.');
  }
  return data;
}

export async function authLogin(payload) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || data.error || 'உள்நுழைவு தோல்வியடைந்தது.');
  }
  return data;
}

export function saveSession(authResponse) {
  localStorage.setItem('lawvoice-session', JSON.stringify({
    id: authResponse.user.id,
    token: authResponse.token,
    role: authResponse.user.role,
    email: authResponse.user.email,
    name: authResponse.user.name,
    phone: authResponse.user.phone,
    district: authResponse.user.district,
    lawyerProfile: authResponse.user.lawyerProfile,
    loggedInAt: new Date().toISOString()
  }));
}

export async function updateLawyerProfile(payload) {
  const session = JSON.parse(localStorage.getItem('lawvoice-session') || '{}');
  const token = session.token;
  const res = await fetch(`${API}/auth/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || data.error || 'சுயவிவரத்தை புதுப்பிக்க முடியவில்லை.');
  }
  return data;
}

export async function bookConsultation(payload) {
  const res = await fetch(`${API}/consultations/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
}

export async function fetchClientConsultations(name, phone) {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (phone) params.append('phone', phone);
  const res = await fetch(`${API}/consultations/client?${params}`);
  return parseJson(res);
}

export async function fetchLawyerConsultations(lawyerId, lawyerName) {
  const params = new URLSearchParams();
  if (lawyerId) params.append('lawyerId', lawyerId);
  if (lawyerName) params.append('lawyerName', lawyerName);
  const res = await fetch(`${API}/consultations/lawyer?${params}`);
  return parseJson(res);
}

export async function updateConsultationStatus(id, status) {
  const res = await fetch(`${API}/consultations/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return parseJson(res);
}

export async function uploadVaultDocument(payload) {
  const res = await fetch(`${API}/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
}

export async function fetchMyVault(name, phone) {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (phone) params.append('phone', phone);
  const res = await fetch(`${API}/documents/my-vault?${params}`);
  return parseJson(res);
}

export async function fetchSharedDocuments(lawyerId, lawyerName) {
  const params = new URLSearchParams();
  if (lawyerId) params.append('lawyerId', lawyerId);
  if (lawyerName) params.append('lawyerName', lawyerName);
  const res = await fetch(`${API}/documents/shared-with-me?${params}`);
  return parseJson(res);
}

export async function shareVaultDocument(id, lawyerId, lawyerName, consultationId) {
  const res = await fetch(`${API}/documents/${id}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lawyerId, lawyerName, consultationId })
  });
  return parseJson(res);
}

export async function sendChatMessage(payload) {
  const res = await fetch(`${API}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
}

export async function fetchChatHistory(consultationId) {
  const res = await fetch(`${API}/chat/${consultationId}`);
  return parseJson(res);
}

export async function generateRtiDraft(payload) {
  const res = await fetch(`${API}/rti/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
}

export async function fetchMyRtiDrafts(name, phone) {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (phone) params.append('phone', phone);
  const res = await fetch(`${API}/rti/my-drafts?${params}`);
  return parseJson(res);
}

export async function createLegalDeadline(payload) {
  const res = await fetch(`${API}/deadlines/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
}

export async function fetchMyDeadlines(name, phone) {
  const params = new URLSearchParams();
  if (name) params.append('name', name);
  if (phone) params.append('phone', phone);
  const res = await fetch(`${API}/deadlines/my-deadlines?${params}`);
  return parseJson(res);
}

export async function updateDeadlineStatus(id, status) {
  const res = await fetch(`${API}/deadlines/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return parseJson(res);
}


