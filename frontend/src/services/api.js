/**
 * API Service for communicating with Express backend
 * Uses Fetch API with credentials: 'include' for HTTP-only cookie session persistence
 */

// Fallback to relative '/api' which works with Vite proxy locally and same-domain in production,
// or use VITE_API_URL if configured for separate domain deployment.
const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

/**
 * Helper to retrieve CSRF token from document.cookie
 */
function getCsrfTokenFromCookie() {
  const match = document.cookie.match(new RegExp('(^|;\\s*)csrf_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
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
    const csrf = getCsrfTokenFromCookie();
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
  login: (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  logout: () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  getMe: () => {
    return apiRequest('/auth/me');
  },

  getCsrfToken: () => {
    return apiRequest('/auth/csrf-token');
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
