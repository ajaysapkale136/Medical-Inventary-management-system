import React, { useState, useEffect, useMemo } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest, downloadFile } from "../../lib/api";
import "./StaffOrders.css";

const API_BASE_URL = "/api/staff/orders";

function StaffOrders() {
  const [ordersList, setOrdersList] = useState([]);
  const [suppliersList, setSuppliersList] = useState([]);
  const [summary, setSummary] = useState({ totalOrders: 0, pending: 0, received: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");

  // Modals State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [createModal, setCreateModal] = useState({ isOpen: false, supplierId: "", expectedDate: "", notes: "" });

  // --- DATABASE & BACKEND CONNECTION ---
  useEffect(() => {
    fetchOrdersData();
    fetchSuppliersData();
  }, []);

  const fetchSuppliersData = async () => {
    try {
      const data = await apiRequest("/api/suppliers");
      setSuppliersList(data || []);
    } catch (e) {
      // fallback
    }
  };

  const fetchOrdersData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(API_BASE_URL);
      setOrdersList(data.orders || []);
      setSummary({ totalOrders: 0, pending: 0, received: 0, overdue: 0, ...(data.summary || {}) });
    } catch (err) {
      setError(err.message || "Failed to fetch database order records");
    } finally {
      setLoading(false);
    }
  };

  // Filter Computation
  const filteredOrders = useMemo(() => {
    return ordersList.filter((item) => {
      if (!item) return false;
      const idStr = String(item.id || '').toLowerCase();
      const supStr = String(item.supplier || '').toLowerCase();
      const statusStr = String(item.status || '').toLowerCase();
      const q = (searchQuery || '').trim().toLowerCase();

      const matchSearch = !q || idStr.includes(q) || supStr.includes(q);
      const matchSupplier = supplierFilter === "All" || supStr === supplierFilter.toLowerCase();
      const matchStatus = statusFilter === "All" || statusStr === statusFilter.toLowerCase();

      return matchSearch && matchSupplier && matchStatus;
    });
  }, [ordersList, searchQuery, supplierFilter, statusFilter]);

  const suppliers = [...new Set(ordersList.map((item) => item.supplier).filter(Boolean))];

  const handleQuickAction = async (action) => {
    if (action === "New-Order") {
      setCreateModal({
        isOpen: true,
        supplierId: suppliersList[0]?.id || "",
        expectedDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        notes: ""
      });
      return;
    }
    await fetchOrdersData();
    setFeedbackMsg(`${action} synchronized from database.`);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  const handleCreatePO = async (e) => {
    e.preventDefault();
    try {
      const poNumber = `PO-${Date.now()}`;
      await apiRequest("/api/purchase-orders", {
        method: "POST",
        body: {
          supplierId: Number(createModal.supplierId),
          poNumber,
          expectedDate: createModal.expectedDate || null,
          notes: createModal.notes || "Staff stock procurement",
          createdBy: "Staff"
        }
      });
      setCreateModal({ isOpen: false, supplierId: "", expectedDate: "", notes: "" });
      setFeedbackMsg(`Purchase order ${poNumber} created successfully.`);
      setTimeout(() => setFeedbackMsg(""), 4000);
      await fetchOrdersData();
    } catch (err) {
      setFeedbackMsg(err.message || "Failed to create purchase order");
      setTimeout(() => setFeedbackMsg(""), 5000);
    }
  };

  const handleReceiveItems = async (orderId) => {
    try {
      const data = await apiRequest(`${API_BASE_URL}/${orderId}/receive`, { method: "POST" });
      setFeedbackMsg(data.message || `Stock received for order ${orderId}`);
      setTimeout(() => setFeedbackMsg(""), 4000);
      setSelectedOrder(null);
      await fetchOrdersData();
    } catch (err) {
      setFeedbackMsg(err.message || `Failed to receive items for ${orderId}`);
      setTimeout(() => setFeedbackMsg(""), 5000);
    }
  };

  const handlePrintPO = () => {
    window.print();
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      downloadFile("/api/reports/purchase-orders/download", `PO_Invoice_${orderId}.pdf`);
      setFeedbackMsg(`Invoice download initiated for order ${orderId}`);
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch (err) {
      setFeedbackMsg(err.message || `Failed to download invoice for ${orderId}`);
      setTimeout(() => setFeedbackMsg(""), 5000);
    }
  };

  return (
    <StaffLayout title="Purchase Orders">
      <div className="staff-orders-page">
        
        {/* HEADER */}
        <div className="staff-ord-header">
          <div>
            <div className="staff-ord-breadcrumb">Dashboard ? Purchase Orders</div>
            <h1>Purchase Orders</h1>
            <p>Monitor supplier purchases, track order deliveries, and log receiving entries.</p>
          </div>
        </div>
        {error && <div className="page-loading">{error}</div>}

        {/* FEEDBACK BANNER */}
        {feedbackMsg && (
          <div style={{
            background: "rgba(34, 197, 94, 0.15)",
            border: "1px solid #22c55e",
            color: "#86efac",
            padding: "10px 16px",
            borderRadius: "8px",
            marginBottom: "1rem",
            fontWeight: "500"
          }}>
            ? {feedbackMsg}
          </div>
        )}

        {/* 4 SUMMARY CARDS */}
        <div className="staff-ord-summary-grid">
          <div className="staff-ord-summary-card">
            <div className="staff-ord-icon icon-total">??</div>
            <div>
              <span>Total Orders</span>
              <strong>{summary.totalOrders}</strong>
            </div>
          </div>

          <div className="staff-ord-summary-card">
            <div className="staff-ord-icon icon-pending">?</div>
            <div>
              <span>Pending</span>
              <strong>{summary.pending}</strong>
            </div>
          </div>

          <div className="staff-ord-summary-card">
            <div className="staff-ord-icon icon-received">?</div>
            <div>
              <span>Received</span>
              <strong>{summary.received}</strong>
            </div>
          </div>

          <div className="staff-ord-summary-card">
            <div className="staff-ord-icon icon-overdue">⚠️</div>
            <div>
              <span>Overdue</span>
              <strong>{summary.overdue}</strong>
            </div>
          </div>
        </div>

        {/* VISUAL ORDERS & SUPPLIER CHARTS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', margin: '0 20px 24px 20px' }}>
          
          {/* Chart 1: Orders Fulfillment Circular Donut Chart */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#CAF0F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Orders Fulfillment Status</span>
              <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>Pipeline Breakdown</small>
            </h3>
            {(() => {
              const total = summary.totalOrders || ordersList.length || 1;
              const pendingPct = Math.round(((summary.pending || 0) / total) * 100);
              const receivedPct = Math.round(((summary.received || 0) / total) * 100);
              const overduePct = Math.round(((summary.overdue || 0) / total) * 100);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '4px 0' }}>
                    <div style={{
                      width: '110px',
                      height: '110px',
                      borderRadius: '50%',
                      background: total === 0 ? '#1e293b' : `conic-gradient(#22c55e 0% ${receivedPct}%, #f59e0b ${receivedPct}% ${receivedPct + pendingPct}%, #f43f5e ${receivedPct + pendingPct}% 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 16px rgba(0,0,0,0.4)',
                      flexShrink: 0
                    }}>
                      <div style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '50%',
                        background: '#0a192f',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(144, 224, 239, 0.15)'
                      }}>
                        <span style={{ fontSize: '17px', fontWeight: 'bold', color: '#ffffff' }}>{summary.totalOrders || ordersList.length}</span>
                        <span style={{ fontSize: '9px', color: '#94A3B8', textTransform: 'uppercase' }}>Orders</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#86efac' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                          Received
                        </span>
                        <strong style={{ color: '#ffffff' }}>{summary.received} ({receivedPct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fcd34d' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                          Pending
                        </span>
                        <strong style={{ color: '#ffffff' }}>{summary.pending} ({pendingPct}%)</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fda4af' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
                          Overdue
                        </span>
                        <strong style={{ color: '#ffffff' }}>{summary.overdue} ({overduePct}%)</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', background: '#1e293b' }}>
                    {receivedPct > 0 && <div style={{ width: `${receivedPct}%`, background: '#22c55e' }} />}
                    {pendingPct > 0 && <div style={{ width: `${pendingPct}%`, background: '#f59e0b' }} />}
                    {overduePct > 0 && <div style={{ width: `${overduePct}%`, background: '#f43f5e' }} />}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Chart 2: Top Suppliers Vertical Column Bar Chart */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#CAF0F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Active Order Suppliers</span>
              <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>Order Volume</small>
            </h3>
            {(() => {
              const supMap = {};
              ordersList.forEach(o => {
                const s = o.supplier || 'Unknown';
                supMap[s] = (supMap[s] || 0) + 1;
              });
              const supList = Object.entries(supMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 4);
              const maxCount = Math.max(1, ...supList.map(s => s.count));
              const palette = ['#00B4D8', '#4ade80', '#f59e0b', '#a855f7'];

              if (supList.length === 0) return <p style={{ color: '#94A3B8', fontSize: '12px', textAlign: 'center', marginTop: '30px' }}>No supplier orders recorded</p>;

              return (
                <div>
                  <div style={{
                    height: '140px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-around',
                    gap: '12px',
                    padding: '12px 8px 4px 8px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '8px',
                    borderBottom: '2px solid rgba(144, 224, 239, 0.2)',
                    position: 'relative'
                  }}>
                    <div style={{ position: 'absolute', top: '33%', left: 0, right: 0, borderTop: '1px dashed rgba(144,224,239,0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: '66%', left: 0, right: 0, borderTop: '1px dashed rgba(144,224,239,0.08)', pointerEvents: 'none' }} />
                    {supList.map((sup, idx) => {
                      const color = palette[idx % palette.length];
                      const pct = Math.max(18, Math.min(100, Math.round((sup.count / maxCount) * 100)));
                      return (
                        <div key={sup.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', zIndex: 1 }}>
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color, marginBottom: '4px' }}>{sup.count}</span>
                          <div style={{
                            width: '70%',
                            maxWidth: '36px',
                            height: `${pct}%`,
                            background: `linear-gradient(180deg, ${color} 0%, ${color}55 100%)`,
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.4s ease',
                            boxShadow: `0 0 10px ${color}33`
                          }} />
                          <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }} title={sup.name}>
                            {sup.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${supList.length}, 1fr)`, gap: '4px', marginTop: '10px', textAlign: 'center', fontSize: '10px' }}>
                    {supList.map((sup, idx) => (
                      <div key={sup.name} style={{ background: `${palette[idx % palette.length]}1a`, padding: '3px 2px', borderRadius: '4px', color: palette[idx % palette.length], overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sup.name.split(' ')[0]} ({sup.count})
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* SEARCH & FILTER PANEL */}
        <div className="staff-ord-filter-panel">
          <div className="filter-title">SEARCH &amp; FILTER</div>
          <div className="filter-controls">
            <input
              type="text"
              placeholder="PO Number / Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
              <option value="All">Supplier ?</option>
              {suppliers.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">Status ?</option>
              <option value="Pending">Pending</option>
              <option value="Ordered">Ordered</option>
              <option value="Received">Received</option>
              <option value="Overdue">Overdue</option>
            </select>

            <select value={dateRangeFilter} onChange={(e) => setDateRangeFilter(e.target.value)}>
              <option value="All">Date Range ?</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="older">Older</option>
            </select>

            <button className="ord-filter-btn" onClick={fetchOrdersData}>
              [Search]
            </button>
          </div>
        </div>

        {/* PURCHASE ORDER LIST TABLE */}
        <div className="staff-ord-card">
          <div className="staff-ord-card-header">
            <h2>PURCHASE ORDER LIST</h2>
          </div>
          <div className="staff-ord-wrapper">
            <table>
              <thead>
                <tr>
                  <th>PO No.</th>
                  <th>Supplier</th>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>Loading database records...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>No orders match filter criteria.</td></tr>
                ) : (
                  filteredOrders.map((item) => (
                    <tr key={item.id}>
                      <td><strong style={{ color: "#00B4D8" }}>{item.id}</strong></td>
                      <td><strong style={{ color: "#ffffff" }}>{item.supplier}</strong></td>
                      <td>{item.orderDate}</td>
                      <td>{item.amount}</td>
                      <td>
                        <span className={`status-pill pill-${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button className="action-view-btn" onClick={() => setSelectedOrder(item)} title="View Order Details">
                          ??
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOWER SPLIT SECTION: QUICK ACTIONS & ORDER ALERTS */}
        <div className="staff-ord-split-grid">
          
          {/* QUICK ACTIONS */}
          <div className="split-card">
            <div className="split-card-header">
              <h3>QUICK ACTIONS</h3>
            </div>
            <div className="quick-action-list">
              <button className="qa-link-btn" onClick={() => handleQuickAction("New-Order")}>
                + New Order
              </button>
              <button className="qa-link-btn" onClick={() => handleQuickAction("View-Pending")}>
                ?? View Pending
              </button>
              <button className="qa-link-btn" onClick={() => handleQuickAction("Receive-Items")}>
                ?? Receive Items
              </button>
              <button className="qa-link-btn" onClick={() => handleQuickAction("Purchase-History")}>
                ?? Purchase History
              </button>
            </div>
          </div>

          {/* ORDER ALERTS */}
          <div className="split-card">
            <div className="split-card-header">
              <h3>ORDER ALERTS</h3>
            </div>
            <div className="alert-list">
              <div className="alert-item">
                <span className="alert-dot dot-red"></span>
                <span style={{ color: "#f43f5e", fontWeight: "600" }}>{summary.overdue} orders overdue</span>
              </div>
              <div className="alert-item">
                <span className="alert-dot dot-orange"></span>
                <span style={{ color: "#f59e0b", fontWeight: "600" }}>{summary.pending} pending fulfillment</span>
              </div>
              <div className="alert-item">
                <span className="alert-dot dot-blue"></span>
                <span style={{ color: "#3b82f6", fontWeight: "600" }}>{summary.received} orders completed</span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= PURCHASE ORDER DETAILED MODAL ================= */}
        {selectedOrder && (
          <div className="po-modal-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="po-modal-content" onClick={(e) => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="po-modal-header">
                <h2>Purchase Order: {selectedOrder.id}</h2>
                <button className="po-print-btn" onClick={() => handlePrintPO()}>
                  [Print]
                </button>
              </div>

              {/* SUPPLIER INFO */}
              <div className="po-info-section">
                <h3>Supplier Information</h3>
                <div><span>Supplier:</span> <strong>{selectedOrder.supplierName || selectedOrder.supplier}</strong></div>
                <div><span>Contact:</span> <strong>{selectedOrder.contact || "+91 XXXXX XXXXX"}</strong></div>
              </div>

              {/* ORDER INFO */}
              <div className="po-info-section">
                <h3>Order Information</h3>
                <div><span>Order Date:</span> <strong>{selectedOrder.orderDate}</strong></div>
                <div><span>Expected Date:</span> <strong>{selectedOrder.expectedDate || "12 Aug 2026"}</strong></div>
                <div className="po-status-row">
                  <span>Status:</span>
                  <span className={`po-dot po-dot-${selectedOrder.status.toLowerCase()}`}></span>
                  <strong style={{ color: selectedOrder.status === "Received" ? "#22c55e" : selectedOrder.status === "Overdue" ? "#f43f5e" : "#f59e0b" }}>
                    {selectedOrder.status}
                  </strong>
                </div>
              </div>

              {/* MEDICINES TABLE */}
              <div className="po-medicines-section">
                <h3>Medicines</h3>
                <table className="po-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Batch</th>
                      <th>Quantity</th>
                      <th>Unit ?</th>
                      <th>Total ?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items && selectedOrder.items.map((med, idx) => (
                      <tr key={idx}>
                        <td><strong style={{ color: "#ffffff" }}>{med.medicine}</strong></td>
                        <td>{med.batch}</td>
                        <td>{med.quantity}</td>
                        <td>{med.unitPrice}</td>
                        <td><strong style={{ color: "#22c55e" }}>{med.total}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAYMENT & GRN STATUS */}
              <div className="po-meta-row">
                <div>Payment: <strong>{selectedOrder.paymentStatus || "Unpaid"}</strong></div>
                <div>GRN: <strong>{selectedOrder.grnStatus || "Pending"}</strong></div>
              </div>

              {/* MODAL ACTION FOOTER */}
              <div className="po-modal-footer">
                <button className="po-action-btn btn-receive" onClick={() => handleReceiveItems(selectedOrder.id)}>
                  [Receive Items]
                </button>
                <button className="po-action-btn btn-invoice" onClick={() => handlePrintPO()}>
                  [Print PO]
                </button>
                <button className="po-action-btn btn-invoice" onClick={() => handleDownloadInvoice(selectedOrder.id)}>
                  [Download Invoice]
                </button>
                <button className="po-action-btn btn-close" onClick={() => setSelectedOrder(null)}>
                  [Close]
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ================= CREATE PO MODAL ================= */}
        {createModal.isOpen && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }}>
            <div className="modal-content" style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
              padding: '1.5rem', width: '480px', maxWidth: '90%', color: '#fff'
            }}>
              <h3 style={{ color: '#00B4D8', marginTop: 0 }}>Create Purchase Order</h3>
              <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Supplier</label>
                  <select
                    style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={createModal.supplierId}
                    onChange={(e) => setCreateModal({ ...createModal, supplierId: e.target.value })}
                    required
                  >
                    {suppliersList.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.companyName} ({sup.contactPerson || 'Contact'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Expected Delivery Date</label>
                  <input
                    type="date"
                    style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={createModal.expectedDate}
                    onChange={(e) => setCreateModal({ ...createModal, expectedDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Notes / Procurement Memo</label>
                  <input
                    type="text"
                    style={{ width: '100%', padding: '8px', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={createModal.notes}
                    onChange={(e) => setCreateModal({ ...createModal, notes: e.target.value })}
                    placeholder="e.g. Regular monthly replenishment"
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                  <button
                    type="button"
                    style={{ padding: '8px 16px', background: '#334155', border: 'none', borderRadius: '6px', color: '#94A3B8', cursor: 'pointer' }}
                    onClick={() => setCreateModal({ ...createModal, isOpen: false })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: '8px 16px', background: '#00B4D8', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    Create PO
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </StaffLayout>
  );
}

export default StaffOrders;
