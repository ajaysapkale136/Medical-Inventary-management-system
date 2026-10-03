import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "./DashboardLayout";
import { apiRequest, downloadFile } from "../../lib/api";
import "./AdminAuditTrail.css";

export default function AdminAuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterEntity, setFilterEntity] = useState("ALL");
  const [searchActor, setSearchActor] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      let query = "/api/admin/audit-logs?limit=200";
      if (filterAction !== "ALL") query += `&action=${encodeURIComponent(filterAction)}`;
      if (filterEntity !== "ALL") query += `&entityName=${encodeURIComponent(filterEntity)}`;
      if (searchActor.trim()) query += `&actor=${encodeURIComponent(searchActor.trim())}`;

      const data = await apiRequest(query);
      setLogs(data || []);
    } catch (err) {
      setError(err.message || "Failed to load GxP audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterEntity]);

  const stats = useMemo(() => {
    const stockEvents = logs.filter(l => l.action?.includes("STOCK") || l.action?.includes("TRANSFER")).length;
    const poEvents = logs.filter(l => l.action?.includes("PURCHASE")).length;
    const authEvents = logs.filter(l => l.action?.includes("LOGIN") || l.action?.includes("USER")).length;
    return { total: logs.length, stockEvents, poEvents, authEvents };
  }, [logs]);

  const getActionBadgeClass = (action) => {
    if (!action) return "badge-default";
    if (action.includes("DELETE") || action.includes("FAILURE") || action.includes("REJECT")) return "badge-danger";
    if (action.includes("ADJUST") || action.includes("DISPATCH") || action.includes("UPDATE")) return "badge-warning";
    if (action.includes("SUCCESS") || action.includes("RECEIVE") || action.includes("APPROVE")) return "badge-success";
    return "badge-info";
  };

  return (
    <DashboardLayout title="GxP Audit Trail">
      <div className="audit-trail-container">
        
        {/* Header */}
        <div className="audit-header">
          <div>
            <div className="breadcrumb-nav">Dashboard › Compliance › GxP Audit Trail</div>
            <h1>Tamper-Proof Audit Trail (21 CFR Part 11)</h1>
            <p>Immutable forensic record of all medicine stock transactions, user actions, transfers, and system events.</p>
          </div>
          <button
            className="audit-export-btn"
            onClick={() => downloadFile("/api/admin/audit-logs/export", "Medistock_GxP_Audit_Trail.csv")}
          >
            📥 Export Regulatory CSV
          </button>
        </div>

        {error && <div className="audit-error-banner">⚠️ {error}</div>}

        {/* Telemetry Summary Cards */}
        <div className="audit-stats-grid">
          <div className="audit-stat-card">
            <span>Total Logged Events</span>
            <strong>{stats.total}</strong>
            <small>Immutable records</small>
          </div>
          <div className="audit-stat-card">
            <span>Stock & Ward Transfers</span>
            <strong style={{ color: "#38bdf8" }}>{stats.stockEvents}</strong>
            <small>Inventory movements</small>
          </div>
          <div className="audit-stat-card">
            <span>Procurement & POs</span>
            <strong style={{ color: "#f59e0b" }}>{stats.poEvents}</strong>
            <small>Supplier orders</small>
          </div>
          <div className="audit-stat-card">
            <span>Auth & Access Audits</span>
            <strong style={{ color: "#34d399" }}>{stats.authEvents}</strong>
            <small>Security telemetry</small>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="audit-filters-bar">
          <div className="filter-input-wrap">
            <label>Search Actor</label>
            <input
              type="text"
              placeholder="e.g. admin@medistock.com"
              value={searchActor}
              onChange={(e) => setSearchActor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
            />
          </div>

          <div className="filter-input-wrap">
            <label>Action Type</label>
            <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="ALL">All Actions</option>
              <option value="STOCK_ADJUSTMENT">Stock Adjustment</option>
              <option value="STOCK_IN">Stock In</option>
              <option value="STOCK_OUT">Stock Out</option>
              <option value="WARD_TRANSFER_REQUEST">Ward Transfer Request</option>
              <option value="WARD_TRANSFER_APPROVE">Ward Transfer Approve</option>
              <option value="WARD_TRANSFER_DISPATCH">Ward Transfer Dispatch</option>
              <option value="WARD_TRANSFER_RECEIVE">Ward Transfer Receive</option>
              <option value="PURCHASE_ORDER_CREATE">Purchase Order Create</option>
              <option value="AUTO_REORDER_TRIGGER">Auto-Reorder Trigger</option>
              <option value="LOGIN_SUCCESS">Login Success</option>
            </select>
          </div>

          <div className="filter-input-wrap">
            <label>Entity</label>
            <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)}>
              <option value="ALL">All Entities</option>
              <option value="Inventory">Inventory</option>
              <option value="StockTransfer">StockTransfer</option>
              <option value="PurchaseOrder">PurchaseOrder</option>
              <option value="User">User</option>
            </select>
          </div>

          <div className="audit-action-btns">
            <button className="audit-btn-primary" onClick={fetchLogs}>Filter</button>
            <button
              className="audit-btn-secondary"
              onClick={() => { setFilterAction("ALL"); setFilterEntity("ALL"); setSearchActor(""); }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="audit-table-card">
          <div className="table-responsive">
            <table className="audit-data-table">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>IP Address</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Reason / Details</th>
                  <th>Inspection</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "28px" }}>Loading regulatory audit trail...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: "center", padding: "28px", color: "#94a3b8" }}>No audit log records match the selected criteria.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: "#cbd5e1", whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                        {log.timestamp ? log.timestamp.replace("T", " ").substring(0, 19) : "N/A"}
                      </td>
                      <td><strong style={{ color: "#f8fafc" }}>{log.actor}</strong></td>
                      <td>
                        <span className="role-pill">{log.role || "SYSTEM"}</span>
                      </td>
                      <td style={{ color: "#94a3b8", fontSize: "0.82rem" }}>{log.ipAddress || "127.0.0.1"}</td>
                      <td>
                        <span className={`audit-badge ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="entity-tag">{log.entityName}{log.entityId ? ` #${log.entityId}` : ""}</span>
                      </td>
                      <td style={{ maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#cbd5e1" }}>
                        {log.reason || log.newValue || "System recorded event"}
                      </td>
                      <td>
                        <button
                          className="audit-inspect-btn"
                          onClick={() => setSelectedLog(log)}
                        >
                          👁 Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspection Diff Modal */}
        {selectedLog && (
          <div className="audit-modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="audit-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="audit-modal-header">
                <div>
                  <span className="audit-modal-subtitle">Log Entry #{selectedLog.id}</span>
                  <h3>Audit Event Details</h3>
                </div>
                <button className="audit-close-btn" onClick={() => setSelectedLog(null)}>✕</button>
              </div>

              <div className="audit-modal-body">
                <div className="audit-detail-grid">
                  <div>
                    <label>Timestamp</label>
                    <span>{selectedLog.timestamp}</span>
                  </div>
                  <div>
                    <label>Actor & Role</label>
                    <span>{selectedLog.actor} ({selectedLog.role})</span>
                  </div>
                  <div>
                    <label>Action</label>
                    <span className={`audit-badge ${getActionBadgeClass(selectedLog.action)}`}>{selectedLog.action}</span>
                  </div>
                  <div>
                    <label>Target Entity</label>
                    <span>{selectedLog.entityName} #{selectedLog.entityId || "N/A"}</span>
                  </div>
                </div>

                <div className="audit-diff-section">
                  <div className="diff-box">
                    <label>Previous Value (Before)</label>
                    <pre>{selectedLog.oldValue || "[None / Initial State]"}</pre>
                  </div>
                  <div className="diff-box new">
                    <label>Updated Value (After)</label>
                    <pre>{selectedLog.newValue || "[No modification recorded]"}</pre>
                  </div>
                </div>

                {selectedLog.reason && (
                  <div className="audit-reason-box">
                    <label>Regulatory Justification / Rationale:</label>
                    <p>{selectedLog.reason}</p>
                  </div>
                )}
              </div>

              <div className="audit-modal-footer">
                <button className="audit-btn-secondary" onClick={() => setSelectedLog(null)}>Close</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
