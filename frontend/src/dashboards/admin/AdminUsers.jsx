import React, { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './DashboardLayout';
import { apiRequest } from '../../lib/api';
import './AdminUsers.css';

const AdminUsers = () => {
  const [selectedUserModal, setSelectedUserModal] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // --- STATE MANAGEMENT ---
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, new: 0, blocked: 0 });
  const [userList, setUserList] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [recentLogins, setRecentLogins] = useState([]);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "STAFF" });
  const [toastMsg, setToastMsg] = useState("");

  const [filters, setFilters] = useState({
    search: '', role: 'All Roles', status: 'All Status', startDate: '', endDate: '', location: 'All Locations'
  });

  const fetchUserData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/api/admin/users");
      setStats(data.stats || { total: 0, active: 0, inactive: 0, new: 0, blocked: 0 });
      setUserList(data.userList || []);
      setFilteredUsers(data.userList || []);
      setRecentLogins(data.recentLogins || []);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    let result = userList;
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(u => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.phone && u.phone.includes(term)));
    }
    if (filters.role !== 'All Roles') result = result.filter(u => u.role.toUpperCase() === filters.role.toUpperCase());
    if (filters.status !== 'All Status') result = result.filter(u => u.status === filters.status);
    if (filters.location !== 'All Locations') result = result.filter(u => u.location === filters.location);
    setFilteredUsers(result);
  }, [filters, userList]);

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => setFilters({ search: '', role: 'All Roles', status: 'All Status', startDate: '', endDate: '', location: 'All Locations' });

  const getRoleClass = (role) => {
    if (role === 'Admin') return 'role-admin';
    if (role === 'Pharmacist') return 'role-pharmacist';
    return 'role-staff';
  };

  const getBadgeClass = (status) => {
    if (status === 'Active') return 'badge-success';
    if (status === 'Inactive') return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <DashboardLayout title="User Tracking">
      {error && <div className="page-loading">{error}</div>}
      {toastMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#a7f3d0',
          padding: '10px 16px',
          borderRadius: '8px',
          margin: '0 0 1rem 0'
        }}>
          {toastMsg}
        </div>
      )}
      
      {/* 1. TOP SUMMARY CARDS */}
      <div className="users-stats-grid">
        <div className="glass-panel stat-box">
          <div className="stat-top">Total Users <div className="stat-icon icon-blue">👥</div></div>
          <h3 className="stat-val">{stats.total}</h3>
          <span className="stat-sub text-blue">All time</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Active Users <div className="stat-icon icon-green">🟢</div></div>
          <h3 className="stat-val">{stats.active}</h3>
          <span className="stat-sub text-green">77.34% of total</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Inactive Users <div className="stat-icon icon-orange">🟡</div></div>
          <h3 className="stat-val">{stats.inactive}</h3>
          <span className="stat-sub text-orange">16.41% of total</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">New Users <span className="stat-sub">(This Month)</span> <div className="stat-icon icon-blue">👤</div></div>
          <h3 className="stat-val">{stats.new}</h3>
          <span className="stat-sub text-blue">+12.5% from last month</span>
        </div>
        <div className="glass-panel stat-box">
          <div className="stat-top">Blocked / Suspended <div className="stat-icon icon-red">⛔</div></div>
          <h3 className="stat-val">{stats.blocked}</h3>
          <span className="stat-sub text-red">6.25% of total</span>
        </div>
      </div>

      {/* 2. FILTERS */}
      <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
        <div className="filters-container" style={{ marginBottom: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
            <div className="filter-group">
              <label>Search</label>
              <input type="text" name="search" value={filters.search} onChange={handleFilterChange} className="filter-input" placeholder="Search by name, email or phone..." />
            </div>
            <div className="filter-group hide-mobile">
              <label>Role</label>
              <select name="role" value={filters.role} onChange={handleFilterChange} className="filter-input">
                <option>All Roles</option><option>Admin</option><option>Pharmacist</option><option>Staff</option>
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Status</label>
              <select name="status" value={filters.status} onChange={handleFilterChange} className="filter-input">
                <option>All Status</option><option>Active</option><option>Inactive</option><option>Blocked</option>
              </select>
            </div>
            <div className="filter-group hide-mobile">
              <label>Joined Date</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="filter-input" />
                <span style={{color: '#94A3B8', alignSelf: 'center'}}>to</span>
                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="filter-input" />
              </div>
            </div>
            <div className="filter-group hide-mobile">
              <label>Location / Branch</label>
              <select name="location" value={filters.location} onChange={handleFilterChange} className="filter-input">
                <option>All Locations</option><option>Head Office - Pune</option><option>Branch - Mumbai</option>
              </select>
            </div>
          </div>
          <div className="filter-actions">
            <button className="btn-primary" onClick={() => setIsAddModalOpen(true)}>➕ Add New User</button>
            <button className="btn-secondary" onClick={() => {
              const csv = [
                ["Name", "Email", "Phone", "Role", "Joined", "Status"],
                ...filteredUsers.map(u => [u.name, u.email, u.phone, u.role, u.joined, u.status])
              ].map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "Users_List.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}>📤 Export CSV</button>
            <button className="btn-secondary" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </div>

      {/* 3. MAIN SPLIT LAYOUT (75% / 25%) */}
      <div className="users-main-split">
        
        {/* LEFT COLUMN: Main Users Table */}
        <div className="users-left-col glass-panel">
          <h3 className="panel-header">Users List</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length} onChange={(e) => setSelectedIds(e.target.checked ? filteredUsers.map(u => u.id) : [])} /></th>
                  <th>User Name</th>
                  <th className="hide-mobile">Email</th>
                  <th className="hide-mobile">Phone</th>
                  <th>Role</th>
                  <th className="hide-mobile">Location / Branch</th>
                  <th className="hide-mobile">Joined Date</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="10" style={{textAlign: 'center'}}>Loading...</td></tr> : 
                  filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td><input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => setSelectedIds(prev => prev.includes(user.id) ? prev.filter(x => x !== user.id) : [...prev, user.id])} /></td>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-initials">{user.initials}</div>
                        <span style={{color: '#00B4D8', fontWeight: '600'}}>{user.name}</span>
                      </div>
                    </td>
                    <td className="hide-mobile">{user.email}</td>
                    <td className="hide-mobile">{user.phone}</td>
                    <td><span className={`role-text ${getRoleClass(user.role)}`}>{user.role}</span></td>
                    <td className="hide-mobile">{user.location}</td>
                    <td className="hide-mobile">{user.joined}</td>
                    <td>{user.lastLogin}</td>
                    <td><span className={`status-badge ${getBadgeClass(user.status)}`}>{user.status}</span></td>
                    <td>
                      <div className="table-icons">
                        <button className="icon-btn" title="View details" onClick={() => setSelectedUserModal(user)}>👁️</button>
                        <button className="icon-btn delete" title="Delete user" onClick={async () => {
                          if (window.confirm(`Delete user ${user.name}?`)) {
                            await apiRequest(`/api/users/${user.id}`, { method: 'DELETE' });
                            await fetchUserData();
                          }
                        }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-container">
            <div>Showing 1 to {filteredUsers.length} of {stats.total} entries</div>
          </div>
        </div>

        {/* RIGHT COLUMN: Overviews & Alerts */}
        <div className="users-right-col">
          <div className="glass-panel">
            <h3 className="panel-header">User Activity Overview</h3>
            <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Active Users',   value: stats.active,   color: '#4ade80' },
                { label: 'Inactive Users', value: stats.inactive, color: '#f59e0b' },
                { label: 'Blocked Users',  value: stats.blocked,  color: '#f43f5e' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span style={{ color: item.color }}>{item.label}</span>
                    <strong style={{ color: item.color }}>{item.value}</strong>
                  </div>
                  <div style={{ height: '8px', background: '#1e3a5f', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: stats.total > 0 ? `${Math.max(4, (item.value / stats.total) * 100)}%` : '0%',
                      background: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid #1e3a5f', paddingTop: '8px' }}>
                <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>Total Registered</span>
                <strong style={{ color: '#00B4D8' }}>{stats.total}</strong>
              </div>
            </div>
          </div>
          
          <div className="glass-panel">
            <h3 className="panel-header">Quick Actions</h3>
            <div className="action-list">
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => setIsAddModalOpen(true)}>👤 Add New User</div>
              <div className="action-list-item" style={{ cursor: 'pointer' }} onClick={() => fetchUserData()}>🔄 Refresh Directory</div>
            </div>
          </div>

          <div className="glass-panel">
            <h3 className="panel-header">Alerts</h3>
            <div className="alert-list">
              <div className="alert-list-item"><div className="dot orange"></div> <span className="text-orange font-bold">{stats.inactive}</span> inactive user accounts</div>
              <div className="alert-list-item"><div className="dot green"></div> <span className="text-green font-bold">{stats.active}</span> active users in good standing</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM 4-COLUMN GRID */}
      <div className="users-bottom-grid">
        
        <div className="glass-panel">
          <h3 className="panel-header">User Registrations</h3>
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
            <h2 style={{ fontSize: '2.5rem', color: '#00B4D8', margin: 0 }}>{stats.total}</h2>
            <p style={{ color: '#94A3B8', margin: 0 }}>Registered Staff & Admins</p>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Role Wise Users</h3>
          <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="role-admin">Admin</span>
              <strong>{userList.filter(u => u.role.toUpperCase() === 'ADMIN').length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="role-pharmacist">Pharmacist</span>
              <strong>{userList.filter(u => u.role.toUpperCase() === 'PHARMACIST').length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="role-staff">Staff</span>
              <strong>{userList.filter(u => u.role.toUpperCase() === 'STAFF').length}</strong>
            </div>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">System Security</h3>
          <div style={{ height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px', padding: '15px' }}>
            <div style={{ color: '#10B981', fontSize: '0.85rem' }}>✓ Session Authentication Active</div>
            <div style={{ color: '#10B981', fontSize: '0.85rem' }}>✓ Role-based API Protection</div>
            <div style={{ color: '#00B4D8', fontSize: '0.85rem' }}>✓ Passwords BCrypt Encrypted</div>
          </div>
        </div>

        <div className="glass-panel">
          <h3 className="panel-header">Recent Logins</h3>
          <div className="table-responsive" style={{marginBottom: 0}}>
            <table className="data-table" style={{minWidth: '200px'}}>
              <tbody>
                {loading ? <tr><td>Loading...</td></tr> : recentLogins.map(login => (
                  <tr key={login.id}>
                    <td style={{fontSize: '0.8rem', color: '#CAF0F8'}}>{login.name}</td>
                    <td style={{fontSize: '0.8rem', color: '#94A3B8'}} className="hide-mobile">{login.time}</td>
                    <td style={{fontSize: '0.8rem', color: '#94A3B8'}} className="hide-mobile">{login.location}</td>
                    <td style={{fontSize: '0.8rem', textAlign: 'right'}} className={login.status === 'Success' ? 'text-green' : 'text-red'}>{login.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '450px', width: '90%', padding: '24px', borderRadius: '12px', background: '#0d1b2a', border: '1px solid #1e3a5f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>Create System User</h3>
              <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setIsAddModalOpen(false)}>×</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRequest("/api/auth/register", {
                  method: "POST",
                  body: newUser
                });
                setIsAddModalOpen(false);
                setNewUser({ name: "", email: "", password: "", role: "STAFF" });
                setToastMsg("User created successfully.");
                setTimeout(() => setToastMsg(""), 4000);
                await fetchUserData();
              } catch (err) {
                setToastMsg(`❌ ${err.message || "Failed to create user"}`);
                setTimeout(() => setToastMsg(""), 5000);
              }
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Full Name *</label>
                <input required className="filter-input" style={{ width: '100%' }} value={newUser.name} onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Email *</label>
                <input required type="email" className="filter-input" style={{ width: '100%' }} value={newUser.email} onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Password *</label>
                <input required type="password" minLength="6" className="filter-input" style={{ width: '100%' }} value={newUser.password} onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '4px' }}>Role *</label>
                <select className="filter-input" style={{ width: '100%' }} value={newUser.role} onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="STAFF">Staff</option>
                  <option value="PHARMACIST">Pharmacist</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {/* VIEW USER DETAILS MODAL */}
      {selectedUserModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '500px', padding: '24px', background: '#0a192f', border: '1px solid #1e3a5f', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #1e3a5f', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#00B4D8' }}>User Account Details</h3>
              <button onClick={() => setSelectedUserModal(null)} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Full Name</span><strong style={{ color: '#CAF0F8' }}>{selectedUserModal.name}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Email Address</span><strong style={{ color: '#CAF0F8' }}>{selectedUserModal.email}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Phone</span><strong style={{ color: '#CAF0F8' }}>{selectedUserModal.phone || 'N/A'}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Role</span><span className={`role-text ${getRoleClass(selectedUserModal.role)}`}>{selectedUserModal.role}</span></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Assigned Location</span><strong style={{ color: '#CAF0F8' }}>{selectedUserModal.location}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Date Joined</span><strong style={{ color: '#CAF0F8' }}>{selectedUserModal.joined}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Last Login</span><strong style={{ color: '#CAF0F8' }}>{selectedUserModal.lastLogin}</strong></div>
              <div><span style={{ color: '#94A3B8', display: 'block' }}>Account Status</span><span className={`status-badge ${getBadgeClass(selectedUserModal.status)}`}>{selectedUserModal.status}</span></div>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-secondary" onClick={() => setSelectedUserModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

export default AdminUsers;