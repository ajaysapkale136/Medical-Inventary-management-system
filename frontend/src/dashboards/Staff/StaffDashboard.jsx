import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StaffLayout from "./StaffLayout";
import { apiRequest } from "../../lib/api";
import "../pharmacist/PharmacistDashboard.css";

function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const displayDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  }).format(new Date());

  const [stats, setStats] = useState({ medicines: 0, stock: 0, expiring: 0, orders: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [checklist, setChecklist] = useState([
    { id: 1, text: "Verify cold-chain refrigerators 01 & 02 (Maintained at 3.6°C)", done: true, tag: "Cold-Chain" },
    { id: 2, text: "Segregate expired batch Ascoril LS (ASC23-112) into Quarantine Bay", done: true, tag: "GxP Safety" },
    { id: 3, text: "Perform inward physical count on GSK PO-2026-1045 delivery", done: false, tag: "Receiving" },
    { id: 4, text: "Restock Emergency Crash-Cart with Dynapar AQ & Clexane syringes", done: false, tag: "Ward Replenish" },
    { id: 5, text: "Enforce FEFO front-shelf placement for Lantus Solostar (21 days left)", done: true, tag: "FEFO Protocol" }
  ]);
  const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setError("");
        const data = await apiRequest("/api/staff/dashboard");
        setStats({ medicines: 0, stock: 0, expiring: 0, orders: 0, ...(data.stats || {}) });
        setRecentTasks(data.recentTasks || []);
      } catch (err) {
        setError(err.message || "Unable to load staff dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const toggleChecklist = (id) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleSimulateScan = (code) => {
    setScannedCode(code);
    if (code === "8901117001021" || code.toLowerCase().includes("aug")) {
      setScanResult({
        name: "Augmentin 625 Duo (GSK)",
        batch: "AUG24-819A",
        location: "Rack A-01 (Main Warehouse)",
        stock: "420 Units",
        expiry: "In 14 months",
        status: "SAFE / IN STOCK"
      });
    } else if (code === "8902228004012" || code.toLowerCase().includes("lan")) {
      setScanResult({
        name: "Lantus Solostar 100IU/ml (Sanofi)",
        batch: "LNT24-009C",
        location: "Cold-Chain Refrigerator 01 (2°C - 8°C)",
        stock: "8 Units (CRITICAL LOW)",
        expiry: "In 21 days (FEFO PRIORITY)",
        status: "NEAR EXPIRY / REFRIGERATED"
      });
    } else {
      setScanResult({
        name: "Dolo 650 Tablets (Sun Pharma)",
        batch: "DL24-9042",
        location: "Rack A-04 (Main Warehouse)",
        stock: "1,250 Units",
        expiry: "In 18 months",
        status: "HEALTHY INVENTORY"
      });
    }
  };

  if (loading) {
    return (
      <StaffLayout>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#00B4D8' }}>
          Loading staff operations control center...
        </div>
      </StaffLayout>
    );
  }

  const completedChecklistCount = checklist.filter(c => c.done).length;

  return (
    <StaffLayout title="Staff Operations Hub">
      {/* Title & Shift Telemetry Header */}
      <div className="page-title-row" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.25rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '0.75rem',
              fontWeight: '700',
              textTransform: 'uppercase'
            }}>
              ● Active Shift: 08:00 - 16:00 IST
            </span>
            <span style={{ color: '#64748B', fontSize: '0.8rem' }}>Station: Receiving Bay 01 &amp; Cold-Chain</span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginTop: '4px', letterSpacing: '-0.02em' }}>
            Warehouse &amp; Ward Operations Hub
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
            Operational receiving, barcode verification, rack storage allocations, and ward transfer dispatches.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            padding: '8px 14px',
            borderRadius: '8px',
            border: '1px solid rgba(144, 224, 239, 0.12)',
            color: '#CAF0F8',
            fontSize: '0.85rem',
            fontWeight: '600'
          }}>
            📅 {displayDate}
          </div>
          <button
            onClick={() => {
              setBarcodeModalOpen(true);
              handleSimulateScan("8901117001021");
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#ffffff',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <span>📷</span>
            <span>Scan Barcode / Shelf Bin</span>
          </button>
        </div>
      </div>

      {error && <div className="page-loading" style={{ color: '#f87171' }}>{error}</div>}

      {/* Shift Personnel Strip */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(144, 224, 239, 0.12)',
        borderRadius: '12px',
        padding: '12px 20px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: 'rgba(0, 180, 216, 0.15)',
            color: '#00B4D8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700'
          }}>
            RK
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}>
              Rohit Kumar <span style={{ color: '#64748B', fontWeight: '400', fontSize: '0.8rem' }}>(Logistics Supervisor #STF-8042)</span>
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              Assigned Zone: Central Pharmacy &amp; Emergency Cabinet Stocking
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Cold Storage Sensor</span>
            <span style={{ color: '#34d399', fontWeight: '700', fontSize: '0.9rem' }}>3.6°C (Normal 2-8°C)</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748B', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase' }}>Checklist Progress</span>
            <span style={{ color: '#38bdf8', fontWeight: '700', fontSize: '0.9rem' }}>
              {completedChecklistCount} of {checklist.length} Completed
            </span>
          </div>
        </div>
      </div>

      {/* 4 SUMMARY CARDS */}
      <div className="summary-grid staff-dashboard-summary" style={{ marginBottom: '1.75rem' }}>
        <button className="summary-box clickable-card" onClick={() => navigate('/staff/medicines')}>
          <div className="summary-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>💊</div>
          <div className="summary-info">
            <h4>Catalog Medicines</h4>
            <h2>{stats.medicines}</h2>
            <p style={{ color: '#38bdf8' }}>Browse rack / bin locations</p>
          </div>
        </button>

        <button className="summary-box clickable-card" onClick={() => navigate('/staff/inventory')}>
          <div className="summary-icon" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e' }}>📦</div>
          <div className="summary-info">
            <h4>Physical Stock Units</h4>
            <h2>{stats.stock ? stats.stock.toLocaleString() : "8,430"}</h2>
            <p style={{ color: '#34d399' }}>Verified in storage bays</p>
          </div>
        </button>

        <button className="summary-box clickable-card" onClick={() => navigate('/staff/expiry')}>
          <div className="summary-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>⏰</div>
          <div className="summary-info">
            <h4>Expiry Hazards</h4>
            <h2 style={{ color: '#f87171' }}>{stats.expiring}</h2>
            <p style={{ color: '#fca5a5' }}>Segregate from shelves</p>
          </div>
        </button>

        <button className="summary-box clickable-card" onClick={() => navigate('/staff/orders')}>
          <div className="summary-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>🚚</div>
          <div className="summary-info">
            <h4>Inward Consignments</h4>
            <h2>{stats.orders}</h2>
            <p style={{ color: '#fbbf24' }}>Awaiting GRN verification</p>
          </div>
        </button>
      </div>

      {/* QUICK ACTIONS DECK */}
      <div className="pharma-card" style={{ marginBottom: '1.75rem' }}>
        <div className="card-header-row" style={{ marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Shift Rapid Operations Deck</h3>
          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>1-Click shortcut actions for floor operations</span>
        </div>
        <div className="quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <button 
            className="qa-btn" 
            onClick={() => {
              setBarcodeModalOpen(true);
              handleSimulateScan("8901117001021");
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '10px' }}
          >
            <span style={{ fontSize: '1.2rem', color: '#00B4D8' }}>📷</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', color: '#ffffff' }}>Scan Barcode</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Identify medicine &amp; rack</div>
            </div>
          </button>

          <button 
            className="qa-btn" 
            onClick={() => navigate('/staff/inventory')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '10px' }}
          >
            <span style={{ fontSize: '1.2rem', color: '#10B981' }}>+</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', color: '#ffffff' }}>Inward GRN Entry</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Receive supplier delivery</div>
            </div>
          </button>

          <button 
            className="qa-btn" 
            onClick={() => navigate('/staff/transfers')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '10px' }}
          >
            <span style={{ fontSize: '1.2rem', color: '#F59E0B' }}>⇄</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', color: '#ffffff' }}>Ward Stock Transfer</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Dispense to ICU/OT</div>
            </div>
          </button>

          <button 
            className="qa-btn" 
            onClick={() => navigate('/staff/orders')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px', borderRadius: '10px' }}
          >
            <span style={{ fontSize: '1.2rem', color: '#6366F1' }}>📋</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: '600', color: '#ffffff' }}>Inspect Shipments</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Verify PO invoices</div>
            </div>
          </button>
        </div>
      </div>

      {/* TWO COLUMNS: SHIFT CHECKLIST & RECENT SHIFT ACTIVITIES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.75rem' }}>
        
        {/* Interactive Shift Checklist */}
        <div className="pharma-card">
          <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Daily Shift Safety Checklist</h3>
            <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '600' }}>
              {completedChecklistCount}/{checklist.length} Done
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checklist.map(item => (
              <div 
                key={item.id}
                onClick={() => toggleChecklist(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: item.done ? 'rgba(34, 197, 94, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                  border: item.done ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(144, 224, 239, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input 
                  type="checkbox" 
                  checked={item.done} 
                  onChange={() => toggleChecklist(item.id)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#10B981' }}
                />
                <div style={{ flex: 1 }}>
                  <span style={{ 
                    fontSize: '0.88rem', 
                    color: item.done ? '#94A3B8' : '#ffffff',
                    textDecoration: item.done ? 'line-through' : 'none'
                  }}>
                    {item.text}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(0, 180, 216, 0.1)',
                  color: '#38bdf8',
                  fontWeight: '600'
                }}>
                  {item.tag}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Operational Tasks & Log */}
        <div className="pharma-card">
          <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Shift Activity Log</h3>
            <button 
              className="card-link" 
              onClick={() => navigate('/staff/inventory')}
              style={{ background: 'none', border: 'none', color: '#00B4D8', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
            >
              Full Log ›
            </button>
          </div>
          
          <table className="table-light">
            <thead>
              <tr>
                <th>Operation &amp; Medicine</th>
                <th>Time Logged</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8' }}>No shift tasks recorded.</td></tr>
              ) : (
                recentTasks.map(task => (
                  <tr key={task.id}>
                    <td style={{ color: '#ffffff', fontWeight: '500' }}>{task.task}</td>
                    <td style={{ color: '#94A3B8' }}>{task.time}</td>
                    <td>
                      <span className={`status-pill ${task.status === 'Completed' ? 'pill-green' : 'pill-orange'}`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* BARCODE SCANNER MODAL */}
      {barcodeModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(1, 4, 9, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: '#0d1117',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>📷</span>
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.15rem' }}>Camera Barcode / Bin Scanner</h3>
              </div>
              <button 
                onClick={() => setBarcodeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Simulated Camera Viewfinder */}
            <div style={{
              height: '160px',
              borderRadius: '10px',
              background: 'linear-gradient(180deg, rgba(0, 180, 216, 0.08), rgba(0,0,0,0.6))',
              border: '2px dashed rgba(56, 189, 248, 0.4)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                position: 'absolute',
                width: '80%',
                height: '2px',
                background: '#ef4444',
                boxShadow: '0 0 10px #ef4444',
                animation: 'scanLine 2s infinite ease-in-out'
              }} />
              <span style={{ color: '#38bdf8', fontSize: '0.85rem', fontWeight: '600' }}>
                Align EAN-13 / GS1 DataMatrix within frame
              </span>
            </div>

            {/* Quick barcode simulation buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button 
                onClick={() => handleSimulateScan("8901117001021")}
                style={{
                  flex: 1,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Augmentin 625 Duo
              </button>
              <button 
                onClick={() => handleSimulateScan("8902228004012")}
                style={{
                  flex: 1,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Lantus Solostar
              </button>
              <button 
                onClick={() => handleSimulateScan("8903339007015")}
                style={{
                  flex: 1,
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  color: '#34d399',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                Dolo 650
              </button>
            </div>

            {/* Scan Result Card */}
            {scanResult && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(144, 224, 239, 0.2)',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem' }}>{scanResult.name}</h4>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: scanResult.status.includes('CRITICAL') || scanResult.status.includes('NEAR') ? '#f87171' : '#34d399'
                  }}>
                    {scanResult.status}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <div><strong>Batch:</strong> {scanResult.batch}</div>
                  <div><strong>Stock:</strong> {scanResult.stock}</div>
                  <div><strong>Location:</strong> {scanResult.location}</div>
                  <div><strong>Expiry:</strong> {scanResult.expiry}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setBarcodeModalOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  setBarcodeModalOpen(false);
                  navigate('/staff/inventory');
                }}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                View in Inventory ›
              </button>
            </div>
          </div>
        </div>
      )}
    </StaffLayout>
  );
}

export default StaffDashboard;
