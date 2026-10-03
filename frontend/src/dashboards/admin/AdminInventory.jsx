import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import { apiRequest, downloadFile } from '../../lib/api';
import BarcodeScannerModal from '../../components/BarcodeScannerModal';
import './AdminInventory.css'; 

const AdminInventory = () => {
  const navigate = useNavigate();
  const [viewDetailsModal, setViewDetailsModal] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // --- STATE MANAGEMENT ---
  const [stats, setStats] = useState({ value: 0, items: 0, stockInHand: 0, lowStock: 0, expired: 0 });
  const [inventoryList, setInventoryList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  
  const [lowStockList, setLowStockList] = useState([]);
  const [expiringList, setExpiringList] = useState([]);
  const [warehouseSummary, setWarehouseSummary] = useState([]);

  // Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [adjustQuantity, setAdjustQuantity] = useState(0);
  const [adjustReason, setAdjustReason] = useState("RESTOCK");

  const [filters, setFilters] = useState({
    search: '', category: 'All Categories', location: 'All Locations', status: 'All Status', expiry: 'All'
  });

  const fetchInventoryData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/admin/inventory");
      setStats(data.stats || { value: 0, items: 0, stockInHand: 0, lowStock: 0, expired: 0 });
      setInventoryList(data.inventoryList || []);
      setFilteredList(data.inventoryList || []);
      setLowStockList(data.lowStockList || []);
      setExpiringList(data.expiringList || []);
      setWarehouseSummary(data.warehouseSummary || []);
    } catch (err) {
      setError(err.message || "Failed to load live inventory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = inventoryList;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(term) || m.batch.toLowerCase().includes(term));
    }
    if (filters.category !== 'All Categories') result = result.filter(m => m.category === filters.category);
    if (filters.location !== 'All Locations') result = result.filter(m => m.location === filters.location);
    if (filters.status !== 'All Status') result = result.filter(m => m.status === filters.status);
    setFilteredList(result);
  }, [filters, inventoryList]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters({ search: '', category: 'All Categories', location: 'All Locations', status: 'All Status', expiry: 'All' });

  const categoryOptions = useMemo(() => [
    'All Categories',
    ...new Set(inventoryList.map(item => item.category).filter(Boolean))
  ], [inventoryList]);

  const locationOptions = useMemo(() => [
    'All Locations',
    ...new Set(inventoryList.map(item => item.location).filter(Boolean))
  ], [inventoryList]);

  const [toastMsg, setToastMsg] = useState("");

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInventoryItem) return;
    try {
      if (adjustReason === "STOCK_IN") {
        await apiRequest("/api/inventory/stock-in", {
          method: "POST",
          body: { inventoryId: selectedInventoryItem.id, quantity: adjustQuantity, reason: "Manual Restock", performedBy: "Admin" }
        });
      } else {
        await apiRequest("/api/inventory/stock-out", {
          method: "POST",
          body: { inventoryId: selectedInventoryItem.id, quantity: adjustQuantity, reason: "Manual Adjustment", performedBy: "Admin" }
        });
      }
      setToastMsg(`Stock ${adjustReason === 'STOCK_IN' ? 'added' : 'deducted'} successfully for ${selectedInventoryItem.name || 'item'}.`);
      setTimeout(() => setToastMsg(""), 4000);
      setIsAdjustModalOpen(false);
      await fetchInventoryData();
    } catch (err) {
      setToastMsg(`❌ ${err.message || "Failed to adjust stock"}`);
      setTimeout(() => setToastMsg(""), 5000);
    }
  };

  return (
    <DashboardLayout title="Inventory">
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
      <div className="inventory-stats-grid">
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Value <div className="stat-icon icon-blue">💰</div></div>
          <h3 className="stat-val">₹ {stats.value}</h3>
          <span className="stat-sub text-blue">All warehouses</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Items <div className="stat-icon icon-blue">📦</div></div>
          <h3 className="stat-val">{stats.items}</h3>
          <span className="stat-sub text-blue">Unique medicines</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Stock in Hand <div className="stat-icon icon-green">📊</div></div>
          <h3 className="stat-val">{stats.stockInHand}</h3>
          <span className="stat-sub text-green">Total quantity</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Low Stock <div className="stat-icon icon-orange">⚠️</div></div>
          <h3 className="stat-val">{stats.lowStock}</h3>
          <span className="stat-sub text-orange">Needs reorder</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Expired <div className="stat-icon icon-red">⌛</div></div>
          <h3 className="stat-val">{stats.expired}</h3>
          <span className="stat-sub text-red">Action required</span>
        </div>
      </div>

      {/* 2. FILTERS */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="filters-container" style={{ marginBottom: 0 }}>
          <div className="filter-group">
            <label>Search</label>
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search..." />
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="filter-input">
              {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="filter-group hide-mobile">
            <label>Location</label>
            <select name="location" value={filters.location} onChange={handleFilterChange} className="filter-input">
              {locationOptions.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>
          <div className="filter-group hide-mobile">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input">
              <option>All Status</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option>
            </select>
          </div>
          <div className="filter-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn-primary" onClick={fetchInventoryData}>Filter</button>
            <button className="btn-secondary" onClick={resetFilters}>Reset</button>
            <button
              type="button"
              className="btn-accent"
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={() => setIsScannerOpen(true)}
            >
              📷 Scan Barcode
            </button>
          </div>
        </div>
      </div>

      {/* 3. CHARTS (Horizontal Row) */}
      <div className="inventory-charts-row">
        
        {/* Chart 1: Warehouse Capacity & Distribution */}
        <div className="glass-panel">
          <h3 className="panel-header">Warehouse Distribution <span className="stat-sub">(Capacity & Value)</span></h3>
          <div className="chart-box" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {warehouseSummary.length === 0 ? (
              <p style={{ color: '#94A3B8', fontSize: '0.8rem', textAlign: 'center' }}>No warehouse telemetry</p>
            ) : warehouseSummary.slice(0, 4).map((wh, idx) => {
              const utilVal = parseFloat(wh.util) || 65;
              const barColors = ['#00B4D8', '#4ade80', '#f59e0b', '#a855f7'];
              return (
                <div key={wh.id || idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: '#CAF0F8', fontWeight: '500' }}>🏢 {wh.name}</span>
                    <span style={{ color: barColors[idx % 4], fontWeight: 'bold' }}>{wh.util}% <span style={{ color: '#94A3B8', fontWeight: 'normal', fontSize: '0.75rem' }}>(₹ {wh.value})</span></span>
                  </div>
                  <div style={{ height: '10px', background: '#1e3a5f', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.max(5, utilVal))}%`, background: `linear-gradient(90deg, ${barColors[idx % 4]} 0%, #00B4D8 100%)`, borderRadius: '5px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Stock Volume by Category Vertical Column Chart */}
        <div className="glass-panel">
          <h3 className="panel-header">Stock Volume by Category</h3>
          <div className="chart-box" style={{ padding: '12px' }}>
            {(() => {
              const cats = categoryOptions.filter(c => c !== 'All Categories');
              const catCounts = cats.map(c => ({
                name: c,
                qty: inventoryList.filter(item => item.category === c).reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
              })).sort((a, b) => b.qty - a.qty).slice(0, 4);

              const maxQty = Math.max(1, ...catCounts.map(c => c.qty));
              const palette = ['#00B4D8', '#10b981', '#f59e0b', '#ec4899'];

              return (
                <div style={{ height: '175px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', padding: '10px 4px 4px' }}>
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', inset: '10px 10px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                    <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                    <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                    <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                  </div>
                  {catCounts.map((cat, i) => {
                    const heightPct = Math.max(15, Math.min(100, Math.round((cat.qty / maxQty) * 100)));
                    return (
                      <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, width: '22%' }}>
                        <span style={{ fontSize: '11px', color: palette[i % 4], fontWeight: 'bold' }}>{cat.qty}</span>
                        <div style={{
                          width: '100%',
                          maxWidth: '34px',
                          height: `${heightPct}%`,
                          background: `linear-gradient(180deg, ${palette[i % 4]} 0%, rgba(0, 180, 216, 0.25) 100%)`,
                          borderRadius: '6px 6px 0 0',
                          boxShadow: `0 0 8px ${palette[i % 4]}55`,
                          transition: 'height 0.4s ease'
                        }} />
                        <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Chart 3: Stock Status Donut & Overview Chart */}
        <div className="glass-panel">
          <h3 className="panel-header">Stock Status Overview</h3>
          <div className="chart-box" style={{ padding: '14px' }}>
            {(() => {
              const inStockCount = inventoryList.filter(i => i.status === 'In Stock').length;
              const lowStockCount = Number(stats.lowStock) || inventoryList.filter(i => i.status === 'Low Stock').length;
              const expiredCount = Number(stats.expired) || inventoryList.filter(i => i.status === 'Out of Stock').length;
              const totalItems = inStockCount + lowStockCount + expiredCount || 1;

              const inStockPct = Math.round((inStockCount / totalItems) * 100);
              const lowStockPct = Math.round((lowStockCount / totalItems) * 100);
              const expiredPct = Math.max(0, 100 - inStockPct - lowStockPct);

              return (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', width: '100%' }}>
                  {/* Conic-gradient Donut Chart */}
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: `conic-gradient(#4ade80 0% ${inStockPct}%, #f59e0b ${inStockPct}% ${inStockPct + lowStockPct}%, #f43f5e ${inStockPct + lowStockPct}% 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 15px rgba(0, 180, 216, 0.2)'
                  }}>
                    <div style={{
                      width: '66px',
                      height: '66px',
                      borderRadius: '50%',
                      background: '#0a192f',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{totalItems}</span>
                      <span style={{ fontSize: '9px', color: '#94A3B8' }}>Total</span>
                    </div>
                  </div>

                  {/* Legend & Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(74, 222, 128, 0.08)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #4ade80' }}>
                      <span style={{ color: '#4ade80' }}>In Stock</span>
                      <strong style={{ color: '#4ade80' }}>{inStockCount} ({inStockPct}%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(245, 158, 11, 0.08)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                      <span style={{ color: '#f59e0b' }}>Low Stock</span>
                      <strong style={{ color: '#f59e0b' }}>{lowStockCount} ({lowStockPct}%)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', background: 'rgba(244, 63, 94, 0.08)', padding: '4px 8px', borderRadius: '4px', borderLeft: '3px solid #f43f5e' }}>
                      <span style={{ color: '#f43f5e' }}>Expired / Out</span>
                      <strong style={{ color: '#f43f5e' }}>{expiredCount} ({expiredPct}%)</strong>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

      </div>


      {/* 4. MAIN INVENTORY TABLE */}
      <div className="glass-panel inventory-full-width-table">
        <div className="table-header-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h3 className="panel-header" style={{ margin: 0, border: 'none' }}>Inventory List</h3>
          <div className="filter-actions" style={{ flexWrap: 'wrap' }}>
            <button className="btn-secondary hide-mobile" onClick={() => { if (inventoryList.length > 0) { setSelectedInventoryItem(inventoryList[0]); setIsAdjustModalOpen(true); } }}>⚙️ Adjust Stock</button>
            <button className="btn-secondary" onClick={() => downloadFile("/api/reports/inventory-summary/download", "Inventory_Summary.pdf")}>📤 Export PDF</button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th className="hide-mobile">Batch No.</th>
                <th className="hide-mobile">Category</th>
                <th>Stock Qty</th>
                <th className="hide-mobile">Unit</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan="8" style={{textAlign: 'center'}}>Loading...</td></tr> : 
                filteredList.map(med => (
                <tr key={med.id}>
                  <td style={{color: '#00B4D8', fontWeight: '600'}}>{med.name}</td>
                  <td className="hide-mobile">{med.batch}</td>
                  <td className="hide-mobile">{med.category}</td>
                  <td className={med.qty === 0 ? "text-red font-bold" : med.qty < 100 ? "text-orange font-bold" : "text-green font-bold"}>{med.qty}</td>
                  <td className="hide-mobile">{med.unit}</td>
                  <td>{med.expiry}</td>
                  <td><span className={`status-badge ${med.status === 'In Stock' ? 'badge-success' : med.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>{med.status}</span></td>
                  <td>
                    <div className="table-icons">
                      <button className="icon-btn" title="View details" onClick={() => setViewDetailsModal(med)}>👁️</button>
                      <button className="icon-btn hide-mobile" title="Adjust stock" onClick={() => { setSelectedInventoryItem(med); setAdjustQuantity(med.qty); setIsAdjustModalOpen(true); }}>✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM SPLIT TABLES (Horizontal Row) */}
      <div className="inventory-bottom-grid">
        
        <div className="glass-panel">
          <h3 className="panel-header">Low Stock Items</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Available</th>
                  <th className="hide-mobile">Min</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="4">Loading...</td></tr> : lowStockList.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="text-red font-bold">{item.available}</td>
                    <td className="hide-mobile">{item.min}</td>
                    <td><span style={{color: '#00B4D8', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => navigate('/admin/purchases')}>Order</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Expiring Soon</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th className="hide-mobile">Batch No.</th>
                  <th>Days Left</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="4">Loading...</td></tr> : expiringList.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td className="hide-mobile">{item.batch}</td>
                    <td className="text-green font-bold">{item.daysLeft}</td>
                    <td><span className="badge-warning">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Warehouse Summary</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th className="hide-mobile">Stock Value (₹)</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="3">Loading...</td></tr> : warehouseSummary.map(wh => (
                  <tr key={wh.id}>
                    <td>{wh.name}</td>
                    <td className="hide-mobile">{wh.value}</td>
                    <td style={{minWidth: '100px'}}>
                      <div className="util-bar-container">
                        <div className="util-bar-bg">
                          <div className="util-bar-fill" style={{width: `${wh.util}%`}}></div>
                        </div>
                        <span className="util-text">{wh.util}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && selectedInventoryItem && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '450px', width: '90%', padding: '24px', borderRadius: '12px', background: '#0d1b2a', border: '1px solid #1e3a5f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Adjust Stock</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setIsAdjustModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Medicine</label>
                <div style={{ color: '#CAF0F8', fontWeight: 'bold' }}>{selectedInventoryItem.name} ({selectedInventoryItem.batch})</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Current Stock</label>
                <div style={{ color: '#00B4D8', fontWeight: 'bold' }}>{selectedInventoryItem.qty} {selectedInventoryItem.unit}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Adjustment Type</label>
                <select className="filter-input" style={{ width: '100%' }} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
                  <option value="STOCK_IN">Stock In (Receive / Restock)</option>
                  <option value="STOCK_OUT">Stock Out (Dispense / Damage)</option>
                </select>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Quantity to Adjust</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="filter-input"
                  style={{ width: '100%' }}
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Number(e.target.value))}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    
      {/* VIEW DETAILS MODAL */}
      {viewDetailsModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '24px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e3a5f', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Medicine Inventory Details</h3>
              <button onClick={() => setViewDetailsModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Medicine Name</span><strong style={{ color: '#CAF0F8' }}>{viewDetailsModal.name}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Batch Number</span><strong style={{ color: '#CAF0F8' }}>{viewDetailsModal.batch}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Category</span><strong style={{ color: '#CAF0F8' }}>{viewDetailsModal.category}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Location / Warehouse</span><strong style={{ color: '#CAF0F8' }}>{viewDetailsModal.location}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Current Stock</span><strong className={viewDetailsModal.qty === 0 ? "text-red" : viewDetailsModal.qty < 100 ? "text-orange" : "text-green"}>{viewDetailsModal.qty} {viewDetailsModal.unit}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Expiry Date</span><strong style={{ color: '#CAF0F8' }}>{viewDetailsModal.expiry}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Stock Status</span><span className={`status-badge ${viewDetailsModal.status === 'In Stock' ? 'badge-success' : viewDetailsModal.status === 'Out of Stock' ? 'badge-danger' : 'badge-warning'}`}>{viewDetailsModal.status}</span></div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setViewDetailsModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => { setSelectedInventoryItem(viewDetailsModal); setAdjustQuantity(viewDetailsModal.qty); setIsAdjustModalOpen(true); setViewDetailsModal(null); }}>Adjust Stock</button>
            </div>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicine={(scanned) => {
          setFilters(prev => ({
            ...prev,
            search: scanned.medicineName || scanned.batchNumber || ""
          }));
          setIsScannerOpen(false);
        }}
      />

    </DashboardLayout>
  );
};

export default AdminInventory;