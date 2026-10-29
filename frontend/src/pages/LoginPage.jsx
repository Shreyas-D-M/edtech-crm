import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Invalid credentials or server error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Header */}
      <header className="app-header">
        <div className="nav-container">
          <Link to="/" className="brand-logo" id="home-link">
            <span>EduReach CRM</span>
            <span className="brand-badge">Admissions</span>
          </Link>
          <div className="nav-links">
            <Link to="/" className="btn btn-secondary btn-sm" id="public-form-nav-btn">
              ← Public Form
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="login-main">
        <div className="login-card">
          <div className="login-header">
            <div className="login-header-icon" aria-hidden="true">🔒</div>
            <h1>Admin Portal Login</h1>
            <p>Enter your administrator credentials to access inquiry management.</p>
          </div>

          {errorMessage && (
            <div className="alert alert-error" role="alert" id="login-error-alert">
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate id="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-email" className="form-label">
                Admin Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="admin-email"
                name="email"
                className="form-input"
                placeholder="admin@edtech.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="admin-password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="admin-password"
                  name="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '0.8125rem' }}
              disabled={isSubmitting}
              id="login-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="login-tip-box">
            <strong>System Setup Note:</strong>
            <p style={{ marginTop: '0.25rem' }}>
              Admin accounts are configured securely via CLI. Run <code>npm run create-admin</code> inside <code>backend/</code> to provision your credentials.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
