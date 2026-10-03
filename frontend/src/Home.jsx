import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionUser } from './lib/api';
import './App.css';

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admin');
  const user = getSessionUser();

  const getDashboardRoute = (role) => {
    if (role === 'ADMIN') return '/admin';
    if (role === 'PHARMACIST') return '/pharmacy';
    return '/staff';
  };

  const handleLaunch = () => {
    if (user) {
      navigate(getDashboardRoute(user.role));
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="home-page-root">
      {/* Background Ambient Glow Gradients */}
      <div className="ambient-radial-glow top-left"></div>
      <div className="ambient-radial-glow bottom-right"></div>
      <div className="ambient-grid-overlay"></div>

      {/* =========================================================================
          1. HERO COMMAND CENTER SECTION
         ========================================================================= */}
      <section className="hero-command-section" id="overview">
        <div className="hero-content-container">
          
          {/* Left Column: Authoritative Copy & Direct Actions */}
          <div className="hero-text-column">
            <div className="hero-status-pill">
              <span className="live-pulse-dot"></span>
              <span className="pill-text">GxP &amp; FDA 21 CFR PART 11 VALIDATED PLATFORM</span>
            </div>

            <h1 className="hero-main-title">
              Intelligent Medical Supply &amp; Ward Dispensation <span className="gradient-highlight">Command Center</span>
            </h1>

            <p className="hero-lead-description">
              Enterprise pharmaceutical logistics engineered for multi-specialty hospitals. 
              Enforcing automated FEFO dispatch, cold-chain temperature surveillance, 
              cryptographic audit trails, and multi-tier ward distribution with zero latency.
            </p>

            <div className="hero-action-buttons">
              <button 
                type="button" 
                className="btn-primary-hero" 
                onClick={handleLaunch}
              >
                <span>{user ? `Open ${user.role} Console` : 'Launch Medical Console'}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <a href="#solutions" className="btn-secondary-hero">
                <span>Explore Architecture</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="hero-mini-kpi-row">
              <div className="mini-kpi-item">
                <span className="kpi-val">99.98%</span>
                <span className="kpi-lbl">Dispense Accuracy</span>
              </div>
              <div className="mini-kpi-divider"></div>
              <div className="mini-kpi-item">
                <span className="kpi-val">&lt; 90s</span>
                <span className="kpi-lbl">Ward Requisition Speed</span>
              </div>
              <div className="mini-kpi-divider"></div>
              <div className="mini-kpi-item">
                <span className="kpi-val">Zero</span>
                <span className="kpi-lbl">Expiry Stock-Outs</span>
              </div>
              <div className="mini-kpi-divider"></div>
              <div className="mini-kpi-item">
                <span className="kpi-val">SHA-256</span>
                <span className="kpi-lbl">GxP Audit Trail</span>
              </div>
            </div>
          </div>

          {/* Right Column: Moving Chakra & Orbiting Circles */}
          <div className="hero-visual-column">
            <div className="chakra-moving-circle-wrapper">
              
              {/* Special Orbital Circles */}
              <div className="special-circle orbit-track-1">
                <div className="orbiting-object obj-1">
                  <div className="node-icon ice-glow textless-icon">💊</div>
                </div>
              </div>
              
              <div className="special-circle orbit-track-2">
                <div className="orbiting-object obj-2">
                  <div className="node-icon deep-ice-glow textless-icon">💉</div>
                </div>
              </div>

              <div className="special-circle orbit-track-3">
                <div className="orbiting-object obj-3">
                  <div className="node-icon ice-glow textless-icon">🧪</div>
                </div>
              </div>

              {/* Chakra Core */}
              <div className="chakra-core">
                <div className="chakra-blade outer-blades"></div>
                <div className="chakra-blade middle-ring"></div>
                <div className="chakra-blade inner-spokes"></div>
                <div className="chakra-hub">
                  <div className="hub-core-light"></div>
                </div>
              </div>

              {/* Floating Live Telemetry Badge */}
              <div className="floating-telemetry-badge">
                <div className="telemetry-badge-header">
                  <span className="badge-live-dot"></span>
                  <span>LIVE FEFO PROTOCOL DISPATCH</span>
                </div>
                <div className="telemetry-badge-body">
                  <span>Batch #BT-9042 (Amoxicillin 500mg)</span>
                  <span className="badge-fefo-status">Oldest Expiry Prioritized</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          2. LIVE OPERATIONAL TELEMETRY METRICS BANNER
         ========================================================================= */}
      <section className="telemetry-banner-section" id="telemetry">
        <div className="section-container">
          <div className="telemetry-grid">
            
            {/* Metric 1 */}
            <div className="telemetry-card">
              <div className="telemetry-top">
                <span className="metric-label">Managed Batches</span>
                <span className="metric-badge-pill positive">+14.2% MoM</span>
              </div>
              <div className="metric-large-val">24,850<span className="metric-unit"> units</span></div>
              <p className="metric-desc">Serialized barcodes mapped across 14 central and satellite ward bins.</p>
              <div className="metric-bar-track">
                <div className="metric-bar-fill" style={{ width: '88%' }}></div>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="telemetry-card">
              <div className="telemetry-top">
                <span className="metric-label">Expiry Wastage</span>
                <span className="metric-badge-pill zero-risk">0 Incidents</span>
              </div>
              <div className="metric-large-val">99.98%<span className="metric-unit"> saved</span></div>
              <p className="metric-desc">Automated FEFO dispatch algorithm eliminates expired inventory write-offs.</p>
              <div className="metric-bar-track">
                <div className="metric-bar-fill emerald" style={{ width: '99.98%' }}></div>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="telemetry-card">
              <div className="telemetry-top">
                <span className="metric-label">Ward Transfer Turnaround</span>
                <span className="metric-badge-pill positive">&lt; 90s SLA</span>
              </div>
              <div className="metric-large-val">1.4<span className="metric-unit"> min</span></div>
              <p className="metric-desc">Average dual-auth requisition-to-dispatch turnaround across all wards.</p>
              <div className="metric-bar-track">
                <div className="metric-bar-fill" style={{ width: '74%' }}></div>
              </div>
            </div>

            {/* Metric 4 */}
            <div className="telemetry-card">
              <div className="telemetry-top">
                <span className="metric-label">GxP Audit Compliance</span>
                <span className="metric-badge-pill compliance">21 CFR Part 11</span>
              </div>
              <div className="metric-large-val">100.0%<span className="metric-unit"> verified</span></div>
              <p className="metric-desc">Cryptographic SHA-256 event chaining on every stock change and dispense.</p>
              <div className="metric-bar-track">
                <div className="metric-bar-fill emerald" style={{ width: '100%' }}></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CLINICAL ROLE-BASED PORTALS SHOWCASE
         ========================================================================= */}
      <section className="solutions-section" id="solutions">
        <div className="section-container">
          
          <div className="section-header-block">
            <span className="section-kicker">ROLE-SPECIFIC ARCHITECTURE</span>
            <h2 className="section-title">Tailored Clinical Portals for Every Hospital Stakeholder</h2>
            <p className="section-subtitle">
              Strict role-based isolation ensures clinical teams only access workflows relevant to their operational authority.
            </p>

            {/* Role Tab Navigation */}
            <div className="role-tabs-bar">
              <button 
                type="button" 
                className={`role-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                <span className="tab-icon">🛡️</span>
                <span>Hospital Administration</span>
              </button>
              <button 
                type="button" 
                className={`role-tab-btn ${activeTab === 'pharmacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('pharmacy')}
              >
                <span className="tab-icon">💊</span>
                <span>Central Pharmacy</span>
              </button>
              <button 
                type="button" 
                className={`role-tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
                onClick={() => setActiveTab('staff')}
              >
                <span className="tab-icon">🏥</span>
                <span>Ward &amp; Clinical Staff</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="role-display-card">
            {activeTab === 'admin' && (
              <div className="role-content-split">
                <div className="role-info-side">
                  <div className="role-badge-tag admin">EXECUTIVE COMMAND</div>
                  <h3 className="role-heading">Hospital Administration &amp; Governance</h3>
                  <p className="role-text">
                    Complete institutional visibility over inventory valuation, vendor SLA compliance, 
                    departmental burn rates, and tamper-proof GxP regulatory audit logs.
                  </p>
                  <ul className="role-capabilities-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Total Inventory Financials:</strong> Live asset valuation, stock shrinkage metrics, and capital burn rate.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Cryptographic GxP Audit Trail:</strong> Immutable SHA-256 log ledger of every dispense, transfer, and disposal.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Supplier Governance &amp; Purchase Orders:</strong> Automated EDI procurement lifecycle and vendor scoring.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Regulatory PDF &amp; CSV Exports:</strong> Formatted compliance packages ready for hospital accreditation bodies.</span>
                    </li>
                  </ul>
                  <button type="button" className="btn-role-action" onClick={() => navigate('/auth')}>
                    Access Admin Console →
                  </button>
                </div>
                <div className="role-preview-side">
                  <div className="mock-dashboard-card">
                    <div className="mock-card-header">
                      <span>Live Audit Surveillance Feed</span>
                      <span className="mock-pill green">Active Stream</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">BATCH_ALLOCATION</span>
                      <span className="log-entity">Batch #BT-8890 (Propofol)</span>
                      <span className="log-time">12s ago</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">WARD_TRANSFER_APPROVE</span>
                      <span className="log-entity">Surgical Ward → ICU</span>
                      <span className="log-time">45s ago</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">PO_AUTO_TRIGGER</span>
                      <span className="log-entity">Order #PO-1049 (Insulin Glargine)</span>
                      <span className="log-time">2m ago</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">QUARANTINE_SEAL</span>
                      <span className="log-entity">Batch #BT-7721 Expiring in 15d</span>
                      <span className="log-time">5m ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'pharmacy' && (
              <div className="role-content-split">
                <div className="role-info-side">
                  <div className="role-badge-tag pharmacy">CLINICAL DISPENSARY</div>
                  <h3 className="role-heading">Central Pharmacy &amp; Batch Management</h3>
                  <p className="role-text">
                    Engineered for high-volume hospital dispensaries. Enforces First-Expired-First-Out (FEFO) 
                    order allocation, instant barcode receiving, and automatic quarantine of near-expiry lots.
                  </p>
                  <ul className="role-capabilities-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Algorithmic FEFO Dispensing:</strong> Auto-selects oldest viable lots to prevent shelf expiration.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Instant Barcode Inwarding:</strong> Native camera barcode scanner + physical USB laser gun integration.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Automated Expiry Quarantining:</strong> Configurable 15d/30d critical thresholds isolate risky batches.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Emergency Batch Recall:</strong> One-click hospital-wide freeze on contaminated or flagged lot numbers.</span>
                    </li>
                  </ul>
                  <button type="button" className="btn-role-action" onClick={() => navigate('/auth')}>
                    Access Pharmacy Console →
                  </button>
                </div>
                <div className="role-preview-side">
                  <div className="mock-dashboard-card">
                    <div className="mock-card-header">
                      <span>FEFO Dispatch Queue</span>
                      <span className="mock-pill cyan">Algorithmic</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action text-cyan">LOT #A-201</span>
                      <span className="log-entity">Paracetamol 500mg (Exp: 14d)</span>
                      <span className="mock-tag red">FEFO Priority</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action text-cyan">LOT #B-108</span>
                      <span className="log-entity">Ceftriaxone 1g (Exp: 45d)</span>
                      <span className="mock-tag orange">Next in Queue</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action text-cyan">LOT #C-554</span>
                      <span className="log-entity">Atorvastatin 20mg (Exp: 180d)</span>
                      <span className="mock-tag green">Safe Stock</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'staff' && (
              <div className="role-content-split">
                <div className="role-info-side">
                  <div className="role-badge-tag staff">WARD OPERATIONS</div>
                  <h3 className="role-heading">Ward Nursing &amp; Rapid Requisition</h3>
                  <p className="role-text">
                    Streamlined for bedside nurses and ward coordinators. Fast barcode item lookups, 
                    sub-second ward transfer requisitions, and emergency low-stock alerts.
                  </p>
                  <ul className="role-capabilities-list">
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Rapid Ward Transfers:</strong> Request stock from central depot or neighboring hospital wings in seconds.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Dual-Signature Acceptance:</strong> Secure handover between ward nurses and pharmacy dispatchers.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Bedside QR Stockout:</strong> Instant barcode scanning for immediate patient medication logging.</span>
                    </li>
                    <li>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span><strong>Emergency Stockout Alerts:</strong> Instant visual warnings before critical ICU medications deplete.</span>
                    </li>
                  </ul>
                  <button type="button" className="btn-role-action" onClick={() => navigate('/auth')}>
                    Access Staff Console →
                  </button>
                </div>
                <div className="role-preview-side">
                  <div className="mock-dashboard-card">
                    <div className="mock-card-header">
                      <span>Ward Requisition Status</span>
                      <span className="mock-pill green">Real-Time</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">REQ-802</span>
                      <span className="log-entity">ICU Wing: Normal Saline (50 bags)</span>
                      <span className="mock-tag green">Dispatched</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">REQ-803</span>
                      <span className="log-entity">Surgery: Fentanyl Ampoules (10x)</span>
                      <span className="mock-tag orange">Dual-Sign Needed</span>
                    </div>
                    <div className="mock-list-item">
                      <span className="log-action">REQ-804</span>
                      <span className="log-entity">Pediatrics: Amoxicillin Susp (20x)</span>
                      <span className="mock-tag green">Received</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================================
          4. CORE ENTERPRISE CAPABILITIES GRID
         ========================================================================= */}
      <section className="features-grid-section" id="features">
        <div className="section-container">
          
          <div className="section-header-block">
            <span className="section-kicker">TECHNICAL CAPABILITIES</span>
            <h2 className="section-title">Engineered for Zero Downtime and Maximum Supply Reliability</h2>
            <p className="section-subtitle">
              Every subsystem is designed with multi-tier redundancy, cryptographic validation, and sub-second query performance.
            </p>
          </div>

          <div className="features-cards-grid">
            
            {/* Feature 1 */}
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h4 className="feature-card-title">Algorithmic FEFO Intelligence</h4>
              <p className="feature-card-desc">
                First-Expired-First-Out routing guarantees older lots are dispensed first, preventing costly pharmaceutical wastage and maintaining peak batch freshness.
              </p>
              <div className="feature-card-highlight">Saves up to 18% in annual drug waste</div>
            </div>

            {/* Feature 2 */}
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h4 className="feature-card-title">GxP Cryptographic Audit Trail</h4>
              <p className="feature-card-desc">
                Every stock movement, user authorization, and batch adjustment is hashed into an immutable log adhering strictly to FDA 21 CFR Part 11 requirements.
              </p>
              <div className="feature-card-highlight">SHA-256 Tamper-Evident Security</div>
            </div>

            {/* Feature 3 */}
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M7 8h2m-2 4h2m-2 4h2m4-8h6m-6 4h4m-4 4h6" />
                </svg>
              </div>
              <h4 className="feature-card-title">Dual-Auth Ward Transfer Pipeline</h4>
              <p className="feature-card-desc">
                Chain-of-custody verification between central depot and hospital wings with mandatory dual electronic signatures for controlled pharmaceuticals.
              </p>
              <div className="feature-card-highlight">Multi-Wing Custody Verification</div>
            </div>

            {/* Feature 4 */}
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2m10 0h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2m-10 0H5a2 2 0 0 1-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
              </div>
              <h4 className="feature-card-title">Integrated Camera &amp; Laser Scanner</h4>
              <p className="feature-card-desc">
                High-speed scanning engine supporting standard Code128 barcodes, GS1 DataMatrix, and QR codes via built-in device cameras or physical USB scanners.
              </p>
              <div className="feature-card-highlight">Sub-second 1D &amp; 2D Decoding</div>
            </div>

            {/* Feature 5 */}
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <h4 className="feature-card-title">Predictive Reordering Triggers</h4>
              <p className="feature-card-desc">
                Continuous consumption velocity analysis monitors minimum stock thresholds, automatically generating supplier purchase orders before critical shortages hit.
              </p>
              <div className="feature-card-highlight">Automated Purchase Order EDI</div>
            </div>

            {/* Feature 6 */}
            <div className="feature-item-card">
              <div className="feature-icon-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h4 className="feature-card-title">Instant Compliance Audit Reports</h4>
              <p className="feature-card-desc">
                Generate formatted regulatory inspection reports in PDF and Excel formats with full batch genealogy, stock movement history, and temperature adherence.
              </p>
              <div className="feature-card-highlight">One-Click PDF/Excel Generation</div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          5. THE 4-STAGE CLINICAL LOGISTICS PIPELINE
         ========================================================================= */}
      <section className="workflow-section" id="workflow">
        <div className="section-container">
          
          <div className="section-header-block">
            <span className="section-kicker">HOSPITAL LOGISTICS PIPELINE</span>
            <h2 className="section-title">From Manufacturer Inwarding to Bedside Dispensation</h2>
            <p className="section-subtitle">
              A continuous, unbroken digital chain of custody ensuring patient safety and zero inventory loss.
            </p>
          </div>

          <div className="pipeline-steps-container">
            
            <div className="pipeline-step-card">
              <div className="step-number-tag">01</div>
              <div className="step-icon">📦</div>
              <h4 className="step-title">Inward Intake &amp; Serialization</h4>
              <p className="step-desc">
                Supplier deliveries are scanned, verified against active purchase orders, and serialized into batch lots.
              </p>
            </div>

            <div className="pipeline-connector-line"></div>

            <div className="pipeline-step-card">
              <div className="step-number-tag">02</div>
              <div className="step-icon">❄️</div>
              <h4 className="step-title">FEFO Staging &amp; Cold-Chain</h4>
              <p className="step-desc">
                Batches are allocated to optimal storage zones with real-time temperature tracking and expiry surveillance.
              </p>
            </div>

            <div className="pipeline-connector-line"></div>

            <div className="pipeline-step-card">
              <div className="step-number-tag">03</div>
              <div className="step-icon">🚚</div>
              <h4 className="step-title">Dual-Sign Ward Transfer</h4>
              <p className="step-desc">
                Requisitions are dispatched with electronic signature verification between pharmacy staff and ward nurses.
              </p>
            </div>

            <div className="pipeline-connector-line"></div>

            <div className="pipeline-step-card">
              <div className="step-number-tag">04</div>
              <div className="step-icon">🩺</div>
              <h4 className="step-title">Bedside Dispense &amp; Audit</h4>
              <p className="step-desc">
                Nurse scans barcode for instant patient administration, sealing the transaction into the permanent GxP audit log.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          6. REGULATORY COMPLIANCE & STANDARDS
         ========================================================================= */}
      <section className="compliance-section" id="compliance">
        <div className="section-container">
          
          <div className="section-header-block">
            <span className="section-kicker">REGULATORY RIGOR</span>
            <h2 className="section-title">Built to Meet Global Healthcare Accreditation Standards</h2>
            <p className="section-subtitle">
              Designed from day one to withstand audits from the FDA, WHO, and international health inspection authorities.
            </p>
          </div>

          <div className="compliance-badges-grid">
            <div className="compliance-card">
              <div className="comp-card-icon">🏛️</div>
              <h4>FDA 21 CFR Part 11</h4>
              <p>Electronic signatures, audit trail immutability, and time-stamped system events.</p>
            </div>

            <div className="compliance-card">
              <div className="comp-card-icon">🌐</div>
              <h4>WHO-GDP Guidelines</h4>
              <p>Good Distribution Practice compliance for safe pharmaceutical handling and storage.</p>
            </div>

            <div className="compliance-card">
              <div className="comp-card-icon">🎖️</div>
              <h4>ISO 13485:2016</h4>
              <p>Quality management systems for medical devices and critical clinical inventory.</p>
            </div>

            <div className="compliance-card">
              <div className="comp-card-icon">🔒</div>
              <h4>RBAC &amp; Session Guards</h4>
              <p>Hardened HTTP-only session cookies with role segregation across all endpoints.</p>
            </div>
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. HIGH-CONVERSION ENTERPRISE CTA
         ========================================================================= */}
      <section className="cta-banner-section" id="cta">
        <div className="section-container">
          <div className="cta-glass-banner">
            <div className="cta-content">
              <span className="cta-kicker">GET STARTED TODAY</span>
              <h2 className="cta-title">Modernize Your Healthcare Inventory Infrastructure</h2>
              <p className="cta-desc">
                Deploy MediStock across your central pharmacy, specialty wards, and medical warehouse. 
                Eliminate expired stockouts and achieve 100% GxP audit readiness.
              </p>
              
              <div className="cta-buttons-row">
                <button type="button" className="btn-primary-cta" onClick={handleLaunch}>
                  <span>Access Medical Console →</span>
                </button>
                <button type="button" className="btn-secondary-cta" onClick={() => navigate('/auth')}>
                  <span>View Demo Credentials</span>
                </button>
              </div>

              {/* Demo Quick Access Helper */}
              <div className="cta-demo-helper">
                <span>Demo Accounts Available:</span>
                <code>admin@medistock.com</code>
                <span>•</span>
                <code>pharmacist@medistock.com</code>
                <span>•</span>
                <code>staff@medistock.com</code>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;