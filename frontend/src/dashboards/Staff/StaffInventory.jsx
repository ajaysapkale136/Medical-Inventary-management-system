import React, { useState, useEffect, useMemo } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest } from "../../lib/api";
import BarcodeScannerModal from "../../components/BarcodeScannerModal";
import "./StaffInventory.css";

const API_BASE_URL = "/api/staff/inventory"; // Ready for backend integration

function StaffInventory() {
  const [inventory, setInventory] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [stockMovement, setStockMovement] = useState({ in: 0, out: 0, returns: 0, adjustments: 0 });
  const [lowStockList, setLowStockList] = useState([]);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [stockStatus, setStockStatus] = useState("All");
  const [batch, setBatch] = useState("All");

  // --- DATABASE & BACKEND CONNECTION ---
  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(API_BASE_URL);
      setInventory(data.inventory || []);
      setStockMovement(data.movement || { in: 0, out: 0, returns: 0, adjustments: 0 });
      setLowStockList(data.lowStock || []);
      setRecentHistory(data.history || []);
    } catch (err) {
      setError(err.message || "Failed to load database inventory");
    } finally {
      setLoading(false);
    }
  };

  // Filter Computation
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch = item.medicine.toLowerCase().includes(search.toLowerCase()) || item.batchNo.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || item.category === category;
      const matchStatus = stockStatus === "All" || item.status.toLowerCase() === stockStatus.toLowerCase();
      const matchBatch = batch === "All" || item.batchNo === batch;

      return matchSearch && matchCategory && matchStatus && matchBatch;
    });
  }, [inventory, search, category, stockStatus, batch]);

  const categories = [...new Set(inventory.map((item) => item.category).filter(Boolean))];
  const batches = [...new Set(inventory.map((item) => item.batchNo).filter(Boolean))];

  const [stockModal, setStockModal] = useState({ isOpen: false, type: 'Stock-In', inventoryId: '', quantity: 10, reason: '' });
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const handleQuickAction = async (actionType) => {
    if (actionType === "View-History") {
      await fetchInventoryData();
      setFeedbackMsg("Stock history refreshed from database.");
      setTimeout(() => setFeedbackMsg(''), 4000);
      return;
    }

    setStockModal({
      isOpen: true,
      type: actionType,
      inventoryId: inventory[0]?.id || '',
      quantity: 10,
      reason: actionType === 'Stock-In' ? 'Standard Restock' : 'Routine Dispense'
    });
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = stockModal.type === "Stock-In" ? "/api/inventory/stock-in" : "/api/inventory/stock-out";
      await apiRequest(endpoint, {
        method: "POST",
        body: {
          inventoryId: Number(stockModal.inventoryId),
          quantity: Number(stockModal.quantity),
          reason: stockModal.reason || stockModal.type,
          performedBy: "Staff"
        }
      });
      setStockModal((prev) => ({ ...prev, isOpen: false }));
      setFeedbackMsg(`Successfully processed ${stockModal.type} for quantity ${stockModal.quantity}.`);
      setTimeout(() => setFeedbackMsg(''), 4000);
      await fetchInventoryData();
    } catch (err) {
      setFeedbackMsg(`❌ ${err.message || `Failed to process ${stockModal.type}`}`);
      setTimeout(() => setFeedbackMsg(''), 5000);
    }
  };

  return (
    <StaffLayout title="Inventory">
      <div className="staff-inventory-page">
        
        {/* HEADER */}
        <div className="staff-inv-header">
          <div>
            <div className="staff-inv-breadcrumb">Dashboard › Inventory</div>
            <h1>Stock & Inventory Control</h1>
            <p>Real-time stock tracking, inventory movement logs, and stock replenishment.</p>
          </div>
        </div>
        {error && <div className="page-loading">{error}</div>}
        {feedbackMsg && (
          <div style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid #22c55e",
            color: "#86efac",
            padding: "10px 16px",
            borderRadius: "8px",
            margin: "0 20px 1rem 20px",
            fontWeight: "500"
          }}>
            {feedbackMsg}
          </div>
        )}

        {/* 3 SUMMARY CARDS */}
        <div className="staff-inv-summary-grid">
          <div className="staff-inv-summary-card">
            <div className="staff-inv-icon total-stock-icon">📦</div>
            <div>
              <span>Total Stock</span>
              <strong>{inventory.reduce((total, item) => total + Number(item.qty || 0), 0)}</strong>
              <small>Units available</small>
            </div>
          </div>

          <div className="staff-inv-summary-card">
            <div className="staff-inv-icon low-stock-icon">⚠️</div>
            <div>
              <span>Low Stock</span>
              <strong>{inventory.filter((item) => item.status === "Low").length}</strong>
              <small>Items need review</small>
            </div>
          </div>

          <div className="staff-inv-summary-card">
            <div className="staff-inv-icon out-stock-icon">🚫</div>
            <div>
              <span>Out of Stock</span>
              <strong>{inventory.filter((item) => item.status === "Out").length}</strong>
              <small>Immediate reorder</small>
            </div>
          </div>
        </div>

        {/* FILTER PANEL */}
        <div className="staff-inv-filter-panel">
          <input
            type="text"
            placeholder="Search medicine / batch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            type="button"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap'
            }}
            onClick={() => setIsScannerOpen(true)}
          >
            📷 Scan Barcode
          </button>

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">Category ▼</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={stockStatus} onChange={(e) => setStockStatus(e.target.value)}>
            <option value="All">Stock Status ▼</option>
            <option value="Good">Good</option>
            <option value="Low">Low</option>
            <option value="Out">Out</option>
          </select>

          <select value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="All">Batch ▼</option>
            {batches.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <button className="staff-inv-filter-btn" onClick={fetchInventoryData}>
            Search
          </button>
        </div>

        {/* CURRENT INVENTORY TABLE */}
        <div className="staff-inv-card">
          <div className="staff-inv-card-header">
            <h2>Current Inventory</h2>
          </div>
          <div className="staff-inv-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch No</th>
                  <th>Qty</th>
                  <th>Status</th>
                  <th>Expiry</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>Loading inventory data...</td></tr>
                ) : filteredInventory.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>No matching inventory records found.</td></tr>
                ) : (
                  filteredInventory.map((item) => (
                    <tr key={item.id}>
                      <td><strong style={{ color: "#ffffff" }}>{item.medicine}</strong></td>
                      <td>{item.batchNo}</td>
                      <td>{item.qty}</td>
                      <td>
                        <span className="status-badge">
                          <span className={`dot ${item.status === 'Good' ? 'dot-good' : item.status === 'Low' ? 'dot-low' : 'dot-out'}`}></span>
                          {item.status}
                        </span>
                      </td>
                      <td>{item.expiry}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOWER SPLIT SECTION: STOCK MOVEMENT, LOW STOCK, & INVENTORY HEALTH CHARTS */}
        <div className="staff-inv-split-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
          
          {/* Chart 1: Stock Movement Vertical Column Bar Chart */}
          <div className="split-card">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Stock Movement Flow</span>
              <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>Live Transactions</small>
            </h3>
            {(() => {
              const maxMove = Math.max(1, stockMovement.in, stockMovement.out, stockMovement.returns, stockMovement.adjustments);
              const items = [
                { label: 'Stock In', val: stockMovement.in, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.2)' },
                { label: 'Stock Out', val: stockMovement.out, color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.2)' },
                { label: 'Returns', val: stockMovement.returns, color: '#00B4D8', bg: 'rgba(0, 180, 216, 0.2)' },
                { label: 'Adjustments', val: stockMovement.adjustments, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' }
              ];
              return (
                <div>
                  <div style={{
                    height: '160px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    gap: '12px',
                    padding: '16px 8px 8px 8px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '8px',
                    borderBottom: '2px solid rgba(144, 224, 239, 0.2)',
                    position: 'relative'
                  }}>
                    {/* Horizontal grid guide lines */}
                    <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, borderTop: '1px dashed rgba(144,224,239,0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px dashed rgba(144,224,239,0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, borderTop: '1px dashed rgba(144,224,239,0.08)', pointerEvents: 'none' }} />
                    {items.map(m => {
                      const pct = Math.max(14, Math.min(100, Math.round((m.val / maxMove) * 100)));
                      return (
                        <div key={m.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', zIndex: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: m.color, marginBottom: '4px' }}>{m.val}</span>
                          <div style={{
                            width: '70%',
                            maxWidth: '36px',
                            height: `${pct}%`,
                            background: `linear-gradient(180deg, ${m.color} 0%, ${m.color}55 100%)`,
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease',
                            boxShadow: `0 0 10px ${m.color}33`
                          }} />
                          <span style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>{m.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', marginTop: '10px', textAlign: 'center', fontSize: '11px' }}>
                    {items.map(m => (
                      <div key={m.label} style={{ background: m.bg, padding: '4px 2px', borderRadius: '4px', color: m.color }}>
                        <strong>{m.val}</strong> u
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Chart 2: Inventory Health Circular Donut Chart */}
          <div className="split-card">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Inventory Health Overview</span>
              <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>Status Breakdown</small>
            </h3>
            {(() => {
              const good = inventory.filter(item => item.status === 'Good').length;
              const low = inventory.filter(item => item.status === 'Low').length;
              const out = inventory.filter(item => item.status === 'Out').length;
              const total = inventory.length || 1;
              const goodPct = Math.round((good / total) * 100);
              const lowPct = Math.round((low / total) * 100);
              const outPct = Math.max(0, 100 - goodPct - lowPct);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '6px 0' }}>
                    <div style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: total === 0 ? '#1e293b' : `conic-gradient(#22c55e 0% ${goodPct}%, #f59e0b ${goodPct}% ${goodPct + lowPct}%, #f43f5e ${goodPct + lowPct}% 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(0,0,0,0.4)',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '50%',
                        background: '#0a192f',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(144, 224, 239, 0.15)'
                      }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>{inventory.length}</span>
                        <span style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase' }}>Items</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#86efac' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                          Good Stock
                        </span>
                        <strong style={{ color: '#ffffff' }}>{good} ({goodPct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fcd34d' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                          Low Stock
                        </span>
                        <strong style={{ color: '#ffffff' }}>{low} ({lowPct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fda4af' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
                          Out of Stock
                        </span>
                        <strong style={{ color: '#ffffff' }}>{out} ({outPct}%)</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#1e293b' }}>
                    {goodPct > 0 && <div style={{ width: `${goodPct}%`, background: '#22c55e' }} />}
                    {lowPct > 0 && <div style={{ width: `${lowPct}%`, background: '#f59e0b' }} />}
                    {outPct > 0 && <div style={{ width: `${outPct}%`, background: '#f43f5e' }} />}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Chart 3: Low Stock Urgency Radar */}
          <div className="split-card">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Stock Urgency Radar</span>
              <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>Reorder Priority</small>
            </h3>
            {lowStockList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '140px' }}>
                <span style={{ fontSize: '28px', marginBottom: '8px' }}>✅</span>
                <p style={{ color: '#22c55e', fontSize: '13px', margin: 0, textAlign: 'center' }}>All medicine stocks are at safe operational levels</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lowStockList.slice(0, 4).map((low, idx) => {
                  const num = Number(low.qty) || 0;
                  const color = num <= 5 ? '#f43f5e' : num <= 15 ? '#f59e0b' : '#38bdf8';
                  const pct = Math.min(100, Math.max(12, Math.round((num / 30) * 100)));
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: '#CAF0F8', fontWeight: '500' }}>{low.medicine}</span>
                        <strong style={{ color }}>{low.qty} units left</strong>
                      </div>
                      <div style={{ height: '7px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', boxShadow: `0 0 6px ${color}66` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* RECENT STOCK HISTORY TABLE */}
        <div className="staff-inv-card">
          <div className="staff-inv-card-header">
            <h2>Recent Stock History</h2>
          </div>
          <div className="staff-inv-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Action</th>
                  <th>Qty</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((hist) => (
                  <tr key={hist.id}>
                    <td><strong style={{ color: "#ffffff" }}>{hist.medicine}</strong></td>
                    <td>{hist.batch}</td>
                    <td>
                      <span style={{ fontWeight: 'bold', color: hist.action === 'IN' ? '#22c55e' : hist.action === 'OUT' ? '#f43f5e' : '#f59e0b' }}>
                        {hist.action}
                      </span>
                    </td>
                    <td>{hist.qty}</td>
                    <td>{hist.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* QUICK ACTIONS BAR */}
        <div className="staff-inv-quick-actions">
          <span className="qa-label">Quick Actions:</span>
          <button className="qa-action-btn" onClick={() => handleQuickAction("Stock-In")}>[Stock In]</button>
          <button className="qa-action-btn" onClick={() => handleQuickAction("Stock-Out")}>[Stock Out]</button>
          <button className="qa-action-btn" onClick={() => handleQuickAction("View-History")}>[View History]</button>
        </div>

        {/* STOCK IN / STOCK OUT MODAL */}
        {stockModal.isOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }}>
            <div className="modal-content" style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
              padding: '1.5rem', width: '450px', maxWidth: '90%', color: '#fff'
            }}>
              <h3 style={{ color: '#00B4D8', marginTop: 0 }}>Process {stockModal.type}</h3>
              <form onSubmit={handleStockSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Medicine &amp; Batch</label>
                  <select
                    style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={stockModal.inventoryId}
                    onChange={(e) => setStockModal({ ...stockModal, inventoryId: e.target.value })}
                    required
                  >
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.medicine} (Batch: {item.batchNo}, Current Qty: {item.qty})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Quantity</label>
                  <input
                    type="number"
                    min="1"
                    style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={stockModal.quantity}
                    onChange={(e) => setStockModal({ ...stockModal, quantity: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Reason / Notes</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={stockModal.reason}
                    onChange={(e) => setStockModal({ ...stockModal, reason: e.target.value })}
                    placeholder="e.g. Received shipment / Dispensed"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                  <button
                    type="button"
                    style={{ padding: '8px 16px', background: '#334155', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer' }}
                    onClick={() => setStockModal({ ...stockModal, isOpen: false })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 16px', background: stockModal.type === 'Stock-In' ? '#22c55e' : '#f43f5e', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Confirm {stockModal.type}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSelectMedicine={(scanned) => {
            setSearch(scanned.medicineName || scanned.batchNumber || "");
            setIsScannerOpen(false);
          }}
        />

      </div>
    </StaffLayout>
  );
}

export default StaffInventory;
