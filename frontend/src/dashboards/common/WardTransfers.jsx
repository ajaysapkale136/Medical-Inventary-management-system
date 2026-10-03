import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "../admin/DashboardLayout";
import PharmacyLayout from "../pharmacist/PharmacyLayout";
import StaffLayout from "../Staff/StaffLayout";
import { apiRequest, getSessionUser } from "../../lib/api";
import "./WardTransfers.css";

const WARDS = [
  "Central Pharmacy",
  "Emergency Room (ER)",
  "Intensive Care Unit (ICU)",
  "Operation Theatre (OT)",
  "Inpatient Ward A",
  "Inpatient Ward B",
  "Pediatric Ward",
  "Outpatient Dispensary"
];

export default function WardTransfers() {
  const currentUser = getSessionUser();
  const userRole = currentUser?.role || "ADMIN";

  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // New Transfer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [batches, setBatches] = useState([]);
  const [formData, setFormData] = useState({
    medicineId: "",
    batchId: "",
    fromLocation: "Central Pharmacy",
    toLocation: "Emergency Room (ER)",
    quantity: 10,
    urgency: "ROUTINE",
    notes: ""
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  };

  const fetchTransfers = async () => {
    setLoading(true);
    setError("");
    try {
      const url = statusFilter === "ALL" ? "/api/transfers" : `/api/transfers?status=${statusFilter}`;
      const data = await apiRequest(url);
      setTransfers(data || []);
    } catch (err) {
      setError(err.message || "Failed to load ward transfers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  // Load medicines & batches when modal opens
  const openNewTransferModal = async () => {
    setIsModalOpen(true);
    try {
      const medList = await apiRequest("/api/medicines");
      setMedicines(medList || []);
      if (medList && medList.length > 0) {
        const firstMedId = medList[0].id;
        setFormData(prev => ({ ...prev, medicineId: firstMedId }));
        loadBatchesForMed(firstMedId);
      }
    } catch (err) {
      showToast("❌ Could not load medicines list");
    }
  };

  const loadBatchesForMed = async (medId) => {
    try {
      const batchList = await apiRequest(`/api/batches/medicine/${medId}`);
      setBatches(batchList || []);
      if (batchList && batchList.length > 0) {
        setFormData(prev => ({ ...prev, batchId: batchList[0].id }));
      }
    } catch (err) {
      setBatches([]);
    }
  };

  const handleMedicineChange = (e) => {
    const medId = e.target.value;
    setFormData(prev => ({ ...prev, medicineId: medId }));
    loadBatchesForMed(medId);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicineId || !formData.batchId || formData.quantity <= 0) {
      showToast("❌ Please complete all required fields with valid quantity.");
      return;
    }

    try {
      await apiRequest("/api/transfers", {
        method: "POST",
        body: {
          ...formData,
          requestedBy: currentUser?.email || "STAFF"
        }
      });
      setIsModalOpen(false);
      showToast("✅ Ward transfer request created successfully!");
      fetchTransfers();
    } catch (err) {
      showToast(`❌ ${err.message || "Failed to submit transfer request"}`);
    }
  };

  // Pipeline Actions
  const handleApprove = async (id) => {
    try {
      await apiRequest(`/api/transfers/${id}/approve`, {
        method: "POST",
        body: { approvedBy: currentUser?.email || "PHARMACIST" }
      });
      showToast("✅ Transfer approved for dispatch!");
      fetchTransfers();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const handleDispatch = async (id) => {
    try {
      await apiRequest(`/api/transfers/${id}/dispatch`, {
        method: "POST",
        body: { dispatchedBy: currentUser?.email || "PHARMACIST" }
      });
      showToast("🚚 Stock dispatched! Inventory deducted from source storage.");
      fetchTransfers();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const handleReceive = async (id) => {
    try {
      await apiRequest(`/api/transfers/${id}/receive`, {
        method: "POST",
        body: { receivedBy: currentUser?.email || "WARD_STAFF" }
      });
      showToast("📥 Transfer received! Stock added to ward storage.");
      fetchTransfers();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejecting this transfer:");
    if (!reason) return;
    try {
      await apiRequest(`/api/transfers/${id}/reject`, {
        method: "POST",
        body: { rejectedBy: currentUser?.email || "PHARMACIST", reason }
      });
      showToast("Transfer marked as rejected.");
      fetchTransfers();
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const pipelineStats = useMemo(() => {
    const req = transfers.filter(t => t.status === "REQUESTED").length;
    const app = transfers.filter(t => t.status === "APPROVED").length;
    const disp = transfers.filter(t => t.status === "DISPATCHED").length;
    const rec = transfers.filter(t => t.status === "RECEIVED").length;
    return { requested: req, approved: app, dispatched: disp, received: rec, total: transfers.length };
  }, [transfers]);

  // Wrap in appropriate dashboard layout
  const LayoutComponent = userRole === "PHARMACIST" ? PharmacyLayout : userRole === "STAFF" ? StaffLayout : DashboardLayout;

  return (
    <LayoutComponent title="Ward Stock Transfers">
      <div className="ward-transfers-container">

        {/* Page Header */}
        <div className="ward-header">
          <div>
            <div className="breadcrumb-nav">Dashboard › Logistics › Ward Transfers</div>
            <h1>Multi-Location & Ward Stock Transfers</h1>
            <p>Coordinate medicine requisition and distribution between Central Pharmacy, ICU, ER, and hospital wards.</p>
          </div>
          <button className="new-transfer-btn" onClick={openNewTransferModal}>
            + Request Ward Transfer
          </button>
        </div>

        {toastMsg && (
          <div className="ward-toast-banner">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg("")}>✕</button>
          </div>
        )}

        {error && <div className="ward-error-banner">⚠️ {error}</div>}

        {/* Pipeline Metric Cards */}
        <div className="pipeline-grid">
          <div className="pipeline-card" onClick={() => setStatusFilter("ALL")}>
            <span className="p-title">Total Transfers</span>
            <strong className="p-val">{pipelineStats.total}</strong>
            <small>All movements</small>
          </div>
          <div className={`pipeline-card ${statusFilter === "REQUESTED" ? "active" : ""}`} onClick={() => setStatusFilter("REQUESTED")}>
            <span className="p-title">1. Requisitions</span>
            <strong className="p-val" style={{ color: "#f59e0b" }}>{pipelineStats.requested}</strong>
            <small>Awaiting approval</small>
          </div>
          <div className={`pipeline-card ${statusFilter === "APPROVED" ? "active" : ""}`} onClick={() => setStatusFilter("APPROVED")}>
            <span className="p-title">2. Approved</span>
            <strong className="p-val" style={{ color: "#38bdf8" }}>{pipelineStats.approved}</strong>
            <small>Ready for packing</small>
          </div>
          <div className={`pipeline-card ${statusFilter === "DISPATCHED" ? "active" : ""}`} onClick={() => setStatusFilter("DISPATCHED")}>
            <span className="p-title">3. In Transit</span>
            <strong className="p-val" style={{ color: "#a855f7" }}>{pipelineStats.dispatched}</strong>
            <small>Dispatched to ward</small>
          </div>
          <div className={`pipeline-card ${statusFilter === "RECEIVED" ? "active" : ""}`} onClick={() => setStatusFilter("RECEIVED")}>
            <span className="p-title">4. Received</span>
            <strong className="p-val" style={{ color: "#10b981" }}>{pipelineStats.received}</strong>
            <small>Stock confirmed</small>
          </div>
        </div>

        {/* Transfer Orders Table */}
        <div className="ward-table-card">
          <div className="table-responsive">
            <table className="ward-data-table">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>Medicine & Batch</th>
                  <th>Origin & Destination</th>
                  <th>Quantity</th>
                  <th>Urgency</th>
                  <th>Status</th>
                  <th>Requested By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "28px" }}>Loading ward transfer pipeline...</td></tr>
                ) : transfers.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>No ward transfer records in this category.</td></tr>
                ) : (
                  transfers.map((t) => (
                    <tr key={t.id}>
                      <td><strong style={{ color: "#38bdf8" }}>{t.transferNumber}</strong></td>
                      <td>
                        <strong style={{ color: "#f8fafc", display: "block" }}>{t.medicine?.name}</strong>
                        <small style={{ color: "#94a3b8" }}>Batch: {t.batch?.batchNumber}</small>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "#cbd5e1" }}>{t.fromLocation}</span>
                          <span style={{ color: "#38bdf8", margin: "0 6px" }}>➔</span>
                          <strong style={{ color: "#34d399" }}>{t.toLocation}</strong>
                        </div>
                      </td>
                      <td><strong>{t.quantity}</strong> units</td>
                      <td>
                        <span className={`urgency-badge ${t.urgency === "STAT_EMERGENCY" ? "emergency" : t.urgency === "URGENT" ? "urgent" : "routine"}`}>
                          {t.urgency === "STAT_EMERGENCY" ? "🚨 STAT" : t.urgency}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill pill-${t.status.toLowerCase()}`}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.82rem", color: "#94a3b8" }}>{t.requestedBy}</td>
                      <td>
                        <div className="action-buttons-group">
                          {t.status === "REQUESTED" && (
                            <>
                              <button className="btn-approve" onClick={() => handleApprove(t.id)}>Approve</button>
                              <button className="btn-reject" onClick={() => handleReject(t.id)}>Reject</button>
                            </>
                          )}
                          {t.status === "APPROVED" && (
                            <button className="btn-dispatch" onClick={() => handleDispatch(t.id)}>🚚 Dispatch</button>
                          )}
                          {t.status === "DISPATCHED" && (
                            <button className="btn-receive" onClick={() => handleReceive(t.id)}>📥 Receive</button>
                          )}
                          {t.status === "RECEIVED" && (
                            <span style={{ color: "#10b981", fontSize: "0.8rem", fontWeight: "600" }}>✔ Completed</span>
                          )}
                          {t.status === "REJECTED" && (
                            <span style={{ color: "#ef4444", fontSize: "0.8rem" }}>Cancelled</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: New Requisition */}
        {isModalOpen && (
          <div className="ward-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="ward-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="ward-modal-header">
                <h3>New Ward Stock Requisition</h3>
                <button onClick={() => setIsModalOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleCreateSubmit} className="ward-form">
                <div className="form-group">
                  <label>Select Medicine</label>
                  <select value={formData.medicineId} onChange={handleMedicineChange} required>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.dosage || "Std"})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Select Batch</label>
                  <select value={formData.batchId} onChange={(e) => setFormData({ ...formData, batchId: e.target.value })} required>
                    {batches.length === 0 ? (
                      <option value="">No active batches available</option>
                    ) : (
                      batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.batchNumber} (Avail: {b.quantity} units, Exp: {b.expiryDate})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>From Storage Location</label>
                    <select value={formData.fromLocation} onChange={(e) => setFormData({ ...formData, fromLocation: e.target.value })}>
                      {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>To Destination Ward</label>
                    <select value={formData.toLocation} onChange={(e) => setFormData({ ...formData, toLocation: e.target.value })}>
                      {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Transfer Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Clinical Urgency</label>
                    <select value={formData.urgency} onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}>
                      <option value="ROUTINE">Routine Stock Refill</option>
                      <option value="URGENT">Urgent Care Demand</option>
                      <option value="STAT_EMERGENCY">🚨 STAT Emergency</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Clinical Rationale / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. ICU ventilator patient critical reserve"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn-submit">Submit Requisition</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </LayoutComponent>
  );
}
