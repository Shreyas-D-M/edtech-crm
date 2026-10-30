import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import InquiryDetailModal from '../components/InquiryDetailModal';
import '../styles/dashboard.css';

const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];
const USER_TYPES = ['Parent', 'Student', 'School'];
const STATUSES = ['New', 'In Progress', 'Resolved'];

export default function DashboardPage() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  // Stats state
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    inProgress: 0,
    resolved: 0,
  });

  // Table & Filters state
  const [inquiries, setInquiries] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    user_type: 'All',
    status: 'All',
    page: 1,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [apiError, setApiError] = useState('');
  const [notification, setNotification] = useState('');

  // Fetch Dashboard Statistics
  const loadStats = useCallback(async () => {
    try {
      const res = await api.getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
      }
    }
  }, [logout, navigate]);

  // Fetch Inquiries with active filters & pagination
  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const res = await api.getInquiries(filters);
      if (res.success && res.data) {
        setInquiries(res.data.inquiries || []);
        setPagination(res.data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setApiError(err.message || 'Failed to fetch inquiries. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, logout, navigate]);

  // Load data on mount & filter changes
  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on any filter adjustment
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      user_type: 'All',
      status: 'All',
      page: 1,
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Status Change Handler (Persisted to database)
  const handleStatusChange = async (inquiryId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      const res = await api.updateInquiryStatus(inquiryId, newStatus);
      if (res.success && res.data) {
        // Update local inquiry list
        setInquiries((prev) =>
          prev.map((item) => (item.id === inquiryId ? { ...item, status: newStatus } : item))
        );

        // Update modal if open
        if (selectedInquiry && selectedInquiry.id === inquiryId) {
          setSelectedInquiry((prev) => ({ ...prev, status: newStatus }));
        }

        // Show brief notification
        setNotification(`Inquiry status updated to "${newStatus}".`);
        setTimeout(() => setNotification(''), 3000);

        // Recompute stats
        loadStats();
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true });
        return;
      }
      setApiError(err.message || 'Failed to update status in database.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.category !== 'All' ||
    filters.user_type !== 'All' ||
    filters.status !== 'All';

  const adminInitial = (admin?.name || admin?.email || 'A').charAt(0).toUpperCase();

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <header className="app-header">
        <div className="nav-container">
          <Link to="/dashboard" className="brand-logo" id="dashboard-brand-link" aria-label="EduReach CRM Dashboard">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--primary-700)' }}
              aria-hidden="true"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
              <path d="M6 14h6" />
            </svg>
            <span>EduReach CRM</span>
            <span className="brand-badge">Admissions</span>
          </Link>

          <div className="admin-badge-group">
            <div className="admin-profile-pill">
              <div className="admin-avatar" aria-hidden="true">
                {adminInitial}
              </div>
              <div className="admin-info-text">
                <span className="admin-info-name">{admin?.name || 'Administrator'}</span>
                <span className="admin-info-email">{admin?.email || ''}</span>
              </div>
            </div>
            <Link to="/" className="btn btn-secondary btn-sm" id="view-public-portal-btn">
              Public Portal
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleLogout}
              id="admin-logout-btn"
              aria-label="Sign Out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="dashboard-container">
        {/* Header with Title & Refresh */}
        <div className="dashboard-header">
          <div>
            <h1>Inquiry Management Dashboard</h1>
            <p>Monitor prospective student inquiries, track communications, and update resolution statuses in real-time.</p>
          </div>
          <div className="dashboard-header-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                loadStats();
                loadInquiries();
              }}
              disabled={isLoading}
              id="refresh-dashboard-btn"
              aria-label="Refresh Dashboard Data"
            >
              {isLoading ? (
                <span className="spinner spinner-dark" aria-hidden="true"></span>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                </svg>
              )}
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Notifications & Error Banners */}
        {notification && (
          <div className="alert alert-success" role="status" id="dashboard-success-notification">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{notification}</span>
          </div>
        )}

        {apiError && (
          <div className="alert alert-error" role="alert" id="dashboard-error-banner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <section className="stats-grid" aria-label="Inquiry Metrics Overview">
          {/* Total Inquiries */}
          <div className="stat-card total" id="stat-card-total">
            <div className="stat-card-border-indicator"></div>
            <div className="stat-card-header">
              <span className="stat-label">Total Inquiries</span>
              <div className="stat-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
            </div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-subtext">All-time logged records</span>
          </div>

          {/* New Inquiries */}
          <div className="stat-card new" id="stat-card-new">
            <div className="stat-card-border-indicator"></div>
            <div className="stat-card-header">
              <span className="stat-label">New Inquiries</span>
              <div className="stat-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>
            <span className="stat-value">{stats.new}</span>
            <span className="stat-subtext">Awaiting initial review</span>
          </div>

          {/* In Progress */}
          <div className="stat-card progress" id="stat-card-progress">
            <div className="stat-card-border-indicator"></div>
            <div className="stat-card-header">
              <span className="stat-label">In Progress</span>
              <div className="stat-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-subtext">Under active follow-up</span>
          </div>

          {/* Resolved */}
          <div className="stat-card resolved" id="stat-card-resolved">
            <div className="stat-card-border-indicator"></div>
            <div className="stat-card-header">
              <span className="stat-label">Resolved</span>
              <div className="stat-card-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <span className="stat-value">{stats.resolved}</span>
            <span className="stat-subtext">Inquiries concluded</span>
          </div>
        </section>

        {/* Inquiry Directory Section */}
        <section className="inquiry-section-wrapper" aria-label="Inquiry Management Directory">
          <div className="inquiry-section-header">
            <div className="inquiry-section-title-group">
              <h2>Inquiry Records</h2>
              <span className="badge badge-neutral" id="inquiry-total-badge">
                {pagination.total} {pagination.total === 1 ? 'Record' : 'Records'}
              </span>
            </div>
          </div>

          {/* Toolbar: Filters & Multi-Parameter Search */}
          <div className="filter-bar">
            {/* Search Input */}
            <div className="search-input-wrapper">
              <span className="search-input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Search name, phone, or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                id="search-filter-input"
                aria-label="Search inquiries"
              />
              {filters.search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => handleFilterChange('search', '')}
                  aria-label="Clear search input"
                  id="clear-search-btn"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter */}
            <select
              className="form-select"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              id="category-filter-select"
              aria-label="Filter by Category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* User Type Filter */}
            <select
              className="form-select"
              value={filters.user_type}
              onChange={(e) => handleFilterChange('user_type', e.target.value)}
              id="user-type-filter-select"
              aria-label="Filter by Role"
            >
              <option value="All">All Roles</option>
              {USER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              id="status-filter-select"
              aria-label="Filter by Status"
            >
              <option value="All">All Statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            {/* Reset Filters Button */}
            <button
              type="button"
              className={`btn btn-secondary btn-sm ${hasActiveFilters ? 'active' : ''}`}
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              id="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>

          {/* Inquiries Table */}
          <div className="table-responsive">
            <table className="data-table" id="inquiries-management-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Contact Info</th>
                  <th>Category</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem' }}>
                      <span className="spinner spinner-dark" aria-hidden="true"></span>
                      <p style={{ marginTop: '0.75rem', color: 'var(--neutral-500)', fontSize: '0.875rem' }}>
                        Loading inquiry records...
                      </p>
                    </td>
                  </tr>
                ) : inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state-box">
                        <div className="empty-state-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <h3>No Inquiries Found</h3>
                        <p>
                          {hasActiveFilters
                            ? 'No inquiries match your current filter and search criteria.'
                            : 'No inquiries have been received yet. Test by submitting an inquiry on the public portal.'}
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={handleResetFilters}
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inquiry) => (
                    <tr key={inquiry.id} id={`inquiry-row-${inquiry.id}`}>
                      <td>
                        <div className="table-name-cell">
                          <span className="table-name-bold">{inquiry.name}</span>
                          <span className="table-user-type-sub">{inquiry.user_type}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--neutral-800)' }}>
                            {inquiry.phone}
                          </span>
                          <a
                            href={`mailto:${inquiry.email}`}
                            style={{ fontSize: '0.8125rem', color: 'var(--primary-600)' }}
                            title={`Send email to ${inquiry.email}`}
                          >
                            {inquiry.email}
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{inquiry.category}</span>
                      </td>
                      <td style={{ color: 'var(--neutral-600)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                        {formatDate(inquiry.created_at)}
                      </td>
                      <td>
                        <select
                          value={inquiry.status}
                          onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                          disabled={isUpdatingStatus}
                          className={`status-select-inline ${
                            inquiry.status === 'New'
                              ? 'new'
                              : inquiry.status === 'In Progress'
                              ? 'in-progress'
                              : 'resolved'
                          }`}
                          aria-label={`Change status for ${inquiry.name}`}
                          id={`status-dropdown-${inquiry.id}`}
                        >
                          <option value="New">New</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setSelectedInquiry(inquiry)}
                          id={`view-details-btn-${inquiry.id}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="pagination-bar">
              <div>
                Showing{' '}
                <strong>
                  {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
                </strong>{' '}
                to{' '}
                <strong>
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </strong>{' '}
                of <strong>{pagination.total}</strong> inquiries
              </div>

              <div className="pagination-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1 || isLoading}
                  id="pagination-prev-btn"
                >
                  ← Previous
                </button>
                <span>
                  Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong>
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages || isLoading}
                  id="pagination-next-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Inquiry Detail Modal */}
        {selectedInquiry && (
          <InquiryDetailModal
            inquiry={selectedInquiry}
            onClose={() => setSelectedInquiry(null)}
            onStatusChange={handleStatusChange}
            isUpdating={isUpdatingStatus}
          />
        )}
      </main>
    </div>
  );
}
