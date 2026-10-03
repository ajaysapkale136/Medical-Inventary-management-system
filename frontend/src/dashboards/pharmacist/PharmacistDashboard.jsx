import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PharmacyLayout from './PharmacyLayout'; // Import the layout
import { apiRequest } from '../../lib/api';
import './PharmacistDashboard.css';

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const displayDate = new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    weekday: "long",
  }).format(new Date());

  // --- API STATE STRUCTURE ---
  const [summary, setSummary] = useState({ totalMedicines: 0, totalStock: 0, lowStock: 0, expired: 0, expiringSoon: 0 });
  const [lowStock, setLowStock] = useState([]);
  const [upcomingExpiry, setUpcomingExpiry] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [stockMovementPoints, setStockMovementPoints] = useState([35, 48, 40, 65, 58, 74, 69, 86, 76, 92, 88, 96]);
  const [onlineOrdersCount, setOnlineOrdersCount] = useState(0);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError("");
        const data = await apiRequest("/api/pharmacist/dashboard");
        setSummary({ totalMedicines: 0, totalStock: 0, lowStock: 0, expired: 0, expiringSoon: 0, ...(data.summary || {}) });
        setLowStock(data.lowStock || []);
        setTopCategories(data.topCategories || []);
        setUpcomingExpiry(data.upcomingExpiry || []);
        setAlerts(data.alerts || []);
        setRecentActivities(data.recentActivities || []);
        setRecentPurchases(data.recentPurchases || []);
        if (data.stockMovement?.points && data.stockMovement.points.length > 0) {
          setStockMovementPoints(data.stockMovement.points);
        }

        try {
          const orders = await apiRequest("/api/pharmacist/online-orders");
          setOnlineOrdersCount(Array.isArray(orders) ? orders.length : 0);
        } catch (ignored) {}
      } catch (error) {
        setError(error.message || "Unable to load pharmacist dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <PharmacyLayout>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#00B4D8' }}>Loading dashboard data...</div>
      </PharmacyLayout>
    );
  }

  const totalMeds = Math.max(1, summary.totalMedicines || 0);
  const lowStockPct = Math.round(((summary.lowStock || 0) / totalMeds) * 100);
  const expiringPct = Math.round(((summary.expiringSoon || 0) / totalMeds) * 100);
  const inStockPct = Math.max(0, 100 - lowStockPct - expiringPct);

  return (
    <PharmacyLayout>
      <div className="page-title-row">
        <div>
          <h1>Pharmacist Dashboard</h1>
          <p>Welcome back! Here's your pharmacy overview.</p>
        </div>
        <div style={{color: '#94A3B8', fontSize: '0.9rem'}}>
          {displayDate}
        </div>
      </div>
      {error && <div className="page-loading">{error}</div>}

      {/* ROW 1: SUMMARY CARDS */}
      <div className="summary-grid">
        <button className="summary-box clickable-card" onClick={() => navigate('/pharmacy/inventory')}>
          <div className="summary-icon" style={{background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6'}}>💊</div>
          <div className="summary-info">
            <h4>Total Medicines</h4>
            <h2>{summary.totalMedicines}</h2>
            <p>All medicines in inventory</p>
          </div>
        </button>
        <button className="summary-box clickable-card" onClick={() => navigate('/pharmacy/inventory')}>
          <div className="summary-icon" style={{background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e'}}>📦</div>
          <div className="summary-info">
            <h4>Total Stock (Units)</h4>
            <h2>{summary.totalStock}</h2>
            <p>Total available quantity</p>
          </div>
        </button>
        <button className="summary-box clickable-card" onClick={() => navigate('/pharmacy/monitoring')}>
          <div className="summary-icon" style={{background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b'}}>📉</div>
          <div className="summary-info">
            <h4>Low Stock Items</h4>
            <h2>{summary.lowStock}</h2>
            <p style={{color: '#f43f5e'}}>Items need attention</p>
          </div>
        </button>
        <button className="summary-box clickable-card" onClick={() => navigate('/pharmacy/monitoring')}>
          <div className="summary-icon" style={{background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e'}}>⚠️</div>
          <div className="summary-info">
            <h4>Expired Items</h4>
            <h2>{summary.expired}</h2>
            <p style={{color: '#f43f5e'}}>Remove from inventory</p>
          </div>
        </button>
        <button className="summary-box clickable-card" onClick={() => navigate('/pharmacy/monitoring')}>
          <div className="summary-icon" style={{background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7'}}>📅</div>
          <div className="summary-info">
            <h4>Expiring Soon</h4>
            <h2>{summary.expiringSoon}</h2>
            <p>Within next 30 days</p>
          </div>
        </button>
        <button className="summary-box clickable-card" onClick={() => navigate('/pharmacy/online-orders')}>
          <div className="summary-icon" style={{background: 'rgba(0, 180, 216, 0.15)', color: '#00B4D8'}}>🛒</div>
          <div className="summary-info">
            <h4>Online Orders</h4>
            <h2 style={{color: '#38bdf8'}}>{onlineOrdersCount}</h2>
            <p style={{color: '#38bdf8'}}>1mg / Apollo / Direct</p>
          </div>
        </button>
      </div>

      {/* Online Order Live Multi-Channel Inflow Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12), rgba(3, 105, 161, 0.2))',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '12px',
        padding: '12px 20px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <div>
            <strong style={{ color: '#bae6fd', fontSize: '0.92rem', display: 'block' }}>
              Multi-Channel Pharmacy Dispatch Active: {onlineOrdersCount} prescriptions in pipeline
            </strong>
            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
              Live channels integrated: Apollo 24/7, Tata 1mg, PharmEasy, WhatsApp Rx &amp; Direct Storefront
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate('/pharmacy/online-orders')}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: '#ffffff',
            border: 'none',
            padding: '7px 16px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.84rem',
            cursor: 'pointer'
          }}
        >
          Process Online Orders ›
        </button>
      </div>

      {/* ROW 2 */}
      <div className="row-2-grid">
        {/* Inventory Overview Chart */}
        <div className="pharma-card">
          <h3 style={{marginBottom: '1rem', fontSize: '1rem'}}>Inventory Overview</h3>
          <div className="donut-analytics pharmacist-chart">
            <div className="donut-ring" style={{
              background: `conic-gradient(#10b981 0% ${inStockPct}%, #f59e0b ${inStockPct}% ${inStockPct + lowStockPct}%, #3b82f6 ${inStockPct + lowStockPct}% 100%)`
            }} />
            <div className="donut-legend">
              <span><b className="legend-green" /> In Stock {inStockPct}%</span>
              <span><b className="legend-orange" /> Low Stock {lowStockPct}%</span>
              <span><b className="legend-blue" /> Expiring {expiringPct}%</span>
            </div>
          </div>
        </div>

        <div className="pharma-card">
          <div className="card-header-row">
            <h3>Low Stock Items</h3>
            <button className="card-link" onClick={() => navigate('/pharmacy/monitoring')}>View All</button>
          </div>
          <table className="table-light">
            <thead><tr><th>Medicine Name</th><th>Current Stock</th><th>Reorder Level</th></tr></thead>
            <tbody>
              {lowStock.map(item => (
                <tr key={item.id}>
                  <td style={{color: '#00B4D8', fontWeight: '500'}}>💊 {item.name}</td>
                  <td style={{color: '#f43f5e', fontWeight: '600'}}>{item.stock}</td>
                  <td>{item.reorder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="pharma-card">
          <h3 style={{marginBottom: '1rem', fontSize: '1rem'}}>Quick Actions</h3>
          <div className="quick-actions-grid">
            <button className="qa-btn" onClick={() => navigate('/pharmacy/inventory')}><span className="qa-icon">+</span> Add Medicine</button>
            <button className="qa-btn" style={{color: '#22c55e'}} onClick={() => navigate('/pharmacy/inventory')}><span className="qa-icon">↻</span> Update Stock</button>
            <button className="qa-btn" style={{color: '#38bdf8'}} onClick={() => navigate('/pharmacy/online-orders')}><span className="qa-icon">🛒</span> Online Orders Hub</button>
            <button className="qa-btn" style={{color: '#f97316'}} onClick={() => navigate('/pharmacy/suppliers')}><span className="qa-icon">🚚</span> Suppliers & POs</button>
            <button className="qa-btn" style={{color: '#0ea5e9'}} onClick={() => navigate('/pharmacy/inventory')}><span className="qa-icon">[]</span> Scan Barcode</button>
            <button className="qa-btn" style={{color: '#f43f5e'}} onClick={() => navigate('/pharmacy/reports')}><span className="qa-icon">📊</span> Clinical Reports</button>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="pharma-card">
          <div className="card-header-row">
            <h3>Alerts & Notifications</h3>
            <button className="card-link" onClick={() => navigate('/pharmacy/notifications')}>View All</button>
          </div>
          <div>
            {alerts.map((alert, idx) => (
              <div className="list-item" key={idx}>
                <div className="list-icon" style={{background: alert.bg, color: alert.color}}>{alert.icon}</div>
                <div className="list-content">
                  <h4 style={{color: '#ffffff'}}>{alert.title}</h4>
                  <p style={{color: '#94A3B8'}}>{alert.desc}</p>
                </div>
                <span className="list-meta">{alert.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="row-3-grid">
        <div className="pharma-card">
          <h3 style={{marginBottom: '1rem', fontSize: '1rem'}}>Stock Movement <span style={{color: '#94A3B8', fontSize: '0.8rem'}}>(This Month)</span></h3>
          <div className="analytics-chart line-analytics pharmacist-chart tall">
            {stockMovementPoints.map((point, index) => (
              <span key={index} style={{ height: `${point}%` }} />
            ))}
          </div>
        </div>

        <div className="pharma-card">
          <div className="card-header-row">
            <h3>Top Categories</h3>
            <button className="card-link" onClick={() => navigate('/pharmacy/inventory')}>View All</button>
          </div>
          <table className="table-light">
            <thead><tr><th>Category</th><th>Items</th><th>Stock (Units)</th></tr></thead>
            <tbody>
              {topCategories.map((cat, idx) => (
                <tr key={idx}>
                  <td style={{fontWeight: '500', color: '#ffffff'}}>{cat.category}</td>
                  <td>{cat.items}</td>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                      <span>{cat.stock}</span>
                      <div style={{width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px'}}>
                        <div style={{width: '60%', height: '100%', background: cat.color, borderRadius: '3px'}}></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pharma-card">
          <div className="card-header-row">
            <h3>Upcoming Expiry <span style={{color: '#94A3B8', fontSize: '0.8rem'}}>(Next 30 Days)</span></h3>
            <button className="card-link" onClick={() => navigate('/pharmacy/monitoring')}>View All</button>
          </div>
          <table className="table-light">
            <thead><tr><th>Medicine Name</th><th style={{textAlign: 'right'}}>Expiry Date</th></tr></thead>
            <tbody>
              {upcomingExpiry.map((med, idx) => (
                <tr key={idx}>
                  <td style={{color: '#f43f5e', fontWeight: '500'}}>📅 {med.name}</td>
                  <td style={{textAlign: 'right'}}>{med.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 4 */}
      <div className="row-4-grid">
        <div className="pharma-card">
          <div className="card-header-row">
            <h3>Recent Purchases</h3>
            <button className="card-link" onClick={() => navigate('/pharmacy/suppliers')}>View All</button>
          </div>
          <table className="table-light">
            <thead><tr><th>Order ID</th><th>Supplier Name</th><th>Order Date</th><th>Total Items</th><th>Total Amount</th><th>Status</th></tr></thead>
            <tbody>
              {recentPurchases.map((po, idx) => (
                <tr key={idx}>
                  <td style={{color: '#94A3B8'}}>{po.id}</td>
                  <td style={{fontWeight: '500', color: '#ffffff'}}>{po.supplier}</td>
                  <td>{po.date}</td>
                  <td>{po.items}</td>
                  <td>₹ {po.amount}</td>
                  <td><span className={`status-pill ${po.style}`}>{po.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pharma-card">
          <div className="card-header-row">
            <h3>Recent Activities</h3>
            <button className="card-link" onClick={() => navigate('/pharmacy/reports')}>View All</button>
          </div>
          <div>
            {recentActivities.map((act, idx) => (
              <div className="list-item" key={idx} style={{padding: '12px 0'}}>
                <div style={{width: '8px', height: '8px', borderRadius: '50%', background: act.color, marginTop: '6px'}}></div>
                <div className="list-content" style={{flex: 1}}>
                  <h4 style={{fontWeight: '500', color: '#CAF0F8'}}>{act.action}</h4>
                </div>
                <span className="list-meta">{act.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default PharmacistDashboard;
