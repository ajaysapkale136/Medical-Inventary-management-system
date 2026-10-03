import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "./DashboardLayout";
import { apiRequest } from "../../lib/api";
import "./AdminSettings.css";

const SETTINGS_API_URL = "/api/system-settings";
const PROFILE_API_URL = "/api/auth/profile";
const PREFERENCES_API_URL = "/api/preferences";

const defaultSystemSettings = {
  orgName: "",
  email: "",
  phone: "",
  address: "",
  timezone: "Asia/Kolkata (GMT +05:30)",
  dateFormat: "DD-MM-YYYY",
  currency: "INR",
  language: "English",
  lowStock: 10,
  expiryAlert: 30,
  warehouse: "",
  emailNotif: true,
  smsNotif: true,
  pushNotif: true,
};

const defaultProfile = {
  fullName: "",
  adminId: "",
  email: "",
  phone: "",
  location: "",
  accessLevel: "System Administrator",
  address: "",
};

const modules = [
  { id: 1, title: "Inventory Settings", desc: "Stock levels, batch format, categories, units, and warehouse preferences.", status: "Configured", statusColor: "text-green" },
  { id: 2, title: "Expiry and Alerts", desc: "Near-expiry windows, expired stock workflow, and low-stock alerts.", status: "Configured", statusColor: "text-green" },
  { id: 3, title: "Users and Roles", desc: "Admin, Pharmacist, and Staff access permissions for each module.", status: "Configured", statusColor: "text-green" },
  { id: 4, title: "Notifications", desc: "Email, SMS, and in-app notification delivery preferences.", status: "Configured", statusColor: "text-green" },
  { id: 5, title: "Security", desc: "Password policy, JWT sessions, OAuth2 login, and two-factor controls.", status: "Ready for backend", statusColor: "text-orange" },
  { id: 6, title: "Reports and Export", desc: "Inventory, expiry, stock movement, and purchase history export rules.", status: "Configured", statusColor: "text-green" },
];

