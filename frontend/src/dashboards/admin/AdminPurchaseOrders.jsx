import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './DashboardLayout';
import { apiRequest, downloadFile } from '../../lib/api';
import './AdminPurchaseOrders.css';

const AdminPurchaseOrders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // --- STATE MANAGEMENT ---
  const [stats, setStats] = useState({ total: 0, pending: 0, received: 0, amount: 0, overdue: 0 });
  const [poList, setPoList] = useState([]);
  const [filteredPoList, setFilteredPoList] = useState([]);
  
  const [recentPO, setRecentPO] = useState([]);
  const [supplierPerf, setSupplierPerf] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [supplierOptionsList, setSupplierOptionsList] = useState([]);

  // Create PO Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPoSupplierId, setNewPoSupplierId] = useState("");
  const [newPoNumber, setNewPoNumber] = useState("");
  const [newPoAmount, setNewPoAmount] = useState(0);

  // View Details Modal & Status Update Modal
  const [selectedPoModal, setSelectedPoModal] = useState(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState(null);
  const [newStatusValue, setNewStatusValue] = useState("RECEIVED");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [filters, setFilters] = useState({
    search: '', supplier: 'All Suppliers', status: 'All Status', startDate: '', endDate: ''
  });

  const fetchPOData = async () => {
    setLoading(true);
    setError("");
    try {
      const [poData, suppliersData] = await Promise.all([
        apiRequest("/api/admin/purchases"),
        apiRequest("/api/suppliers")
      ]);
      setStats(poData.stats || { total: 0, pending: 0, received: 0, amount: 0, overdue: 0 });
      setPoList(poData.poList || []);
      setFilteredPoList(poData.poList || []);
      setRecentPO(poData.recentPO || (poData.poList || []).slice(0, 5));
      setSupplierPerf(poData.supplierPerf || []);
      setTopMedicines(poData.topMedicines || []);
      setSupplierOptionsList(suppliersData || []);
    } catch (err) {
      setError(err.message || "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOData();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = poList;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(p => (p.id || '').toLowerCase().includes(term) || (p.supplier || '').toLowerCase().includes(term));
    }
    if (filters.supplier !== 'All Suppliers') result = result.filter(p => p.supplier === filters.supplier);
    if (filters.status !== 'All Status') result = result.filter(p => p.status === filters.status);
    setFilteredPoList(result);
    setCurrentPage(1);
  }, [filters, poList]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters({ search: '', supplier: 'All Suppliers', status: 'All Status', startDate: '', endDate: '' });

  const getBadgeClass = (status) => {
    if (status === 'Received' || status === 'Paid') return 'badge-success';
    if (status === 'Pending' || status === 'Partial Received' || status === 'Partial') return 'badge-warning';
    return 'badge-danger'; // Overdue, Cancelled, Unpaid
  };

  const supplierOptions = useMemo(() => [
    'All Suppliers',
    ...new Set(poList.map(p => p.supplier).filter(Boolean))
  ], [poList]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPoList.length / pageSize));
  const pagedPoList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPoList.slice(start, start + pageSize);
  }, [filteredPoList, currentPage, pageSize]);

  const handleCreatePoSubmit = async (e) => {
    e.preventDefault();
    if (!newPoSupplierId) {
      setToastMessage("⚠️ Please select a supplier");
      setTimeout(() => setToastMessage(""), 4000);
      return;
    }
    try {
      const poNum = newPoNumber || `PO-${Date.now()}`;
      await apiRequest("/api/purchase-orders", {
        method: "POST",
        body: {
          supplierId: Number(newPoSupplierId),
          poNumber: poNum,
          totalAmount: Number(newPoAmount || 0),
          createdBy: "Admin"
        }
      });
      setIsCreateModalOpen(false);
      setNewPoNumber("");
      setNewPoAmount(0);
      setToastMessage(`Purchase order ${poNum} created successfully.`);
      setTimeout(() => setToastMessage(""), 4000);
      await fetchPOData();
    } catch (err) {
      setToastMessage(`❌ ${err.message || "Failed to create PO"}`);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  const handleCopyPoNumber = (poId) => {
    navigator.clipboard?.writeText(poId);
    setToastMessage(`Copied ${poId} to clipboard.`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!statusUpdateModal) return;
    try {
      const idToUse = statusUpdateModal.orderId || statusUpdateModal.id;
      if (newStatusValue === 'CANCELLED') {
        await apiRequest(`/api/purchase-orders/${idToUse}/cancel`, { method: "PATCH" });
      } else {
        await apiRequest(`/api/purchase-orders/${idToUse}/status?status=${newStatusValue}`, { method: "PATCH" });
      }
      setStatusUpdateModal(null);
      setToastMessage(`PO ${statusUpdateModal.id} status updated to ${newStatusValue}.`);
      setTimeout(() => setToastMessage(""), 4000);
      await fetchPOData();
    } catch (err) {
      setToastMessage(`❌ ${err.message || "Failed to update PO status"}`);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  const handleTriggerAutoReorder = async () => {
    try {
      setToastMessage("Evaluating inventory thresholds for automated reorder...");
      const res = await apiRequest("/api/purchase-orders/auto-reorder", { method: "POST" });
      if (res && res.createdOrders && res.createdOrders.length > 0) {
        setToastMessage(`⚡ Auto-Reorder complete! Created ${res.createdOrders.length} draft PO(s) for ${res.lowStockCount} low-stock item(s).`);
      } else {
        setToastMessage(`ℹ️ ${res.message || "All inventory items are currently above threshold levels."}`);
      }
      setTimeout(() => setToastMessage(""), 6000);
      await fetchPOData();
    } catch (err) {
      setToastMessage(`❌ ${err.message || "Failed to trigger auto-reorder"}`);
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  return (
    <DashboardLayout title="Purchase Orders">

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

      {/* 1. TOP SUMMARY CARDS */}
      <div className="po-stats-grid">
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Orders <div className="stat-icon icon-blue">📦</div></div>
          <h3 className="stat-val">{stats.total}</h3>
          <span className="stat-sub text-blue">All purchase orders</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Pending Orders <div className="stat-icon icon-orange">⏳</div></div>
          <h3 className="stat-val">{stats.pending}</h3>
          <span className="stat-sub text-orange">Awaiting delivery</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Received <div className="stat-icon icon-green">✅</div></div>
          <h3 className="stat-val">{stats.received}</h3>
          <span className="stat-sub text-green">Fulfilled orders</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Spend <div className="stat-icon icon-purple">💳</div></div>
          <h3 className="stat-val">₹ {stats.amount}</h3>
          <span className="stat-sub text-purple">Cumulative amount</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Overdue Orders <div className="stat-icon icon-red">⚠️</div></div>
          <h3 className="stat-val">{stats.overdue}</h3>
          <span className="stat-sub text-red">Action required</span>
        </div>
      </div>

      {/* 2. FILTERS ROW */}
      <div className="glass-panel" style={{marginTop: '1.5rem'}}>
        <div className="filters-container" style={{marginBottom: 0, justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1}}>
            <div className="filter-group">
              <label>Search PO</label>
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search PO number, supplier..." />
            </div>
            <div className="filter-group hide-mobile">
              <label>Supplier</label>
              <select name="supplier" value={filters.supplier} onChange={handleFilterChange} className="filter-input">
                {supplierOptions.map(sup => <option key={sup} value={sup}>{sup}</option>)}
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input">
                <option>All Status</option><option>Pending</option><option>Received</option><option>Cancelled</option>
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Date Range</label>
              <div style={{display: 'flex', gap: '5px'}}>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="filter-input" />
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="filter-input" />
              </div>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-primary" onClick={fetchPOData}>Filter</button>
            <button className="btn-secondary" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* 3. MAIN SPLIT: PO Table (Left) + Quick Actions/Alerts (Right) */}
      <div className="po-main-split">
        
        {/* LEFT COLUMN: Table */}
        <div className="glass-panel">
          <div className="table-header-actions" style={{justifyContent: 'space-between'}}>
            <h3 className="panel-header" style={{margin: 0, border: 'none'}}>Purchase Orders List</h3>
            <div className="filter-actions" style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
              <button
                className="btn-accent"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                }}
                onClick={handleTriggerAutoReorder}
              >
                ⚡ Auto-Reorder
              </button>
              <button className="btn-primary" onClick={() => setIsCreateModalOpen(true)}>+ New PO</button>
              <button className="btn-secondary" onClick={() => downloadFile("/api/reports/purchase-orders/download", "Purchase_Orders_Report.pdf")}>📥 Export</button>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Supplier</th>
                  <th className="hide-mobile">Order Date</th>
                  <th className="hide-mobile">Expected Date</th>
                  <th>Total Amount (₹)</th>
                  <th>Status</th>
                  <th className="hide-mobile">Payment</th>
                  <th className="hide-mobile">GRN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="9" style={{textAlign: 'center'}}>Loading...</td></tr> : 
                  pagedPoList.length === 0 ? <tr><td colSpan="9" style={{textAlign: 'center', color: '#94A3B8'}}>No purchase orders found</td></tr> :
                  pagedPoList.map(po => (
                  <tr key={po.id}>
                    <td style={{color: '#94A3B8', maxWidth: '140px', overflowWrap: 'break-word', wordBreak: 'break-all', fontSize: '0.82rem', cursor: 'pointer'}} onClick={() => setSelectedPoModal(po)}>{po.id}</td>
                    <td style={{color: '#00B4D8', fontWeight: '600', maxWidth: '160px', overflowWrap: 'break-word'}}>{po.supplier}</td>
                    <td className="hide-mobile">{po.orderDate}</td>
                    <td className="hide-mobile">{po.expectedDate}</td>
                    <td>₹ {po.amount}</td>
                    <td><span className={`status-badge ${getBadgeClass(po.status)}`}>{po.status}</span></td>
                    <td className="hide-mobile"><span className={`status-badge ${getBadgeClass(po.payment)}`}>{po.payment}</span></td>
                    <td className="hide-mobile"><span className={`status-badge ${getBadgeClass(po.grn)}`}>{po.grn}</span></td>
                    <td>
                      <div className="table-icons">
                        <button className="icon-btn" title="View Details" onClick={() => setSelectedPoModal(po)}>👁️</button>
                        <button className="icon-btn hide-mobile" title="Update Status" onClick={() => { setStatusUpdateModal(po); setNewStatusValue(po.status === 'Pending' ? 'RECEIVED' : 'PENDING'); }}>✏️</button>
                        <button className="icon-btn" title="Copy PO Number" onClick={() => handleCopyPoNumber(po.id)}>🔗</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <div className="show-entries">
              Show <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select> entries
            </div>
            <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              Showing {filteredPoList.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredPoList.length)} of {filteredPoList.length} orders
            </div>
            <div className="pagination-controls">
              <button className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`} disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>«</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
              ))}
              <button className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`} disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>»</button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Actions & Alerts */}
        <div className="po-right-col">
          <div className="glass-panel">
            <h3 className="panel-header">Quick Actions</h3>
            <div className="action-list">
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => setIsCreateModalOpen(true)}>📄 Create New PO</div>
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => { downloadFile("/api/reports/purchase-orders/download", "PO_Template.pdf"); setToastMessage("PO Template downloaded. Ready for Excel batch import."); setTimeout(() => setToastMessage(""), 4000); }}>📥 Import PO from Excel</div>
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => setFilters(prev => ({ ...prev, status: 'Received' }))}>📦 View All Fulfilled (GRN)</div>
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => setFilters(prev => ({ ...prev, status: 'Pending' }))}>⏳ Pending Receipts</div>
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => setFilters(prev => ({ ...prev, status: 'Pending' }))}>⚠️ Overdue Orders</div>
            </div>
          </div>
          
          <div className="glass-panel">
            <h3 className="panel-header">Alerts</h3>
            <div className="alert-list">
              <div className="alert-list-item"><div className="dot red"></div> <span className="text-red font-bold">{stats.overdue || 0}</span> Orders are overdue</div>
              <div className="alert-list-item"><div className="dot orange"></div> <span className="text-orange font-bold">{stats.pending || 0}</span> Orders pending delivery</div>
              <div className="alert-list-item"><div className="dot blue"></div> <span className="text-blue font-bold">{stats.total || 0}</span> Total orders logged</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM 4-COLUMN GRID */}
      <div className="po-bottom-grid">
        <div className="glass-panel">
          <h3 className="panel-header">Recent PO</h3>
          <div className="po-small-list">
            {recentPO.map((p, i) => (
              <div className="po-small-item" key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedPoModal(p)}>
                <div>
                  <div style={{color: '#CAF0F8', fontWeight: 'bold'}}>{p.id}</div>
                  <div style={{fontSize: '0.75rem', color: '#94A3B8'}}>{p.supplier}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <div style={{color: '#00B4D8'}}>₹ {p.amount}</div>
                  <div style={{fontSize: '0.7rem'}} className={p.status === 'Received' ? 'text-green' : 'text-orange'}>{p.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Supplier Performance</h3>
          <div className="po-small-list">
            {supplierPerf.map(s => (
              <div className="po-small-item" key={s.id}>
                <div>
                  <div style={{color: '#CAF0F8'}}>{s.name}</div>
                  <div style={{fontSize: '0.75rem', color: '#94A3B8'}}>Orders: {s.orders} | Vol: ₹ {s.amount}</div>
                </div>
                <span className="text-green font-bold">{s.delivery}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Purchase Summary</h3>
          <div style={{padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
              <span style={{color: '#94A3B8'}}>Total Orders:</span>
              <strong style={{color: '#00B4D8'}}>{stats.total}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
              <span style={{color: '#94A3B8'}}>Fulfilled (Received):</span>
              <strong style={{color: '#4ADE80'}}>{stats.received}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
              <span style={{color: '#94A3B8'}}>Pending Delivery:</span>
              <strong style={{color: '#F59E0B'}}>{stats.pending}</strong>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem'}}>
              <span style={{color: '#94A3B8'}}>Overdue:</span>
              <strong style={{color: '#F43F5E'}}>{stats.overdue}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Top Purchased Medicines</h3>
          <div className="po-small-list">
            {topMedicines.map(m => (
              <div className="po-small-item" key={m.id}>
                <span style={{color: '#CAF0F8'}}>💊 {m.name}</span>
                <span style={{color: '#00B4D8'}}>{m.qty} Units</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CREATE PO MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '20px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#00B4D8' }}>Create Purchase Order</h3>
            <form onSubmit={handleCreatePoSubmit}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8' }}>Select Supplier</label>
                <select 
                  className="filter-input" 
                  style={{ width: '100%' }}
                  value={newPoSupplierId} 
                  onChange={(e) => setNewPoSupplierId(e.target.value)} 
                  required
                >
                  <option value="">-- Choose Supplier --</option>
                  {supplierOptionsList.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8' }}>PO Number (Optional)</label>
                <input 
                  type="text" 
                  className="filter-input" 
                  style={{ width: '100%' }}
                  placeholder="e.g. PO-2026-0925"
                  value={newPoNumber}
                  onChange={(e) => setNewPoNumber(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8' }}>Total Estimated Amount (₹)</label>
                <input 
                  type="number" 
                  className="filter-input" 
                  style={{ width: '100%' }}
                  value={newPoAmount}
                  onChange={(e) => setNewPoAmount(e.target.value)}
                  min="0"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Generate PO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW PO DETAILS MODAL */}
      {selectedPoModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '520px', padding: '24px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e3a5f', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Purchase Order Details</h3>
              <button onClick={() => setSelectedPoModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>PO Number</span><strong style={{ color: '#CAF0F8' }}>{selectedPoModal.id}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Supplier</span><strong style={{ color: '#CAF0F8' }}>{selectedPoModal.supplier}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Order Date</span><strong style={{ color: '#CAF0F8' }}>{selectedPoModal.orderDate}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Expected Delivery</span><strong style={{ color: '#CAF0F8' }}>{selectedPoModal.expectedDate}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Order Amount</span><strong style={{ color: '#4ade80' }}>₹ {selectedPoModal.amount}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Order Status</span><span className={`status-badge ${getBadgeClass(selectedPoModal.status)}`}>{selectedPoModal.status}</span></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Payment Status</span><span className={`status-badge ${getBadgeClass(selectedPoModal.payment)}`}>{selectedPoModal.payment}</span></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>GRN Status</span><span className={`status-badge ${getBadgeClass(selectedPoModal.grn)}`}>{selectedPoModal.grn}</span></div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setSelectedPoModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => { handleCopyPoNumber(selectedPoModal.id); }}>Copy PO #</button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE STATUS MODAL */}
      {statusUpdateModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '440px', padding: '24px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#00B4D8' }}>Update PO Status</h3>
            <p style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: '15px' }}>
              Change delivery status for <strong>{statusUpdateModal.id}</strong> ({statusUpdateModal.supplier})
            </p>
            <form onSubmit={handleStatusSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px' }}>Target Status</label>
                <select className="filter-input" style={{ width: '100%' }} value={newStatusValue} onChange={(e) => setNewStatusValue(e.target.value)}>
                  <option value="RECEIVED">Received (Fulfill)</option>
                  <option value="PENDING">Pending (Waiting Delivery)</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setStatusUpdateModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminPurchaseOrders;
