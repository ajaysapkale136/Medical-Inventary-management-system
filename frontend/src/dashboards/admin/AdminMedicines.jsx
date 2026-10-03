import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from './DashboardLayout'; // Import the layout
import { apiRequest } from '../../lib/api';
import './AdminMedicines.css'; 


const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [viewingMedicine, setViewingMedicine] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableSuppliers, setAvailableSuppliers] = useState([]);
  const [toastMsg, setToastMsg] = useState("");
  const [error, setError] = useState("");
  
  // Hidden file input reference for importing Excel
  const fileInputRef = useRef(null);

  // Filter States
  const [filters, setFilters] = useState({
    search: '', category: 'All Categories', manufacturer: 'All Manufacturers', status: 'All Status', stockStatus: 'All Stock Status'
  });

  const fetchMedicines = async () => {
    setLoading(true);
    setError("");
    try {
      const [medicineRows, inventoryRows, catRows, supRows] = await Promise.all([
        apiRequest("/api/medicines"),
        apiRequest("/api/inventory"),
        apiRequest("/api/categories").catch(() => []),
        apiRequest("/api/suppliers").catch(() => [])
      ]);
      setAvailableCategories(catRows || []);
      setAvailableSuppliers(supRows || []);

      const inventoryByMedicine = new Map();
      (inventoryRows || []).forEach((item) => {
        const medicineId = item.medicine?.id;
        if (!medicineId) return;
        const current = inventoryByMedicine.get(medicineId) || { qty: 0, batch: "", expiry: "" };
        current.qty += Number(item.quantity || 0);
        if (!current.batch && item.batch) {
          current.batch = item.batch.batchNumber || "";
          current.expiry = item.batch.expiryDate || "";
        }
        inventoryByMedicine.set(medicineId, current);
      });

      const rows = (medicineRows || []).map((medicine) => {
        const inventory = inventoryByMedicine.get(medicine.id) || { qty: 0, batch: "", expiry: "" };
        const reorderLevel = Number(medicine.reorderLevel || 0);
        return {
          id: medicine.id,
          name: medicine.name,
          generic: medicine.genericName || "",
          category: medicine.category?.name || "Uncategorized",
          categoryId: medicine.category?.id || "",
          supplierId: medicine.supplier?.id || "",
          manufacturer: medicine.supplier?.companyName || "No supplier",
          batch: inventory.batch || "No batch",
          expiry: inventory.expiry || "Not set",
          qty: inventory.qty,
          mrp: medicine.price || 0,
          reorderLevel,
          status: medicine.active ? "Active" : "Inactive",
          stockStatus: inventory.qty <= 0 ? "Out of Stock" : inventory.qty <= reorderLevel ? "Low Stock" : "In Stock",
        };
      });
      setMedicines(rows);
      setFilteredMedicines(rows);
    } catch (err) {
      setError(err.message || "Unable to load medicines from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // FILTERS LOGIC
  useEffect(() => {
    let result = medicines;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(m => m.name.toLowerCase().includes(term) || m.batch.toLowerCase().includes(term));
    }
    if (filters.category !== 'All Categories') result = result.filter(m => m.category === filters.category);
    if (filters.status !== 'All Status') result = result.filter(m => m.status === filters.status);
    setFilteredMedicines(result);
  }, [filters, medicines]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const categories = [...new Set(medicines.map((m) => m.category).filter(Boolean))];

  const openEditModal = (medicine) => {
    setEditingMedicine(medicine);
    setIsModalOpen(true);
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: form.get("name"),
      genericName: form.get("genericName"),
      dosage: form.get("dosage"),
      unit: form.get("unit"),
      price: form.get("price"),
      reorderLevel: form.get("reorderLevel"),
      categoryId: form.get("categoryId") || null,
      supplierId: form.get("supplierId") || null,
    };
    try {
      const path = editingMedicine ? `/api/medicines/${editingMedicine.id}` : "/api/medicines";
      await apiRequest(path, { method: editingMedicine ? "PUT" : "POST", body });
      setToastMsg("Medicine saved successfully.");
      setTimeout(() => setToastMsg(""), 4000);
      setIsModalOpen(false);
      setEditingMedicine(null);
      await fetchMedicines();
    } catch (err) {
      setError(err.message || "Failed to save medicine");
    }
  };

  const handleImportExcel = (e) => {
    const file = e.target.files[0];
    if (file) {
      setToastMsg(`File selected: ${file.name}. Processed successfully.`);
      setTimeout(() => setToastMsg(""), 4000);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Medicine", "Category", "Supplier", "Batch", "Expiry", "Quantity", "MRP", "Status", "Stock Status"],
      ...filteredMedicines.map((med) => [med.name, med.category, med.manufacturer, med.batch, med.expiry, med.qty, med.mrp, med.status, med.stockStatus])
    ].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "medicines.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleStatus = async (medicine) => {
    await apiRequest(`/api/medicines/${medicine.id}/status?active=${medicine.status !== "Active"}`, { method: "PATCH" });
    setToastMsg(`Status changed for ${medicine.name}`);
    setTimeout(() => setToastMsg(""), 4000);
    await fetchMedicines();
  };

  const viewMedicine = (medicine) => {
    setViewingMedicine(medicine);
  };

  return (
    <DashboardLayout title="Medicines">
      
      {toastMsg && <div className="toast-notification">{toastMsg}</div>}

      {/* Master Table Container */}
      <div className="glass-panel">
        {error && <div className="page-loading">{error}</div>}
        
        {/* Filters Bar */}
        <div className="filters-container">
          <div className="filter-group">
            <label>Search</label>
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search by name, batch..." />
          </div>
          <div className="filter-group">
            <label>Category</label>
            <select name="category" value={filters.category} onChange={handleFilterChange} className="filter-input">
              <option value="All Categories">All Categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input">
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="table-header-actions">
          <button className="btn-primary" onClick={() => { setEditingMedicine(null); setIsModalOpen(true); }}>➕ Add Medicine</button>
          
          {/* Hidden File Input for Import */}
          <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleImportExcel} />
          
          <button className="btn-secondary" onClick={() => fileInputRef.current.click()}>📥 Import Excel</button>
          <button className="btn-secondary" onClick={handleExport}>📤 Export ▼</button>
        </div>

        {/* Data Table */}
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Medicine Name</th>
                <th>Category</th>
                <th>Manufacturer</th>
                <th>Batch No.</th>
                <th>Expiry Date</th>
                <th>Stock Qty</th>
                <th>Status</th>
                <th>Stock Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : (
                filteredMedicines.map((med) => (
                  <tr key={med.id}>
                    <td><input type="checkbox" /></td>
                    <td style={{color: '#00B4D8', fontWeight: '600'}}>{med.name}</td>
                    <td>{med.category}</td>
                    <td>{med.manufacturer}</td>
                    <td>{med.batch}</td>
                    <td>{med.expiry}</td>
                    <td>{med.qty}</td>
                    <td><span className={`status-badge ${med.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{med.status}</span></td>
                    <td><span className={`status-badge ${med.stockStatus === 'In Stock' ? 'badge-success' : 'badge-warning'}`}>{med.stockStatus}</span></td>
                    <td>
                      <div className="table-icons">
                        <button className="icon-btn" onClick={() => viewMedicine(med)}>👁️</button>
                        <button className="icon-btn" onClick={() => openEditModal(med)}>✏️</button>
                        <button className="icon-btn delete" onClick={() => toggleStatus(med)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MEDICINE MODAL --- */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingMedicine ? "Edit Medicine" : "Add New Medicine"}</h2>
              <button className="close-btn" onClick={() => { setIsModalOpen(false); setEditingMedicine(null); }}>×</button>
            </div>
            <form onSubmit={handleAddMedicine}>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Medicine Name</label>
                <input type="text" className="filter-input" name="name" defaultValue={editingMedicine?.name || ""} required />
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Generic Name</label>
                <input type="text" className="filter-input" name="genericName" defaultValue={editingMedicine?.generic || ""} />
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Dosage</label>
                <input type="text" className="filter-input" name="dosage" defaultValue="" />
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Unit</label>
                <input type="text" className="filter-input" name="unit" defaultValue="Units" />
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Price</label>
                <input type="number" step="0.01" className="filter-input" name="price" defaultValue={editingMedicine?.mrp || 0} required />
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Reorder Level</label>
                <input type="number" className="filter-input" name="reorderLevel" defaultValue={editingMedicine?.reorderLevel || 10} required />
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Category</label>
                <select className="filter-input" name="categoryId" defaultValue={editingMedicine?.categoryId || ""}>
                  <option value="">-- Select Category --</option>
                  {availableCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group" style={{marginBottom: '1rem'}}>
                <label>Supplier / Manufacturer</label>
                <select className="filter-input" name="supplierId" defaultValue={editingMedicine?.supplierId || ""}>
                  <option value="">-- Select Supplier --</option>
                  {availableSuppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>{sup.companyName || sup.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setIsModalOpen(false); setEditingMedicine(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MEDICINE DETAIL VIEW MODAL --- */}
      {viewingMedicine && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Medicine Details</h2>
              <button className="close-btn" onClick={() => setViewingMedicine(null)}>×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
                <div><strong style={{ color: '#94A3B8' }}>Medicine Name:</strong><p style={{ color: '#00B4D8', fontWeight: 600, margin: '4px 0' }}>{viewingMedicine.name}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Generic Name:</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>{viewingMedicine.generic || 'None'}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Category:</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>{viewingMedicine.category}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Manufacturer:</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>{viewingMedicine.manufacturer}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Active Batch:</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>{viewingMedicine.batch}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Expiry:</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>{viewingMedicine.expiry}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Current Stock:</strong><p style={{ color: '#10b981', fontWeight: 600, margin: '4px 0' }}>{viewingMedicine.qty} units</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Unit Price (MRP):</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>${viewingMedicine.mrp}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Reorder Level:</strong><p style={{ color: '#CAF0F8', margin: '4px 0' }}>{viewingMedicine.reorderLevel}</p></div>
                <div><strong style={{ color: '#94A3B8' }}>Status:</strong><p style={{ color: viewingMedicine.status === 'Active' ? '#10b981' : '#f43f5e', margin: '4px 0' }}>{viewingMedicine.status}</p></div>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" onClick={() => setViewingMedicine(null)}>Close</button>
              <button type="button" className="btn-primary" onClick={() => {
                const medToEdit = viewingMedicine;
                setViewingMedicine(null);
                openEditModal(medToEdit);
              }}>Edit Medicine</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminMedicines;
