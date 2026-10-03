import React, { useMemo, useState, useEffect } from "react";
import PharmacyLayout from "./PharmacyLayout"; // Wrapped in global layout
import { apiRequest } from "../../lib/api";
import "./PharmacistNotifications.css";

function PharmacistNotifications() {
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/notifications");
      const mapped = (data || []).map((n) => {
        const typeStr = n.type ? n.type.replace(/_/g, " ") : "SYSTEM";
        return {
          id: n.id,
          type: typeStr.toUpperCase(),
          title: n.title || "Alert",
          message: n.message || "",
          medicine: n.batch?.medicine?.name || n.medicine?.name || "-",
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recently",
          priority: (n.priority || "NORMAL").toUpperCase(),
          read: n.status === "READ" || n.status === "DISMISSED"
        };
      });
      setNotifications(mapped);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === "ALL") return notifications;
    if (filter === "UNREAD") return notifications.filter((item) => !item.read);
    return notifications.filter((item) => item.type.includes(filter));
  }, [notifications, filter]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const markAsRead = async (id) => {
    try {
      await apiRequest(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((current) =>
        current.map((notification) => notification.id === id ? { ...notification, read: true } : notification)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications.filter((n) => !n.read).map((n) =>
          apiRequest(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {})
        )
      );
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await apiRequest(`/api/notifications/${id}/dismiss`, { method: "PATCH" });
      setNotifications((current) => current.filter((notification) => notification.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PharmacyLayout title="Notifications">
      <div className="pharmacist-notifications">

        {/* HEADER */}
        <header className="notification-header">
          <div>
            <div className="notification-breadcrumb">Dashboard › Notifications</div>
            <h1>Alerts & Notifications</h1>
            <p>Important inventory and system alerts.</p>
          </div>
          <button className="mark-all-btn" onClick={markAllAsRead}>
            Mark All as Read
          </button>
        </header>

        {/* SUMMARY */}
        <section className="notification-summary">
          <div className="notification-summary-card">
            <span>Total Notifications</span>
            <strong>{notifications.length}</strong>
          </div>
          <div className="notification-summary-card">
            <span>Unread</span>
            <strong className="unread-number">{unreadCount}</strong>
          </div>
          <div className="notification-summary-card">
            <span>High Priority</span>
            <strong className="high-number">{notifications.filter((item) => item.priority === "HIGH").length}</strong>
          </div>
          <div className="notification-summary-card">
            <span>Critical</span>
            <strong className="critical-number">{notifications.filter((item) => item.priority === "CRITICAL").length}</strong>
          </div>
        </section>

        {/* FILTER */}
        <section className="notification-filter">
          <button className={filter === "ALL" ? "active" : ""} onClick={() => setFilter("ALL")}>All</button>
          <button className={filter === "UNREAD" ? "active" : ""} onClick={() => setFilter("UNREAD")}>Unread</button>
          <button className={filter === "LOW STOCK" ? "active" : ""} onClick={() => setFilter("LOW STOCK")}>Low Stock</button>
          <button className={filter === "EXPIRY" ? "active" : ""} onClick={() => setFilter("EXPIRY")}>Expiry</button>
          <button className={filter === "OUT OF STOCK" ? "active" : ""} onClick={() => setFilter("OUT OF STOCK")}>Out of Stock</button>
          <button className={filter === "PURCHASE" ? "active" : ""} onClick={() => setFilter("PURCHASE")}>Purchases</button>
        </section>

        {/* NOTIFICATION LIST */}
        <section className="notification-list">
          <div className="list-header">
            <div>
              <h2>Alert Center</h2>
              <p>{filteredNotifications.length} notifications</p>
            </div>
          </div>

          {filteredNotifications.length === 0 ? (
            <div className="empty-notifications">
              <div>✓</div>
              <h3>No Notifications</h3>
              <p>There are no notifications matching your filter.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.id} className={`notification-item ${notification.read ? "read" : "unread"}`}>
                
                <div className={`notification-icon ${notification.type.toLowerCase().replaceAll(" ", "-")}`}>
                  {notification.type === "LOW STOCK" && "📉"}
                  {notification.type === "EXPIRY" && "⏰"}
                  {notification.type === "OUT OF STOCK" && "🚫"}
                  {notification.type === "PURCHASE" && "🛒"}
                  {notification.type === "SYSTEM" && "⚙️"}
                </div>

                <div className="notification-content">
                  <div className="notification-title-row">
                    <h3>{notification.title}</h3>
                    {!notification.read && <span className="new-badge">NEW</span>}
                  </div>
                  <p>{notification.message}</p>
                  
                  <div className="notification-meta">
                    <span>💊 {notification.medicine}</span>
                    <span>🕒 {notification.time}</span>
                    <span className={`priority ${notification.priority.toLowerCase()}`}>
                      {notification.priority}
                    </span>
                  </div>
                </div>

                <div className="notification-actions">
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)}>Mark Read</button>
                  )}
                  <button className="delete-notification" onClick={() => deleteNotification(notification.id)}>✕</button>
                </div>

              </div>
            ))
          )}
        </section>

        {/* ALERT RULES */}
        <section className="notification-rules">
          <h2>Notification Rules</h2>
          <div className="rules-grid">
            <div>
              <strong>Low Stock</strong>
              <p>Triggered when stock falls below reorder level.</p>
            </div>
            <div>
              <strong>Expiry</strong>
              <p>Triggered for medicines approaching expiry.</p>
            </div>
            <div>
              <strong>Out of Stock</strong>
              <p>Triggered when available quantity reaches zero.</p>
            </div>
            <div>
              <strong>Purchase</strong>
              <p>Triggered when purchase-order status changes.</p>
            </div>
          </div>
        </section>

      </div>
    </PharmacyLayout>
  );
}

export default PharmacistNotifications;