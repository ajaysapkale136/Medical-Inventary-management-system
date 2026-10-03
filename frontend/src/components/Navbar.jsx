import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getSessionUser } from '../lib/api';
import './Layout.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getSessionUser());
  }, [location.pathname]);

  const getDashboardRoute = (role) => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'PHARMACIST') return '/pharmacy';
    return '/staff';
  };

  const handleScrollTo = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/home' && location.pathname !== '/') {
      navigate(`/home#${id}`);
      return;
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="medistock-navbar">
      {/* Brand Logo */}
      <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="navbar-logo-badge">
          <svg className="navbar-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20" />
            <path d="M7 7l10 10M17 7L7 17" strokeOpacity="0.4" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="navbar-title-group">
          <span className="navbar-logo-text">MediStock</span>
          <span className="navbar-sub-tag">ENTERPRISE</span>
        </div>
      </div>

      {/* Navigation Links */}
      <ul className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
        <li><Link to="/" onClick={() => setMobileMenuOpen(false)}>Overview</Link></li>
        <li><button type="button" className="nav-link-btn" onClick={() => handleScrollTo('solutions')}>Solutions</button></li>
        <li><button type="button" className="nav-link-btn" onClick={() => handleScrollTo('features')}>Capabilities</button></li>
        <li><button type="button" className="nav-link-btn" onClick={() => handleScrollTo('workflow')}>Logistics Pipeline</button></li>
        <li><button type="button" className="nav-link-btn" onClick={() => handleScrollTo('compliance')}>Compliance</button></li>
      </ul>

      {/* Action Buttons */}
      <div className="navbar-actions">
        {user ? (
          <button
            type="button"
            className="btn-console-nav"
            onClick={() => navigate(getDashboardRoute(user.role))}
          >
            <span className="nav-pulse-dot"></span>
            <span>{user.role} Console</span>
            <span className="nav-arrow">→</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn-login-nav"
              onClick={() => navigate('/auth')}
            >
              Sign In
            </button>
            <button
              type="button"
              className="btn-register-nav"
              onClick={() => navigate('/auth')}
            >
              Access Console
            </button>
          </>
        )}

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          className="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileMenuOpen ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;