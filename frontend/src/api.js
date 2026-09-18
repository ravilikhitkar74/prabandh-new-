// --- PRODUCTION DEPLOYMENT UPDATE ---
// Pointing to the live Render backend
const API_BASE = "https://prabandh-new.onrender.com/api";

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getBlocks: () => request("/blocks"),
  createBlock: (payload) =>
    request("/blocks", { method: "POST", body: JSON.stringify(payload) }),
  sanctionBlock: (blockId) =>
    request(`/blocks/${blockId}/sanction`, { method: "POST" }),
    
  // --- NEW: Real backend rejection ---
  rejectBlock: (blockId) =>
    request(`/blocks/${blockId}/reject`, { method: "POST" }),
    
  // --- NEW: Mark block as completed by department ---
  completeBlock: (blockId) =>
    request(`/blocks/${blockId}/complete`, { method: "POST" }),

  getConflicts: () => request("/conflicts"),
  
  // --- UPDATED SMART SHADOW MERGE ---
  shadowMerge: async (conflictOrBlockId) => {
    try {
      return await request(`/conflicts/${conflictOrBlockId}/shadow-merge`, { method: "POST" });
    } catch (err) {
      // Fallback: If backend expects a block ID instead of a conflict ID, try this route
      return await request(`/blocks/${conflictOrBlockId}/shadow-merge`, { method: "POST" });
    }
  },

  getTrains: () => request("/trains"),
  uploadTimetable: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetch(`${API_BASE}/coa/timetable`, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      body: formData,
    }).then((res) => res.json());
  },
  whatIf: (trainNo, delayMinutes, rootCause) =>
    request("/simulator/what-if", {
      method: "POST",
      body: JSON.stringify({ trainNo, delayMinutes, rootCause }),
    }),
};