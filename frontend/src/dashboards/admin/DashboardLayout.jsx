import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../../lib/api";
import "./AdminDashboard.css";

const navItems = [
  { label: "Dashboard", path: "/admin", exact: true, icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { label: "Medicines", path: "/admin/medicines", icon: "M10 20.593v-4.186a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4.186m-4-10v-3.5a1.5 1.5 0 0 1 3 0v3.5m-3-1v3a1 1 0 0 0 2 0v-3" },
  { label: "Inventory", path: "/admin/inventory", icon: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18" },
  { label: "Expiry Tracking", path: "/admin/expiry", icon: "M12 6v6l4 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20" },
  { label: "Suppliers", path: "/admin/suppliers", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87" },
  { label: "Purchase Orders", path: "/admin/purchases", icon: "M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M20 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2 M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" },
  { label: "Users", path: "/admin/users", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
  { label: "Reports", path: "/admin/reports", icon: "M18 20V10 M12 20V4 M6 20v-6" },
  { label: "Alerts", path: "/admin/alerts", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" },
  { label: "Ward Transfers", path: "/admin/transfers", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { label: "GxP Audit Trail", path: "/admin/audit", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

const settingsIcon = "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z";

const logoutIcon = "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9";

const DashboardLayout = ({ children, title = "Dashboard" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const checkActive = (path, exact = false) => {
    if (exact) return location.pathname === path ? "active" : "";
    return location.pathname.includes(path) ? "active" : "";
  };

  const renderIcon = (path) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d={path} />
    </svg>
  );

  return (
    <div className="admin-dashboard-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header" onClick={() => navigate("/admin")} style={{ cursor: "pointer" }}>
          <span>Rx</span>
          <h2>MediStock</h2>
        </div>

        <div className="sidebar-menu">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`sidebar-link ${checkActive(item.path, item.exact)}`}
              onClick={() => navigate(item.path)}
            >
              {renderIcon(item.icon)}
              {item.label}
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className={`sidebar-link ${checkActive("/admin/settings")}`} onClick={() => navigate("/admin/settings")}>
            {renderIcon(settingsIcon)}
            Settings
          </button>
          <button className="sidebar-link" style={{ color: "#f43f5e" }} onClick={handleLogout}>
            {renderIcon(logoutIcon)}
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-ambient-glow"></div>
        <header className="admin-topnav">
          <div className="topnav-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search medicines, users, suppliers, reports..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const q = e.target.value.trim().toLowerCase();
                  if (['user','admin','pharmacist','staff','people'].some(k => q.includes(k))) navigate('/admin/users');
                  else if (['supplier','vendor','distributor','manufacturer'].some(k => q.includes(k))) navigate('/admin/suppliers');
                  else if (['report','export','pdf','analytics'].some(k => q.includes(k))) navigate('/admin/reports');
                  else if (['alert','notification'].some(k => q.includes(k))) navigate('/admin/alerts');
                  else if (['order','purchase','po','grn'].some(k => q.includes(k))) navigate('/admin/purchases');
                  else if (['expiry','expire','expired','batch'].some(k => q.includes(k))) navigate('/admin/expiry');
                  else if (['inventory','stock','warehouse'].some(k => q.includes(k))) navigate('/admin/inventory');
                  else navigate('/admin/medicines');
                  e.target.value = '';
                }
              }}
            />
          </div>
          <div className="topnav-profile">
            <div className="bell-icon" onClick={() => navigate("/admin/alerts")} style={{ cursor: "pointer" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="bell-badge">5</span>
            </div>
            <div className="profile-dropdown" onClick={() => navigate("/admin/settings")} style={{ cursor: "pointer" }}>
              <div className="profile-avatar">A</div>
              Admin
            </div>
          </div>
        </header>

        <div className="dashboard-content" aria-label={title}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
