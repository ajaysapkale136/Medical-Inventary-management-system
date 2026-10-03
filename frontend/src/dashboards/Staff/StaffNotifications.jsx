import React, { useState, useEffect, useMemo } from "react";
import StaffLayout from "./StaffLayout";
import { apiRequest } from "../../lib/api";
import "./StaffNotifications.css";

const API_BASE_URL = "/api/staff/notifications";

function StaffNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [summary, setSummary] = useState({ total: 0, unread: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [viewModal, setViewModal] = useState({ isOpen: false, notif: null });

  // Filter States
  const [typeFilter, setTypeFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // --- DATABASE & BACKEND CONNECTION ---
  useEffect(() => {
    fetchNotificationsData();
  }, []);

  const fetchNotificationsData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(API_BASE_URL);
      setNotifications(data.notifications || []);
      setSummary({ total: 0, unread: 0, critical: 0, ...(data.summary || {}) });
    } catch (err) {
      setError(err.message || "Failed to load notifications from database");
    } finally {
      setLoading(false);
    }
  };

  // Filter Computation
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      const matchType = typeFilter === "All" || item.type.toLowerCase() === typeFilter.toLowerCase();
      const matchPriority = priorityFilter === "All" || item.priority.toLowerCase() === priorityFilter.toLowerCase();
      const matchStatus = statusFilter === "All" || (statusFilter === "Unread" ? !item.read : item.read);

      return matchType && matchPriority && matchStatus;
    });
  }, [notifications, typeFilter, priorityFilter, statusFilter]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest(`${API_BASE_URL}/read-all`, { method: "POST" });
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setSummary((prev) => ({ ...prev, unread: 0 }));
      setFeedbackMsg("All notifications marked as read.");
      setTimeout(() => setFeedbackMsg(""), 4000);
    } catch (e) {
      setFeedbackMsg(e.message || "Failed to mark notifications read");
      setTimeout(() => setFeedbackMsg(""), 4000);
    }
  };

  const handleViewNotification = async (notif) => {
    try {
      await apiRequest(`${API_BASE_URL}/${notif.id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((item) => item.id === notif.id ? { ...item, read: true } : item)
      );
      setSummary((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
    } catch (e) {
      // proceed to view
    }
    setViewModal({ isOpen: true, notif });
  };

  return (
    <StaffLayout title="Notifications">
      <div className="staff-notifications-page">
        
        {/* HEADER */}
        <div className="staff-notif-header">
          <div>
            <div className="staff-notif-breadcrumb">Dashboard ? Notifications</div>
            <h1>Notifications</h1>
          </div>
          <button className="mark-read-btn" onClick={handleMarkAllRead}>
            [Mark All Read]
          </button>
        </div>
        {error && <div className="page-loading">{error}</div>}

        {/* FEEDBACK BANNER */}
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
        <div className="staff-notif-summary-grid">
          <div className="staff-notif-summary-card">
            <div className="notif-icon icon-total">??</div>
            <div>
              <span>Total</span>
              <strong>{summary.total}</strong>
            </div>
          </div>

          <div className="staff-notif-summary-card">
            <div className="notif-icon icon-unread">??</div>
            <div>
              <span>Unread</span>
              <strong>{summary.unread}</strong>
            </div>
          </div>

          <div className="staff-notif-summary-card">
            <div className="notif-icon icon-critical">??</div>
            <div>
              <span>Critical</span>
              <strong>{summary.critical}</strong>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="staff-notif-filter-bar">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="All">Type ?</option>
            <option value="Expiry Alert">Expiry Alert</option>
            <option value="Stock Alert">Stock Alert</option>
            <option value="Order Update">Order Update</option>
            <option value="System">System</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="All">Priority ?</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Info">Info</option>
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">Status ?</option>
            <option value="Unread">Unread</option>
            <option value="Read">Read</option>
          </select>

          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
            <option value="All">Date ?</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="older">Older</option>
          </select>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="notif-list-container">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>No notifications match the filter.</div>
          ) : (
            filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`notif-card ${!notif.read ? "unread" : ""}`}
                onClick={() => handleViewNotification(notif)}
              >
                <div className="notif-card-header">
                  <div className="notif-title-area">
                    <span className={`priority-badge badge-${notif.priority.toLowerCase()}`}>
                      {notif.priority}
                    </span>
                    <h3>{notif.title}</h3>
                  </div>
                  <span className="notif-time">{notif.time}</span>
                </div>

                <p className="notif-desc">{notif.message}</p>

                <div className="notif-card-footer">
                  <span className="notif-type-tag">Category: {notif.type}</span>
                  {!notif.read && <span className="unread-indicator">? New</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* PAGINATION */}
        <div className="notif-pagination">
          <button 
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            [? Prev]
          </button>
          <button 
            className={`page-btn ${currentPage === 1 ? "active" : ""}`}
            onClick={() => setCurrentPage(1)}
          >
            [1]
          </button>
          <button 
            className={`page-btn ${currentPage === 2 ? "active" : ""}`}
            onClick={() => setCurrentPage(2)}
          >
            [2]
          </button>
          <button 
            className={`page-btn ${currentPage === 3 ? "active" : ""}`}
            onClick={() => setCurrentPage(3)}
          >
            [3]
          </button>
          <button 
            className="page-btn"
            onClick={() => setCurrentPage((p) => Math.min(3, p + 1))}
          >
            [Next ?]
          </button>
        </div>

        {/* NOTIFICATION VIEW MODAL */}
        {viewModal.isOpen && viewModal.notif && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }} onClick={() => setViewModal({ isOpen: false, notif: null })}>
            <div className="modal-content" style={{
              background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px',
              padding: '1.5rem', width: '480px', maxWidth: '90%', color: '#fff'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#00B4D8' }}>?? {viewModal.notif.title}</h3>
                <button onClick={() => setViewModal({ isOpen: false, notif: null })} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>?</button>
              </div>
              <div style={{ marginTop: '1rem', fontSize: '0.95rem', color: '#e2e8f0', lineHeight: '1.5' }}>
                <p>{viewModal.notif.message}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '10px', borderTop: '1px solid #1e293b', fontSize: '0.85rem', color: '#94A3B8' }}>
                <span>Priority: <strong style={{ color: viewModal.notif.priority === 'Critical' ? '#f43f5e' : '#f59e0b' }}>{viewModal.notif.priority}</strong></span>
                <span>Type: <strong style={{ color: '#00B4D8' }}>{viewModal.notif.type}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                <button
                  onClick={() => setViewModal({ isOpen: false, notif: null })}
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

export default StaffNotifications;
