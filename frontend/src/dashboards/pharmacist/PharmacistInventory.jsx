import React, { useEffect, useMemo, useState } from "react";
import PharmacyLayout from "./PharmacyLayout";
import { apiRequest, getSessionUser } from "../../lib/api";
import "./PharmacistInventory.css";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-CA") : "-";

const inventoryStatus = (item) => {
  if (!item.quantity) return "OUT OF STOCK";
  if (item.quantity <= item.reorderLevel) return "LOW STOCK";
  const expiry = item.batch?.expiryDate ? new Date(item.batch.expiryDate) : null;
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  return expiry && expiry <= thirtyDays ? "EXPIRING SOON" : "IN STOCK";
};

const mapStock = (item) => ({
  id: item.id,
  medicineId: item.medicine?.id,
  batchId: item.batch?.id,
  medicineName: item.medicine?.name || "Unnamed medicine",
  batchNo: item.batch?.batchNumber || "-",
  category: item.medicine?.category?.name || "Uncategorized",
  supplier: item.medicine?.supplier?.companyName || "Unassigned",
  currentStock: item.quantity || 0,
  reorderLevel: item.reorderLevel || item.medicine?.reorderLevel || 0,
  expiryDate: item.batch?.expiryDate || null,
  status: inventoryStatus(item),
  price: item.medicine?.price || 0,
  location: item.location || "-",
});

const mapMedicine = (medicine, stock) => ({
  id: medicine.id,
  medicineName: medicine.name,
  category: medicine.category?.name || "Uncategorized",
  supplier: medicine.supplier?.companyName || "Unassigned",
  currentStock: stock?.currentStock || 0,
  reorderLevel: medicine.reorderLevel || 0,
  price: medicine.price || 0,
  active: medicine.active,
  dosage: medicine.dosage || "",
  unit: medicine.unit || "",
});

