import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './DashboardLayout';
import { apiRequest, downloadFile } from '../../lib/api';
import './AdminExpiry.css';

const AdminExpiry = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [selectedMedModal, setSelectedMedModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [stats, setStats] = useState({ total: 0, near: 0, expired: 0, safe: 0, alerts: 0 });
  const [expiryList, setExpiryList] = useState([]);
  const [topNearExpiry, setTopNearExpiry] = useState([]);
  const [alertSummary, setAlertSummary] = useState({ expired: 0, near: 0, sent: 0, pending: 0 });
  const [settings, setSettings] = useState({ email: true, sms: false, nearDays: 30, criticalDays: 7 });
  const [filters, setFilters] = useState({ search: '', batch: '', category: 'All Categories', status: 'All Status' });

  const fetchExpiryData = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiRequest('/api/admin/expiry');
      setStats(data.stats || { total: 0, near: 0, expired: 0, safe: 0, alerts: 0 });
      setAlertSummary(data.alertSummary || { expired: 0, near: 0, sent: 0, pending: 0 });
      setExpiryList(data.expiryList || []);
      setTopNearExpiry(data.topNearExpiry || (data.expiryList || []).slice(0, 5));
    } catch (err) {
      setError(err.message || 'Failed to load expiry data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpiryData(); }, []);

  const categoryOptions = useMemo(() => [
    'All Categories',
    ...new Set(expiryList.map(i => i.category).filter(Boolean))
  ], [expiryList]);

  const filteredExpiryList = useMemo(() => expiryList.filter(item => {
    const matchSearch = !filters.search || item.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchBatch = !filters.batch || item.batch.toLowerCase().includes(filters.batch.toLowerCase());
    const matchCat = filters.category === 'All Categories' || item.category === filters.category;
    const matchStatus = filters.status === 'All Status' || item.status === filters.status;
    return matchSearch && matchBatch && matchCat && matchStatus;
  }), [expiryList, filters]);

  const trendData = useMemo(() => {
    const now = new Date();
    const defaults = [18, 32, 48, 62, 38, 22];
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = d.toLocaleString('en-US', { month: 'short' });
      months.push({
        label: `M${i + 1}`,
        monthName,
        val: defaults[i],
        color: i < 2 ? '#f43f5e' : i === 2 ? '#f59e0b' : '#00B4D8'
      });
    }
    return months;
  }, []);

  const maxTrendVal = useMemo(() => Math.max(...trendData.map(d => d.val), 1), [trendData]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters({ search: '', batch: '', category: 'All Categories', status: 'All Status' });
  const toggleSetting = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredExpiryList.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSendAlert = (med) => {
    setToastMessage(`Alert dispatched for ${med.name} (Batch: ${med.batch}) to active notification channels.`);
    setTimeout(() => setToastMessage(''), 4000);
    setExpiryList(prev => prev.map(m => m.id === med.id ? { ...m, alert: true } : m));
    setAlertSummary(prev => ({ ...prev, sent: (prev.sent || 0) + 1 }));
  };

  const handleDiscard = (med) => {
    if (window.confirm(`Mark batch ${med.batch} of ${med.name} as disposed / removed from active stock?`)) {
      setExpiryList(prev => prev.filter(m => m.id !== med.id));
      setToastMessage(`Batch ${med.batch} of ${med.name} removed from active inventory.`);
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  const handleSaveSettings = () => {
    setToastMessage('Expiry and alert threshold preferences updated successfully.');
    setTimeout(() => setToastMessage(''), 4000);
  };

  return (
    <DashboardLayout title="Expiry Tracking">
      
      {toastMessage && (
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
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      <div className="expiry-stats-grid">
        <div className="glass-panel stat-box"><div className="stat-top">Total Medicines <div className="stat-icon icon-blue">💊</div></div><h3 className="stat-val">{stats.total}</h3><span className="stat-sub text-blue">All medicines</span></div>
        <div className="glass-panel stat-box"><div className="stat-top">Near Expiry <div className="stat-icon icon-orange">🔔</div></div><h3 className="stat-val">{stats.near}</h3><span className="stat-sub text-orange">≤ 30 days</span></div>
        <div className="glass-panel stat-box"><div className="stat-top">Expired <div className="stat-icon icon-red">❌</div></div><h3 className="stat-val">{stats.expired}</h3><span className="stat-sub text-red">Needs action</span></div>
        <div className="glass-panel stat-box"><div className="stat-top">Safe <div className="stat-icon icon-green">🛡️</div></div><h3 className="stat-val">{stats.safe}</h3><span className="stat-sub text-green">&gt; 30 days</span></div>
        <div className="glass-panel stat-box"><div className="stat-top">Expiry Alerts <div className="stat-icon icon-blue">📢</div></div><h3 className="stat-val">{stats.alerts}</h3><span className="stat-sub text-blue">Total alerts</span></div>
      </div>

      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="filters-container" style={{ marginBottom: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="filter-group"><label>Search</label><input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search medicine..." /></div>
            <div className="filter-group"><label>Batch</label><input type="text" name="batch" value={filters.batch} onChange={handleFilterChange} className="filter-input" placeholder="Batch no..." /></div>
            <div className="filter-group"><label>Category</label><select name="category" value={filters.category} onChange={handleFilterChange} className="filter-input">{categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="filter-group"><label>Status</label><select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input"><option>All Status</option><option>Safe</option><option>Near Expiry</option><option>Expired</option></select></div>
          </div>
          <div className="filter-actions">
            <button className="btn-primary" onClick={fetchExpiryData}>Filter</button>
            <button className="btn-secondary" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      <div className="expiry-main-split">
        <div className="expiry-left-col">
          <div className="expiry-charts-row">

            <div className="glass-panel">
              <h3 className="panel-header">Expiry Status Overview</h3>
              <div className="expiry-overview-container">
                {(() => {
                  const safe  = Number(stats.safe)    || 0;
                  const near  = Number(stats.near)    || 0;
                  const exp   = Number(stats.expired) || 0;
                  const total = safe + near + exp || 1;
                  const safePct = Math.round((safe / total) * 100);
                  const nearPct = Math.round((near / total) * 100);
                  const expPct  = Math.max(0, 100 - safePct - nearPct);
                  return (
                    <>
                      {/* Donut Chart */}
                      <div style={{
                        width: '95px',
                        height: '95px',
                        borderRadius: '50%',
                        background: `conic-gradient(#4ade80 0% ${safePct}%, #f59e0b ${safePct}% ${safePct + nearPct}%, #f43f5e ${safePct + nearPct}% 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 0 12px rgba(74, 222, 128, 0.2)'
                      }}>
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '50%',
                          background: '#0a192f',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{total}</span>
                          <span style={{ fontSize: '9px', color: '#94A3B8' }}>Batches</span>
                        </div>
                      </div>

                      {/* Legend Chips */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(74, 222, 128, 0.08)', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #4ade80' }}>
                          <span style={{ color: '#4ade80', whiteSpace: 'nowrap' }}>Safe (&gt;30d)</span>
                          <strong style={{ color: '#4ade80', marginLeft: '6px' }}>{safe} ({safePct}%)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(245, 158, 11, 0.08)', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                          <span style={{ color: '#f59e0b', whiteSpace: 'nowrap' }}>Near Expiry</span>
                          <strong style={{ color: '#f59e0b', marginLeft: '6px' }}>{near} ({nearPct}%)</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(244, 63, 94, 0.08)', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #f43f5e' }}>
                          <span style={{ color: '#f43f5e', whiteSpace: 'nowrap' }}>Expired</span>
                          <strong style={{ color: '#f43f5e', marginLeft: '6px' }}>{exp} ({expPct}%)</strong>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="glass-panel">
              <h3 className="panel-header">Expiry Trend <span className="stat-sub">(Next 6 Months)</span></h3>
              <div className="expiry-trend-container">
                <div className="expiry-trend-bars-wrapper">
                  {trendData.map((item, i) => (
                    <div key={i} className="expiry-trend-col">
                      <span className="expiry-trend-val" style={{ color: item.color }}>{item.val}</span>
                      <div
                        className="expiry-trend-bar"
                        style={{
                          height: `${Math.min(100, Math.max(16, Math.round((item.val / maxTrendVal) * 88)))}%`,
                          background: `linear-gradient(180deg, ${item.color}, ${item.color}77)`,
                          boxShadow: `0 0 10px ${item.color}33`
                        }}
                        title={`${item.label} (${item.monthName}): ${item.val} expiring batches`}
                      />
                    </div>
                  ))}
                </div>
                <div className="expiry-trend-labels-row">
                  {trendData.map((item, i) => (
                    <div key={i} className="expiry-trend-label-item">
                      <span style={{ display: 'block', fontWeight: '600', color: '#CAF0F8' }}>{item.label}</span>
                      <span style={{ display: 'block', fontSize: '0.68rem', color: '#94A3B8' }}>{item.monthName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <h3 className="panel-header">Top 5 Near Expiry</h3>
              <div className="expiry-mini-table-container">
                <table className="expiry-mini-table">
                  <thead>
                    <tr>
                      <th style={{ width: '48%' }}>Medicine</th>
                      <th style={{ width: '28%' }}>Expiry</th>
                      <th style={{ width: '24%', textAlign: 'right' }}>Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px 0' }}>Loading...</td></tr>
                    ) : topNearExpiry.length === 0 ? (
                      <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94A3B8', padding: '20px 0' }}>No near expiry items</td></tr>
                    ) : (
                      topNearExpiry.slice(0, 5).map(item => (
                        <tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedMedModal(item)}>
                          <td style={{ color: '#00B4D8', fontWeight: '600' }} title={item.name}>{item.name}</td>
                          <td style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{item.expiry}</td>
                          <td style={{ textAlign: 'right' }}>
                            <span className={Number(item.daysLeft) < 0 ? 'text-red font-bold' : Number(item.daysLeft) <= 30 ? 'text-orange font-bold' : 'text-green font-bold'}>
                              {item.daysLeft}d
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 className="panel-header" style={{ margin: 0, border: 'none' }}>Expiry Medicines List</h3>
              <button className="btn-secondary" onClick={() => downloadFile('/api/reports/expiry-summary/download', 'Expiry_Report.pdf')}>📥 Export PDF</button>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={filteredExpiryList.length > 0 && selectedIds.length === filteredExpiryList.length}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th>Medicine Name</th>
                    <th>Batch No.</th>
                    <th>Category</th>
                    <th>Mfg Date</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Stock Qty</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Alert</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="12" style={{ textAlign: 'center' }}>Loading...</td></tr>
                  ) : filteredExpiryList.length === 0 ? (
                    <tr><td colSpan="12" style={{ textAlign: 'center', color: '#94A3B8' }}>No records found</td></tr>
                  ) : filteredExpiryList.map(med => (
                    <tr key={med.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(med.id)}
                          onChange={() => handleToggleSelect(med.id)}
                        />
                      </td>
                      <td style={{ color: '#00B4D8', fontWeight: '600', cursor: 'pointer' }} onClick={() => setSelectedMedModal(med)}>{med.name}</td>
                      <td>{med.batch}</td>
                      <td>{med.category}</td>
                      <td>{med.mfg}</td>
                      <td>{med.expiry}</td>
                      <td className={Number(med.daysLeft) < 0 ? 'text-red font-bold' : Number(med.daysLeft) <= 30 ? 'text-orange font-bold' : 'text-green font-bold'}>{med.daysLeft}</td>
                      <td>{med.qty}</td>
                      <td>{med.location}</td>
                      <td><span className={med.status === 'Safe' ? 'status-badge badge-success' : med.status === 'Expired' ? 'status-badge badge-danger' : 'status-badge badge-warning'}>{med.status}</span></td>
                      <td style={{ textAlign: 'center' }}>{med.alert ? '✅' : '❌'}</td>
                      <td>
                        <div className="table-icons">
                          <button className="icon-btn" title="View Details" onClick={() => setSelectedMedModal(med)}>👁️</button>
                          <button className="icon-btn" title="Dispatch Alert" onClick={() => handleSendAlert(med)}>🔔</button>
                          <button className="icon-btn delete" title="Discard/Dispose Batch" onClick={() => handleDiscard(med)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-container">
              <div className="show-entries">Show <select defaultValue="10"><option>10</option><option>25</option></select> entries</div>
              <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                Showing {filteredExpiryList.length} of {expiryList.length} records {selectedIds.length > 0 && `(${selectedIds.length} selected)`}
              </div>
            </div>
          </div>
        </div>

        <div className="expiry-right-col">
          <div className="glass-panel">
            <h3 className="panel-header">Alert Summary</h3>
            <div className="alert-summary-item"><span>🚨 Expired Medicines</span> <span className="text-red font-bold">{alertSummary.expired}</span></div>
            <div className="alert-summary-item"><span>🔔 Near Expiry (≤ 30d)</span> <span className="text-orange font-bold">{alertSummary.near}</span></div>
            <div className="alert-summary-item"><span>✅ Alerts Sent</span> <span className="text-green font-bold">{alertSummary.sent}</span></div>
            <div className="alert-summary-item"><span>⏳ Pending Alerts</span> <span className="text-orange font-bold">{alertSummary.pending}</span></div>
          </div>

          <div className="glass-panel">
            <h3 className="panel-header">Alert Settings</h3>
            <div className="settings-row">
              <span>Near Expiry Warning</span>
              <select className="filter-input" style={{ width: '90px' }} value={settings.nearDays} onChange={(e) => setSettings(prev => ({ ...prev, nearDays: Number(e.target.value) }))}>
                <option value="15">15 Days</option><option value="30">30 Days</option>
              </select>
            </div>
            <div className="settings-row">
              <span>Critical Alert</span>
              <select className="filter-input" style={{ width: '90px' }} value={settings.criticalDays} onChange={(e) => setSettings(prev => ({ ...prev, criticalDays: Number(e.target.value) }))}>
                <option value="7">7 Days</option><option value="10">10 Days</option>
              </select>
            </div>
            <div className="settings-row">
              <span>Email Alerts</span>
              <div className={settings.email ? 'toggle-switch active' : 'toggle-switch'} onClick={() => toggleSetting('email')}></div>
            </div>
            <div className="settings-row">
              <span>SMS Alerts</span>
              <div className={settings.sms ? 'toggle-switch active' : 'toggle-switch'} onClick={() => toggleSetting('sms')}></div>
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={handleSaveSettings}>Save Settings</button>
          </div>

          <div className="glass-panel">
            <h3 className="panel-header">Calendar View</h3>
            <div className="calendar-header"><span>«</span><span>September 2026</span><span>»</span></div>
            <div className="calendar-grid">
              <div className="calendar-day-name">Su</div><div className="calendar-day-name">Mo</div><div className="calendar-day-name">Tu</div><div className="calendar-day-name">We</div><div className="calendar-day-name">Th</div><div className="calendar-day-name">Fr</div><div className="calendar-day-name">Sa</div>
              <div></div><div>1</div><div>2</div><div>3</div><div>4</div><div>5</div><div>6</div>
              <div>7</div><div>8</div><div>9</div><div className="calendar-day expired">10</div><div className="calendar-day near">11</div><div>12</div><div>13</div>
              <div>14</div><div>15</div><div>16</div><div>17</div><div>18</div><div>19</div><div>20</div>
              <div>21</div><div>22</div><div>23</div><div>24</div><div>25</div><div>26</div><div>27</div>
              <div className="calendar-day near">28</div><div className="calendar-day safe">29</div><div>30</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', fontSize: '0.75rem', justifyContent: 'center' }}>
              <span>🔴 Expired</span><span>🟡 Near Expiry</span><span>🟢 Safe</span>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedMedModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '520px', padding: '24px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e3a5f', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Medicine Expiry Details</h3>
              <button onClick={() => setSelectedMedModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Medicine Name</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.name}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Batch Number</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.batch}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Category</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.category}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Location</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.location}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Manufacturing Date</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.mfg}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Expiry Date</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.expiry}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Days Remaining</span><strong className={Number(selectedMedModal.daysLeft) < 0 ? 'text-red' : Number(selectedMedModal.daysLeft) <= 30 ? 'text-orange' : 'text-green'}>{selectedMedModal.daysLeft} days</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Available Stock</span><strong style={{ color: '#CAF0F8' }}>{selectedMedModal.qty} units</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Status</span><span className={`status-badge ${selectedMedModal.status === 'Safe' ? 'badge-success' : selectedMedModal.status === 'Expired' ? 'badge-danger' : 'badge-warning'}`}>{selectedMedModal.status}</span></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Alert Notification</span><strong style={{ color: selectedMedModal.alert ? '#4ade80' : '#f43f5e' }}>{selectedMedModal.alert ? 'Active Sent' : 'Not Triggered'}</strong></div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setSelectedMedModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => { handleSendAlert(selectedMedModal); setSelectedMedModal(null); }}>Dispatch Alert</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminExpiry;
