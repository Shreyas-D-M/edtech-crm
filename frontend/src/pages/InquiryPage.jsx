import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import '../styles/inquiry.css';

const USER_TYPES = ['Parent', 'Student', 'School'];
const CATEGORIES = ['Scholarship', 'Concert', 'Admission', 'General Query'];

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^[+0-9()\s.-]{7,25}$/;

export default function InquiryPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    user_type: '',
    category: '',
    message: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submittedInquiry, setSubmittedInquiry] = useState(null);

  // Validate single field or all fields
  const validateField = (name, value) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Full name is required.';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters.';
        if (value.trim().length > 100) return 'Full name cannot exceed 100 characters.';
        return '';
      case 'email':
        if (!value.trim()) return 'Email address is required.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please provide a valid email format (e.g., student@domain.com).';
        return '';
      case 'phone':
        if (!value.trim()) return 'Phone number is required.';
        const digits = (value.match(/\d/g) || []).length;
        if (!PHONE_REGEX.test(value.trim()) || digits < 7 || digits > 16) {
          return 'Please provide a valid phone number (7 to 15 digits).';
        }
        return '';
      case 'user_type':
        if (!value) return 'Please select your role.';
        if (!USER_TYPES.includes(value)) return 'Invalid role selected.';
        return '';
      case 'category':
        if (!value) return 'Please select an inquiry category.';
        if (!CATEGORIES.includes(value)) return 'Invalid category selected.';
        return '';
      case 'message':
        if (!value.trim()) return 'Inquiry message is required.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        if (value.trim().length > 2000) return 'Message cannot exceed 2000 characters.';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field-specific error as user types
    if (errors[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const err = validateField(name, value);
    if (err) {
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent duplicate submission if already processing
    if (isSubmitting) return;

    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const err = validateField(key, formData[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Focus first error field for accessibility
      const firstField = Object.keys(newErrors)[0];
      const element = document.getElementById(firstField);
      if (element) element.focus();
      return;
    }

    setErrors({});
    setServerError('');
    setIsSubmitting(true);

    try {
      const response = await api.submitInquiry(formData);
      if (response.success && response.data) {
        setSubmittedInquiry(response.data);
      } else {
        throw new Error(response.message || 'Could not complete submission.');
      }
    } catch (err) {
      if (err.details && typeof err.details === 'object') {
        setErrors(err.details);
      } else {
        setServerError(err.message || 'Unable to connect to the server. Please verify your connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      user_type: '',
      category: '',
      message: '',
    });
    setErrors({});
    setServerError('');
    setSubmittedInquiry(null);
  };

  return (
    <div className="inquiry-page-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="nav-container">
          <Link to="/" className="brand-logo" id="home-link">
            <span>EduReach CRM</span>
            <span className="brand-badge">Admissions & Inquiries</span>
          </Link>
          <div className="nav-links">
            <Link to="/login" className="btn btn-secondary btn-sm" id="admin-login-nav-btn">
              Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="inquiry-main">
        {submittedInquiry ? (
          /* Success Screen */
          <div className="success-card" id="submission-success-banner">
            <div className="success-icon-badge" aria-hidden="true">✓</div>
            <h2>Inquiry Submitted Successfully!</h2>
            <p>
              Thank you, <strong>{submittedInquiry.name}</strong>. Your inquiry has been logged in our system.
              Our academic advisory team will review your query and respond shortly.
            </p>

            <div className="success-summary-box">
              <div className="summary-item">
                <span className="summary-label">Reference ID</span>
                <span className="summary-value" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  {submittedInquiry.id}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Inquiry Category</span>
                <span className="summary-value">{submittedInquiry.category}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Role</span>
                <span className="summary-value">{submittedInquiry.user_type}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Contact Email</span>
                <span className="summary-value">{submittedInquiry.email}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Contact Phone</span>
                <span className="summary-value">{submittedInquiry.phone}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Initial Status</span>
                <span className="summary-value">
                  <span className="badge badge-new">New</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleReset}
              id="submit-another-btn"
            >
              Submit Another Inquiry
            </button>
          </div>
        ) : (
          /* Inquiry Form */
          <div className="inquiry-card">
            <div className="inquiry-header-section">
              <h1>Prospective Student & Inquiry Portal</h1>
              <p>
                Have questions regarding admissions, scholarships, campus concerts, or academic programs?
                Fill out the details below and an advisor will connect with you.
              </p>
            </div>

            {serverError && (
              <div className="alert alert-error" role="alert" id="inquiry-server-error">
                <strong>Error: </strong> {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate id="public-inquiry-form">
              {/* Dropdown Row: User Type & Category */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="user_type" className="form-label">
                    I am a <span className="required">*</span>
                  </label>
                  <select
                    id="user_type"
                    name="user_type"
                    className={`form-select ${errors.user_type ? 'has-error' : ''}`}
                    value={formData.user_type}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">-- Select Your Role --</option>
                    {USER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.user_type && <span className="form-error">{errors.user_type}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="category" className="form-label">
                    Inquiry Category <span className="required">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    className={`form-select ${errors.category ? 'has-error' : ''}`}
                    value={formData.category}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="form-error">{errors.category}</span>}
                </div>
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`form-input ${errors.name ? 'has-error' : ''}`}
                  placeholder="e.g., Alexandra Rivers"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  maxLength={100}
                  required
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Contact Row: Email & Phone */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'has-error' : ''}`}
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    maxLength={255}
                    required
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className={`form-input ${errors.phone ? 'has-error' : ''}`}
                    placeholder="+1 (555) 019-2834"
                    value={formData.phone}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                    maxLength={25}
                    required
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
              </div>

              {/* Message / Query */}
              <div className="form-group">
                <label htmlFor="message" className="form-label">
                  Message / Inquiry Details <span className="required">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className={`form-textarea ${errors.message ? 'has-error' : ''}`}
                  placeholder="Please describe your question, intended major/program, scholarship inquiries, or event details..."
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                  maxLength={2000}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  {errors.message ? (
                    <span className="form-error">{errors.message}</span>
                  ) : (
                    <span className="form-hint">Minimum 10 characters</span>
                  )}
                  <span className="char-counter">{formData.message.length} / 2000</span>
                </div>
              </div>

              {/* Submit Action */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem', padding: '0.8125rem' }}
                disabled={isSubmitting}
                id="inquiry-submit-btn"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true"></span>
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  'Submit Inquiry'
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="portal-footer">
        <p>© 2026 EduReach CRM Academic Advisory Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}
