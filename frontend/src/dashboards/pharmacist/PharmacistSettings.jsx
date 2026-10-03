import React, { useEffect, useState } from "react";
import PharmacyLayout from "./PharmacyLayout";
import { apiRequest } from "../../lib/api";
import "./PharmacistSettings.css";

const API_URL = "/api/auth/profile";
const STORAGE_KEY = "medistock.pharmacist.profile";

const defaultProfile = {
  fullName: "Priya Mehta",
  employeeId: "PHR-2048",
  email: "priya.mehta@citycarepharmacy.com",
  phone: "+91 97654 32109",
  branch: "Mumbai Central Pharmacy",
  licenseNumber: "MH-PH-77421",
  shift: "Morning Shift",
  specialization: "Inventory and Dispensing",
  address: "42, Health Avenue, Mumbai, Maharashtra",
  lowStockThreshold: 25,
  expiryAlertDays: 30,
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
};

const PharmacistSettings = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [profile, setProfile] = useState(defaultProfile);
  const [status, setStatus] = useState("Local draft ready");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setProfile({ ...defaultProfile, ...JSON.parse(saved) });
    }

    const fetchProfile = async () => {
      try {
        const data = await apiRequest(API_URL);
        setProfile((current) => ({
          ...current,
          fullName: data.name || current.fullName,
          email: data.email || current.email,
          phone: data.phone || "",
          branch: data.location || "",
          specialization: data.department || "",
        }));
        setStatus("Loaded from backend profile API");
      } catch (error) {
        setStatus(error.message || "Using local profile until backend API is available");
      }
    };

    fetchProfile();
  }, []);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setProfile((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const saveProfile = async () => {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

    try {
      await apiRequest(API_URL, {
        method: "PUT",
        body: {
          name: profile.fullName,
          phone: profile.phone,
          department: profile.specialization,
          location: profile.branch,
        },
      });

      setStatus("Profile saved to backend");
    } catch (error) {
      setStatus(error.message || "Profile could not be saved. Check your connection and sign in again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PharmacyLayout title="Pharmacist Settings">
      <div className="settings-wrapper role-settings">
        <div className="settings-inner-sidebar glass-panel">
          <div className="settings-nav-header">Pharmacist Settings</div>
          {["Profile", "Inventory Rules", "Notifications", "Security"].map((tab) => (
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
                <p>Manage your pharmacist account, alert thresholds, and dispensing preferences.</p>
              </div>
              <div className="settings-actions">
                <button className="btn-secondary" onClick={() => setProfile(defaultProfile)}>Reset</button>
                <button className="btn-primary" onClick={saveProfile} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div className="role-settings-status">{status}</div>

            {activeTab === "Profile" && (
              <div className="settings-form-grid two-column-settings">
                <div className="form-column">
                  <div className="settings-group">
                    <label>Full Name</label>
                    <input className="settings-input" name="fullName" value={profile.fullName} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Employee ID</label>
                    <input className="settings-input" name="employeeId" value={profile.employeeId} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Email</label>
                    <input className="settings-input" name="email" type="email" value={profile.email} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Phone</label>
                    <input className="settings-input" name="phone" value={profile.phone} onChange={updateField} />
                  </div>
                </div>
                <div className="form-column">
                  <div className="settings-group">
                    <label>Branch</label>
                    <input className="settings-input" name="branch" value={profile.branch} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>License Number</label>
                    <input className="settings-input" name="licenseNumber" value={profile.licenseNumber} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Specialization</label>
                    <input className="settings-input" name="specialization" value={profile.specialization} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Address</label>
                    <textarea className="settings-textarea" name="address" value={profile.address} onChange={updateField} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Inventory Rules" && (
              <div className="settings-form-grid two-column-settings">
                <div className="form-column">
                  <div className="settings-group">
                    <label>Low Stock Threshold</label>
                    <input className="settings-input" name="lowStockThreshold" type="number" value={profile.lowStockThreshold} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Expiry Alert Days</label>
                    <input className="settings-input" name="expiryAlertDays" type="number" value={profile.expiryAlertDays} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Default Shift</label>
                    <select className="settings-select" name="shift" value={profile.shift} onChange={updateField}>
                      <option>Morning Shift</option>
                      <option>Evening Shift</option>
                      <option>Night Shift</option>
                    </select>
                  </div>
                </div>
                <div className="form-column quick-summary-col">
                  <h3 className="panel-header">Backend Hooks</h3>
                  <div className="quick-summary-list">
                    <div className="summary-item"><span className="summary-label">Read Profile</span><span className="summary-value">GET {API_URL}</span></div>
                    <div className="summary-item"><span className="summary-label">Save Profile</span><span className="summary-value">PUT {API_URL}</span></div>
                    <div className="summary-item"><span className="summary-label">Role</span><span className="summary-value">PHARMACIST</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Notifications" && (
              <div className="settings-form-grid two-column-settings">
                {[
                  ["emailNotifications", "Email Notifications"],
                  ["pushNotifications", "In-app Push Notifications"],
                  ["smsNotifications", "SMS Notifications"],
                ].map(([name, label]) => (
                  <label className="settings-toggle-row" key={name}>
                    <span>{label}</span>
                    <input type="checkbox" name={name} checked={profile[name]} onChange={updateField} />
                  </label>
                ))}
              </div>
            )}

            {activeTab === "Security" && (
              <div className="settings-empty-state">
                Password reset, OAuth2, JWT session, and two-factor controls are ready for the Spring Security endpoints.
              </div>
            )}
          </div>
        </div>
      </div>
    </PharmacyLayout>
  );
};

export default PharmacistSettings;
