import React, { useMemo, useState, useEffect } from "react";
import PharmacyLayout from "./PharmacyLayout"; // Wrapped in your global Layout
import { apiRequest } from "../../lib/api";
import "./PharmacistMonitoring.css";

function PharmacistMonitoring() {
  const API_BASE_URL = "/api/pharmacist/monitoring";


  const [activeTab, setActiveTab] = useState("expiry");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- DATA STATE ---
  const [expiryData, setExpiryData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [poModal, setPoModal] = useState({
    isOpen: false,
    medicineName: "",
    medicineId: "",
    supplierId: "",
    quantity: 20,
    unitPrice: 15,
    batchNumber: ""
  });

  useEffect(() => {
    const fetchMonitoringData = async () => {
      setLoading(true);
      setError("");

      try {
        const [data, sups, meds] = await Promise.all([
          apiRequest(API_BASE_URL),
          apiRequest("/api/suppliers").catch(() => []),
          apiRequest("/api/medicines").catch(() => [])
        ]);
        setExpiryData(data.expiryData || []);
        setStockData(data.stockData || []);
        setSuppliers(sups || []);
        setMedicines(meds || []);
      } catch (apiError) {
        setError(apiError.message || "Failed to load monitoring data");
      } finally {
        setLoading(false);
      }
    };

    fetchMonitoringData();
  }, []);

  const filteredExpiry = useMemo(() => {
    return expiryData.filter((item) => {
      const matchesSearch = item.medicine.toLowerCase().includes(search.toLowerCase()) || item.batch.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, expiryData]);

  const filteredStock = useMemo(() => {
    return stockData.filter((item) => {
      const matchesSearch = item.medicine.toLowerCase().includes(search.toLowerCase()) || item.batch.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, stockData]);

  const handleCreatePurchase = (medicine) => {
    const matchedMed = medicines.find(m => m.name.toLowerCase() === (medicine || "").toLowerCase()) || medicines[0];
    const defaultSup = suppliers[0];
    setPoModal({
      isOpen: true,
      medicineName: matchedMed?.name || medicine,
      medicineId: matchedMed?.id || "",
      supplierId: defaultSup?.id || "",
      quantity: 50,
      unitPrice: matchedMed?.price || 15,
      batchNumber: `B-${Date.now().toString().slice(-4)}`
    });
  };

  const handleSavePO = async (e) => {
    e.preventDefault();
    try {
      const poNumber = `PO-${Date.now().toString().slice(-6)}`;
      const order = await apiRequest("/api/purchase-orders", {
        method: "POST",
        body: { supplierId: poModal.supplierId, poNumber, createdBy: "Pharmacist" },
      });
      if (order?.id && poModal.medicineId) {
        await apiRequest(`/api/purchase-orders/${order.id}/items`, {
          method: "POST",
          body: {
            medicineId: poModal.medicineId,
            quantity: Number(poModal.quantity),
            unitPrice: Number(poModal.unitPrice),
            batchNumber: poModal.batchNumber
          },
        });
      }
      setPoModal({ ...poModal, isOpen: false });
      setToastMsg(`Purchase Order ${poNumber} created successfully.`);
      setTimeout(() => setToastMsg(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to create purchase order");
    }
  };

  const handleMonitoringAction = async (action, item) => {
    try {
      const data = await apiRequest("/api/staff/reports/generate", {
        method: "POST",
        body: { action, item },
      });
      setToastMsg(data.message || `${action} completed successfully`);
      setTimeout(() => setToastMsg(""), 4000);
    } catch (err) {
      setToastMsg(`Action ${action} initiated`);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  return (
    <PharmacyLayout title="Monitoring">
      <div className="monitoring-page">
        {toastMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            color: '#a7f3d0',
            padding: '10px 16px',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            {toastMsg}
          </div>
        )}

        {/* ================= HEADER ================= */}
        <header className="monitoring-header">
          <div>
            <h1>System Monitoring</h1>
            <p>Monitor medicine expiry, low stock and inventory alerts</p>
          </div>
          <div className="monitoring-date">
            {new Date().toLocaleDateString("en-IN")}
          </div>
        </header>
        {error && <div className="page-loading">{error}</div>}

        {/* ================= KPI CARDS ================= */}
        <section className="monitoring-kpis">
          <div className="monitor-card expiry-card">
            <span className="monitor-icon">⏰</span>
            <div>
              <h3>Expiring Soon</h3>
              <strong>{expiryData.filter((item) => item.status === "EXPIRING SOON").length}</strong>
              <p>Within 30 days</p>
            </div>
          </div>

          <div className="monitor-card expired-card">
            <span className="monitor-icon">⚠️</span>
            <div>
              <h3>Expired Medicines</h3>
              <strong>{expiryData.filter((item) => item.status === "EXPIRED").length}</strong>
              <p>Require removal</p>
            </div>
          </div>

          <div className="monitor-card low-card">
            <span className="monitor-icon">📉</span>
            <div>
              <h3>Low Stock</h3>
              <strong>{stockData.filter((item) => item.status === "LOW STOCK").length}</strong>
              <p>Need attention</p>
            </div>
          </div>

          <div className="monitor-card out-card">
            <span className="monitor-icon">🚫</span>
            <div>
              <h3>Out of Stock</h3>
              <strong>{stockData.filter((item) => item.status === "OUT OF STOCK").length}</strong>
              <p>Immediate action</p>
            </div>
          </div>

          <div className="monitor-card normal-card">
            <span className="monitor-icon">✓</span>
            <div>
              <h3>Stock Normal</h3>
              <strong>{stockData.filter((item) => item.status === "NORMAL").length}</strong>
              <p>Healthy inventory</p>
            </div>
          </div>
        </section>

        {/* ================= TABS ================= */}
        <div className="monitor-tabs">
          <button
            className={activeTab === "expiry" ? "active" : ""}
            onClick={() => { setActiveTab("expiry"); setStatusFilter("ALL"); setSearch(""); }}
          >
            ⏰ Expiry Tracking
          </button>
          <button
            className={activeTab === "stock" ? "active" : ""}
            onClick={() => { setActiveTab("stock"); setStatusFilter("ALL"); setSearch(""); }}
          >
            📉 Low Stock Alerts
          </button>
        </div>

        {/* ================= FILTER AREA ================= */}
        <section className="monitor-filters">
          <input
            type="text"
            placeholder="Search medicine or batch number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Status</option>
            {activeTab === "expiry" ? (
              <>
                <option value="EXPIRING SOON">Expiring Soon</option>
                <option value="EXPIRED">Expired</option>
                <option value="SAFE">Safe</option>
              </>
            ) : (
              <>
                <option value="LOW STOCK">Low Stock</option>
                <option value="OUT OF STOCK">Out of Stock</option>
                <option value="NORMAL">Normal</option>
              </>
            )}
          </select>

          <button
            className="reset-btn"
            onClick={() => { setSearch(""); setStatusFilter("ALL"); }}
          >
            Reset
          </button>
        </section>

        {/* ================= EXPIRY TRACKING ================= */}
        {activeTab === "expiry" && (
          <section className="monitor-table-section">
            <div className="table-header">
              <div>
                <h2>Expiry Tracking</h2>
                <p>Monitor near-expiry and expired medicines</p>
              </div>
              <button className="export-btn" onClick={() => handleMonitoringAction("export-expiry-report", { activeTab })}>Export Report</button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Batch No.</th>
                    <th>Category</th>
                    <th>Expiry Date</th>
                    <th>Days Left</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="9" className="loading-text">Loading expiry data...</td></tr>
                  ) : filteredExpiry.length === 0 ? (
                    <tr><td colSpan="9" className="no-data">No records match your filter.</td></tr>
                  ) : (
                    filteredExpiry.map((item, index) => (
                      <tr key={item.id}>
                        <td style={{color: '#94A3B8'}}>{index + 1}</td>
                        <td><strong style={{color: '#ffffff'}}>{item.medicine}</strong></td>
                        <td>{item.batch}</td>
                        <td>{item.category}</td>
                        <td>{item.expiryDate}</td>
                        <td style={{color: item.daysLeft < 0 ? '#f43f5e' : '#CAF0F8', fontWeight: 'bold'}}>
                          {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} days ago` : `${item.daysLeft} days`}
                        </td>
                        <td>{item.quantity}</td>
                        <td>
                          <span className={`status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          {item.status === "EXPIRED" ? (
                            <button className="danger-action" onClick={() => handleMonitoringAction("remove-expired-stock", item)}>Remove</button>
                          ) : (
                            <button className="view-action" onClick={() => handleMonitoringAction("view-expiry-stock", item)}>View</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= LOW STOCK ================= */}
        {activeTab === "stock" && (
          <section className="monitor-table-section">
            <div className="table-header">
              <div>
                <h2>Low Stock Alerts</h2>
                <p>Medicines requiring stock replenishment</p>
              </div>
              <button className="export-btn" onClick={() => handleMonitoringAction("export-stock-report", { activeTab })}>Export Report</button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Medicine</th>
                    <th>Batch No.</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Stock Difference</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="loading-text">Loading stock data...</td></tr>
                  ) : filteredStock.length === 0 ? (
                    <tr><td colSpan="8" className="no-data">No records match your filter.</td></tr>
                  ) : (
                    filteredStock.map((item, index) => {
                      const difference = item.currentStock - item.reorderLevel;
                      return (
                        <tr key={item.id}>
                          <td style={{color: '#94A3B8'}}>{index + 1}</td>
                          <td><strong style={{color: '#ffffff'}}>{item.medicine}</strong></td>
                          <td>{item.batch}</td>
                          <td>
                            <strong className={item.currentStock === 0 ? "stock-zero" : "stock-low"}>
                              {item.currentStock}
                            </strong>
                          </td>
                          <td>{item.reorderLevel}</td>
                          <td style={{color: difference < 0 ? '#f43f5e' : '#22c55e'}}>{difference}</td>
                          <td>
                            <span className={`status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>
                              {item.status}
                            </span>
                          </td>
                          <td>
                            {item.status !== "NORMAL" ? (
                              <button className="purchase-action" onClick={() => handleCreatePurchase(item.medicine)}>
                                Create PO
                              </button>
                            ) : (
                              <button className="view-action" onClick={() => handleMonitoringAction("view-stock", item)}>View</button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ================= MONITORING SUMMARY ================= */}
        <section className="monitor-summary">
          <div className="summary-box">
            <h3>Monitoring Responsibilities</h3>
            <ul>
              <li>✓ Monitor real-time medicine stock</li>
              <li>✓ Identify low-stock medicines</li>
              <li>✓ Identify out-of-stock medicines</li>
              <li>✓ Track near-expiry medicines</li>
              <li>✓ Identify expired stock</li>
              <li>✓ Trigger purchase actions for low stock</li>
              <li>✓ Maintain inventory movement visibility</li>
            </ul>
          </div>

          <div className="summary-box">
            <h3>Alert Rules</h3>
            <div className="rule">
              <span>Expiry Alert</span>
              <strong>30 Days</strong>
            </div>
            <div className="rule">
              <span>Critical Expiry</span>
              <strong>7 Days</strong>
            </div>
            <div className="rule">
              <span>Low Stock</span>
              <strong>Below Reorder Level</strong>
            </div>
            <div className="rule">
              <span>Out of Stock</span>
              <strong>Quantity = 0</strong>
            </div>
          </div>
        </section>

        {/* ================= PURCHASE ORDER MODAL ================= */}
        {poModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>Create Purchase Order: {poModal.medicineName}</h3>
              <form onSubmit={handleSavePO} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Medicine</label>
                  <select
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={poModal.medicineId}
                    onChange={(e) => {
                      const m = medicines.find(med => String(med.id) === e.target.value);
                      setPoModal({ ...poModal, medicineId: e.target.value, medicineName: m?.name || "" });
                    }}
                    required
                  >
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Supplier / Vendor</label>
                  <select
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={poModal.supplierId}
                    onChange={(e) => setPoModal({ ...poModal, supplierId: e.target.value })}
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.companyName}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Order Quantity</label>
                    <input
                      type="number"
                      style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                      value={poModal.quantity}
                      onChange={(e) => setPoModal({ ...poModal, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Unit Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                      value={poModal.unitPrice}
                      onChange={(e) => setPoModal({ ...poModal, unitPrice: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Receiving Batch Number</label>
                  <input
                    style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }}
                    value={poModal.batchNumber}
                    onChange={(e) => setPoModal({ ...poModal, batchNumber: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="btn-secondary" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #334155', color: '#94A3B8', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setPoModal({ ...poModal, isOpen: false })}>Cancel</button>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 16px', background: '#00B4D8', border: 'none', color: '#030712', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Create Purchase Order</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PharmacyLayout>
  );
}

export default PharmacistMonitoring;
