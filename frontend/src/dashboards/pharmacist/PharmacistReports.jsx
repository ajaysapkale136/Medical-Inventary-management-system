import React, { useEffect, useState } from "react";
import PharmacyLayout from "./PharmacyLayout"; // Wrapped in global layout
import { apiRequest, downloadFile } from "../../lib/api";
import "./PharmacistReports.css";

function PharmacistReports() {
  const [reportType, setReportType] = useState("inventory");
  const [reportFormat, setReportFormat] = useState("PDF");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState({ inventory: 0, expiry: 0, purchase: 0, total: 0 });
  const [toastMsg, setToastMsg] = useState("");
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setError("");
      const data = await apiRequest("/api/staff/reports");
      const rows = data.reports || [];
      setReports(rows.map((item) => ({
        ...item,
        description: `${item.type} report generated from database`,
        date: item.generated,
      })));
      setSummary({
        inventory: rows.filter((item) => item.type.toLowerCase().includes("stock") || item.type.toLowerCase().includes("inventory")).length,
        expiry: rows.filter((item) => item.type.toLowerCase().includes("expiry")).length,
        purchase: rows.filter((item) => item.type.toLowerCase().includes("purchase")).length,
        total: rows.length,
      });
    } catch (err) {
      setError(err.message || "Failed to load reports");
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleGenerate = async () => {
    try {
      const data = await apiRequest("/api/staff/reports/generate", {
        method: "POST",
        body: { reportType, fromDate, toDate, format: reportFormat },
      });
      setToastMsg(data.message || `${reportType} report generated successfully.`);
      setTimeout(() => setToastMsg(""), 4000);
      await loadReports();
    } catch (err) {
      setError("Failed to generate report");
    }
  };

  const handleDownload = async (report) => {
    const format = String(report.format || "PDF").toUpperCase();
    const filename = `${(report.name || "Medical_Report").replace(/\s+/g, "_")}.${format.toLowerCase() === "csv" ? "csv" : "pdf"}`;
    let endpoint = "/api/reports/inventory-summary/download";
    const t = (report.type || "").toLowerCase();
    if (t.includes("expiry")) endpoint = "/api/reports/expiring-medicines/download";
    else if (t.includes("purchase")) endpoint = "/api/reports/purchase-orders/download";
    else if (t.includes("movement") || t.includes("stock")) endpoint = "/api/reports/stock-movement/download";
    
    await downloadFile(`${endpoint}?format=${format}`, filename);
  };

  return (
    <PharmacyLayout title="Reports">
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
      <div className="pharmacist-reports">

        {/* HEADER */}
        <div className="reports-header">
          <div>
            <div className="reports-breadcrumb">Dashboard › Reports</div>
            <h1>Reports Engine</h1>
            <p>Generate, download, and manage medical inventory reports.</p>
          </div>
          <button className="generate-top-btn" onClick={handleGenerate}>
            + Generate Report
          </button>
        </div>
        {error && <div className="page-loading">{error}</div>}

        {/* REPORT SUMMARY */}
        <div className="report-summary">
          <div className="report-summary-card">
            <span>Inventory Reports</span>
            <strong>{summary.inventory}</strong>
            <small>Generated reports</small>
          </div>
          <div className="report-summary-card">
            <span>Expiry Reports</span>
            <strong>{summary.expiry}</strong>
            <small>Expiry analysis</small>
          </div>
          <div className="report-summary-card">
            <span>Purchase Reports</span>
            <strong>{summary.purchase}</strong>
            <small>Purchase records</small>
          </div>
          <div className="report-summary-card">
            <span>Total Reports</span>
            <strong>{summary.total}</strong>
            <small>This month</small>
          </div>
        </div>

        {/* REPORT GENERATOR */}
        <section className="report-generator">
          <div className="section-title">
            <div>
              <h2>Generate Report</h2>
              <p>Select the report type and date range to pull data.</p>
            </div>
          </div>

          <div className="generator-grid">
            <div className="form-group">
              <label>Report Type</label>
              <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="inventory">Inventory Report</option>
                <option value="expiry">Expiry Report</option>
                <option value="low-stock">Low Stock Report</option>
                <option value="purchase">Purchase Report</option>
                <option value="supplier">Supplier Report</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Format</label>
              <select value={reportFormat} onChange={(e) => setReportFormat(e.target.value)}>
                <option value="PDF">PDF Document (.pdf)</option>
                <option value="CSV">CSV Export (.csv)</option>
              </select>
            </div>
          </div>

          <button className="generate-btn" onClick={handleGenerate}>
            Generate Report
          </button>
        </section>

        {/* REPORT TYPES */}
        <section className="report-types">
          <h2>Available Reports</h2>
          <div className="report-type-grid">
            <div className="report-type-card">
              <div className="report-icon">📦</div>
              <h3>Inventory Report</h3>
              <p>View current stock, available quantity and inventory status.</p>
              <button onClick={() => setReportType("inventory")}>Select</button>
            </div>
            <div className="report-type-card">
              <div className="report-icon">⏰</div>
              <h3>Expiry Report</h3>
              <p>Identify expired and near-expiry medicines.</p>
              <button onClick={() => setReportType("expiry")}>Select</button>
            </div>
            <div className="report-type-card">
              <div className="report-icon">📉</div>
              <h3>Low Stock Report</h3>
              <p>Identify medicines requiring replenishment.</p>
              <button onClick={() => setReportType("low-stock")}>Select</button>
            </div>
            <div className="report-type-card">
              <div className="report-icon">🛒</div>
              <h3>Purchase Report</h3>
              <p>View purchase orders and purchase history.</p>
              <button onClick={() => setReportType("purchase")}>Select</button>
            </div>
            <div className="report-type-card">
              <div className="report-icon">🏭</div>
              <h3>Supplier Report</h3>
              <p>Review suppliers and purchasing activity.</p>
              <button onClick={() => setReportType("supplier")}>Select</button>
            </div>
          </div>
        </section>

        {/* REPORT HISTORY */}
        <section className="report-history">
          <div className="history-header">
            <div>
              <h2>Recent Reports</h2>
              <p>Previously generated reports available for download.</p>
            </div>
          </div>
          
          <div className="reports-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Report Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Generated Date</th>
                  <th>Format</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td style={{color: '#94A3B8'}}>{report.id}</td>
                    <td><strong style={{color: '#ffffff'}}>{report.name}</strong></td>
                    <td>{report.description}</td>
                    <td><span className="report-type">{report.type}</span></td>
                    <td>{report.date}</td>
                    <td>{report.format}</td>
                    <td>
                      <button className="download-btn" onClick={() => handleDownload(report)}>
                        ↓ Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </PharmacyLayout>
  );
}

export default PharmacistReports;