const AdminSettings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("My Profile");
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
  const [profile, setProfile] = useState(defaultProfile);
  const [status, setStatus] = useState("Loading saved settings...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [settingsData, profileData, preferencesData] = await Promise.all([
          apiRequest(SETTINGS_API_URL),
          apiRequest(PROFILE_API_URL),
          apiRequest(PREFERENCES_API_URL),
        ]);
        setSystemSettings({ ...defaultSystemSettings, ...settingsData });
        setProfile((current) => ({
          ...defaultProfile,
          ...preferencesData,
          fullName: profileData.name || current.fullName,
          email: profileData.email || current.email,
          phone: profileData.phone || "",
          location: profileData.location || "",
          address: profileData.department || "",
        }));
        setStatus("Saved settings loaded");
      } catch (error) {
        setStatus(error.message || "Settings could not be loaded");
      }
    };

    fetchInitialData();
  }, []);

  const updateSystem = (event) => {
    const { name, value, type, checked } = event.target;
    setSystemSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const updateProfile = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await Promise.all([
        apiRequest(SETTINGS_API_URL, {
          method: "PUT",
          body: systemSettings,
        }),
        apiRequest(PROFILE_API_URL, {
          method: "PUT",
          body: {
            name: profile.fullName,
            phone: profile.phone,
            department: profile.address,
            location: profile.location,
          },
        }),
        apiRequest(PREFERENCES_API_URL, {
          method: "PUT",
          body: profile,
        }),
      ]);
      setStatus("Settings saved to backend");
    } catch (error) {
      setStatus(error.message || "Settings could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const resetCurrentTab = () => {
    if (activeTab === "My Profile") {
      setProfile(defaultProfile);
      return;
    }
    setSystemSettings(defaultSystemSettings);
  };

  const tabs = ["My Profile", "Organization", "Inventory Rules", "Notifications", "Modules", "Security"];

  return (
    <DashboardLayout title="Settings">
      <div className="settings-wrapper">
        <div className="settings-inner-sidebar glass-panel">
          <div className="settings-nav-header">Admin Settings</div>
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`settings-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="tab-dot" /> {tab}
            </button>
          ))}
        </div>

        <div className="settings-content">
          <div className="glass-panel">
            <div className="settings-header-row">
              <div className="settings-title">
                <h2>{activeTab}</h2>
                <p>Manage admin profile, system preferences, and backend-ready module settings.</p>
              </div>
              <div className="settings-actions">
                <button className="btn-secondary" onClick={resetCurrentTab}>Reset</button>
                <button className="btn-primary" onClick={saveChanges} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="role-settings-status">{status}</div>

            {activeTab === "My Profile" && (
              <div className="settings-form-grid two-column-settings">
                <div className="form-column">
                  <div className="settings-group">
                    <label>Full Name</label>
                    <input className="settings-input" name="fullName" value={profile.fullName} onChange={updateProfile} />
                  </div>
                  <div className="settings-group">
                    <label>Admin ID</label>
                    <input className="settings-input" name="adminId" value={profile.adminId} onChange={updateProfile} />
                  </div>
                  <div className="settings-group">
                    <label>Email</label>
                    <input className="settings-input" type="email" name="email" value={profile.email} onChange={updateProfile} />
                  </div>
                  <div className="settings-group">
                    <label>Phone</label>
                    <input className="settings-input" name="phone" value={profile.phone} onChange={updateProfile} />
                  </div>
                </div>
                <div className="form-column">
                  <div className="settings-group">
                    <label>Location</label>
                    <input className="settings-input" name="location" value={profile.location} onChange={updateProfile} />
                  </div>
                  <div className="settings-group">
                    <label>Access Level</label>
                    <input className="settings-input" name="accessLevel" value={profile.accessLevel} onChange={updateProfile} />
                  </div>
                  <div className="settings-group">
                    <label>Address</label>
                    <textarea className="settings-textarea" name="address" value={profile.address} onChange={updateProfile} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Organization" && (
              <div className="settings-form-grid two-column-settings">
                <div className="form-column">
                  <div className="settings-group">
                    <label>Organization / Pharmacy Name</label>
                    <input className="settings-input" name="orgName" value={systemSettings.orgName} onChange={updateSystem} />
                  </div>
                  <div className="settings-group">
                    <label>Email</label>
                    <input className="settings-input" type="email" name="email" value={systemSettings.email} onChange={updateSystem} />
                  </div>
                  <div className="settings-group">
                    <label>Phone</label>
                    <input className="settings-input" name="phone" value={systemSettings.phone} onChange={updateSystem} />
                  </div>
                  <div className="settings-group">
                    <label>Address</label>
                    <textarea className="settings-textarea" name="address" value={systemSettings.address} onChange={updateSystem} />
                  </div>
                </div>
                <div className="form-column">
                  <div className="settings-group">
                    <label>Timezone</label>
                    <select className="settings-select" name="timezone" value={systemSettings.timezone} onChange={updateSystem}>
                      <option>Asia/Kolkata (GMT +05:30)</option>
                      <option>America/New_York (GMT -04:00)</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label>Date Format</label>
                    <select className="settings-select" name="dateFormat" value={systemSettings.dateFormat} onChange={updateSystem}>
                      <option>DD-MM-YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label>Currency</label>
                    <select className="settings-select" name="currency" value={systemSettings.currency} onChange={updateSystem}>
                      <option>INR</option>
                      <option>USD</option>
                      <option>EUR</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label>Default Language</label>
                    <select className="settings-select" name="language" value={systemSettings.language} onChange={updateSystem}>
                      <option>English</option>
                      <option>Hindi</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Inventory Rules" && (
              <div className="settings-form-grid two-column-settings">
                <div className="form-column">
                  <div className="settings-group">
                    <label>Low Stock Threshold</label>
                    <input className="settings-input" type="number" name="lowStock" value={systemSettings.lowStock} onChange={updateSystem} />
                  </div>
                  <div className="settings-group">
                    <label>Expiry Alert Days</label>
                    <input className="settings-input" type="number" name="expiryAlert" value={systemSettings.expiryAlert} onChange={updateSystem} />
                  </div>
                  <div className="settings-group">
                    <label>Default Warehouse</label>
                    <input className="settings-input" name="warehouse" value={systemSettings.warehouse} onChange={updateSystem} />
                  </div>
                </div>
                <div className="form-column quick-summary-col">
                  <h3 className="panel-header">Backend Hooks</h3>
                  <div className="quick-summary-list">
                    <div className="summary-item"><span className="summary-label">Read Settings</span><span className="summary-value">GET {SETTINGS_API_URL}</span></div>
                    <div className="summary-item"><span className="summary-label">Save Settings</span><span className="summary-value">PUT {SETTINGS_API_URL}</span></div>
                    <div className="summary-item"><span className="summary-label">Read Profile</span><span className="summary-value">GET {PROFILE_API_URL}</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Notifications" && (
              <div className="settings-form-grid two-column-settings">
                {[
                  ["emailNotif", "Email Notifications"],
                  ["smsNotif", "SMS Notifications"],
                  ["pushNotif", "In-app Push Notifications"],
                ].map(([name, label]) => (
                  <label className="settings-toggle-row" key={name}>
                    <span>{label}</span>
                    <input type="checkbox" name={name} checked={systemSettings[name]} onChange={updateSystem} />
                  </label>
                ))}
              </div>
            )}

            {activeTab === "Modules" && (
              <div className="settings-modules-grid inline-modules-grid">
                {modules.map((module) => (
                  <div className="module-card" key={module.id}>
                    <div className="module-header">
                      <div className="module-icon icon-blue">{module.id}</div>
                      <div className="module-title"><h4>{module.title}</h4></div>
                    </div>
                    <div className="module-title"><p>{module.desc}</p></div>
                    <div className="module-status">
                      <span className={module.statusColor}>{module.status}</span>
                      <button className="btn-link" onClick={() => {
                        if (module.id === 1) navigate('/admin/inventory');
                        else if (module.id === 2) navigate('/admin/expiry');
                        else if (module.id === 3) navigate('/admin/users');
                        else if (module.id === 4) setActiveTab("Notifications");
                        else if (module.id === 5) setActiveTab("Security");
                        else if (module.id === 6) navigate('/admin/reports');
                      }}>Configure</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Security" && (
              <div className="settings-empty-state">
                JWT authentication, OAuth2 login, password reset, session timeout, and two-factor controls are ready for Spring Security endpoints.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
