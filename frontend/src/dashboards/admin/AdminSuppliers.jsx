import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './DashboardLayout';
import { apiRequest, downloadFile } from '../../lib/api';
import './AdminSuppliers.css';

const AdminSuppliers = () => {
  const [selectedSupplierModal, setSelectedSupplierModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- STATE MANAGEMENT ---
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, payable: 0, overdue: 0 });
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [activities, setActivities] = useState([]);

  // Add Supplier Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    supplierType: "Distributor",
  });

  // Filters
  const [filters, setFilters] = useState({
    search: '', type: 'All Types', status: 'All Status', location: 'All Locations', paymentStatus: 'All'
  });
  const [toastMsg, setToastMsg] = useState("");

  const fetchSupplierData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/admin/suppliers");
      setStats(data.stats || { total: 0, active: 0, inactive: 0, payable: 0, overdue: 0 });
      setSuppliers(data.suppliers || []);
      setFilteredSuppliers(data.suppliers || []);
      setUpcomingPayments(data.upcomingPayments || []);
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message || "Failed to load supplier records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplierData();
  }, []);

  // Available dynamic filter options derived from actual database records
  const availableTypes = useMemo(() => {
    const types = Array.from(new Set(suppliers.map(s => s.type).filter(Boolean)));
    return ['All Types', ...types];
  }, [suppliers]);

  const availableLocations = useMemo(() => {
    const locs = Array.from(new Set(suppliers.map(s => s.location).filter(Boolean)));
    return ['All Locations', ...locs];
  }, [suppliers]);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = suppliers;
    if (filters.search) {
      const term = filters.search.trim().toLowerCase();
      result = result.filter(s =>
        (s.name && s.name.toLowerCase().includes(term)) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(term)) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.location && s.location.toLowerCase().includes(term)) ||
        (s.type && s.type.toLowerCase().includes(term)) ||
        (s.contactNo && s.contactNo.includes(term))
      );
    }
    if (filters.type !== 'All Types') {
      result = result.filter(s => s.type === filters.type);
    }
    if (filters.status !== 'All Status') {
      result = result.filter(s => (s.status || '').toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.location !== 'All Locations') {
      result = result.filter(s => s.location === filters.location);
    }
    setFilteredSuppliers(result);
  }, [filters, suppliers]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters({ search: '', type: 'All Types', status: 'All Status', location: 'All Locations', paymentStatus: 'All' });

  return (
    <DashboardLayout title="Suppliers">
      {error && <div className="page-loading">{error}</div>}
      {toastMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#a7f3d0',
          padding: '10px 16px',
          borderRadius: '8px',
          margin: '0 0 1rem 0'
        }}>
          {toastMsg}
        </div>
      )}
      
      {/* 1. TOP SUMMARY CARDS */}
      <div className="suppliers-stats-grid">
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Suppliers <div className="stat-icon icon-blue">👥</div></div>
          <h3 className="stat-val">{stats.total}</h3>
          <span className="stat-sub text-blue">All suppliers</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Active Suppliers <div className="stat-icon icon-green">✅</div></div>
          <h3 className="stat-val">{stats.active}</h3>
          <span className="stat-sub text-green">78% of total</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Inactive Suppliers <div className="stat-icon icon-red">❌</div></div>
          <h3 className="stat-val">{stats.inactive}</h3>
          <span className="stat-sub text-red">22% of total</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Payable <div className="stat-icon icon-blue">💳</div></div>
          <h3 className="stat-val">₹ {stats.payable}</h3>
          <span className="stat-sub text-blue">All unpaid invoices</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Overdue Payments <div className="stat-icon icon-orange">⏳</div></div>
          <h3 className="stat-val">₹ {stats.overdue}</h3>
          <span className="stat-sub text-orange">18 suppliers</span>
        </div>
      </div>

      {/* 2. FILTERS & ACTIONS ROW */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="suppliers-filter-row">
          <div className="suppliers-filters">
            <div className="filter-group">
              <label>Search</label>
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search by name, contact..." />
            </div>
            <div className="filter-group hide-mobile">
              <label>Supplier Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange} className="filter-input">
                {availableTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input">
                <option value="All Status">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Location</label>
              <select name="location" value={filters.location} onChange={handleFilterChange} className="filter-input">
                {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Payment Status</label>
              <select name="paymentStatus" value={filters.paymentStatus} onChange={handleFilterChange} className="filter-input">
                <option>All</option><option>Pending</option><option>Cleared</option>
              </select>
            </div>
          </div>
          <div className="suppliers-actions">
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>➕ Add Supplier</button>
            <button className="btn-secondary" onClick={() => downloadFile("/api/reports/supplier-analysis/download", "Suppliers_Report.pdf")}>📤 Export PDF</button>
            <button className="btn-secondary" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* 3. SUPPLIERS LIST TABLE */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <h3 className="panel-header">Suppliers List</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={filteredSuppliers.length > 0 && selectedIds.length === filteredSuppliers.length} onChange={(e) => setSelectedIds(e.target.checked ? filteredSuppliers.map(s => s.id) : [])} /></th>
                <th>Supplier Name</th>
                <th className="hide-mobile">Type</th>
                <th>Contact Person</th>
                <th className="hide-mobile">Contact No.</th>
                <th className="hide-mobile">Email</th>
                <th className="hide-mobile">Location</th>
                <th className="hide-mobile">Credit Limit (₹)</th>
                <th>Balance (₹)</th>
                <th className="hide-mobile">Payment Terms</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="12" style={{textAlign: 'center'}}>Loading...</td></tr> : 
                filteredSuppliers.map(sup => (
                <tr key={sup.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(sup.id)} onChange={() => setSelectedIds(prev => prev.includes(sup.id) ? prev.filter(x => x !== sup.id) : [...prev, sup.id])} /></td>
                  <td style={{color: '#00B4D8', fontWeight: '600'}}>{sup.name}</td>
                  <td className="hide-mobile">{sup.type}</td>
                  <td>{sup.contactPerson}</td>
                  <td className="hide-mobile">{sup.contactNo}</td>
                  <td className="hide-mobile">{sup.email}</td>
                  <td className="hide-mobile">{sup.location}</td>
                  <td className="hide-mobile">{sup.creditLimit}</td>
                  <td className={sup.balance === "0" ? "text-green" : "text-orange"}>{sup.balance}</td>
                  <td className="hide-mobile">{sup.paymentTerms}</td>
                  <td><span className={`status-badge ${sup.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{sup.status}</span></td>
                  <td>
                    <div className="table-icons">
                      <button className="icon-btn" title="View details" onClick={() => setSelectedSupplierModal(sup)}>👁️</button>
                      <button className="icon-btn delete" title="Deactivate" onClick={async () => {
                        if (window.confirm(`Deactivate supplier ${sup.name}?`)) {
                          await apiRequest(`/api/suppliers/${sup.id}`, { method: 'DELETE' });
                          await fetchSupplierData();
                        }
                      }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="pagination-container">
          <div>Showing 1 to {filteredSuppliers.length} of {stats.total} entries</div>
        </div>
      </div>

      {/* 4. BOTTOM 4-COLUMN GRID */}
      <div className="suppliers-bottom-grid">
        
        <div className="glass-panel">
          <h3 className="panel-header">Top Suppliers <span className="stat-sub">(By Activity & Balance)</span></h3>
          <div className="chart-box" style={{ padding: '12px' }}>
            {suppliers.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: 'center' }}>No supplier data</p>
            ) : (() => {
              const maxBal = Math.max(1, ...suppliers.map(s => parseFloat(String(s.balance || '0').replace(/[^0-9.]/g, '')) || 0));
              const top = [...suppliers].sort((a,b) => (parseFloat(String(b.balance||'0').replace(/[^0-9.]/g,''))||0) - (parseFloat(String(a.balance||'0').replace(/[^0-9.]/g,''))||0)).slice(0, 4);
              const barColors = ['#00B4D8', '#4ade80', '#f59e0b', '#ec4899'];
              return (
                <div style={{ height: '175px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', padding: '10px 4px 4px' }}>
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', inset: '10px 10px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                    <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                    <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                    <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                  </div>
                  {top.map((s, idx) => {
                    const balNum = parseFloat(String(s.balance || '0').replace(/[^0-9.]/g, '')) || 0;
                    const heightPct = Math.max(15, Math.min(100, Math.round((balNum / maxBal) * 100)));
                    return (
                      <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, width: '22%' }}>
                        <span style={{ fontSize: '10px', color: barColors[idx % 4], fontWeight: 'bold' }}>₹{s.balance}</span>
                        <div style={{
                          width: '100%',
                          maxWidth: '34px',
                          height: `${heightPct}%`,
                          background: `linear-gradient(180deg, ${barColors[idx % 4]} 0%, rgba(0, 180, 216, 0.25) 100%)`,
                          borderRadius: '6px 6px 0 0',
                          boxShadow: `0 0 8px ${barColors[idx % 4]}55`,
                          transition: 'height 0.4s ease'
                        }} />
                        <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{s.name}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Supplier Status &amp; Types</h3>
          <div className="chart-box" style={{ padding: '14px' }}>
            {(() => {
              const activePct = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 100;
              const types = ['Manufacturer', 'Distributor', 'Wholesaler'];
              const typePalette = { Manufacturer: '#00B4D8', Distributor: '#a855f7', Wholesaler: '#f59e0b' };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                    {/* Donut Chart */}
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      background: `conic-gradient(#4ade80 0% ${activePct}%, #f43f5e ${activePct}% 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 0 12px rgba(74, 222, 128, 0.25)'
                    }}>
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: '#0a192f',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{stats.total}</span>
                        <span style={{ fontSize: '9px', color: '#94A3B8' }}>Vendors</span>
                      </div>
                    </div>

                    {/* Active vs Inactive stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(74, 222, 128, 0.08)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #4ade80' }}>
                        <span style={{ color: '#4ade80' }}>Active</span>
                        <strong style={{ color: '#4ade80' }}>{stats.active} ({activePct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(244, 63, 94, 0.08)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #f43f5e' }}>
                        <span style={{ color: '#f43f5e' }}>Inactive</span>
                        <strong style={{ color: '#f43f5e' }}>{stats.inactive} ({100 - activePct}%)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Vendor Types Distribution */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px 8px', borderRadius: '6px', border: '1px solid #1e3a5f' }}>
                    {types.map(t => {
                      const count = suppliers.filter(s => s.type === t).length;
                      return (
                        <div key={t} style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: typePalette[t], display: 'block', fontWeight: '600' }}>● {t}</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{count}</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Upcoming Payments</h3>
          <div className="mini-list">
            {loading ? <p>Loading...</p> : upcomingPayments.length === 0 ? <p style={{ fontSize: '0.8rem', color: '#94A3B8' }}>No pending payments</p> : upcomingPayments.map(payment => (
              <div className="mini-list-item" key={payment.id}>
                <div className="mini-list-info">
                  <div className={`mini-list-icon ${payment.iconClass}`}>👤</div>
                  <div className="mini-list-text">
                    <h4>{payment.name}</h4>
                  </div>
                </div>
                <div className="mini-list-value text-orange">{payment.amount}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Recent Supplier Activities</h3>
          <div className="mini-list">
            {loading ? <p>Loading...</p> : activities.map(activity => (
              <div className="mini-list-item" key={activity.id}>
                <div className="mini-list-info">
                  <div className={`mini-list-icon ${activity.iconClass}`}>{activity.icon}</div>
                  <div className="mini-list-text">
                    <p style={{color: '#CAF0F8'}}>{activity.text}</p>
                  </div>
                </div>
                <div className="mini-list-text"><p>{activity.time}</p></div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Add Supplier Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '90%', padding: '24px', borderRadius: '12px', background: '#0d1b2a', border: '1px solid #1e3a5f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Add New Supplier</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRequest("/api/suppliers", {
                  method: "POST",
                  body: {
                    companyName: supplierForm.companyName,
                    contactPerson: supplierForm.contactPerson,
                    phone: supplierForm.phone,
                    email: supplierForm.email,
                    address: supplierForm.address,
                    supplierType: supplierForm.supplierType,
                    status: "ACTIVE"
                  }
                });
                setIsAddModalOpen(false);
                setSupplierForm({ companyName: "", contactPerson: "", phone: "", email: "", address: "", supplierType: "Distributor" });
                setToastMsg(`Supplier ${supplierForm.companyName} added successfully.`);
                setTimeout(() => setToastMsg(""), 4000);
                await fetchSupplierData();
              } catch (err) {
                setToastMsg(`❌ ${err.message || "Failed to add supplier"}`);
                setTimeout(() => setToastMsg(""), 5000);
              }
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Company Name *</label>
                <input required className="filter-input" style={{ width: '100%' }} value={supplierForm.companyName} onChange={e => setSupplierForm(prev => ({ ...prev, companyName: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Contact Person</label>
                  <input className="filter-input" style={{ width: '100%' }} value={supplierForm.contactPerson} onChange={e => setSupplierForm(prev => ({ ...prev, contactPerson: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Phone *</label>
                  <input required className="filter-input" style={{ width: '100%' }} value={supplierForm.phone} onChange={e => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Email</label>
                <input type="email" className="filter-input" style={{ width: '100%' }} value={supplierForm.email} onChange={e => setSupplierForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Type</label>
                  <select className="filter-input" style={{ width: '100%' }} value={supplierForm.supplierType} onChange={e => setSupplierForm(prev => ({ ...prev, supplierType: e.target.value }))}>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Wholesaler">Wholesaler</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Location / City</label>
                  <input className="filter-input" style={{ width: '100%' }} value={supplierForm.address} onChange={e => setSupplierForm(prev => ({ ...prev, address: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* VIEW SUPPLIER DETAILS MODAL */}
      {selectedSupplierModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '520px', padding: '24px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e3a5f', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Supplier Details</h3>
              <button onClick={() => setSelectedSupplierModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Company Name</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.name}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Supplier Type</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.type}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Contact Person</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.contactPerson}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Contact Number</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.contactNo}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Email</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.email}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Location / City</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.location}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Credit Limit</span><strong style={{ color: '#CAF0F8' }}>₹ {selectedSupplierModal.creditLimit}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Outstanding Balance</span><strong className={selectedSupplierModal.balance === "0" ? "text-green" : "text-orange"}>₹ {selectedSupplierModal.balance}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Payment Terms</span><strong style={{ color: '#CAF0F8' }}>{selectedSupplierModal.paymentTerms}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Status</span><span className={`status-badge ${selectedSupplierModal.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{selectedSupplierModal.status}</span></div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setSelectedSupplierModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminSuppliers;