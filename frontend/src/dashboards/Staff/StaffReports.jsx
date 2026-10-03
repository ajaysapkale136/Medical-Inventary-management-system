import React, { useState, useEffect, useMemo } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest, downloadFile } from "../../lib/api";
import "./StaffReports.css";

const API_BASE_URL = "/api/staff/reports"; // Ready for backend database integration

function StaffReports() {
  const [reportsList, setReportsList] = useState([]);
  const [summary, setSummary] = useState({ totalReports: 0, thisMonth: 0, recentReport: "" });
  const [reportSummary, setReportSummary] = useState({ totalMedicines: 0, totalStock: 0, lowStock: 0, expiringSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Active Report Type State
  const [activeReportType, setActiveReportType] = useState("Inventory");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [supplierFilter, setSupplierFilter] = useState("All");
  const [medicineFilter, setMedicineFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // --- DATABASE & BACKEND CONNECTION ---
  useEffect(() => {
    fetchReportsData();
  }, []);

  const fetchReportsData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(API_BASE_URL);
      setReportsList(data.reports || []);
      setSummary({ totalReports: 0, thisMonth: 0, recentReport: "", ...(data.summary || {}) });
      setReportSummary({ totalMedicines: 0, totalStock: 0, lowStock: 0, expiringSoon: 0, ...(data.reportSummary || {}) });
    } catch (err) {
      setError(err.message || "Failed to load reports from database");
    } finally {
      setLoading(false);
    }
  };

  // Filter Computation
  const filteredReports = useMemo(() => {
    return reportsList.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = activeReportType === "All" || item.type.toLowerCase() === activeReportType.toLowerCase();
      return matchSearch && matchType;
    });
  }, [reportsList, searchQuery, activeReportType]);

  const handleGenerateReport = async () => {
    const data = await apiRequest(`${API_BASE_URL}/generate`, {
      method: "POST",
      body: {
        reportType: activeReportType,
        dateFrom,
        dateTo,
        category: categoryFilter,
        supplier: supplierFilter,
        medicine: medicineFilter,
        status: statusFilter,
      },
    });
    setFeedbackMsg(data.message || `${activeReportType} report generated successfully`);
    setTimeout(() => setFeedbackMsg(""), 4000);
    await fetchReportsData();
  };

  const handleResetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCategoryFilter("All");
    setSupplierFilter("All");
    setMedicineFilter("All");
    setStatusFilter("All");
    setSearchQuery("");
  };

  const handleQuickExport = async (exportType) => {
    if (exportType === "Print") {
      window.print();
      return;
    }
    const ext = exportType.toLowerCase() === "excel" ? "xlsx" : "pdf";
    downloadFile("/api/reports/inventory-summary/download", `Staff_Report_${Date.now()}.${ext}`);
    setFeedbackMsg(`${exportType} report downloaded.`);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  return (
    <StaffLayout title="Reports">
      <div className="staff-reports-page">
        
        {/* HEADER */}
        <div className="staff-rep-header">
          <div>
            <div className="staff-rep-breadcrumb">Dashboard › Reports</div>
            <h1>Reports</h1>
          </div>
          <input
            type="text"
            className="rep-top-search"
            placeholder="Search Reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

        {/* 3 SUMMARY CARDS */}
        <div className="staff-rep-summary-grid">
          <div className="staff-rep-summary-card">
            <div className="rep-icon icon-total">📊</div>
            <div>
              <span>Total Reports</span>
              <strong>{summary.totalReports}</strong>
            </div>
          </div>

          <div className="staff-rep-summary-card">
            <div className="rep-icon icon-month">📅</div>
            <div>
              <span>This Month</span>
              <strong>{summary.thisMonth}</strong>
            </div>
          </div>

          <div className="staff-rep-summary-card">
            <div className="rep-icon icon-recent">📋</div>
            <div>
              <span>Recent Report</span>
              <strong>{summary.recentReport}</strong>
            </div>
          </div>
        </div>

        {/* REPORT TYPE PANEL */}
        <div className="staff-rep-type-panel">
          <div className="panel-title">REPORT TYPE</div>
          <div className="rep-type-btn-group">
            {["Inventory", "Stock", "Expiry", "Purchase", "Supplier", "My Activity"].map((type) => (
              <button
                key={type}
                className={`rep-type-btn ${activeReportType === type ? "active" : ""}`}
                onClick={() => setActiveReportType(type)}
              >
                [{type === "Stock" ? "Stock Movement" : type === "Purchase" ? "Purchases" : type}]
              </button>
            ))}
          </div>
        </div>

        {/* FILTERS PANEL */}
        <div className="staff-rep-filters-panel">
          <div className="panel-title">FILTERS</div>
          
          <div className="rep-filter-grid">
            <div className="filter-input-group">
              <label>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-input-group">
              <label>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="filter-input-group">
              <label>Category</label>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="All">Category ▼</option>
                <option value="Tablets">Tablets</option>
                <option value="Capsules">Capsules</option>
                <option value="Syrups">Syrups</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label>Supplier</label>
              <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}>
                <option value="All">Supplier ▼</option>
                <option value="ABC Pharma">ABC Pharma</option>
                <option value="MedLife">MedLife</option>
                <option value="HealthCo">HealthCo</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label>Medicine</label>
              <select value={medicineFilter} onChange={(e) => setMedicineFilter(e.target.value)}>
                <option value="All">Medicine ▼</option>
                <option value="Paracetamol">Paracetamol</option>
                <option value="Amoxicillin">Amoxicillin</option>
                <option value="Cetirizine">Cetirizine</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label>Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="All">Status ▼</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          <div className="rep-filter-actions">
            <button className="generate-btn" onClick={handleGenerateReport}>
              [Generate Report]
            </button>
            <button className="reset-btn" onClick={handleResetFilters}>
              [Reset]
            </button>
          </div>
        </div>

        {/* MIDDLE SPLIT SECTION: REPORT SUMMARY & QUICK EXPORT */}
        <div className="staff-rep-split-grid">
          
          {/* REPORT SUMMARY */}
          <div className="rep-split-card">
            <h3>REPORT SUMMARY</h3>
            <div className="rep-stat-row">
              <span>Total Medicines</span>
              <strong>{reportSummary.totalMedicines}</strong>
            </div>
            <div className="rep-stat-row">
              <span>Total Stock</span>
              <strong>{reportSummary.totalStock}</strong>
            </div>
            <div className="rep-stat-row">
              <span>Low Stock</span>
              <strong style={{ color: "#f59e0b" }}>{reportSummary.lowStock}</strong>
            </div>
            <div className="rep-stat-row">
              <span>Expiring Soon</span>
              <strong style={{ color: "#f43f5e" }}>{reportSummary.expiringSoon}</strong>
            </div>
          </div>

          {/* QUICK EXPORT */}
          <div className="rep-split-card">
            <h3>QUICK EXPORT</h3>
            <div className="quick-export-list">
              <button className="export-action-btn" onClick={() => handleQuickExport("PDF")}>
                📄 Download PDF
              </button>
              <button className="export-action-btn" onClick={() => handleQuickExport("Excel")}>
                📊 Download Excel
              </button>
              <button className="export-action-btn" onClick={() => handleQuickExport("Print")}>
                🖨️ Print Report
              </button>
            </div>
          </div>

        </div>

        {/* GENERATED REPORTS TABLE */}
        <div className="staff-rep-table-card">
          <div className="staff-rep-table-header">
            <h2>GENERATED REPORTS</h2>
          </div>
          <div className="staff-rep-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Type</th>
                  <th>Generated</th>
                  <th>Format</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>Loading database records...</td></tr>
                ) : filteredReports.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: "center", padding: "30px" }}>No reports match the filter criteria.</td></tr>
                ) : (
                  filteredReports.map((item) => (
                    <tr key={item.id}>
                      <td><strong style={{ color: "#ffffff" }}>{item.name}</strong></td>
                      <td>{item.type}</td>
                      <td>{item.generated}</td>
                      <td>
                        <span className={`format-badge badge-${item.format.toLowerCase()}`}>
                          {item.format}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="pagination-bar">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ◄
          </button>
          <button
            className={`page-btn ${currentPage === 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(1)}
          >
            1
          </button>
          <button
            className={`page-btn ${currentPage === 2 ? "active" : ""}`}
            onClick={() => setCurrentPage(2)}
          >
            2
          </button>
          <button
            className={`page-btn ${currentPage === 3 ? "active" : ""}`}
            onClick={() => setCurrentPage(3)}
          >
            3
          </button>
          <span style={{ color: "#94A3B8", padding: "0 4px" }}>...</span>
          <button
            className={`page-btn ${currentPage === 10 ? "active" : ""}`}
            onClick={() => setCurrentPage(10)}
          >
            10
          </button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(10, p + 1))}
          >
            ►
          </button>
        </div>

      </div>
    </StaffLayout>
  );
}

export default StaffReports;
