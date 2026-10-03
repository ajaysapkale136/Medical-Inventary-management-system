path = r'c:\Users\DELL\Desktop\Medical Inventory Management System\frontend\src\dashboards\admin\AdminExpiry.jsx'
with open(path, encoding='utf-8') as f:
    content = f.read()
if content.startswith('\ufeff'):
    content = content[1:]
content = content.replace("''", "'")
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed OK')
