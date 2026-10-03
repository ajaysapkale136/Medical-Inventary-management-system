path = r'c:\Users\DELL\Desktop\Medical Inventory Management System\frontend\src\dashboards\Pharmacist\PharmacistOnlineOrders.jsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find start of unusedOldAlert
start_idx = None
end_idx = None
for i, line in enumerate(lines):
    if "const unusedOldAlert" in line:
        start_idx = i
    if start_idx is not None and "alert(data.message || \"Printing invoice...\");" in line:
        end_idx = i + 2 # inclusive of };
        break

print(f"start_idx: {start_idx}, end_idx: {end_idx}")

new_func = [
    '  const printInvoice = async (orderId) => {\n',
    '    try {\n',
    '      const data = await apiRequest(`/api/pharmacist/online-orders/${orderId}/print`, { method: "POST" });\n',
    '      showToast(`🖨️ ${data.message || "Preparing invoice print preview..."}`);\n',
    '      window.print();\n',
    '    } catch (err) {\n',
    '      showToast(`❌ ${err.message || "Failed to print invoice"}`);\n',
    '    }\n',
    '  };\n'
]

lines[start_idx:end_idx] = new_func

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("SUCCESSFULLY REPLACED")
