import React, { useState, useEffect, useMemo } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest } from "../../lib/api";
import "./StaffMedicines.css";

function StaffMedicines() {
  const API_BASE_URL = "/api/staff/medicines";
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [supplier, setSupplier] = useState("All");
  const [stockStatus, setStockStatus] = useState("All");

  // Selection & Pagination State
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  // --- LIVE DATABASE API FETCH ---
  const fetchMedicines = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(API_BASE_URL);
      setMedicines(data || []);
      setSelectedMedicine((data && data[0]) || null);
    } catch (apiError) {
      setError(apiError.message || "Failed to load staff medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Filter logic
  const filteredMedicines = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.medicine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.batchNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = category === "All" || m.category === category;
      const matchSupplier = supplier === "All" || m.supplier === supplier;
      const matchStockStatus =
        stockStatus === "All" || m.status === stockStatus;

      return matchSearch && matchCategory && matchSupplier && matchStockStatus;
    });
  }, [medicines, searchQuery, category, supplier, stockStatus]);

  const categories = [...new Set(medicines.map((m) => m.category).filter(Boolean))];
  const suppliers = [...new Set(medicines.map((m) => m.supplier).filter(Boolean))];

  const resetFilters = () => {
    setSearchQuery("");
    setCategory("All");
    setStatus("All");
    setSupplier("All");
    setStockStatus("All");
  };

  const [detailsModal, setDetailsModal] = useState({ isOpen: false, item: null });

  const handleViewDetails = (m) => {
    setDetailsModal({ isOpen: true, item: m });
  };

  return (
    <StaffLayout title="Medicines">
      <div className="staff-medicines-page">
        {/* HEADER */}
        <div className="staff-header">
          <div>
            <div className="breadcrumb">Dashboard › Medicines</div>
            <h1>Medicines Catalog</h1>
            <p>Search and inspect registered medicines, stock levels, and batch information.</p>
          </div>
        </div>
        {error && <div className="page-loading">{error}</div>}

        {/* 3 SUMMARY CARDS */}
        <div className="staff-summary-grid">
          <div className="staff-summary-card">
            <div className="summary-icon total-icon">💊</div>
            <div>
              <span>Total Medicines</span>
              <strong>{medicines.length}</strong>
            </div>
          </div>

          <div className="staff-summary-card">
            <div className="summary-icon low-icon">⚠️</div>
            <div>
              <span>Low Stock</span>
              <strong>{medicines.filter((m) => m.status === "LOW STOCK").length}</strong>
            </div>
          </div>

          <div className="staff-summary-card">
            <div className="summary-icon expiry-icon">⏳</div>
            <div>
              <span>Expiring Soon</span>
              <strong>{medicines.filter((m) => String(m.status).includes("EXPIR")).length}</strong>
            </div>
          </div>
        </div>

        {/* FILTER PANEL */}
        <div className="staff-filter-panel">
          <input
            type="text"
            placeholder="Search medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">Category ▼</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">Status ▼</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <select value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="All">Supplier ▼</option>
            {suppliers.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select
            value={stockStatus}
            onChange={(e) => setStockStatus(e.target.value)}
          >
            <option value="All">Stock Status ▼</option>
            <option value="IN STOCK">IN STOCK</option>
            <option value="LOW STOCK">LOW STOCK</option>
            <option value="OUT OF STOCK">OUT OF STOCK</option>
          </select>

          <button className="filter-btn search-btn" onClick={() => fetchMedicines()}>Search</button>
          <button className="filter-btn reset-btn" onClick={resetFilters}>
            Reset
          </button>
        </div>

        {/* MEDICINE LIST TABLE */}
        <div className="staff-table-card">
          <div className="table-top-bar">
            <h2>Medicine List</h2>
            <span>{filteredMedicines.length} Records</span>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Medicine</th>
                  <th>Category</th>
                  <th>Batch No</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                      Loading medicines...
                    </td>
                  </tr>
                ) : filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                      No medicines match your search.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m, index) => {
                    const isActive = selectedMedicine && selectedMedicine.id === m.id;
                    return (
                      <tr
                        key={m.id}
                        className={isActive ? "active-row" : ""}
                        onClick={() => setSelectedMedicine(m)}
                      >
                        <td style={{ color: "#94A3B8" }}>{index + 1}</td>
                        <td>
                          <strong style={{ color: "#ffffff" }}>{m.medicine}</strong>
                        </td>
                        <td>{m.category}</td>
                        <td>{m.batchNo}</td>
                        <td>{m.supplier}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM CARD: SELECTED MEDICINE DETAILS */}
        {selectedMedicine && (
          <div className="medicine-details-panel">
            <div className="details-header">Medicine Details</div>
            <div className="details-grid">
              <div className="detail-item">
                <span>Quantity</span>
                <strong>{selectedMedicine.quantity}</strong>
              </div>

              <div className="detail-item">
                <span>Expiry Date</span>
                <strong>{selectedMedicine.expiryDate}</strong>
              </div>

              <div className="detail-item">
                <span>Status</span>
                <span
                  className={`status-pill ${selectedMedicine.status
                    .toLowerCase()
                    .replaceAll(" ", "-")}`}
                >
                  {selectedMedicine.status}
                </span>
              </div>

              <div className="detail-item">
                <span>Price</span>
                <strong>{selectedMedicine.price}</strong>
              </div>

              <div className="detail-item">
                <span>Batch</span>
                <strong>{selectedMedicine.batchNo}</strong>
              </div>

              <div>
                <button
                  className="view-details-btn"
                  onClick={() => handleViewDetails(selectedMedicine)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        <div className="pagination-bar">
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ◀
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
            className={`page-btn ${currentPage === 25 ? "active" : ""}`}
            onClick={() => setCurrentPage(25)}
          >
            25
          </button>
          <button
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(25, p + 1))}
          >
            ▶
          </button>
        </div>

        {/* MEDICINE DETAILS MODAL */}
        {detailsModal.isOpen && detailsModal.item && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }} onClick={() => setDetailsModal({ isOpen: false, item: null })}>
            <div className="modal-content" style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
              padding: '1.5rem', width: '520px', maxWidth: '90%', color: '#fff'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#00B4D8' }}>?? {detailsModal.item.medicine}</h3>
                <button onClick={() => setDetailsModal({ isOpen: false, item: null })} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>?</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '1.2rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#94A3B8' }}>Category:</span><br /><strong style={{ color: '#fff' }}>{detailsModal.item.category || '-'}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Batch No:</span><br /><strong style={{ color: '#fff' }}>{detailsModal.item.batchNo || '-'}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Supplier:</span><br /><strong style={{ color: '#fff' }}>{detailsModal.item.supplier || '-'}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Current Quantity:</span><br /><strong style={{ color: '#22c55e' }}>{detailsModal.item.quantity || detailsModal.item.qty || 0} units</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Unit Price:</span><br /><strong style={{ color: '#fff' }}>?{detailsModal.item.price || '0.00'}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Expiry Date:</span><br /><strong style={{ color: '#f43f5e' }}>{detailsModal.item.expiryDate || detailsModal.item.expiry || '-'}</strong></div>
                <div><span style={{ color: '#94A3B8' }}>Stock Status:</span><br /><span className={status-pill }>{detailsModal.item.status}</span></div>
                <div><span style={{ color: '#94A3B8' }}>Reorder Level:</span><br /><strong style={{ color: '#fff' }}>{detailsModal.item.reorderLevel || 10} units</strong></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setDetailsModal({ isOpen: false, item: null })}
                  style={{ padding: '8px 20px', background: '#00B4D8', border: 'none', borderRadius: '6px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </StaffLayout>
  );
}

export default StaffMedicines;
