import React, { useEffect, useMemo, useState } from "react";
import PharmacyLayout from "./PharmacyLayout";
import { apiRequest } from "../../lib/api";
import "./PharmacistOnlineOrders.css";

const STATUS_FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

function PharmacistOnlineOrders() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    platform: "MediStock Direct",
    medicineName: "Amoxicillin 500mg",
    batchNumber: "B1021",
    quantity: 2,
    price: 45.0,
    paymentMethod: "UPI"
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 5000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      setError("");
      const data = await apiRequest("/api/pharmacist/online-orders");
      setOrders(Array.isArray(data) ? data : []);
    } catch (apiError) {
      setError(apiError.message || "Failed to load online orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const calculateSubtotal = (order) => {
    if (!order || !Array.isArray(order.items)) return 0;
    return order.items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  };

  const calculateTotal = (order) => {
    if (!order) return 0;
    if (order.total != null && !isNaN(Number(order.total)) && Number(order.total) > 0) {
      return Number(order.total);
    }
    const sub = calculateSubtotal(order);
    const tax = Number(order.tax) || 0;
    const del = Number(order.delivery) || 0;
    return sub + tax + del;
  };

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    return orders.filter((order) => {
      if (!order) return false;
      const statusMatch = statusFilter === "ALL" || (order.status || "").toUpperCase() === statusFilter.toUpperCase();
      const platformMatch = platformFilter === "ALL" || (order.platform || "").toUpperCase() === platformFilter.toUpperCase();
      
      const q = (searchQuery || "").trim().toLowerCase();
      if (!q) return statusMatch && platformMatch;

      const orderIdStr = String(order.id || "").toLowerCase();
      const orderNumStr = String(order.orderNumber || "").toLowerCase();
      const custNameStr = String(order.customer?.name || "").toLowerCase();
      const custPhoneStr = String(order.customer?.phone || "").toLowerCase();
      const platformStr = String(order.platform || "").toLowerCase();
      const medsStr = Array.isArray(order.items) 
        ? order.items.map(i => String(i.medicine || "")).join(" ").toLowerCase()
        : "";

      const searchMatch = 
        orderIdStr.includes(q) ||
        orderNumStr.includes(q) ||
        custNameStr.includes(q) ||
        custPhoneStr.includes(q) ||
        platformStr.includes(q) ||
        medsStr.includes(q);

      return statusMatch && platformMatch && searchMatch;
    });
  }, [orders, statusFilter, platformFilter, searchQuery]);

  const refreshOrders = async () => {
    setActionLoading(true);
    try {
      const data = await apiRequest("/api/pharmacist/online-orders/refresh", { method: "POST" });
      showToast(data.message || "Orders refreshed and synchronized!");
      await fetchOrders();
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to refresh orders"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(true);
    try {
      const data = await apiRequest(`/api/pharmacist/online-orders/${orderId}/status?status=${newStatus}`, {
        method: "POST"
      });
      showToast(`✅ ${data.message || `Order status updated to ${newStatus}`}`);
      
      // Update local state smoothly
      setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to update order status"}`);
    } finally {
      setActionLoading(false);
    }
  };

  const generateBill = async (order) => {
    try {
      const data = await apiRequest(`/api/pharmacist/online-orders/${order.id}/bill`, { method: "POST" });
      const total = calculateTotal(order);
      showToast(`✅ ${data.message || "Invoice generated"} for Order #${order.orderNumber || order.id} (Total: ₹${total})`);
      setInvoiceOrder(order);
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to generate bill"}`);
    }
  };

  const printInvoice = async (order) => {
    try {
      await apiRequest(`/api/pharmacist/online-orders/${order.id}/print`, { method: "POST" });
      setInvoiceOrder(order);
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to print invoice"}`);
    }
  };

  const handleCreateOrderSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await apiRequest("/api/pharmacist/online-orders", {
        method: "POST",
        body: newOrderForm
      });
      showToast(`✅ ${res.message || "New prescription order recorded successfully!"}`);
      setCreateModalOpen(false);
      setNewOrderForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        deliveryAddress: "",
        platform: "MediStock Direct",
        medicineName: "Amoxicillin 500mg",
        batchNumber: "B1021",
        quantity: 2,
        price: 45.0,
        paymentMethod: "UPI"
      });
      await fetchOrders();
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to create order"}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics computation
  const totalCount = orders.length;
  const pendingCount = orders.filter(o => (o.status || "").toUpperCase() === "PENDING").length;
  const inTransitCount = orders.filter(o => ["PROCESSING", "READY", "OUT_FOR_DELIVERY"].includes((o.status || "").toUpperCase())).length;
  const completedCount = orders.filter(o => (o.status || "").toUpperCase() === "DELIVERED").length;
  const totalRevenue = orders.reduce((sum, o) => sum + calculateTotal(o), 0);

  const getPlatformBadgeClass = (platform = "") => {
    const p = platform.toLowerCase();
    if (p.includes("1mg")) return "badge-1mg";
    if (p.includes("apollo")) return "badge-apollo";
    if (p.includes("pharm")) return "badge-pharmeasy";
    if (p.includes("whatsapp")) return "badge-whatsapp";
    return "badge-direct";
  };

  return (
    <PharmacyLayout title="Online Orders Hub">
      <div className="online-orders-page">

        {/* HERO BANNER & HEADER */}
        <div className="online-orders-hero-header">
          <div className="header-text-block">
            <div className="breadcrumb-trail">
              <span>Pharmacy Operations</span>
              <span className="bc-sep">/</span>
              <span className="bc-active">Multi-Channel Online Orders</span>
            </div>
            <h1>Online Orders Hub</h1>
            <p className="header-subtitle">
              Live ingest and automated dispensing for Tata 1mg, Apollo 24/7, PharmEasy, WhatsApp Rx, and Web Direct.
            </p>
          </div>

          <div className="header-actions-group">
            <div className="gateway-status-pill">
              <span className="live-pulsing-dot"></span>
              <span>4 Channel Gateways Live</span>
            </div>
            <button 
              className="btn-sync-refresh" 
              onClick={refreshOrders} 
              disabled={actionLoading}
              title="Synchronize orders from web stores and partner channels"
            >
              <span className={`sync-icon ${actionLoading ? 'spinning' : ''}`}>↻</span>
              <span>Sync Orders</span>
            </button>
            <button 
              className="btn-create-order" 
              onClick={() => setCreateModalOpen(true)}
            >
              <span>+ New Rx Order</span>
            </button>
          </div>
        </div>

        {/* TOAST NOTIFICATION */}
        {toastMsg && (
          <div className={`order-toast-notification ${toastMsg.startsWith('❌') ? 'toast-err' : 'toast-ok'}`}>
            <span className="toast-text">{toastMsg}</span>
            <button onClick={() => setToastMsg("")} className="toast-dismiss">✕</button>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="orders-error-panel">
            <span className="err-icon">⚠️</span>
            <div className="err-content">
              <strong>Order Hub Synchronization Notice</strong>
              <p>{error}</p>
            </div>
            <button className="btn-retry" onClick={fetchOrders}>Retry</button>
          </div>
        )}

        {/* STATS TELEMETRY STRIP */}
        <div className="orders-telemetry-grid">
          <div className="order-kpi-card">
            <div className="kpi-top">
              <span className="kpi-label">Total Inflow</span>
              <span className="kpi-icon icon-cyan">📦</span>
            </div>
            <div className="kpi-val">{totalCount}</div>
            <span className="kpi-subtext text-cyan">All channels aggregate</span>
          </div>

          <div className="order-kpi-card pending-kpi">
            <div className="kpi-top">
              <span className="kpi-label">Pending Verification</span>
              <span className="kpi-icon icon-amber">⏳</span>
            </div>
            <div className="kpi-val text-amber">{pendingCount}</div>
            <span className="kpi-subtext text-amber">Needs pharmacist sign-off</span>
          </div>

          <div className="order-kpi-card transit-kpi">
            <div className="kpi-top">
              <span className="kpi-label">Dispensing & Transit</span>
              <span className="kpi-icon icon-blue">🚚</span>
            </div>
            <div className="kpi-val text-blue">{inTransitCount}</div>
            <span className="kpi-subtext text-blue">In packing / delivery</span>
          </div>

          <div className="order-kpi-card revenue-kpi">
            <div className="kpi-top">
              <span className="kpi-label">Online Revenue</span>
              <span className="kpi-icon icon-emerald">₹</span>
            </div>
            <div className="kpi-val text-emerald">₹{totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <span className="kpi-subtext text-emerald">{completedCount} delivered orders</span>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="orders-controls-bar">
          <div className="search-field-wrapper">
            <span className="search-icon-symbol">🔍</span>
            <input
              type="text"
              className="orders-search-input"
              placeholder="Search by Order #, Patient name, Phone, Medicine, or Channel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>

          <div className="filters-cluster">
            <div className="select-wrapper">
              <label>Channel:</label>
              <select 
                value={platformFilter} 
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Platforms</option>
                <option value="MediStock Direct">MediStock Direct</option>
                <option value="Tata 1mg">Tata 1mg</option>
                <option value="Apollo 24/7">Apollo 24/7</option>
                <option value="PharmEasy">PharmEasy</option>
                <option value="WhatsApp Rx">WhatsApp Rx</option>
              </select>
            </div>

            <div className="select-wrapper">
              <label>Status:</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="PROCESSING">Packing / Processing</option>
                <option value="READY">Ready for Dispatch</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* QUICK STATUS CHIPS */}
        <div className="quick-status-chips">
          {["ALL", "PENDING", "CONFIRMED", "PROCESSING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
            <button
              key={st}
              className={`chip-btn ${statusFilter === st ? 'active' : ''}`}
              onClick={() => setStatusFilter(st)}
            >
              {st === "ALL" ? "All Orders" : st.replace(/_/g, " ")}
              <span className="chip-counter">
                {st === "ALL" ? orders.length : orders.filter(o => (o.status || "").toUpperCase() === st).length}
              </span>
            </button>
          ))}
        </div>

        {/* ORDERS DIRECTORY TABLE */}
        <div className="orders-table-wrapper-card">
          <div className="table-header-strip">
            <div className="strip-title">
              <h2>Prescription & Dispatch Pipeline</h2>
              <span className="badge-count">{filteredOrders.length} Orders Listed</span>
            </div>
            <div className="strip-meta">
              <span>Automatic FEFO inventory allocation active</span>
            </div>
          </div>

          <div className="table-responsive-box">
            <table className="orders-data-table">
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Source Channel</th>
                  <th>Patient Details</th>
                  <th>Prescribed Medicines</th>
                  <th>Order Value</th>
                  <th>Payment</th>
                  <th>Fulfillment Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="empty-table-state">
                      <div className="spinner-loader"></div>
                      <span>Retrieving live multi-channel orders...</span>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-table-state">
                      <div className="empty-art">📋</div>
                      <strong>No online orders found matching current criteria</strong>
                      <p>Try clearing filters or click "Sync Orders" to pull fresh gateway records.</p>
                      <button className="btn-sync-refresh" onClick={refreshOrders}>Sync Fresh Orders</button>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const total = calculateTotal(order);
                    const items = Array.isArray(order.items) ? order.items : [];
                    const statusStr = (order.status || "PENDING").toUpperCase();

                    return (
                      <tr key={order.id || order.orderNumber} className="order-row-item">
                        {/* ORDER REF */}
                        <td>
                          <div className="order-ref-cell">
                            <span className="order-num-tag">#{order.orderNumber || order.id}</span>
                            <span className="order-timestamp">{order.orderDate || "Today"}</span>
                          </div>
                        </td>

                        {/* PLATFORM */}
                        <td>
                          <span className={`channel-pill ${getPlatformBadgeClass(order.platform)}`}>
                            {order.platform || "Web Direct"}
                          </span>
                        </td>

                        {/* CUSTOMER */}
                        <td>
                          <div className="customer-info-cell">
                            <span className="cust-name">{order.customer?.name || "Walk-in Guest"}</span>
                            <span className="cust-phone">📞 {order.customer?.phone || "No phone"}</span>
                            <span className="cust-address" title={order.customer?.address || ""}>
                              📍 {order.customer?.address ? `${order.customer.address.substring(0, 30)}...` : "Counter Pickup"}
                            </span>
                          </div>
                        </td>

                        {/* ITEMS */}
                        <td>
                          <div className="items-summary-cell">
                            <span className="items-count-badge">{items.length} Medicine(s)</span>
                            <div className="item-name-preview">
                              {items.slice(0, 2).map((item, idx) => (
                                <span key={idx} className="preview-med">
                                  💊 {item.medicine || "Medicine"} <small>x{item.quantity}</small>
                                </span>
                              ))}
                              {items.length > 2 && <span className="more-tag">+{items.length - 2} more</span>}
                            </div>
                          </div>
                        </td>

                        {/* AMOUNT */}
                        <td>
                          <div className="amount-cell">
                            <span className="total-rupee-val">₹{total.toFixed(2)}</span>
                            <span className="tax-del-info">Incl. GST & Delivery</span>
                          </div>
                        </td>

                        {/* PAYMENT */}
                        <td>
                          <div className="payment-cell">
                            <span className={`pay-status ${(order.payment || "PAID").toLowerCase()}`}>
                              {order.payment || "PAID"}
                            </span>
                            <span className="pay-method">{order.paymentMethod || "UPI"}</span>
                          </div>
                        </td>

                        {/* STATUS SELECTOR */}
                        <td>
                          <div className="status-flow-cell">
                            <select
                              value={statusStr}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className={`status-selector-dropdown status-${statusStr.toLowerCase()}`}
                            >
                              <option value="PENDING">⏳ PENDING</option>
                              <option value="CONFIRMED">✅ CONFIRMED</option>
                              <option value="PROCESSING">📦 PROCESSING</option>
                              <option value="READY">🏷️ READY</option>
                              <option value="OUT_FOR_DELIVERY">🚚 IN TRANSIT</option>
                              <option value="DELIVERED">🎉 DELIVERED</option>
                              <option value="CANCELLED">❌ CANCELLED</option>
                            </select>
                          </div>
                        </td>

                        {/* ACTIONS */}
                        <td style={{ textAlign: "right" }}>
                          <div className="actions-cluster">
                            <button 
                              className="btn-action-view" 
                              onClick={() => setSelectedOrder(order)}
                              title="Inspect complete order & prescription breakdown"
                            >
                              Inspect
                            </button>
                            <button 
                              className="btn-action-bill" 
                              onClick={() => generateBill(order)}
                              title="Generate clinical invoice"
                            >
                              Bill
                            </button>
                            <button 
                              className="btn-action-print" 
                              onClick={() => printInvoice(order)}
                              title="Print delivery slip"
                            >
                              🖨️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            ORDER DETAIL INSPECTOR MODAL
           ========================================================================= */}
        {selectedOrder && (
          <div className="modal-backdrop-overlay" onClick={() => setSelectedOrder(null)}>
            <div className="order-details-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-banner">
                <div className="header-info">
                  <div className="ref-pill">Order Reference #{selectedOrder.orderNumber || selectedOrder.id}</div>
                  <h2>{selectedOrder.platform || "Direct Prescription Order"}</h2>
                  <span className="order-placed-stamp">Logged on {selectedOrder.orderDate || "Today"}</span>
                </div>
                <button className="modal-close-icon" onClick={() => setSelectedOrder(null)}>✕</button>
              </div>

              {/* TIMELINE PROGRESS BAR */}
              <div className="order-fulfillment-stepper">
                {STATUS_FLOW.map((step, idx) => {
                  const currentIdx = STATUS_FLOW.indexOf((selectedOrder.status || "PENDING").toUpperCase());
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div key={step} className={`step-node ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                      <div className="step-circle">{isDone ? "✓" : idx + 1}</div>
                      <span className="step-name">{step.replace(/_/g, " ")}</span>
                    </div>
                  );
                })}
              </div>

              <div className="modal-body-split">
                {/* LEFT: CUSTOMER & LOGISTICS */}
                <div className="modal-left-col">
                  <div className="info-card-block">
                    <h3>Patient / Delivery Details</h3>
                    <div className="details-data-grid">
                      <div className="data-row">
                        <span className="label">Patient Name:</span>
                        <span className="val bold-val">{selectedOrder.customer?.name || "Walk-in Guest"}</span>
                      </div>
                      <div className="data-row">
                        <span className="label">Contact Phone:</span>
                        <span className="val">{selectedOrder.customer?.phone || "N/A"}</span>
                      </div>
                      <div className="data-row">
                        <span className="label">Email Address:</span>
                        <span className="val">{selectedOrder.customer?.email || "N/A"}</span>
                      </div>
                      <div className="data-row">
                        <span className="label">Delivery Address:</span>
                        <span className="val">{selectedOrder.customer?.address || "Store Pickup"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="info-card-block">
                    <h3>Order Lifecycle Actions</h3>
                    <div className="status-button-grid">
                      <button 
                        className="btn-status-action btn-confirm" 
                        onClick={() => handleStatusChange(selectedOrder.id, "CONFIRMED")}
                      >
                        ✓ Confirm Order
                      </button>
                      <button 
                        className="btn-status-action btn-pack" 
                        onClick={() => handleStatusChange(selectedOrder.id, "PROCESSING")}
                      >
                        📦 Pack Medicines
                      </button>
                      <button 
                        className="btn-status-action btn-ready" 
                        onClick={() => handleStatusChange(selectedOrder.id, "READY")}
                      >
                        🏷️ Ready for Dispatch
                      </button>
                      <button 
                        className="btn-status-action btn-dispatch" 
                        onClick={() => handleStatusChange(selectedOrder.id, "OUT_FOR_DELIVERY")}
                      >
                        🚚 Mark In-Transit
                      </button>
                      <button 
                        className="btn-status-action btn-delivered" 
                        onClick={() => handleStatusChange(selectedOrder.id, "DELIVERED")}
                      >
                        🎉 Confirm Delivered
                      </button>
                      <button 
                        className="btn-status-action btn-cancel" 
                        onClick={() => handleStatusChange(selectedOrder.id, "CANCELLED")}
                      >
                        ✕ Cancel Order
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT: MEDICINE ITEMS & BILLING */}
                <div className="modal-right-col">
                  <div className="info-card-block">
                    <h3>Prescribed Medicine Items</h3>
                    <div className="modal-items-table-box">
                      <table>
                        <thead>
                          <tr>
                            <th>Medicine</th>
                            <th>Batch</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedOrder.items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <strong style={{ color: "#F8FAFC" }}>{item.medicine || "Medicine"}</strong>
                              </td>
                              <td><span className="batch-tag">{item.batch || "B-AUTO"}</span></td>
                              <td>{item.quantity}</td>
                              <td>₹{Number(item.price || 0).toFixed(2)}</td>
                              <td style={{ fontWeight: "700", color: "#38BDF8" }}>
                                ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="billing-breakdown-card">
                    <h3>Financial & Tax Summary</h3>
                    <div className="bill-line">
                      <span>Items Subtotal:</span>
                      <strong>₹{calculateSubtotal(selectedOrder).toFixed(2)}</strong>
                    </div>
                    <div className="bill-line">
                      <span>GST (12% Pharma):</span>
                      <strong>₹{(Number(selectedOrder.tax) || 0).toFixed(2)}</strong>
                    </div>
                    <div className="bill-line">
                      <span>Delivery & Handling:</span>
                      <strong>₹{(Number(selectedOrder.delivery) || 0).toFixed(2)}</strong>
                    </div>
                    <div className="bill-divider"></div>
                    <div className="bill-line grand-total-line">
                      <span>Net Total Amount:</span>
                      <strong className="grand-val">₹{calculateTotal(selectedOrder).toFixed(2)}</strong>
                    </div>
                    <div className="payment-confirmation-note">
                      <span>Payment Method: <strong>{selectedOrder.paymentMethod || "UPI"}</strong></span>
                      <span className="status-badge-inline">{selectedOrder.payment || "PAID"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer-strip">
                <button className="btn-secondary-close" onClick={() => setSelectedOrder(null)}>
                  Close
                </button>
                <div className="footer-right-buttons">
                  <button className="btn-primary-bill" onClick={() => generateBill(selectedOrder)}>
                    Generate Bill
                  </button>
                  <button className="btn-primary-print" onClick={() => printInvoice(selectedOrder)}>
                    🖨️ Print Dispatch Receipt
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            INVOICE PRINT PREVIEW MODAL
           ========================================================================= */}
        {invoiceOrder && (
          <div className="modal-backdrop-overlay" onClick={() => setInvoiceOrder(null)}>
            <div className="printable-invoice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="invoice-header">
                <div className="invoice-brand">
                  <h2>MEDISTOCK PHARMACY DISPENSARY</h2>
                  <p>Certified Central Healthcare Dispensing Unit</p>
                  <span>GSTIN: 27AAAAA0000A1Z5 | Drug Lic: DL-MH-PUN-10492</span>
                </div>
                <div className="invoice-meta-right">
                  <h3>TAX INVOICE</h3>
                  <span>Inv #: INV-{invoiceOrder.orderNumber || invoiceOrder.id}</span>
                  <span>Date: {invoiceOrder.orderDate || new Date().toLocaleDateString()}</span>
                  <span>Channel: {invoiceOrder.platform || "Web Direct"}</span>
                </div>
              </div>

              <div className="invoice-patient-section">
                <div>
                  <strong>Billed To / Patient:</strong>
                  <p>{invoiceOrder.customer?.name || "Walk-in Guest"}</p>
                  <p>Phone: {invoiceOrder.customer?.phone || "-"}</p>
                  <p>{invoiceOrder.customer?.address || "Store Delivery"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Payment Status:</strong>
                  <p style={{ color: "#10b981", fontWeight: "700" }}>{invoiceOrder.payment || "PAID"}</p>
                  <p>Mode: {invoiceOrder.paymentMethod || "UPI"}</p>
                </div>
              </div>

              <table className="invoice-items-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine Description</th>
                    <th>Batch</th>
                    <th>Qty</th>
                    <th>Unit Rate (₹)</th>
                    <th>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceOrder.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td><strong>{it.medicine || "Medicine"}</strong></td>
                      <td>{it.batch || "B1001"}</td>
                      <td>{it.quantity}</td>
                      <td>₹{Number(it.price || 0).toFixed(2)}</td>
                      <td>₹{((Number(it.quantity) || 0) * (Number(it.price) || 0)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="invoice-totals-box">
                <div className="total-row"><span>Subtotal:</span><strong>₹{calculateSubtotal(invoiceOrder).toFixed(2)}</strong></div>
                <div className="total-row"><span>Pharma GST (12%):</span><strong>₹{(Number(invoiceOrder.tax) || 0).toFixed(2)}</strong></div>
                <div className="total-row"><span>Delivery Charges:</span><strong>₹{(Number(invoiceOrder.delivery) || 0).toFixed(2)}</strong></div>
                <div className="total-row grand"><span>Total Payable:</span><strong>₹{calculateTotal(invoiceOrder).toFixed(2)}</strong></div>
              </div>

              <div className="invoice-footer-signatures">
                <div>
                  <p>Computer-generated dispensary receipt under GxP regulatory guidelines.</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="sig-line"></div>
                  <p>Registered Pharmacist Signature</p>
                </div>
              </div>

              <div className="invoice-actions no-print">
                <button className="btn-secondary-close" onClick={() => setInvoiceOrder(null)}>Close</button>
                <button className="btn-primary-print" onClick={() => window.print()}>🖨️ Print Now</button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CREATE MANUAL / TELEPHONE RX ORDER MODAL
           ========================================================================= */}
        {createModalOpen && (
          <div className="modal-backdrop-overlay" onClick={() => setCreateModalOpen(false)}>
            <div className="create-order-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-banner">
                <div>
                  <h2>Record New Online / Phone Prescription Order</h2>
                  <p className="subtext">Directly ingress tele-consultation or express delivery orders into dispensing queue.</p>
                </div>
                <button className="modal-close-icon" onClick={() => setCreateModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateOrderSubmit} className="create-order-form">
                <div className="form-fields-grid">
                  <div className="form-group">
                    <label>Patient / Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={newOrderForm.customerName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contact Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +91 98220 12345"
                      value={newOrderForm.customerPhone}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerPhone: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Patient Email</label>
                    <input
                      type="email"
                      placeholder="patient@gmail.com"
                      value={newOrderForm.customerEmail}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, customerEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Inflow Channel *</label>
                    <select
                      value={newOrderForm.platform}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, platform: e.target.value })}
                    >
                      <option value="MediStock Direct">MediStock Direct</option>
                      <option value="WhatsApp Rx">WhatsApp Rx Order</option>
                      <option value="Tata 1mg">Tata 1mg</option>
                      <option value="Apollo 24/7">Apollo 24/7</option>
                      <option value="PharmEasy">PharmEasy</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Delivery Address</label>
                    <input
                      type="text"
                      placeholder="Street address, Flat number, City, Pincode"
                      value={newOrderForm.deliveryAddress}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, deliveryAddress: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Medicine Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 650mg"
                      value={newOrderForm.medicineName}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, medicineName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Allocated Batch No</label>
                    <input
                      type="text"
                      placeholder="e.g. B1045"
                      value={newOrderForm.batchNumber}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, batchNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newOrderForm.quantity}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Unit Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newOrderForm.price}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, price: Number(e.target.value) })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method</label>
                    <select
                      value={newOrderForm.paymentMethod}
                      onChange={(e) => setNewOrderForm({ ...newOrderForm, paymentMethod: e.target.value })}
                    >
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="Credit Card">Credit / Debit Card</option>
                      <option value="NetBanking">Net Banking</option>
                      <option value="Cash On Delivery">Cash On Delivery (COD)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer-strip">
                  <button type="button" className="btn-secondary-close" onClick={() => setCreateModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary-bill" disabled={actionLoading}>
                    {actionLoading ? "Submitting..." : "Submit Prescription Order"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PharmacyLayout>
  );
}

export default PharmacistOnlineOrders;
