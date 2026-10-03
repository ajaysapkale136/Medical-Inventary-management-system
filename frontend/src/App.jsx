import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./Home";
import Auth from "./Auth";

// --- ADMIN DASHBOARD IMPORTS ---
import AdminDashboard from "./dashboards/admin/AdminDashboard";
import AdminMedicines from "./dashboards/admin/AdminMedicines";
import AdminInventory from "./dashboards/admin/AdminInventory";
import AdminSuppliers from "./dashboards/admin/AdminSuppliers";
import AdminExpiry from "./dashboards/admin/AdminExpiry";
import AdminPurchaseOrders from "./dashboards/admin/AdminPurchaseOrders";
import AdminUsers from "./dashboards/admin/AdminUsers";
import AdminReports from "./dashboards/admin/AdminReports";
import AdminAlerts from "./dashboards/admin/AdminAlerts";
import AdminSettings from "./dashboards/admin/AdminSettings";
import AdminAuditTrail from "./dashboards/admin/AdminAuditTrail";
import WardTransfers from "./dashboards/common/WardTransfers";

// --- PHARMACY DASHBOARD IMPORTS ---
import PharmacistDashboard from "./dashboards/pharmacist/PharmacistDashboard";
import PharmacistInventory from "./dashboards/pharmacist/PharmacistInventory";
import PharmacistSuppliers from "./dashboards/pharmacist/PharmacistSuppliers";
import PharmacistMonitoring from "./dashboards/pharmacist/PharmacistMonitoring";
import PharmacistReports from "./dashboards/pharmacist/PharmacistReports";
import PharmacistNotifications from "./dashboards/pharmacist/PharmacistNotifications";
import PharmacistOnlineOrders from "./dashboards/pharmacist/PharmacistOnlineOrders";
import PharmacistSettings from "./dashboards/pharmacist/PharmacistSettings";

// --- STAFF DASHBOARD IMPORTS ---

import StaffDashboard from "./dashboards/Staff/StaffDashboard";
import StaffMedicines from "./dashboards/Staff/StaffMedicines";
import StaffInventory from "./dashboards/Staff/StaffInventory";
import StaffExpiry from "./dashboards/Staff/StaffExpiry";
import StaffOrders from "./dashboards/Staff/StaffOrders";
import StaffNotifications from "./dashboards/Staff/StaffNotifications";
import StaffReports from "./dashboards/Staff/StaffReports";
import StaffSettings from "./dashboards/Staff/StaffSettings";

import "./App.css";
import { apiRequest, clearSessionUser, getSessionUser, storeSessionUser } from "./lib/api";

function ProtectedRoute({ roles, children }) {
  const [user, setUser] = useState(getSessionUser());
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    apiRequest("/api/auth/me")
      .then((currentUser) => {
        storeSessionUser(currentUser);
        setUser(currentUser);
      })
      .catch(() => {
        clearSessionUser();
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="page-loading">Checking your session...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "ADMIN" ? "/admin" : user.role === "PHARMACIST" ? "/pharmacy" : "/staff"} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>

        {/* HOME */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route
          path="/home"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
            </>
          }
        />

        {/* AUTH */}
        <Route
          path="/auth"
          element={
            <>
              <Navbar />
              <Auth />
              <Footer />
            </>
          }
        />

        {/* ADMIN */}
        <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/medicines" element={<ProtectedRoute roles={["ADMIN"]}><AdminMedicines /></ProtectedRoute>} />
        <Route path="/admin/inventory" element={<ProtectedRoute roles={["ADMIN"]}><AdminInventory /></ProtectedRoute>} />
        <Route path="/admin/suppliers" element={<ProtectedRoute roles={["ADMIN"]}><AdminSuppliers /></ProtectedRoute>} />
        <Route path="/admin/expiry" element={<ProtectedRoute roles={["ADMIN"]}><AdminExpiry /></ProtectedRoute>} />
        <Route path="/admin/purchases" element={<ProtectedRoute roles={["ADMIN"]}><AdminPurchaseOrders /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={["ADMIN"]}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={["ADMIN"]}><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/alerts" element={<ProtectedRoute roles={["ADMIN"]}><AdminAlerts /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={["ADMIN"]}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute roles={["ADMIN"]}><AdminAuditTrail /></ProtectedRoute>} />
        <Route path="/admin/transfers" element={<ProtectedRoute roles={["ADMIN"]}><WardTransfers /></ProtectedRoute>} />
    

        {/* PHARMACY */}
        <Route path="/pharmacy" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistDashboard /></ProtectedRoute>} />
        <Route path="/pharmacy/inventory" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistInventory /></ProtectedRoute>} />
        {/* FIXED: Pointing to the correct Pharmacist component and standardizing lowercase path */}
        <Route path="/pharmacy/suppliers" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistSuppliers /></ProtectedRoute>} />
        <Route path="/pharmacy/monitoring" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistMonitoring /></ProtectedRoute>} />
        <Route path="/pharmacy/reports" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistReports /></ProtectedRoute>} />
        <Route path="/pharmacy/notifications" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistNotifications /></ProtectedRoute>} />
        <Route path="/pharmacy/online-orders" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistOnlineOrders /></ProtectedRoute>} />
        <Route path="/pharmacy/settings" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistSettings /></ProtectedRoute>} />
        <Route path="/pharmacy/transfers" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><WardTransfers /></ProtectedRoute>} />
        
        {/* STAFF */}
        <Route path="/staff" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffDashboard /></ProtectedRoute>} />
        <Route path="/staff/medicines" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffMedicines /></ProtectedRoute>} />
        <Route path="/staff/inventory" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffInventory /></ProtectedRoute>} />
        <Route path="/staff/expiry" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffExpiry /></ProtectedRoute>} />
        <Route path="/staff/orders" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffOrders /></ProtectedRoute>} />
        <Route path="/staff/notifications" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffNotifications /></ProtectedRoute>} />
        <Route path="/staff/reports" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffReports /></ProtectedRoute>} />
        <Route path="/staff/settings" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffSettings /></ProtectedRoute>} />
        <Route path="/staff/transfers" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><WardTransfers /></ProtectedRoute>} />
        {/* 404 */}
        <Route 
          path="*"
          element={
            <div className="not-found">
              <h1>404</h1>
              <p>Page Not Found</p>
            </div>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;
