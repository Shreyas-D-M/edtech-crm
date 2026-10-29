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

  return (
    <div className="dashboard-layout">
      {/* Top Navigation */}
      <header className="app-header">
        <div className="nav-container">
          <Link to="/dashboard" className="brand-logo" id="dashboard-brand-link">
            <span>EduReach CRM</span>
            <span className="brand-badge">Admin Workspace</span>
          </Link>

          <div className="admin-badge-group">
            <div className="admin-info-text">
              <span className="admin-info-name">{admin?.name || 'Administrator'}</span>
              <span className="admin-info-email">{admin?.email || ''}</span>
            </div>
            <Link to="/" className="btn btn-secondary btn-sm" id="view-public-portal-btn">
              Public Portal
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleLogout}
              id="admin-logout-btn"
            >
              Sign Out
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
            <p>Monitor prospective student inquiries, track communications, and update resolution statuses.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              loadStats();
              loadInquiries();
            }}
            disabled={isLoading}
            id="refresh-dashboard-btn"
          >
            {isLoading ? <span className="spinner spinner-dark" aria-hidden="true"></span> : '↻'} Refresh Data
          </button>
        </div>

        {/* Notifications & Error Banners */}
        {notification && (
          <div className="alert alert-success" role="status" id="dashboard-success-notification">
            <span>{notification}</span>
          </div>
        )}

        {apiError && (
          <div className="alert alert-error" role="alert" id="dashboard-error-banner">
            <span>{apiError}</span>
          </div>
        )}

        {/* Overview Stats Cards */}
        <section className="stats-grid" aria-label="Inquiry Metrics Overview">
          <div className="stat-card total" id="stat-card-total">
            <div className="stat-card-border-indicator"></div>
            <span className="stat-label">Total Inquiries</span>
            <span className="stat-value">{stats.total}</span>
          </div>

          <div className="stat-card new" id="stat-card-new">
            <div className="stat-card-border-indicator"></div>
            <span className="stat-label">New Inquiries</span>
            <span className="stat-value">{stats.new}</span>
          </div>

          <div className="stat-card progress" id="stat-card-progress">
            <div className="stat-card-border-indicator"></div>
            <span className="stat-label">In Progress</span>
            <span className="stat-value">{stats.inProgress}</span>
          </div>

          <div className="stat-card resolved" id="stat-card-resolved">
            <div className="stat-card-border-indicator"></div>
            <span className="stat-label">Resolved</span>
            <span className="stat-value">{stats.resolved}</span>
          </div>
        </section>

        {/* Toolbar: Filters & Multi-Parameter Search */}
        <section className="toolbar-card" aria-label="Filters and Search Controls">
          <div className="filter-bar">
            {/* Search by Name or Phone */}
            <div className="search-input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="Search by name, phone, or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                id="search-filter-input"
              />
              {filters.search && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => handleFilterChange('search', '')}
                  aria-label="Clear search"
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
              aria-label="Filter by category"
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
              aria-label="Filter by user role"
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
              aria-label="Filter by status"
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
              className="btn btn-secondary btn-sm"
              onClick={handleResetFilters}
              id="reset-filters-btn"
            >
              Reset Filters
            </button>
          </div>
        </section>

        {/* Inquiries Table Card */}
        <section className="table-card" aria-label="Inquiry Records Table">
          <div className="table-responsive">
            <table className="data-table" id="inquiries-management-table">
              <thead>
                <tr>
                  <th>Name & Role</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                      <span className="spinner spinner-dark" aria-hidden="true"></span>
                      <p style={{ marginTop: '0.75rem', color: 'var(--neutral-500)' }}>
                        Loading inquiry records...
                      </p>
                    </td>
                  </tr>
                ) : inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state-box">
                        <div className="empty-state-icon">📋</div>
                        <h3>No inquiries found</h3>
                        <p>
                          {filters.search || filters.category !== 'All' || filters.user_type !== 'All' || filters.status !== 'All'
                            ? 'No inquiries match your current filter and search criteria.'
                            : 'No inquiries have been received yet. Test by submitting an inquiry on the public portal.'}
                        </p>
                        {(filters.search || filters.category !== 'All' || filters.user_type !== 'All' || filters.status !== 'All') && (
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
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>
                          {inquiry.phone}
                        </span>
                      </td>
                      <td>
                        <a href={`mailto:${inquiry.email}`} style={{ fontSize: '0.8125rem' }}>
                          {inquiry.email}
                        </a>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{inquiry.category}</span>
                      </td>
                      <td style={{ color: 'var(--neutral-500)', fontSize: '0.8125rem' }}>
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
