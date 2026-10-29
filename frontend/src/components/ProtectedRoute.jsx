import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--neutral-50)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span className="spinner spinner-dark" style={{ width: '2rem', height: '2rem', borderWidth: '3px' }}></span>
          <p style={{ marginTop: '1rem', color: 'var(--neutral-600)', fontSize: '0.875rem' }}>
            Verifying admin session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
