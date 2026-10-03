import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, storeSessionUser } from './lib/api';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('pharmacist');
  const [form, setForm] = useState({
    name: '', email: '', password: '', securityToken: '', licenseNumber: '', staffId: ''
  });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const destinationForRole = (userRole) => {
    if (userRole === 'ADMIN') return '/admin';
    if (userRole === 'PHARMACIST') return '/pharmacy';
    return '/staff';
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const user = await apiRequest(isLogin ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(isLogin
          ? { email: form.email, password: form.password }
          : {
              name: form.name,
              email: form.email,
              password: form.password,
              role,
              securityToken: form.securityToken,
              department: role === 'pharmacist' ? 'Pharmacy' : 'Operations',
            }),
      });
      storeSessionUser(user);
      navigate(destinationForRole(user.role), { replace: true });
    } catch (error) {
      setMessage(error.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ice-auth-wrapper">
      {/* Ambient Ice Glow Background */}
      <div className="ice-ambient-glow"></div>

      <div className="ice-glass-auth-card">
        
        {/* Top Header & Moving Medical Icon */}
        <div className="auth-icon-header">
          <div className="dot-grid"></div>
          <div className="medical-icon-wrapper">
            <span className="medical-symbol">⚕️</span>
          </div>
          <div className="dot-grid"></div>
        </div>

        <h1 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
        <p className="auth-subtitle">
          {isLogin ? "Don't have an account yet? " : "Already have an account? "}
          <button type="button" className="auth-toggle-link" onClick={() => { setIsLogin(!isLogin); setMessage(''); }}>
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

        {/* Integrated Role Selector */}
        <div className="role-segment-control">
          <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin</button>
          <button type="button" className={role === 'pharmacist' ? 'active' : ''} onClick={() => setRole('pharmacist')}>Pharmacist</button>
          <button type="button" className={role === 'staff' ? 'active' : ''} onClick={() => setRole('staff')}>Staff</button>
        </div>

        {/* Auth Form */}
        <form className="ice-form" onSubmit={handleSubmit}>
          
          {!isLogin && (
            <div className="input-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input name="name" value={form.name} onChange={updateField} type="text" placeholder="Full Name" required />
            </div>
          )}

          <div className="input-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <input name="email" value={form.email} onChange={updateField} type="email" placeholder="Email Address" required />
          </div>

          {/* Dynamic Role Fields (Registration only) */}
          {!isLogin && role === 'admin' && (
            <div className="input-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              <input name="securityToken" value={form.securityToken} onChange={updateField} type="password" placeholder="Admin Security Token (default: change-me)" required />
            </div>
          )}
          {!isLogin && role === 'pharmacist' && (
            <div className="input-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input name="licenseNumber" value={form.licenseNumber} onChange={updateField} type="text" placeholder="License Number" />
            </div>
          )}
          {!isLogin && role === 'staff' && (
            <div className="input-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
              <input name="staffId" value={form.staffId} onChange={updateField} type="text" placeholder="Staff ID" />
            </div>
          )}

          <div className="input-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <input name="password" value={form.password} onChange={updateField} type="password" placeholder="Password" minLength="8" required />
          </div>

          {message && <p className="auth-feedback" role="alert">{message}</p>}
          <button type="submit" className="ice-matte-submit-btn" disabled={submitting}>
            {submitting ? 'Please wait...' : isLogin ? 'Login' : 'Register'}
          </button>

          {isLogin && (
            <div className="demo-credentials-bar">
              <span className="demo-label">Quick Demo Sign-In:</span>
              <div className="demo-btn-group">
                <button type="button" className="demo-pill" onClick={() => {
                  setRole('admin');
                  setForm((prev) => ({ ...prev, email: 'admin@medistock.com', password: 'Admin@1234' }));
                }}>Admin</button>
                <button type="button" className="demo-pill" onClick={() => {
                  setRole('pharmacist');
                  setForm((prev) => ({ ...prev, email: 'pharmacist@medistock.com', password: 'Pharma@1234' }));
                }}>Pharmacist</button>
                <button type="button" className="demo-pill" onClick={() => {
                  setRole('staff');
                  setForm((prev) => ({ ...prev, email: 'staff@medistock.com', password: 'Staff@1234' }));
                }}>Staff</button>
              </div>
            </div>
          )}
        </form>

        {/* Hospital Enterprise SSO */}
        {isLogin && (
          <div className="social-login-area">
            <div className="or-divider">
              <span>HOSPITAL WORKSPACE SSO</span>
            </div>
            
            <button 
              type="button" 
              className="ice-matte-submit-btn" 
              style={{ 
                marginTop: '1rem', 
                background: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(144, 224, 239, 0.25)', 
                color: '#CAF0F8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onClick={() => setMessage('Hospital Enterprise SSO (SAML 2.0 / Active Directory) is available in production clusters.')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Single Sign-On (Active Directory)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Auth;
