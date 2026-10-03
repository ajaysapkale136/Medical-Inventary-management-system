# Update DashboardLayout.jsx
path_admin = r'c:\Users\DELL\Desktop\Medical Inventory Management System\frontend\src\dashboards\admin\DashboardLayout.jsx'
with open(path_admin, 'r', encoding='utf-8') as f:
    c = f.read().replace('\r\n', '\n')

old_admin_items = '{ label: "Alerts", path: "/admin/alerts", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" },'
new_admin_items = '''{ label: "Alerts", path: "/admin/alerts", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" },
  { label: "Ward Transfers", path: "/admin/transfers", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { label: "GxP Audit Trail", path: "/admin/audit", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },'''

if old_admin_items in c:
    c = c.replace(old_admin_items, new_admin_items)
    with open(path_admin, 'w', encoding='utf-8') as f:
        f.write(c)
    print("DashboardLayout.jsx updated")

# Update StaffLayout.jsx
path_staff = r'c:\Users\DELL\Desktop\Medical Inventory Management System\frontend\src\dashboards\Staff\StaffLayout.jsx'
with open(path_staff, 'r', encoding='utf-8') as f:
    cs = f.read().replace('\r\n', '\n')

old_staff_nav = '{ label: "Reports", path: "/staff/reports"'
new_staff_nav = '''{ label: "Ward Transfers", path: "/staff/transfers", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { label: "Reports", path: "/staff/reports"'''

if old_staff_nav in cs and '/staff/transfers' not in cs:
    cs = cs.replace(old_staff_nav, new_staff_nav)
    with open(path_staff, 'w', encoding='utf-8') as f:
        f.write(cs)
    print("StaffLayout.jsx updated")

# Update PharmacyLayout.jsx
path_pharma = r'c:\Users\DELL\Desktop\Medical Inventory Management System\frontend\src\dashboards\pharmacist\PharmacyLayout.jsx'
with open(path_pharma, 'r', encoding='utf-8') as f:
    cp = f.read().replace('\r\n', '\n')

old_pharma_nav = '{ label: "Reports", path: "/pharmacy/reports"'
new_pharma_nav = '''{ label: "Ward Transfers", path: "/pharmacy/transfers", icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" },
  { label: "Reports", path: "/pharmacy/reports"'''

if old_pharma_nav in cp and '/pharmacy/transfers' not in cp:
    cp = cp.replace(old_pharma_nav, new_pharma_nav)
    with open(path_pharma, 'w', encoding='utf-8') as f:
        f.write(cp)
    print("PharmacyLayout.jsx updated")