function PharmacistInventory() {
  const [activeTab, setActiveTab] = useState("medicines");
  const [inventory, setInventory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [batches, setBatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [supplier, setSupplier] = useState("");
  const [batch, setBatch] = useState("");
  const [status, setStatus] = useState("");
  const [batchSearch, setBatchSearch] = useState("");

  const loadInventory = async () => {
    setLoading(true);
    setError("");
    try {
      const [medicineData, stockData, categoryData, batchData] = await Promise.all([
        apiRequest("/api/medicines"),
        apiRequest("/api/inventory"),
        apiRequest("/api/categories/active"),
        apiRequest("/api/batches"),
      ]);
      const stockRows = stockData.map(mapStock);
      setInventory(stockRows);
      setMedicines(medicineData.map((medicine) => mapMedicine(
        medicine,
        stockRows.find((stock) => stock.medicineId === medicine.id),
      )));
      setCategories(categoryData);
      setBatches(batchData);
    } catch (requestError) {
      setError(requestError.message || "Inventory data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, []);

  const filteredInventory = useMemo(() => inventory.filter((item) => {
    const text = `${item.medicineName} ${item.batchNo}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (!category || item.category === category)
      && (!supplier || item.supplier === supplier)
      && (!batch || item.batchNo.toLowerCase().includes(batch.toLowerCase()))
      && (!status || item.status === status);
  }), [inventory, search, category, supplier, batch, status]);

  const filteredMedicines = useMemo(() => medicines.filter((item) => {
    const text = `${item.medicineName} ${item.dosage}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (!category || item.category === category)
      && (!supplier || item.supplier === supplier);
  }), [medicines, search, category, supplier]);

  const filteredBatches = useMemo(() => batches.filter((item) => (
    item.batchNumber?.toLowerCase().includes(batchSearch.toLowerCase())
      || item.medicine?.name?.toLowerCase().includes(batchSearch.toLowerCase())
  )), [batches, batchSearch]);

  const totalStock = inventory.reduce((total, item) => total + Number(item.currentStock || 0), 0);
  const lowStock = inventory.filter((item) => item.status === "LOW STOCK").length;
  const outOfStock = inventory.filter((item) => item.status === "OUT OF STOCK").length;
  const expiringSoon = inventory.filter((item) => item.status === "EXPIRING SOON").length;
  const categoryNames = [...new Set(medicines.map((item) => item.category))];
  const supplierNames = [...new Set(medicines.map((item) => item.supplier))];

  const resetFilters = () => {
    setSearch(""); setCategory(""); setSupplier(""); setBatch(""); setStatus("");
  };

  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});

  const runRequest = async (request, successMessage) => {
    try {
      await request();
      setFeedback(successMessage);
      setActiveModal(null);
      await loadInventory();
    } catch (requestError) {
      setFeedback(requestError.message || "The action could not be completed.");
    }
  };

  const openMedicineModal = (medicine = null) => {
    setActiveModal("medicine");
    setModalData(medicine ? {
      id: medicine.id,
      name: medicine.medicineName,
      price: medicine.price,
      reorderLevel: medicine.reorderLevel,
      categoryId: medicine.categoryId || "",
      supplierId: medicine.supplierId || "",
      mode: "edit"
    } : {
      name: "",
      price: 0,
      reorderLevel: 10,
      categoryId: categories[0]?.id || "",
      supplierId: "",
      mode: "add"
    });
  };

  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    const { id, mode, name, price, reorderLevel, categoryId, supplierId } = modalData;
    if (!name) return;
    const body = JSON.stringify({
      name,
      price: Number(price || 0),
      reorderLevel: Number(reorderLevel || 10),
      categoryId: categoryId || null,
      supplierId: supplierId || null,
    });
    if (mode === "edit") {
      await runRequest(() => apiRequest(`/api/medicines/${id}`, { method: "PUT", body }), `${name} was updated.`);
    } else {
      await runRequest(() => apiRequest("/api/medicines", { method: "POST", body }), `${name} was added to the catalog.`);
    }
  };

  const deleteMedicine = async (medicine) => {
    if (!window.confirm(`Deactivate ${medicine.medicineName}?`)) return;
    await runRequest(() => apiRequest(`/api/medicines/${medicine.id}`, { method: "DELETE" }),
      `${medicine.medicineName} was deactivated.`);
  };

  const openStockModal = (action, item) => {
    if (!item) {
      setFeedback("Choose an inventory row before using this action.");
      return;
    }
    setActiveModal("stock");
    setModalData({
      action,
      item,
      quantity: action === "adjustment" ? item.currentStock : 10,
      reason: "Inventory routine update",
      destination: "Main Pharmacy Shelf A"
    });
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    const { action, item, quantity, reason, destination } = modalData;
    const numQty = Number(quantity);
    if (!Number.isFinite(numQty) || numQty < 0) {
      setFeedback("Enter a valid stock quantity.");
      return;
    }
    const user = getSessionUser();
    const payload = {
      inventoryId: item.id,
      reason: reason || "Inventory update",
      performedBy: user?.name || "Pharmacist",
    };
    if (action === "adjustment") payload.newQuantity = numQty;
    else payload.quantity = numQty;
    if (action === "transfer") payload.destination = destination || "Branch warehouse";

    await runRequest(() => apiRequest(`/api/inventory/${action}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }), `Stock ${action.replace("-", " ")} completed for ${item.medicineName}.`);
  };

  const openCategoryModal = () => {
    setActiveModal("category");
    setModalData({ name: "", description: "" });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const { name, description } = modalData;
    if (!name) return;
    await runRequest(() => apiRequest("/api/categories", {
      method: "POST", body: JSON.stringify({ name, description }),
    }), `${name} category was created.`);
  };

  const openBatchModal = () => {
    setActiveModal("batch");
    setModalData({
      medicineId: medicines[0]?.id || "",
      batchNumber: `B-${Date.now().toString().slice(-4)}`,
      manufacturingDate: new Date().toISOString().split("T")[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      quantity: 100
    });
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    const { medicineId, batchNumber, manufacturingDate, expiryDate, quantity } = modalData;
    if (!medicineId || !batchNumber) return;
    await runRequest(() => apiRequest(`/api/batches/medicine/${medicineId}`, {
      method: "POST",
      body: JSON.stringify({ batchNumber, manufacturingDate, expiryDate, quantity: Number(quantity || 0) }),
    }), `Batch ${batchNumber} was created.`);
  };

  const openUpdateBatchModal = (batchItem) => {
    setActiveModal("updateBatch");
    setModalData({
      id: batchItem.id,
      batchNumber: batchItem.batchNumber,
      quantity: batchItem.quantity
    });
  };

  const handleSaveUpdateBatch = async (e) => {
    e.preventDefault();
    const { id, batchNumber, quantity } = modalData;
    if (quantity === null || quantity === undefined) return;
    await runRequest(() => apiRequest(`/api/batches/${id}/quantity?quantity=${encodeURIComponent(quantity)}`, {
      method: "PATCH",
    }), `Batch ${batchNumber} quantity was updated.`);
  };

  const viewHistory = async (item) => {
    try {
      const logs = await apiRequest(`/api/inventory/history/${item.id}`);
      setHistory(logs);
      setFeedback(`${logs.length} stock movements loaded for ${item.medicineName}.`);
    } catch (requestError) {
      setFeedback(requestError.message || "Stock history could not be loaded.");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Medicine", "Batch", "Category", "Supplier", "Quantity", "Reorder level", "Expiry", "Status"],
      ...filteredInventory.map((item) => [item.medicineName, item.batchNo, item.category, item.supplier,
        item.currentStock, item.reorderLevel, item.expiryDate || "", item.status]),
    ];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "inventory-export.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const renderMedicines = () => (
    <div style={{ padding: "0 20px" }}>
      <section className="inventory-kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
        <div className="inventory-kpi"><span>💊</span><div><p>Total Registered</p><h2>{medicines.length}</h2><small>Database medicines</small></div></div>
        <div className="inventory-kpi"><span>✅</span><div><p>Active Medicines</p><h2>{medicines.filter((item) => item.active).length}</h2><small>Available catalog entries</small></div></div>
        <div className="inventory-kpi warning"><span>🏷️</span><div><p>Categories</p><h2>{categories.length}</h2><small>Active categories</small></div></div>
        <div className="inventory-kpi expiry"><span>🏢</span><div><p>Suppliers</p><h2>{supplierNames.length}</h2><small>Connected vendors</small></div></div>
      </section>

      {/* CATALOG DISTRIBUTION CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#CAF0F8' }}>Catalog Category Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(() => {
              const catCounts = categoryNames.map(c => ({
                name: c,
                count: medicines.filter(m => m.category === c).length
              })).sort((a,b) => b.count - a.count).slice(0, 4);
              const maxCount = Math.max(1, ...catCounts.map(c => c.count));
              const palette = ['#00B4D8', '#22c55e', '#f59e0b', '#ec4899'];
              return catCounts.map((cat, idx) => (
                <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#CAF0F8' }}>{cat.name}</span>
                    <strong style={{ color: palette[idx % 4] }}>{cat.count} items</strong>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(8, (cat.count / maxCount) * 100)}%`, background: palette[idx % 4], borderRadius: '3px' }} />
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#CAF0F8' }}>Catalog Status &amp; Pricing</h3>
          {(() => {
            const activeCount = medicines.filter(m => m.active).length;
            const inactiveCount = medicines.length - activeCount;
            const avgPrice = medicines.length > 0 ? (medicines.reduce((sum, m) => sum + Number(m.price || 0), 0) / medicines.length).toFixed(2) : 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#22c55e' }}>Active: {activeCount}</span>
                  <span style={{ color: '#f43f5e' }}>Inactive: {inactiveCount}</span>
                </div>
                <div style={{ display: 'flex', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ width: medicines.length > 0 ? `${(activeCount / medicines.length) * 100}%` : '0%', background: '#22c55e' }} />
                  <div style={{ width: medicines.length > 0 ? `${(inactiveCount / medicines.length) * 100}%` : '0%', background: '#f43f5e' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '4px', background: 'rgba(0,180,216,0.06)', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,180,216,0.2)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <small style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Average Unit Price</small>
                    <strong style={{ color: '#00B4D8', fontSize: '14px' }}>₹ {avgPrice}</strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <small style={{ color: '#94A3B8', fontSize: '11px', display: 'block' }}>Active Ratio</small>
                    <strong style={{ color: '#22c55e', fontSize: '14px' }}>{medicines.length > 0 ? Math.round((activeCount/medicines.length)*100) : 0}%</strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <section className="inventory-filter" style={{ gridTemplateColumns: "2fr 1fr 1fr auto" }}>
        <div className="filter-field"><label>Search Medicine Catalog</label><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by medicine name or dosage" /></div>
        <div className="filter-field"><label>Category</label><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All Categories</option>{categoryNames.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="filter-field"><label>Supplier</label><select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="">All Suppliers</option>{supplierNames.map((item) => <option key={item}>{item}</option>)}</select></div>
        <button className="reset-btn" onClick={resetFilters}>Reset</button>
      </section>

      <section className="inventory-actions"><div><h2>Master Medicines Directory</h2><span>Live database medicine catalog</span></div><div className="action-buttons"><button className="excel-btn" onClick={exportCsv}>Export Catalog</button><button className="stock-btn" onClick={() => openMedicineModal()}>Add New Medicine</button></div></section>
      <section className="inventory-table-card">
        {loading && <div className="inventory-message">Loading medicine catalog...</div>}
        {error && <div className="inventory-error">{error}</div>}
        {!loading && !error && <div className="table-wrapper"><table><thead><tr><th>MED ID</th><th>Medicine Name</th><th>Category</th><th>Primary Supplier</th><th>Unit Price</th><th>Reorder Qty</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {filteredMedicines.length === 0 ? <tr><td colSpan="8" className="empty-row">No medicines found in catalog.</td></tr> : filteredMedicines.map((item) => <tr key={item.id}><td>MED-{item.id}</td><td><strong>{item.medicineName}</strong></td><td>{item.category}</td><td>{item.supplier}</td><td>{item.price}</td><td>{item.reorderLevel}</td><td><span className={`status ${item.active ? "in-stock" : "out-of-stock"}`}>{item.active ? "Active" : "Inactive"}</span></td><td><div className="row-actions"><button title="View stock" onClick={() => { setActiveTab("stock"); setSearch(item.medicineName); }}>View</button><button title="Edit medicine" onClick={() => openMedicineModal(item)}>Edit</button><button title="Deactivate medicine" onClick={() => deleteMedicine(item)}>Delete</button></div></td></tr>)}
        </tbody></table></div>}
      </section>
    </div>
  );

  const renderStockManagement = () => (
    <div style={{ padding: "0 20px" }}>
      <section className="inventory-kpis">
        <div className="inventory-kpi"><span>💊</span><div><p>Total Medicines</p><h2>{medicines.length}</h2><small>All catalog entries</small></div></div>
        <div className="inventory-kpi"><span>📦</span><div><p>Total Stock</p><h2>{totalStock}</h2><small>Available quantity</small></div></div>
        <div className="inventory-kpi warning"><span>⚠️</span><div><p>Low Stock</p><h2>{lowStock}</h2><small>Needs reordering</small></div></div>
        <div className="inventory-kpi danger"><span>🚫</span><div><p>Out of Stock</p><h2>{outOfStock}</h2><small>Unavailable records</small></div></div>
        <div className="inventory-kpi expiry"><span>⏳</span><div><p>Expiring Soon</p><h2>{expiringSoon}</h2><small>Next 30 days</small></div></div>
      </section>

      {/* VISUAL STOCK ANALYTICS CHARTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        
        {/* Chart 1: Stock Status Health Donut Chart */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Stock Health Status</span>
            <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>{inventory.length} tracked items</small>
          </h3>
          {(() => {
            const inStock = inventory.filter(i => i.status === "IN STOCK").length;
            const low = inventory.filter(i => i.status === "LOW STOCK").length;
            const out = inventory.filter(i => i.status === "OUT OF STOCK").length;
            const expiring = inventory.filter(i => i.status === "EXPIRING SOON").length;
            const total = inventory.length || 1;
            const inPct = Math.round((inStock / total) * 100);
            const lowPct = Math.round((low / total) * 100);
            const outPct = Math.round((out / total) * 100);
            const expPct = Math.max(0, 100 - inPct - lowPct - outPct);

            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
                {/* Donut Chart */}
                <div style={{
                  width: '95px',
                  height: '95px',
                  borderRadius: '50%',
                  background: `conic-gradient(#22c55e 0% ${inPct}%, #f59e0b ${inPct}% ${inPct + lowPct}%, #f43f5e ${inPct + lowPct}% ${inPct + lowPct + outPct}%, #a855f7 ${inPct + lowPct + outPct}% 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(34, 197, 94, 0.2)'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#0a192f',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#fff' }}>{inventory.length}</span>
                    <span style={{ fontSize: '9px', color: '#94A3B8' }}>Stocks</span>
                  </div>
                </div>

                {/* Status Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', flex: 1, fontSize: '11px' }}>
                  <div style={{ padding: '4px 6px', background: 'rgba(34, 197, 94, 0.08)', borderRadius: '4px', borderLeft: '3px solid #22c55e' }}>
                    <span style={{ color: '#86efac', display: 'block' }}>In Stock</span>
                    <strong>{inStock} ({inPct}%)</strong>
                  </div>
                  <div style={{ padding: '4px 6px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '4px', borderLeft: '3px solid #f59e0b' }}>
                    <span style={{ color: '#fcd34d', display: 'block' }}>Low Stock</span>
                    <strong>{low} ({lowPct}%)</strong>
                  </div>
                  <div style={{ padding: '4px 6px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '4px', borderLeft: '3px solid #f43f5e' }}>
                    <span style={{ color: '#fda4af', display: 'block' }}>Out Stock</span>
                    <strong>{out} ({outPct}%)</strong>
                  </div>
                  <div style={{ padding: '4px 6px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '4px', borderLeft: '3px solid #a855f7' }}>
                    <span style={{ color: '#d8b4fe', display: 'block' }}>Expiring</span>
                    <strong>{expiring} ({expPct}%)</strong>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Chart 2: Category Stock Volume Vertical Column Chart */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '16px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8' }}>Stock Volume by Category</h3>
          {(() => {
            const catCounts = categoryNames.map(c => ({
              name: c,
              qty: inventory.filter(i => i.category === c).reduce((sum, i) => sum + Number(i.currentStock || 0), 0)
            })).sort((a, b) => b.qty - a.qty).slice(0, 4);

            const maxQty = Math.max(1, ...catCounts.map(c => c.qty));
            const palette = ['#00B4D8', '#22c55e', '#f59e0b', '#ec4899'];

            if (catCounts.length === 0) return <p style={{ color: '#94A3B8', fontSize: '12px' }}>No category inventory records</p>;

            return (
              <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', position: 'relative', padding: '10px 4px 4px' }}>
                {/* Grid Lines */}
                <div style={{ position: 'absolute', inset: '10px 10px 25px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                  <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                  <div style={{ borderTop: '1px dashed rgba(144,224,239,0.1)' }} />
                </div>
                {catCounts.map((cat, idx) => {
                  const heightPct = Math.max(15, Math.min(100, Math.round((cat.qty / maxQty) * 100)));
                  return (
                    <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 1, width: '22%' }}>
                      <span style={{ fontSize: '10px', color: palette[idx % 4], fontWeight: 'bold' }}>{cat.qty}</span>
                      <div style={{
                        width: '100%',
                        maxWidth: '32px',
                        height: `${heightPct}%`,
                        background: `linear-gradient(180deg, ${palette[idx % 4]} 0%, rgba(0, 180, 216, 0.25) 100%)`,
                        borderRadius: '5px 5px 0 0',
                        boxShadow: `0 0 8px ${palette[idx % 4]}55`,
                        transition: 'height 0.4s ease'
                      }} />
                      <span style={{ fontSize: '10px', color: '#94A3B8', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Chart 3: Batch Expiry Horizon */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(144, 224, 239, 0.1)', borderRadius: '12px', padding: '18px', backdropFilter: 'blur(10px)' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#CAF0F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Batch Expiry Horizon</span>
            <small style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'normal' }}>{batches.length} total batches</small>
          </h3>
          {(() => {
            const now = new Date();
            const d30 = new Date(); d30.setDate(now.getDate() + 30);
            const d90 = new Date(); d90.setDate(now.getDate() + 90);

            const urgent = batches.filter(b => b.expiryDate && new Date(b.expiryDate) <= d30).length;
            const impending = batches.filter(b => b.expiryDate && new Date(b.expiryDate) > d30 && new Date(b.expiryDate) <= d90).length;
            const safe = batches.filter(b => !b.expiryDate || new Date(b.expiryDate) > d90).length;
            const total = batches.length || 1;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span style={{ color: '#f43f5e' }}>Critical (&lt; 30 days)</span>
                    <strong style={{ color: '#f43f5e' }}>{urgent} batches ({Math.round((urgent/total)*100)}%)</strong>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(urgent/total)*100}%`, background: '#f43f5e', borderRadius: '3px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span style={{ color: '#f59e0b' }}>Moderate (31-90 days)</span>
                    <strong style={{ color: '#f59e0b' }}>{impending} batches ({Math.round((impending/total)*100)}%)</strong>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(impending/total)*100}%`, background: '#f59e0b', borderRadius: '3px' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                    <span style={{ color: '#22c55e' }}>Healthy (&gt; 90 days)</span>
                    <strong style={{ color: '#22c55e' }}>{safe} batches ({Math.round((safe/total)*100)}%)</strong>
                  </div>
                  <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(safe/total)*100}%`, background: '#22c55e', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

      </div>
      <section className="inventory-filter"><div className="filter-field"><label>Search Medicine</label><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or batch" /></div><div className="filter-field"><label>Category</label><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All Categories</option>{categoryNames.map((item) => <option key={item}>{item}</option>)}</select></div><div className="filter-field"><label>Supplier</label><select value={supplier} onChange={(event) => setSupplier(event.target.value)}><option value="">All Suppliers</option>{supplierNames.map((item) => <option key={item}>{item}</option>)}</select></div><div className="filter-field"><label>Batch</label><input value={batch} onChange={(event) => setBatch(event.target.value)} placeholder="Batch number" /></div><div className="filter-field"><label>Status</label><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All Status</option><option>IN STOCK</option><option>LOW STOCK</option><option>OUT OF STOCK</option><option>EXPIRING SOON</option></select></div><button className="reset-btn" onClick={resetFilters}>Reset</button></section>
      <section className="inventory-actions"><div><h2>Current Inventory List</h2><span>Total Records: {filteredInventory.length}</span></div><div className="action-buttons"><button className="excel-btn" onClick={exportCsv}>Export CSV</button><button className="pdf-btn" onClick={() => window.print()}>Print</button></div></section>
      <section className="inventory-table-card">{loading && <div className="inventory-message">Loading inventory...</div>}{!loading && !error && <div className="table-wrapper"><table><thead><tr><th>#</th><th>Medicine</th><th>Batch</th><th>Category</th><th>Supplier</th><th>Stock</th><th>Reorder</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredInventory.length === 0 ? <tr><td colSpan="10" className="empty-row">No inventory records found.</td></tr> : filteredInventory.map((item, index) => <tr key={item.id}><td>{index + 1}</td><td><strong>{item.medicineName}</strong></td><td>{item.batchNo}</td><td>{item.category}</td><td>{item.supplier}</td><td className="stock-number">{item.currentStock}</td><td>{item.reorderLevel}</td><td>{formatDate(item.expiryDate)}</td><td><span className={`status ${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></td><td><div className="row-actions"><button title="View history" onClick={() => viewHistory(item)}>History</button><button title="Stock in" onClick={() => openStockModal("stock-in", item)}>In</button><button title="Stock out" onClick={() => openStockModal("stock-out", item)}>Out</button><button title="Adjust stock" onClick={() => openStockModal("adjustment", item)}>Adjust</button><button title="Transfer stock" onClick={() => openStockModal("transfer", item)}>Move</button><button title="Return stock" onClick={() => openStockModal("return", item)}>Return</button></div></td></tr>)}</tbody></table></div>}</section>
      {history.length > 0 && <section className="inventory-table-card"><div className="panel-header"><h2>Stock History</h2></div><div className="table-wrapper"><table><thead><tr><th>Date</th><th>Operation</th><th>Quantity</th><th>Previous</th><th>New</th><th>Reason</th></tr></thead><tbody>{history.map((log) => <tr key={log.id}><td>{formatDate(log.createdAt)}</td><td>{log.operation}</td><td>{log.quantity}</td><td>{log.previousQuantity}</td><td>{log.newQuantity}</td><td>{log.reason || "-"}</td></tr>)}</tbody></table></div></section>}
    </div>
  );

  const renderCategories = () => <section style={{ margin: "0 20px" }}><div className="inventory-actions" style={{ marginBottom: "20px" }}><h2>Medicine Categories</h2><button className="stock-btn" onClick={openCategoryModal}>Add Category</button></div><div className="category-grid">{categories.map((item) => <div className="category-card" key={item.id}><h3>{item.name}</h3><p>{item.description || "No description"}</p><small>{medicines.filter((medicine) => medicine.category === item.name).length} medicines</small></div>)}</div></section>;

  const renderBatches = () => <section className="inventory-table-card" style={{ margin: "0 20px" }}><div className="inventory-actions" style={{ padding: "20px" }}><div><h2>Batch Management</h2><span>Database batch quantity and expiry tracking</span></div><div className="action-buttons"><input value={batchSearch} onChange={(event) => setBatchSearch(event.target.value)} placeholder="Search batch number" /><button className="stock-btn" onClick={openBatchModal}>Add Batch</button></div></div><div className="table-wrapper"><table><thead><tr><th>Batch</th><th>Medicine</th><th>Manufactured</th><th>Expiry</th><th>Available</th><th>Status</th><th>Action</th></tr></thead><tbody>{filteredBatches.map((item) => <tr key={item.id}><td><strong>{item.batchNumber}</strong></td><td>{item.medicine?.name || "-"}</td><td>{formatDate(item.manufacturingDate)}</td><td>{formatDate(item.expiryDate)}</td><td className="stock-number">{item.quantity}</td><td><span className={`status ${item.active ? "in-stock" : "out-of-stock"}`}>{item.active ? "Active" : "Inactive"}</span></td><td><button title="Update batch quantity" onClick={() => openUpdateBatchModal(item)}>Update qty</button></td></tr>)}{filteredBatches.length === 0 && <tr><td colSpan="7" className="empty-row">No batches found.</td></tr>}</tbody></table></div></section>;

  return (
    <PharmacyLayout>
      <div className="pharmacist-inventory" style={{ minHeight: "auto", padding: 0, background: "transparent" }}>
        <header className="inventory-header" style={{ padding: "0 20px" }}>
          <div>
            <h1>Inventory Operations</h1>
            <p>Manage medicines, categories, batches, and live stock tracking</p>
          </div>
        </header>
        {feedback && <div className="inventory-message" role="status">{feedback}</div>}
        <div className="inventory-tabs">
          <button className={`inventory-tab ${activeTab === "medicines" ? "active" : ""}`} onClick={() => setActiveTab("medicines")}>Medicines</button>
          <button className={`inventory-tab ${activeTab === "stock" ? "active" : ""}`} onClick={() => setActiveTab("stock")}>Stock Management</button>
          <button className={`inventory-tab ${activeTab === "categories" ? "active" : ""}`} onClick={() => setActiveTab("categories")}>Categories</button>
          <button className={`inventory-tab ${activeTab === "batches" ? "active" : ""}`} onClick={() => setActiveTab("batches")}>Batch Management</button>
        </div>
        {activeTab === "medicines" && renderMedicines()}
        {activeTab === "stock" && renderStockManagement()}
        {activeTab === "categories" && renderCategories()}
        {activeTab === "batches" && renderBatches()}

        {/* --- MODAL DIALOGS --- */}
        {activeModal === "medicine" && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>{modalData.mode === "edit" ? "Edit Medicine" : "Add New Medicine"}</h3>
              <form onSubmit={handleSaveMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Medicine Name</label>
                  <input style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.name} onChange={(e) => setModalData({ ...modalData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Unit Price</label>
                  <input type="number" step="0.01" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.price} onChange={(e) => setModalData({ ...modalData, price: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Reorder Level</label>
                  <input type="number" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.reorderLevel} onChange={(e) => setModalData({ ...modalData, reorderLevel: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Category</label>
                  <select style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.categoryId} onChange={(e) => setModalData({ ...modalData, categoryId: e.target.value })}>
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="stock-btn">Save Medicine</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === "stock" && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>Stock {modalData.action.replace("-", " ").toUpperCase()}: {modalData.item?.medicineName}</h3>
              <form onSubmit={handleSaveStock} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>{modalData.action === "adjustment" ? "New Total Quantity" : "Quantity to Adjust"}</label>
                  <input type="number" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.quantity} onChange={(e) => setModalData({ ...modalData, quantity: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Reason</label>
                  <input style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.reason} onChange={(e) => setModalData({ ...modalData, reason: e.target.value })} required />
                </div>
                {modalData.action === "transfer" && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Destination Location</label>
                    <input style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.destination} onChange={(e) => setModalData({ ...modalData, destination: e.target.value })} required />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="stock-btn">Confirm Stock Action</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === "category" && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>Add Category</h3>
              <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Category Name</label>
                  <input style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.name} onChange={(e) => setModalData({ ...modalData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Description</label>
                  <textarea rows="3" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.description} onChange={(e) => setModalData({ ...modalData, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="stock-btn">Save Category</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === "batch" && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>Create Medicine Batch</h3>
              <form onSubmit={handleSaveBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Medicine</label>
                  <select style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.medicineId} onChange={(e) => setModalData({ ...modalData, medicineId: e.target.value })}>
                    {medicines.map((m) => <option key={m.id} value={m.id}>{m.medicineName}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Batch Number</label>
                  <input style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.batchNumber} onChange={(e) => setModalData({ ...modalData, batchNumber: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Manufacturing Date</label>
                  <input type="date" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.manufacturingDate} onChange={(e) => setModalData({ ...modalData, manufacturingDate: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Expiry Date</label>
                  <input type="date" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.expiryDate} onChange={(e) => setModalData({ ...modalData, expiryDate: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Initial Quantity</label>
                  <input type="number" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.quantity} onChange={(e) => setModalData({ ...modalData, quantity: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="stock-btn">Create Batch</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeModal === "updateBatch" && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ background: '#0a192f', border: '1px solid #1e293b', borderRadius: '12px', padding: '1.5rem', width: '450px', maxWidth: '90%' }}>
              <h3 style={{ color: '#CAF0F8', marginTop: 0 }}>Update Batch Quantity: {modalData.batchNumber}</h3>
              <form onSubmit={handleSaveUpdateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Available Quantity</label>
                  <input type="number" style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff' }} value={modalData.quantity} onChange={(e) => setModalData({ ...modalData, quantity: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="reset-btn" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="stock-btn">Save Quantity</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PharmacyLayout>
  );
}

export default PharmacistInventory;
