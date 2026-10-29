import React, { useEffect } from 'react';

export default function InquiryDetailModal({ inquiry, onClose, onStatusChange, isUpdating }) {
  if (!inquiry) return null;

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-inquiry-title"
    >
      <div className="modal-content">
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 id="modal-inquiry-title" style={{ fontSize: '1.25rem' }}>
              Inquiry Details
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', fontFamily: 'var(--font-mono)' }}>
              ID: {inquiry.id}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close modal"
            id="close-modal-btn"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Full Name</span>
              <span className="detail-value">{inquiry.name}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Role / User Type</span>
              <span className="detail-value">
                <span className="badge badge-neutral">{inquiry.user_type}</span>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Email Address</span>
              <span className="detail-value">
                <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Phone Number</span>
              <span className="detail-value">
                <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Category</span>
              <span className="detail-value">{inquiry.category}</span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Current Status</span>
              <div style={{ marginTop: '0.25rem' }}>
                <select
                  value={inquiry.status}
                  onChange={(e) => onStatusChange(inquiry.id, e.target.value)}
                  disabled={isUpdating}
                  className={`status-select-inline ${
                    inquiry.status === 'New'
                      ? 'new'
                      : inquiry.status === 'In Progress'
                      ? 'in-progress'
                      : 'resolved'
                  }`}
                  id="modal-status-select"
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Received Date</span>
              <span className="detail-value" style={{ fontWeight: 400, fontSize: '0.875rem' }}>
                {formatDate(inquiry.created_at)}
              </span>
            </div>

            <div className="detail-item">
              <span className="detail-label">Last Updated</span>
              <span className="detail-value" style={{ fontWeight: 400, fontSize: '0.875rem' }}>
                {formatDate(inquiry.updated_at)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <span className="detail-label">Full Message / Query</span>
            <div className="message-box" id="modal-inquiry-message">
              {inquiry.message}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            id="modal-close-footer-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
