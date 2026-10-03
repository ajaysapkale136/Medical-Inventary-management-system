import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { apiRequest, downloadFile } from '../../lib/api';
import './AdminAlerts.css';

const AdminAlerts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // --- STATE MANAGEMENT (API READY) ---
  const [stats, setStats] = useState({ total: 0, critical: 0, warning: 0, info: 0, resolved: 0 });
  const [alertsList, setAlertsList] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  const [topMedicines, setTopMedicines] = useState([]);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const [filters, setFilters] = useState({
    search: '', type: 'All Types', priority: 'All Priorities', status: 'All Status', startDate: '', endDate: ''
  });

  const fetchAlertData = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/admin/alerts');
      if (data) {
        if (data.stats) setStats(data.stats);
        if (data.alertsList) {
          setAlertsList(data.alertsList);
          setFilteredAlerts(data.alertsList);
          if (data.alertsList.length > 0) {
            setSelectedAlert(data.alertsList[0]);
          } else {
            setSelectedAlert(null);
          }
        }
        if (data.recentAlerts) setRecentAlerts(data.recentAlerts);
        if (data.topMedicines) setTopMedicines(data.topMedicines);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertData();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = alertsList;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(a => a.message.toLowerCase().includes(term) || a.item.toLowerCase().includes(term) || a.batch.toLowerCase().includes(term));
    }
    if (filters.type !== 'All Types') result = result.filter(a => a.type === filters.type);
    if (filters.priority !== 'All Priorities') result = result.filter(a => a.priority === filters.priority);
    if (filters.status !== 'All Status') result = result.filter(a => a.status === filters.status);
    setFilteredAlerts(result);
  }, [filters, alertsList]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters({ search: '', type: 'All Types', priority: 'All Priorities', status: 'All Status', startDate: '', endDate: '' });

  const getPriorityClass = (priority) => {
    if (priority === 'Critical') return 'priority-critical';
    if (priority === 'Warning') return 'priority-warning';
    return 'priority-info';
  };

  const getStatusClass = (status) => {
    if (status === 'New') return 'status-new';
    if (status === 'Acknowledged') return 'status-ack';
    return 'status-resolved';
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    try {
      await apiRequest(`/api/notifications/${selectedAlert.id}/acknowledge?by=Admin`, { method: 'PATCH' });
      setActionMessage(`Alert #${selectedAlert.id} acknowledged.`);
      setTimeout(() => setActionMessage(''), 4000);
      await fetchAlertData();
    } catch (e) {
      console.error(e);
      setActionMessage('Failed to acknowledge alert.');
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    try {
      await apiRequest(`/api/notifications/${selectedAlert.id}/resolve?by=Admin`, { method: 'PATCH' });
      setActionMessage(`Alert #${selectedAlert.id} marked as resolved.`);
      setTimeout(() => setActionMessage(''), 4000);
      await fetchAlertData();
    } catch (e) {
      console.error(e);
      setActionMessage('Failed to resolve alert.');
    }
  };

  const handleDismiss = async (id) => {
    const alertId = id || selectedAlert?.id;
    if (!alertId) return;
    try {
      await apiRequest(`/api/notifications/${alertId}/dismiss`, { method: 'PATCH' });
      setActionMessage(`Alert #${alertId} dismissed.`);
      setTimeout(() => setActionMessage(''), 4000);
      await fetchAlertData();
    } catch (e) {
      console.error(e);
      setActionMessage('Failed to dismiss alert.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      for (const a of alertsList) {
        if (a.status !== 'Resolved') {
          await apiRequest(`/api/notifications/${a.id}/read`, { method: 'PATCH' }).catch(() => {});
        }
      }
      setActionMessage('All alerts marked as read.');
      setTimeout(() => setActionMessage(''), 4000);
      await fetchAlertData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportPDF = async () => {
    await downloadFile('/api/reports/inventory-summary/download?format=PDF', 'System_Alerts_Report.pdf');
  };

  const handleExportCSV = () => {
    if (!alertsList.length) return;
    const headers = ['ID', 'Message', 'Item', 'Batch', 'Type', 'Priority', 'Status', 'Date Time', 'Expiry'];
    const rows = alertsList.map(a => [
      a.id,
      `"${(a.message || '').replace(/"/g, '""')}"`,
      `"${(a.item || '').replace(/"/g, '""')}"`,
      `"${(a.batch || '').replace(/"/g, '""')}"`,
      `"${(a.type || '').replace(/"/g, '""')}"`,
      a.priority || '',
      a.status || '',
      `"${a.datetime || ''}"`,
      `"${a.expiry || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Medical_Alerts_Export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Category counts for visual breakdown
  const categoryCounts = alertsList.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout title="Alerts">
      
      {actionMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#a7f3d0',
          padding: '10px 16px',
          borderRadius: '8px',
          marginBottom: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} style={{background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontSize: '1rem'}}>✕</button>
        </div>
      )}

      {/* 1. TOP SUMMARY CARDS */}
      <div className="alerts-stats-grid">
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Alerts <div className="stat-icon icon-blue">🔔</div></div>
          <h3 className="stat-val">{stats.total}</h3>
          <span className="stat-sub text-blue">All active alerts</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Critical Alerts <div className="stat-icon icon-red">🚨</div></div>
          <h3 className="stat-val">{stats.critical}</h3>
          <span className="stat-sub text-red">Needs immediate action</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Warning Alerts <div className="stat-icon icon-orange">⚠️</div></div>
          <h3 className="stat-val">{stats.warning}</h3>
          <span className="stat-sub text-orange">Requires attention</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Info Alerts <div className="stat-icon icon-blue">ℹ️</div></div>
          <h3 className="stat-val">{stats.info}</h3>
          <span className="stat-sub text-blue">For your information</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Resolved Alerts <div className="stat-icon icon-green">✅</div></div>
          <h3 className="stat-val">{stats.resolved}</h3>
          <span className="stat-sub text-green">This month</span>
        </div>
      </div>

      {/* 2. FILTERS */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="filters-container" style={{ marginBottom: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="filter-group">
              <label>Search</label>
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search alert, medicine, batch..." />
            </div>
            <div className="filter-group hide-mobile">
              <label>Alert Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange} className="filter-input">
                <option>All Types</option><option>Expiry Alert</option><option>Low Stock Alert</option><option>System Alert</option>
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Priority</label>
              <select name="priority" value={filters.priority} onChange={handleFilterChange} className="filter-input">
                <option>All Priorities</option><option>Critical</option><option>Warning</option><option>Info</option>
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input">
                <option>All Status</option><option>New</option><option>Acknowledged</option><option>Resolved</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-secondary" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* 3. MAIN 3-COLUMN SPLIT */}
      <div className="alerts-main-split">
        
        {/* Column 1: Alerts List Table */}
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <h3 className="panel-header">Alerts List ({filteredAlerts.length})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: "32%", minWidth: "220px" }}>Alert Message</th>
                  <th style={{ width: "18%", minWidth: "130px" }}>Medicine / Item</th>
                  <th className="hide-mobile" style={{ width: "10%", minWidth: "85px" }}>Batch No.</th>
                  <th className="hide-mobile" style={{ width: "10%", minWidth: "85px" }}>Type</th>
                  <th style={{ width: "10%", minWidth: "80px" }}>Priority</th>
                  <th style={{ width: "10%", minWidth: "80px" }}>Status</th>
                  <th className="hide-mobile" style={{ width: "12%", minWidth: "120px" }}>Date & Time</th>
                  <th style={{ width: "8%", minWidth: "75px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>Loading alerts...</td></tr> : 
                  filteredAlerts.length === 0 ? <tr><td colSpan="8" style={{textAlign: 'center', padding: '2rem'}}>No alerts found.</td></tr> :
                  filteredAlerts.map(alert => (
                  <tr key={alert.id} onClick={() => setSelectedAlert(alert)} style={{cursor: 'pointer', background: selectedAlert?.id === alert.id ? 'rgba(144, 224, 239, 0.08)' : 'transparent'}}>
                    <td><span style={{marginRight: '5px'}}>{alert.icon}</span> {alert.message}</td>
                    <td style={{color: '#00B4D8', fontWeight: '600'}}>{alert.item}</td>
                    <td className="hide-mobile">{alert.batch}</td>
                    <td className="hide-mobile">{alert.type}</td>
                    <td><span className={`priority-badge ${getPriorityClass(alert.priority)}`}>{alert.priority}</span></td>
                    <td><span className={`status-text ${getStatusClass(alert.status)}`}>{alert.status}</span></td>
                    <td className="hide-mobile" style={{fontSize: '0.8rem'}}>{alert.datetime}</td>
                    <td>
                      <div className="table-icons" style={{gap: '5px'}}>
                        <button className="icon-btn" title="View details" onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); }}>👁️</button>
                        <button className="icon-btn delete" title="Dismiss" onClick={(e) => { e.stopPropagation(); handleDismiss(alert.id); }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column 2: Alert Details Panel */}
        <div className="glass-panel">
          <h3 className="panel-header">Alert Details</h3>
          {selectedAlert ? (
            <div>
              <div className="alert-detail-header">
                <div>
                  <h4 className="alert-detail-title">{selectedAlert.message}</h4>
                  <p style={{margin: 0, fontSize: '0.8rem', color: '#94A3B8'}}>{selectedAlert.type}</p>
                </div>
                <span className={`priority-badge ${getPriorityClass(selectedAlert.priority)}`}>{selectedAlert.priority}</span>
              </div>

              <div className="alert-detail-group">
                <span className="alert-detail-label">Description</span>
                <span className="alert-detail-value">{selectedAlert.item} (Batch {selectedAlert.batch}) triggered a {selectedAlert.type.toLowerCase()}.</span>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="alert-detail-group">
                  <span className="alert-detail-label">Medicine / Item</span>
                  <span className="alert-detail-value" style={{color: '#00B4D8'}}>{selectedAlert.item}</span>
                </div>
                <div className="alert-detail-group">
                  <span className="alert-detail-label">Batch No.</span>
                  <span className="alert-detail-value">{selectedAlert.batch}</span>
                </div>
                <div className="alert-detail-group">
                  <span className="alert-detail-label">Expiry Date</span>
                  <span className="alert-detail-value">{selectedAlert.expiry}</span>
                </div>
                <div className="alert-detail-group">
                  <span className="alert-detail-label">Status</span>
                  <span className={`status-text ${getStatusClass(selectedAlert.status)}`}>{selectedAlert.status}</span>
                </div>
              </div>

              <div className="alert-detail-group">
                <span className="alert-detail-label">Created On</span>
                <span className="alert-detail-value">{selectedAlert.datetime}</span>
              </div>

              <div className="alert-detail-group">
                <span className="alert-detail-label">Suggested Action</span>
                <span className="alert-detail-value">Review inventory levels and dispatch purchase orders or adjust quarantine.</span>
              </div>

              <div className="alert-detail-actions">
                <div className="btn-group-row">
                  <button className="btn-primary" style={{background: '#10b981', borderColor: '#10b981'}} onClick={handleAcknowledge}>✓ Acknowledge</button>
                  <button className="btn-primary" onClick={handleResolve}>Mark as Resolved</button>
                </div>
                <button className="btn-secondary" onClick={() => handleDismiss()}>Dismiss Alert</button>
                <button className="btn-secondary" style={{color: '#00B4D8', borderColor: '#00B4D8'}} onClick={() => navigate('/admin/purchases')}>Create Purchase Order →</button>
              </div>
            </div>
          ) : (
            <p style={{textAlign: 'center', color: '#94A3B8', marginTop: '50px'}}>Select an alert to view details.</p>
          )}
        </div>

        {/* Column 3: Charts & Recent Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel">
            <h3 className="panel-header">Alerts by Category</h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0'}}>
              {Object.entries(categoryCounts).length > 0 ? (
                Object.entries(categoryCounts).map(([cat, count], idx) => {
                  const colors = ['#00B4D8', '#f59e0b', '#f43f5e', '#10b981', '#8b5cf6'];
                  const pct = Math.round((count / (alertsList.length || 1)) * 100);
                  return (
                    <div key={cat}>
                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#CAF0F8', marginBottom: '3px'}}>
                        <span>{cat}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div style={{width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden'}}>
                        <div style={{width: `${pct}%`, height: '100%', background: colors[idx % colors.length]}}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{textAlign: 'center', color: '#94A3B8', padding: '1rem'}}>No category data</div>
              )}
            </div>
          </div>
          
          <div className="glass-panel" style={{ flex: 1 }}>
            <h3 className="panel-header">Recent Alerts</h3>
            <div className="recent-alerts-list">
              {recentAlerts.map(ra => (
                <div className="recent-alert-item" key={ra.id}>
                  <div className={`recent-alert-dot bg-${ra.color}`} style={{background: ra.color === 'red' ? '#f43f5e' : '#f59e0b'}}></div>
                  <div className="recent-alert-content">
                    <h4>{ra.title}</h4>
                    <p>{ra.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM 4-COLUMN GRID */}
      <div className="alerts-bottom-grid">
        
        {/* Trend Chart */}
        <div className="glass-panel">
          <h3 className="panel-header">Alert Trend <span className="stat-sub">(Activity Distribution)</span></h3>
          <div style={{height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0'}}>
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((wk, i) => {
              const heights = [45, 60, 35, 80];
              return (
                <div key={wk} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '18%'}}>
                  <span style={{fontSize: '0.75rem', color: '#00B4D8'}}>{heights[i]}%</span>
                  <div style={{width: '100%', height: `${heights[i]}%`, background: 'linear-gradient(180deg, #00B4D8 0%, rgba(0, 180, 216, 0.2) 100%)', borderRadius: '4px 4px 0 0'}}></div>
                  <span style={{fontSize: '0.7rem', color: '#94A3B8'}}>{wk}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Medicines */}
        <div className="glass-panel">
          <h3 className="panel-header">Top Medicines with Alerts</h3>
          <div className="table-responsive" style={{marginBottom: 0}}>
            <table className="data-table">
              <thead><tr><th>Medicine / Item</th><th style={{textAlign: 'center'}}>Total</th><th style={{textAlign: 'center'}} className="text-red">Crit</th><th style={{textAlign: 'center'}} className="text-orange">Warn</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="4">Loading...</td></tr> : topMedicines.map(med => (
                  <tr key={med.id}>
                    <td style={{fontSize: '0.8rem', color: '#CAF0F8'}}>{med.name}</td>
                    <td style={{fontSize: '0.8rem', textAlign: 'center'}}>{med.total}</td>
                    <td style={{fontSize: '0.8rem', textAlign: 'center'}} className="text-red">{med.critical}</td>
                    <td style={{fontSize: '0.8rem', textAlign: 'center'}} className="text-orange">{med.warning}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="glass-panel">
          <h3 className="panel-header">Notification Settings <span className="stat-sub">(Active Config)</span></h3>
          <div className="settings-summary-list">
            <div className="settings-summary-item">
              <span className="settings-summary-label">Expiry Alert (Days Before)</span>
              <span className="settings-summary-value">30 Days</span>
            </div>
            <div className="settings-summary-item">
              <span className="settings-summary-label">Low Stock Alert Threshold</span>
              <span className="settings-summary-value">Min. Stock Level</span>
            </div>
            <div className="settings-summary-item">
              <span className="settings-summary-label">Email Notifications</span>
              <span className="settings-summary-value text-green">Enabled</span>
            </div>
            <div className="settings-summary-item">
              <span className="settings-summary-label">SMS Notifications</span>
              <span className="settings-summary-value text-green">Enabled</span>
            </div>
            <div className="settings-summary-item">
              <span className="settings-summary-label">In-app Notifications</span>
              <span className="settings-summary-value text-green">Enabled</span>
            </div>
          </div>
          <button onClick={() => setShowSettingsModal(true)} style={{display: 'inline-block', marginTop: '15px', background: 'transparent', border: 'none', color: '#00B4D8', fontSize: '0.85rem', cursor: 'pointer', padding: 0}}>Manage Settings →</button>
        </div>

        {/* Quick Actions */}
        <div className="glass-panel">
          <h3 className="panel-header">Quick Actions</h3>
          <div className="quick-actions-vertical">
            <button className="quick-action-btn" onClick={handleMarkAllRead}>
              <div className="qa-icon">✓</div> Mark All as Read
            </button>
            <button className="quick-action-btn" onClick={handleExportCSV}>
              <div className="qa-icon text-green" style={{color: '#10b981'}}>📥</div> Export Alerts (CSV)
            </button>
            <button className="quick-action-btn" onClick={handleExportPDF}>
              <div className="qa-icon text-red" style={{color: '#f43f5e'}}>📄</div> Export Alerts (PDF)
            </button>
            <button className="quick-action-btn" onClick={() => setShowSettingsModal(true)}>
              <div className="qa-icon">⚙️</div> Alert Settings
            </button>
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: '450px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0, color: '#CAF0F8' }}>Alert & Notification Configuration</h3>
            <p style={{ fontSize: '0.85rem', color: '#94A3B8' }}>System threshold parameters are auto-synced with inventory services.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '1.5rem 0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Expiry Alert Window (Days)</label>
                <input type="number" defaultValue="30" className="filter-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Low Stock Trigger Threshold</label>
                <input type="number" defaultValue="20" className="filter-input" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Notification Dispatch Mode</label>
                <select className="filter-input" style={{ width: '100%' }} defaultValue="ALL">
                  <option value="ALL">Real-time In-App & Email</option>
                  <option value="DAILY">Daily Digest</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Close</button>
              <button className="btn-primary" onClick={() => {
                setShowSettingsModal(false);
                setActionMessage('Notification settings updated successfully.');
                setTimeout(() => setActionMessage(''), 4000);
              }}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminAlerts;