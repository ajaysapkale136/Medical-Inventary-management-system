import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const Footer = () => {
  return (
    <footer className="medistock-footer">
      <div className="footer-top-accent"></div>
      
      <div className="footer-container normal-footer">
        {/* Brand & Mission */}
        <div className="footer-brand-col" id="about">
          <div className="footer-logo">
            <div className="navbar-logo-badge small">
              <svg className="navbar-logo-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div className="footer-title-group">
              <span className="footer-title">MediStock</span>
              <span className="footer-badge">GxP VALIDATED</span>
            </div>
          </div>
          <p className="footer-desc">
            Enterprise clinical supply chain infrastructure engineered for hospitals, pharmaceutical depots, and high-velocity health networks. Eliminating stock-outs and medication wastage with algorithmic FEFO precision.
          </p>
          <div className="footer-system-status">
            <span className="status-live-dot"></span>
            <span>All System Nodes Operational (24ms)</span>
          </div>
        </div>

        {/* Clinical Portals */}
        <div className="footer-col">
          <h3>Clinical Portals</h3>
          <ul className="footer-links-list">
            <li><Link to="/auth">Executive Administration</Link></li>
            <li><Link to="/auth">Central Pharmacy Hub</Link></li>
            <li><Link to="/auth">Ward & Nursing Requisitions</Link></li>
            <li><Link to="/auth">Procurement & EDI Suppliers</Link></li>
            <li><Link to="/auth">GxP Audit Compliance Portal</Link></li>
          </ul>
        </div>

        {/* Platform Capabilities */}
        <div className="footer-col">
          <h3>Capabilities</h3>
          <ul className="footer-links-list">
            <li><a href="#features">Algorithmic FEFO Dispatch</a></li>
            <li><a href="#features">Dual-Signature Ward Transfers</a></li>
            <li><a href="#features">Integrated Barcode Engine</a></li>
            <li><a href="#features">Near-Expiry Quarantine</a></li>
            <li><a href="#features">Automated PO Procurement</a></li>
          </ul>
        </div>

        {/* Compliance & Contact */}
        <div className="footer-col" id="contact">
          <h3>Standards & Support</h3>
          <div className="footer-compliance-tags">
            <span className="comp-tag">FDA 21 CFR Part 11</span>
            <span className="comp-tag">WHO-GDP Compliant</span>
            <span className="comp-tag">ISO 13485 Standards</span>
          </div>
          <div className="footer-contact-items">
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              compliance@medistock.health
            </p>
            <p>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Healthcare Innovation Hub, Pune
            </p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>© {new Date().getFullYear()} MediStock Health Systems Inc. All clinical rights reserved.</p>
          <div className="footer-legal-links">
            <a href="#compliance">Clinical Data Protection</a>
            <span>•</span>
            <a href="#compliance">GxP Audit Terms</a>
            <span>•</span>
            <a href="#compliance">Security Architecture</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;