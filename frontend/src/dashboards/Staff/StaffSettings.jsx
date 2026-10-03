import React, { useEffect, useState } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest } from "../../lib/api";
import "./StaffSettings.css";

const API_URL = "/api/auth/profile";
const PREFERENCES_API_URL = "/api/preferences";

const defaultProfile = {
  fullName: "",
  staffId: "",
  email: "",
  phone: "",
  branch: "",
  shift: "Day Shift",
  roleScope: "Inventory receiving, stock checks, and order support",
  address: "",
  barcodeMode: "Batch and SKU",
  reorderRequestLimit: 50,
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
};

const StaffSettings = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [profile, setProfile] = useState(defaultProfile);
  const [status, setStatus] = useState("Loading saved settings...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [data, preferences] = await Promise.all([
          apiRequest(API_URL),
          apiRequest(PREFERENCES_API_URL),
        ]);
        setProfile((current) => ({
          ...defaultProfile,
          ...preferences,
          fullName: data.name || current.fullName,
          email: data.email || current.email,
          phone: data.phone || "",
          branch: data.location || "",
          roleScope: data.department || "",
        }));
        setStatus("Saved settings loaded");
      } catch (error) {
        setStatus(error.message || "Settings could not be loaded");
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
    try {
      await Promise.all([
        apiRequest(API_URL, {
        method: "PUT",
        body: {
          name: profile.fullName,
          phone: profile.phone,
          department: profile.roleScope,
          location: profile.branch,
        },
        }),
        apiRequest(PREFERENCES_API_URL, { method: "PUT", body: profile }),
      ]);

      setStatus("Profile saved to backend");
    } catch (error) {
      setStatus(error.message || "Profile could not be saved. Check your connection and sign in again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaffLayout title="Staff Settings">
      <div className="settings-wrapper staff-settings role-settings">
        <div className="settings-inner-sidebar glass-panel">
          <div className="settings-nav-header">Staff Settings</div>
          {["Profile", "Work Rules", "Notifications", "Security"].map((tab) => (
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
                <p>Manage your staff account, shift workflow, and inventory operation preferences.</p>
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
                    <label>Staff ID</label>
                    <input className="settings-input" name="staffId" value={profile.staffId} onChange={updateField} />
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
                    <label>Role Scope</label>
                    <textarea className="settings-textarea" name="roleScope" value={profile.roleScope} onChange={updateField} />
                  </div>
                  <div className="settings-group">
                    <label>Address</label>
                    <textarea className="settings-textarea" name="address" value={profile.address} onChange={updateField} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Work Rules" && (
              <div className="settings-form-grid two-column-settings">
                <div className="form-column">
                  <div className="settings-group">
                    <label>Shift</label>
                    <select className="settings-select" name="shift" value={profile.shift} onChange={updateField}>
                      <option>Day Shift</option>
                      <option>Evening Shift</option>
                      <option>Night Shift</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label>Barcode Mode</label>
                    <select className="settings-select" name="barcodeMode" value={profile.barcodeMode} onChange={updateField}>
                      <option>Batch and SKU</option>
                      <option>SKU Only</option>
                      <option>Batch Only</option>
                    </select>
                  </div>
                  <div className="settings-group">
                    <label>Reorder Request Limit</label>
                    <input className="settings-input" name="reorderRequestLimit" type="number" value={profile.reorderRequestLimit} onChange={updateField} />
                  </div>
                </div>
                <div className="form-column quick-summary-col">
                  <h3 className="panel-header">Backend Hooks</h3>
                  <div className="quick-summary-list">
                    <div className="summary-item"><span className="summary-label">Read Profile</span><span className="summary-value">GET {API_URL}</span></div>
                    <div className="summary-item"><span className="summary-label">Save Profile</span><span className="summary-value">PUT {API_URL}</span></div>
                    <div className="summary-item"><span className="summary-label">Role</span><span className="summary-value">STAFF</span></div>
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
                Password reset, JWT session refresh, and account security controls are ready for Spring Security endpoints.
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffSettings;
