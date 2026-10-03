import React, { useState, useEffect, useMemo } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest } from "../../lib/api";
import "./StaffExpiry.css";

const API_BASE_URL = "/api/staff/expiry"; // Backend integration API endpoint

function StaffExpiry() {
  const [expiryList, setExpiryList] = useState([]);
  const [summary, setSummary] = useState({ totalBatches: 0, nearExpiry: 0, expired: 0, safeStock: 0 });
  const [expiredList, setExpiredList] = useState([]);
  const [nearExpiryList, setNearExpiryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [rangeFilter, setRangeFilter] = useState("All");

  // --- DATABASE & BACKEND CONNECTION ---
  useEffect(() => {
    fetchExpiryData();
  }, []);

  const fetchExpiryData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(API_BASE_URL);
      setExpiryList(data.medicines || []);
      setSummary({ totalBatches: 0, nearExpiry: 0, expired: 0, safeStock: 0, ...(data.summary || {}) });
      setExpiredList(data.expired || []);
      setNearExpiryList(data.nearExpiry || []);
    } catch (err) {
      setError(err.message || "Failed to fetch database expiry records");
    } finally {
      setLoading(false);
    }
  };

  // Filter Computation
  const filteredMedicines = useMemo(() => {
    return expiryList.filter((item) => {
      const matchSearch = item.medicine.toLowerCase().includes(searchQuery.toLowerCase()) || item.batch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "All" || item.status.toLowerCase() === statusFilter.toLowerCase();
      const matchCategory = categoryFilter === "All" || item.category === categoryFilter;
      
      let matchRange = true;
      if (rangeFilter === "<30") matchRange = typeof item.days === "number" && item.days <= 30;
      if (rangeFilter === "expired") matchRange = item.status === "Exp";
      if (rangeFilter === "safe") matchRange = item.status === "Safe";

      return matchSearch && matchStatus && matchCategory && matchRange;
    });
  }, [expiryList, searchQuery, statusFilter, categoryFilter, rangeFilter]);

  const handleQuickAction = async (action) => {
    await fetchExpiryData();
    setFeedbackMsg(`${action} refreshed from database.`);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  return (
    <StaffLayout title="Expiry Tracking">
      <div className="staff-expiry-page">
        
        {/* HEADER */}
        <div className="staff-exp-header">
          <div>
            <div className="staff-exp-breadcrumb">Dashboard › Expiry Tracking</div>
            <h1>Expiry & Batch Control</h1>
            <p>Monitor expired batches, near-expiry alerts, and manage safe stock.</p>
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
            marginBottom: "1rem",
            fontWeight: "500"
          }}>
            ? {feedbackMsg}
          </div>
        )}

        {/* 4 SUMMARY CARDS */}
        <div className="staff-exp-summary-grid">
          <div className="staff-exp-summary-card">
            <div className="staff-exp-icon icon-batches">📦</div>
            <div>
              <span>Total Batches</span>
              <strong>{summary.totalBatches}</strong>
              <small>Batches</small>
            </div>
          </div>

          <div className="staff-exp-summary-card">
            <div className="staff-exp-icon icon-near">⚠️</div>
            <div>
              <span>Near Expiry</span>
              <strong>{summary.nearExpiry}</strong>
              <small>≤ 30 Days</small>
            </div>
          </div>

          <div className="staff-exp-summary-card">
            <div className="staff-exp-icon icon-expired">🚫</div>
            <div>
              <span>Expired</span>
              <strong>{summary.expired}</strong>
              <small>Expired</small>
            </div>
          </div>

          <div className="staff-exp-summary-card">
            <div className="staff-exp-icon icon-safe">✅</div>
            <div>
              <span>Safe Stock</span>
              <strong>{summary.safeStock}</strong>
              <small>&gt; 30 Days</small>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER PANEL */}
        <div className="staff-exp-filter-panel">
          <div className="filter-title">SEARCH &amp; FILTER</div>
          <div className="filter-controls">
            <input
              type="text"
              placeholder="Search medicine / batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">Status ▼</option>
              <option value="Near">Near</option>
              <option value="Exp">Exp</option>
              <option value="Safe">Safe</option>
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">Category ▼</option>
              <option value="Tablets">Tablets</option>
              <option value="Capsules">Capsules</option>
            </select>

            <select value={rangeFilter} onChange={(e) => setRangeFilter(e.target.value)}>
              <option value="All">Expiry Range ▼</option>
              <option value="<30">≤ 30 Days</option>
              <option value="expired">Expired Only</option>
              <option value="safe">&gt; 30 Days</option>
            </select>

            <button className="exp-filter-btn" onClick={fetchExpiryData}>
              [Filter]
            </button>
          </div>
        </div>

        {/* EXPIRY MEDICINES TABLE */}
        <div className="staff-exp-card">
          <div className="staff-exp-card-header">
            <h2>EXPIRY MEDICINES</h2>
          </div>
          <div className="staff-exp-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Medicine</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Days</th>
                  <th>Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>Loading database records...</td></tr>
                ) : filteredMedicines.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px" }}>No medicines match filter criteria.</td></tr>
                ) : (
                  filteredMedicines.map((item) => (
                    <tr key={item.id}>
                      <td><strong style={{ color: "#ffffff" }}>{item.medicine}</strong></td>
                      <td>{item.batch}</td>
                      <td>{item.expiry}</td>
                      <td>{item.days}</td>
                      <td>{item.qty}</td>
                      <td>
                        <span className="status-badge">
                          <span className={`dot ${item.status === 'Safe' ? 'dot-safe' : item.status === 'Near' ? 'dot-near' : 'dot-exp'}`}></span>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOWER SPLIT SECTION: EXPIRED MEDICINES & NEAR EXPIRY */}
        <div className="staff-exp-split-grid">
          
          {/* EXPIRED MEDICINES */}
          <div className="split-card">
            <div className="split-card-header">
              <h3><span className="split-dot dot-red"></span> EXPIRED MEDICINES</h3>
            </div>
            {expiredList.map((exp, idx) => (
              <div className="exp-row" key={idx}>
                <span>{exp.medicine}</span>
                <span className="text-danger">{exp.qty}</span>
              </div>
            ))}
            <button className="view-all-btn" onClick={() => handleQuickAction("View-All-Expired")}>
              [View All]
            </button>
          </div>

          {/* NEAR EXPIRY */}
          <div className="split-card">
            <div className="split-card-header">
              <h3><span className="split-dot dot-orange"></span> NEAR EXPIRY</h3>
            </div>
            {nearExpiryList.map((near, idx) => (
              <div className="exp-row" key={idx}>
                <span>{near.medicine}</span>
                <span className="text-warning">{near.qty}</span>
              </div>
            ))}
            <button className="view-all-btn" onClick={() => handleQuickAction("View-All-Near-Expiry")}>
              [View All]
            </button>
          </div>

        </div>

        {/* QUICK ACTIONS BAR */}
        <div className="staff-exp-quick-actions">
          <span className="qa-label">Quick Actions:</span>
          <button className="qa-action-btn" onClick={() => handleQuickAction("View-Details")}>[View Details]</button>
          <button className="qa-action-btn" onClick={() => handleQuickAction("Notify")}>[Notify]</button>
          <button className="qa-action-btn" onClick={() => handleQuickAction("View-Report")}>[View Report]</button>
        </div>

      </div>
    </StaffLayout>
  );
}

export default StaffExpiry;
