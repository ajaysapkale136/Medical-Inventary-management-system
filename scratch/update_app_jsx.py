path = r'c:\Users\DELL\Desktop\Medical Inventory Management System\frontend\src\App.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize newlines
content = content.replace('\r\n', '\n')

old_import = 'import AdminSettings from "./dashboards/admin/AdminSettings";'
new_import = '''import AdminSettings from "./dashboards/admin/AdminSettings";
import AdminAuditTrail from "./dashboards/admin/AdminAuditTrail";
import WardTransfers from "./dashboards/common/WardTransfers";'''

content = content.replace(old_import, new_import)

# Add routes
old_admin_routes = '<Route path="/admin/settings" element={<ProtectedRoute roles={["ADMIN"]}><AdminSettings /></ProtectedRoute>} />'
new_admin_routes = '''<Route path="/admin/settings" element={<ProtectedRoute roles={["ADMIN"]}><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/audit" element={<ProtectedRoute roles={["ADMIN"]}><AdminAuditTrail /></ProtectedRoute>} />
        <Route path="/admin/transfers" element={<ProtectedRoute roles={["ADMIN"]}><WardTransfers /></ProtectedRoute>} />'''

content = content.replace(old_admin_routes, new_admin_routes)

# Add pharmacy transfer route
old_pharma_routes = '<Route path="/pharmacy/settings" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistSettings /></ProtectedRoute>} />'
new_pharma_routes = '''<Route path="/pharmacy/settings" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><PharmacistSettings /></ProtectedRoute>} />
        <Route path="/pharmacy/transfers" element={<ProtectedRoute roles={["PHARMACIST", "ADMIN"]}><WardTransfers /></ProtectedRoute>} />'''

content = content.replace(old_pharma_routes, new_pharma_routes)

# Add staff transfer route
old_staff_routes = '<Route path="/staff/settings" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffSettings /></ProtectedRoute>} />'
new_staff_routes = '''<Route path="/staff/settings" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><StaffSettings /></ProtectedRoute>} />
        <Route path="/staff/transfers" element={<ProtectedRoute roles={["STAFF", "PHARMACIST", "ADMIN"]}><WardTransfers /></ProtectedRoute>} />'''

content = content.replace(old_staff_routes, new_staff_routes)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("APP.JSX UPDATED SUCCESSFULLY")
