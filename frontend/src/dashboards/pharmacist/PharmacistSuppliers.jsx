import React, { useEffect, useMemo, useState } from "react";
import PharmacyLayout from "./PharmacyLayout";
import { apiRequest, getSessionUser } from "../../lib/api";
import "./PharmacistSuppliers.css";

const money = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
const displayStatus = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const date = (value) => value ? new Date(value).toLocaleDateString("en-CA") : "-";

function PharmacistSuppliers() {
  const [activeTab, setActiveTab] = useState("suppliers");
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatus, setSupplierFilter] = useState("All");
  const [poSearch, setPoSearch] = useState("");
  const [poStatus, setPoStatus] = useState("All");
  const [historySearch, setHistorySearch] = useState("");
  const [feedback, setFeedback] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [supplierData, orderData] = await Promise.all([
        apiRequest("/api/suppliers"),
        apiRequest("/api/purchase-orders"),
      ]);
      setSuppliers(supplierData);
      setPurchaseOrders(orderData);
    } catch (error) {
      setFeedback(error.message || "Supplier data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filteredSuppliers = useMemo(() => suppliers.filter((supplier) => {
    const text = `${supplier.companyName || ""} ${supplier.contactPerson || ""} ${supplier.phone || ""}`.toLowerCase();
    return text.includes(supplierSearch.toLowerCase())
      && (supplierStatus === "All" || supplier.status === supplierStatus.toUpperCase());
  }), [suppliers, supplierSearch, supplierStatus]);

  const filteredPOs = useMemo(() => purchaseOrders.filter((order) => {
    const text = `${order.poNumber || ""} ${order.supplier?.companyName || ""}`.toLowerCase();
    return text.includes(poSearch.toLowerCase())
      && (poStatus === "All" || order.status === poStatus);
  }), [purchaseOrders, poSearch, poStatus]);

  const purchaseHistory = useMemo(() => purchaseOrders.filter((order) => order.status === "RECEIVED"), [purchaseOrders]);
  const filteredHistory = useMemo(() => purchaseHistory.filter((order) => (
    `${order.poNumber || ""} ${order.supplier?.companyName || ""}`.toLowerCase().includes(historySearch.toLowerCase())
  )), [purchaseHistory, historySearch]);

  const [supplierModal, setSupplierModal] = useState({ isOpen: false, supplier: null });
  const [poModal, setPoModal] = useState({ isOpen: false, supplierId: "" });
  const [detailModal, setDetailModal] = useState({ isOpen: false, title: "", content: "" });

  const runAction = async (action, successMessage) => {
    try {
      await action();
      setFeedback(successMessage);
      setSupplierModal({ isOpen: false, supplier: null });
      setPoModal({ isOpen: false, supplierId: "" });
      await loadData();
    } catch (error) {
      setFeedback(error.message || "The action could not be completed.");
    }
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const companyName = form.get("companyName");
    const phone = form.get("phone");
    const email = form.get("email") || "";
    const contactPerson = form.get("contactPerson") || "";
    const supplierType = form.get("supplierType") || "Distributor";

    if (supplierModal.supplier) {
      await runAction(() => apiRequest(`/api/suppliers/${supplierModal.supplier.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...supplierModal.supplier, companyName, phone, email, contactPerson, supplierType }),
      }), `${companyName} was updated.`);
    } else {
      await runAction(() => apiRequest("/api/suppliers", {
        method: "POST",
        body: JSON.stringify({ companyName, phone, email, contactPerson, supplierType, status: "ACTIVE" }),
      }), `${companyName} was added.`);
    }
  };

  const setSupplierStatus = async (supplier) => {
    const active = supplier.status !== "ACTIVE";
    await runAction(() => apiRequest(`/api/suppliers/${supplier.id}/status?active=${active}`, { method: "PATCH" }),
      `${supplier.companyName} is now ${active ? "active" : "inactive"}.`);
  };

  const deleteSupplier = async (supplier) => {
    if (!window.confirm(`Remove ${supplier.companyName}?`)) return;
    await runAction(() => apiRequest(`/api/suppliers/${supplier.id}`, { method: "DELETE" }),
      `${supplier.companyName} was removed.`);
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supplierId = form.get("supplierId");
    const poNumber = form.get("poNumber") || `PO-${Date.now()}`;
    const user = getSessionUser();
    await runAction(() => apiRequest("/api/purchase-orders", {
      method: "POST",
      body: JSON.stringify({ supplierId: Number(supplierId), poNumber, createdBy: user?.name || "Pharmacist" }),
    }), `${poNumber} was created as a draft.`);
  };

  const updateOrderStatus = async (order, status) => {
    await runAction(() => apiRequest(`/api/purchase-orders/${order.id}/status?status=${status}`, { method: "PATCH" }),
      `${order.poNumber} is now ${displayStatus(status)}.`);
  };

  const renderSuppliers = () => <div style={{ padding: "0 20px" }}>
    <div className="supplier-cards"><div className="supplier-card blue"><div className="card-icon">Suppliers</div><div><span>Total Suppliers</span><h2>{suppliers.length}</h2><small>Registered database vendors</small></div></div><div className="supplier-card green"><div className="card-icon">Active</div><div><span>Active Suppliers</span><h2>{suppliers.filter((item) => item.status === "ACTIVE").length}</h2><small>Currently available</small></div></div><div className="supplier-card purple"><div className="card-icon">Orders</div><div><span>Purchase Orders</span><h2>{purchaseOrders.length}</h2><small>All supplier orders</small></div></div><div className="supplier-card orange"><div className="card-icon">Value</div><div><span>Purchase Value</span><h2>{money(suppliers.reduce((total, item) => total + Number(item.totalPurchaseAmount || 0), 0))}</h2><small>Supplier ledger total</small></div></div></div>
    
    {/* SUPPLIER ANALYTICS CHARTS */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '22px' }}>
      
      {/* Chart 1: Top Suppliers Vertical Column Chart */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8' }}>Top Suppliers by Spend &amp; Orders</h3>
        {(() => {
          const top = [...suppliers].sort((a,b) => (Number(b.totalPurchaseAmount)||0) - (Number(a.totalPurchaseAmount)||0)).slice(0, 4);
          const maxSpend = Math.max(1, ...top.map(s => Number(s.totalPurchaseAmount)||0));
          const palette = ['#00B4D8', '#22c55e', '#f59e0b', '#ec4899'];
          if (top.length === 0) return <p style={{ color: '#94A3B8', fontSize: '12px' }}>No supplier spend records</p>;
          return (
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', padding: '10px 4px 4px' }}>
              {/* Grid Lines */}
              <div style={{ position: 'absolute', inset: '10px 10px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
              </div>
              {top.map((s, idx) => {
                const amt = Number(s.totalPurchaseAmount) || 0;
                const heightPct = Math.max(15, Math.min(100, Math.round((amt / maxSpend) * 100)));
                return (
                  <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, width: '22%' }}>
                    <span style={{ fontSize: '10px', color: palette[idx % 4], fontWeight: 'bold' }}>₹{amt > 1000 ? `${(amt/1000).toFixed(1)}k` : amt}</span>
                    <div style={{
                      width: '100%',
                      maxWidth: '34px',
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${palette[idx % 4]} 0%, rgba(0, 180, 216, 0.25) 100%)`,
                      borderRadius: '5px 5px 0 0',
                      boxShadow: `0 0 8px ${palette[idx % 4]}55`,
                      transition: 'height 0.4s ease'
                    }} />
                    <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{s.companyName}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Chart 2: Vendor Type & Active Status Donut Chart */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8' }}>Vendor Distribution &amp; Status</h3>
        {(() => {
          const active = suppliers.filter(s => s.status === 'ACTIVE').length;
          const inactive = suppliers.length - active;
          const total = suppliers.length || 1;
          const activePct = Math.round((active / total) * 100);
          const types = ['Distributor', 'Manufacturer', 'Wholesaler'];
          const typeColors = { Distributor: '#00B4D8', Manufacturer: '#22c55e', Wholesaler: '#f59e0b' };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                {/* Donut Chart */}
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: `conic-gradient(#22c55e 0% ${activePct}%, #f43f5e ${activePct}% 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(34, 197, 94, 0.2)'
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
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{suppliers.length}</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>Vendors</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'rgba(34, 197, 94, 0.08)', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #22c55e' }}>
                    <span style={{ color: '#86efac' }}>Active</span>
                    <strong>{active} ({activePct}%)</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', background: 'rgba(244, 63, 94, 0.08)', padding: '5px 8px', borderRadius: '4px', borderLeft: '3px solid #f43f5e' }}>
                    <span style={{ color: '#fda4af' }}>Inactive</span>
                    <strong>{inactive} ({100 - activePct}%)</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '2px' }}>
                {types.map(t => {
                  const count = suppliers.filter(s => (s.supplierType || 'Distributor') === t).length;
                  return (
                    <div key={t} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e293b', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', color: typeColors[t], display: 'block', fontWeight: '600' }}>● {t}</span>
                      <strong style={{ fontSize: '14px', color: '#fff' }}>{count}</strong>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

    </div>

    <div className="filter-box">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input placeholder="Search supplier name, contact, phone, or email..." value={supplierSearch} onChange={(event) => setSupplierSearch(event.target.value)} />
      </div>
      <select value={supplierStatus} onChange={(event) => setSupplierFilter(event.target.value)}>
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Inactive">Inactive</option>
      </select>
      <button className="reset-btn" onClick={() => { setSupplierSearch(""); setSupplierFilter("All"); }}>Reset</button>
    </div>
    <div className="table-container"><div className="table-header"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2>Supplier List</h2><span>Total Records: {loading ? "..." : filteredSuppliers.length}</span></div><button className="add-supplier-btn" onClick={() => setSupplierModal({ isOpen: true, supplier: null })}>Add Supplier</button></div></div><div className="table-wrapper"><table><thead><tr><th>#</th><th>Supplier</th><th>Contact</th><th>Email</th><th>Orders</th><th>Purchase Value</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="8" className="loading-text">Loading suppliers...</td></tr> : filteredSuppliers.length === 0 ? <tr><td colSpan="8" className="no-data">No suppliers found.</td></tr> : filteredSuppliers.map((supplier, index) => <tr key={supplier.id}><td>{index + 1}</td><td><strong>{supplier.companyName}</strong></td><td>{supplier.phone}</td><td>{supplier.email || "-"}</td><td>{supplier.totalOrders || 0}</td><td><strong>{money(supplier.totalPurchaseAmount)}</strong></td><td><span className={supplier.status === "ACTIVE" ? "status active" : "status inactive"}>{displayStatus(supplier.status)}</span></td><td><div className="actions"><button className="view" title="View supplier" onClick={() => setDetailModal({ isOpen: true, title: supplier.companyName, content: `Contact: ${supplier.phone}\nEmail: ${supplier.email || 'N/A'}\nType: ${supplier.supplierType || 'Distributor'}\nTotal Orders: ${supplier.totalOrders || 0}\nPurchase Amount: ${money(supplier.totalPurchaseAmount)}` })}>View</button><button className="edit" title="Edit supplier" onClick={() => setSupplierModal({ isOpen: true, supplier })}>Edit</button><button className="edit" title="Activate or deactivate" onClick={() => setSupplierStatus(supplier)}>Status</button><button className="delete" title="Delete supplier" onClick={() => deleteSupplier(supplier)}>Delete</button></div></td></tr>)}</tbody></table></div></div>
  </div>;

  const renderPurchases = () => <div style={{ padding: "0 20px" }}>
    <div className="supplier-cards"><div className="supplier-card blue"><div className="card-icon">PO</div><div><span>Total POs</span><h2>{purchaseOrders.length}</h2><small>All purchase orders</small></div></div><div className="supplier-card orange"><div className="card-icon">Open</div><div><span>Open Orders</span><h2>{purchaseOrders.filter((item) => !["RECEIVED", "CANCELLED"].includes(item.status)).length}</h2><small>Need attention</small></div></div><div className="supplier-card purple"><div className="card-icon">Draft</div><div><span>Draft Orders</span><h2>{purchaseOrders.filter((item) => item.status === "DRAFT").length}</h2><small>Awaiting approval</small></div></div><div className="supplier-card green"><div className="card-icon">Received</div><div><span>Received</span><h2>{purchaseHistory.length}</h2><small>Stock posted</small></div></div></div>
    
    {/* PURCHASE ORDER ANALYTICS CHARTS */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', marginBottom: '22px' }}>
      
      {/* Chart 1: PO Status Vertical Column Chart */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Purchase Orders Pipeline</span>
          <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>{purchaseOrders.length} total orders</small>
        </h3>
        {(() => {
          const poCols = [
            { label: 'Draft', count: purchaseOrders.filter(o => o.status === 'DRAFT').length, color: '#a855f7' },
            { label: 'Pending', count: purchaseOrders.filter(o => o.status === 'PENDING').length, color: '#3b82f6' },
            { label: 'Ordered', count: purchaseOrders.filter(o => o.status === 'ORDERED' || o.status === 'PARTIALLY_RECEIVED').length, color: '#f59e0b' },
            { label: 'Received', count: purchaseOrders.filter(o => o.status === 'RECEIVED').length, color: '#22c55e' },
            { label: 'Cancelled', count: purchaseOrders.filter(o => o.status === 'CANCELLED').length, color: '#f43f5e' }
          ];
          const maxCount = Math.max(1, ...poCols.map(c => c.count));

          return (
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', padding: '10px 4px 4px' }}>
              {/* Grid Lines */}
              <div style={{ position: 'absolute', inset: '10px 10px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
              </div>
              {poCols.map((c) => {
                const heightPct = Math.max(14, Math.min(100, Math.round((c.count / maxCount) * 100)));
                return (
                  <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, width: '18%' }}>
                    <span style={{ fontSize: '11px', color: c.color, fontWeight: 'bold' }}>{c.count}</span>
                    <div style={{
                      width: '100%',
                      maxWidth: '30px',
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${c.color} 0%, rgba(0, 180, 216, 0.25) 100%)`,
                      borderRadius: '5px 5px 0 0',
                      boxShadow: `0 0 8px ${c.color}55`,
                      transition: 'height 0.4s ease'
                    }} />
                    <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Chart 2: Financial Commitment Vertical Bar Chart */}
      <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8' }}>Order Value Breakdown</h3>
        {(() => {
          const receivedVal = purchaseOrders.filter(o => o.status === 'RECEIVED').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
          const openVal = purchaseOrders.filter(o => ['PENDING', 'ORDERED', 'PARTIALLY_RECEIVED'].includes(o.status)).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
          const draftVal = purchaseOrders.filter(o => o.status === 'DRAFT').reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
          const valCols = [
            { label: 'Received', val: receivedVal, color: '#22c55e' },
            { label: 'Open Pipeline', val: openVal, color: '#f59e0b' },
            { label: 'Draft', val: draftVal, color: '#a855f7' }
          ];
          const maxVal = Math.max(1, receivedVal, openVal, draftVal);

          return (
            <div style={{ height: '160px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', padding: '10px 4px 4px' }}>
              {/* Grid Lines */}
              <div style={{ position: 'absolute', inset: '10px 10px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
              </div>
              {valCols.map((c) => {
                const heightPct = Math.max(14, Math.min(100, Math.round((c.val / maxVal) * 100)));
                return (
                  <div key={c.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, width: '28%' }}>
                    <span style={{ fontSize: '10px', color: c.color, fontWeight: 'bold' }}>₹{c.val > 1000 ? `${(c.val/1000).toFixed(1)}k` : c.val}</span>
                    <div style={{
                      width: '100%',
                      maxWidth: '38px',
                      height: `${heightPct}%`,
                      background: `linear-gradient(180deg, ${c.color} 0%, rgba(0, 180, 216, 0.25) 100%)`,
                      borderRadius: '5px 5px 0 0',
                      boxShadow: `0 0 8px ${c.color}55`,
                      transition: 'height 0.4s ease'
                    }} />
                    <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{c.label}</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

    </div>

    <div className="filter-box">
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input placeholder="Search PO number or vendor..." value={poSearch} onChange={(event) => setPoSearch(event.target.value)} />
      </div>
      <select value={poStatus} onChange={(event) => setPoStatus(event.target.value)}>
        <option value="All">All Status</option>
        <option value="DRAFT">Draft</option>
        <option value="PENDING">Pending</option>
        <option value="ORDERED">Ordered</option>
        <option value="PARTIALLY_RECEIVED">Partially Received</option>
        <option value="RECEIVED">Received</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      <button className="reset-btn" onClick={() => { setPoSearch(""); setPoStatus("All"); }}>Reset</button>
    </div>
    <div className="table-container"><div className="table-header"><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h2>Purchase Orders</h2><span>Total Orders: {loading ? "..." : filteredPOs.length}</span></div><button className="add-supplier-btn" onClick={() => setPoModal({ isOpen: true, supplierId: suppliers[0]?.id || "" })}>Create PO</button></div></div><div className="table-wrapper"><table><thead><tr><th>PO Number</th><th>Supplier</th><th>Created</th><th>Items</th><th>Total Amount</th><th>Status</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="loading-text">Loading purchase orders...</td></tr> : filteredPOs.length === 0 ? <tr><td colSpan="7" className="no-data">No orders found.</td></tr> : filteredPOs.map((order) => <tr key={order.id}><td><strong>{order.poNumber}</strong></td><td>{order.supplier?.companyName || "-"}</td><td>{date(order.createdAt)}</td><td>{order.items?.length || 0}</td><td>{money(order.totalAmount)}</td><td><span className={`status ${String(order.status).toLowerCase()}`}>{displayStatus(order.status)}</span></td><td><div className="actions"><button className="view" title="View order" onClick={() => setDetailModal({ isOpen: true, title: `Order ${order.poNumber}`, content: `Supplier: ${order.supplier?.companyName || 'N/A'}\nCreated: ${date(order.createdAt)}\nStatus: ${displayStatus(order.status)}\nTotal Amount: ${money(order.totalAmount)}\nCreated By: ${order.createdBy || 'Staff'}` })}>View</button>{order.status === "DRAFT" && <button className="edit" title="Approve order" onClick={() => updateOrderStatus(order, "PENDING")}>Approve</button>}{!["RECEIVED", "CANCELLED"].includes(order.status) && <button className="edit" title="Receive stock" onClick={() => updateOrderStatus(order, "RECEIVED")}>Receive</button>}{order.status !== "RECEIVED" && <button className="delete" title="Cancel order" onClick={() => updateOrderStatus(order, "CANCELLED")}>Cancel</button>}</div></td></tr>)}</tbody></table></div></div>
  </div>;

  const renderHistory = () => <div style={{ padding: "0 20px" }}><div className="supplier-cards"><div className="supplier-card green"><div className="card-icon">History</div><div><span>Received Logs</span><h2>{purchaseHistory.length}</h2><small>Received purchase orders</small></div></div><div className="supplier-card blue"><div className="card-icon">Items</div><div><span>Units Received</span><h2>{purchaseHistory.reduce((total, order) => total + (order.items || []).reduce((sum, item) => sum + Number(item.orderedQuantity || 0), 0), 0)}</h2><small>From received orders</small></div></div></div><div className="filter-box"><div className="search-box"><span className="search-icon">🔍</span><input placeholder="Search received PO or supplier name..." value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} /></div><button className="reset-btn" onClick={() => setHistorySearch("")}>Reset</button></div><div className="table-container"><div className="table-header"><h2>Purchase and Receiving History</h2></div><div className="table-wrapper"><table><thead><tr><th>PO Reference</th><th>Supplier</th><th>Received Date</th><th>Total Items</th><th>Invoice Amount</th><th>Verified By</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="loading-text">Loading history...</td></tr> : filteredHistory.length === 0 ? <tr><td colSpan="6" className="no-data">No received purchase orders found.</td></tr> : filteredHistory.map((order) => <tr key={order.id}><td><strong>{order.poNumber}</strong></td><td>{order.supplier?.companyName || "-"}</td><td>{date(order.updatedAt || order.createdAt)}</td><td>{(order.items || []).reduce((total, item) => total + Number(item.orderedQuantity || 0), 0)}</td><td>{money(order.totalAmount)}</td><td>{order.createdBy || "-"}</td></tr>)}</tbody></table></div></div></div>;

  return (
    <PharmacyLayout title="Suppliers and Purchases">
      <div className="supplier-page">
        <div className="supplier-header" style={{ padding: "0 20px" }}>
          <div>
            <div className="breadcrumb">Dashboard / {activeTab === "suppliers" ? "Suppliers" : activeTab === "purchases" ? "Purchase Orders" : "Purchase History"}</div>
            <h1>Supplier and Purchase Operations</h1>
            <p>Manage vendors, purchase orders, receiving, and audit history.</p>
          </div>
        </div>
        {feedback && <div className="inventory-message" role="status">{feedback}</div>}
        <div className="supplier-tabs">
          <button className={`supplier-tab ${activeTab === "suppliers" ? "active" : ""}`} onClick={() => setActiveTab("suppliers")}>Suppliers Directory</button>
          <button className={`supplier-tab ${activeTab === "purchases" ? "active" : ""}`} onClick={() => setActiveTab("purchases")}>Purchase Orders</button>
          <button className={`supplier-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>Purchase History</button>
        </div>
        {activeTab === "suppliers" ? renderSuppliers() : activeTab === "purchases" ? renderPurchases() : renderHistory()}

        {/* MODAL: ADD / EDIT SUPPLIER */}
        {supplierModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>{supplierModal.supplier ? "Edit Supplier" : "Add New Supplier"}</h3>
              <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Company Name</label>
                  <input name="companyName" defaultValue={supplierModal.supplier?.companyName || ""} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Phone Number</label>
                  <input name="phone" defaultValue={supplierModal.supplier?.phone || ""} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Email Address</label>
                  <input name="email" type="email" defaultValue={supplierModal.supplier?.email || ""} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Contact Person</label>
                  <input name="contactPerson" defaultValue={supplierModal.supplier?.contactPerson || ""} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Supplier Type</label>
                  <select name="supplierType" defaultValue={supplierModal.supplier?.supplierType || "Distributor"} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}>
                    <option value="Manufacturer">Manufacturer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Wholesaler">Wholesaler</option>
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setSupplierModal({ isOpen: false, supplier: null })}>Cancel</button>
                  <button type="submit" className="add-supplier-btn">Save Supplier</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CREATE PURCHASE ORDER */}
        {poModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>Create Purchase Order</h3>
              <form onSubmit={handleSavePO} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Supplier</label>
                  <select name="supplierId" defaultValue={poModal.supplierId} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} required>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>PO Number Reference</label>
                  <input name="poNumber" defaultValue={`PO-${Date.now().toString().slice(-6)}`} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setPoModal({ isOpen: false, supplierId: "" })}>Cancel</button>
                  <button type="submit" className="add-supplier-btn">Create Order</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DETAILS */}
        {detailModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>{detailModal.title}</h3>
              <pre style={{ whiteSpace: 'pre-wrap', color: '#94A3B8', fontFamily: 'inherit', margin: '1rem 0' }}>{detailModal.content}</pre>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="add-supplier-btn" onClick={() => setDetailModal({ isOpen: false, title: "", content: "" })}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
}

export default PharmacistSuppliers;
