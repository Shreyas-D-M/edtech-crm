/**
 * API Service for communicating with Express backend
 * Uses Fetch API with credentials: 'include' for HTTP-only cookie session persistence
 */

// Flexible BASE_URL resolution:
// If VITE_API_URL is configured (e.g. production host), ensure it points to /api without duplicate /api/api
// Otherwise fallback to relative '/api' which routes through the local Vite dev server proxy.
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/$/, '')}/api`)
  : '/api';

let cachedCsrfToken = null;

/**
 * Helper to retrieve CSRF token from document.cookie
 */
function getCsrfTokenFromCookie() {
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Get active CSRF token (prefers cookie, falls back to memory cache)
 */
function getCsrfToken() {
  return getCsrfTokenFromCookie() || cachedCsrfToken;
}

/**
 * Standard fetch wrapper handling credentials, CSRF, and JSON parsing
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers || {}),
  };

  // Attach CSRF token on state-changing requests if present
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes((options.method || 'GET').toUpperCase())) {
    const csrf = getCsrfToken();
    if (csrf) {
      headers['X-CSRF-Token'] = csrf;
    }
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  // Auto-cache CSRF token if returned in response payload
  if (data && data.csrfToken) {
    cachedCsrfToken = data.csrfToken;
  }

  if (!response.ok) {
    const errorMsg = (data && data.error) || response.statusText || 'Request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.details = data && data.details;
    throw error;
  }

  return data;
}

export const api = {
  // Public
  submitInquiry: (payload) => {
    return apiRequest('/inquiries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Auth
  login: async (email, password) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res && res.csrfToken) {
      cachedCsrfToken = res.csrfToken;
    }
    return res;
  },

  logout: async () => {
    cachedCsrfToken = null;
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: async () => {
    const res = await apiRequest('/auth/me');
    if (res && res.csrfToken) {
      cachedCsrfToken = res.csrfToken;
    }
    return res;
  },

  getCsrfToken: async () => {
    const res = await apiRequest('/auth/csrf-token');
    if (res && res.csrfToken) {
      cachedCsrfToken = res.csrfToken;
    }
    return res;
  },

  // Protected Inquiries
  getInquiries: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.user_type && params.user_type !== 'All') query.append('user_type', params.user_type);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    return apiRequest(`/inquiries${queryString ? `?${queryString}` : ''}`);
  },

  getInquiryById: (id) => {
    return apiRequest(`/inquiries/${id}`);
  },

  updateInquiryStatus: (id, status) => {
    return apiRequest(`/inquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Dashboard Stats
  getDashboardStats: () => {
    return apiRequest('/dashboard/stats');
  },
};
