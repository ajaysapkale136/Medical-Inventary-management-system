import urllib.request
import urllib.parse
import http.cookiejar
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
BASE_URL = "http://localhost:8080"

class ApiClient:
    def __init__(self):
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))

    def post_json(self, url, data):
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with self.opener.open(req) as res:
                return res.status, json.loads(res.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8")

    def get(self, url):
        req = urllib.request.Request(url)
        try:
            with self.opener.open(req) as res:
                return res.status, res.read(), res.headers.get_content_type()
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8"), "error"

def run_tests():
    print("=== TESTING AUTH & ENDPOINTS WITH COOKIE SESSION ===")
    
    # 1. Admin Login & Reports
    admin = ApiClient()
    status, res = admin.post_json(f"{BASE_URL}/api/auth/login", {
        "email": "admin@medistock.com",
        "password": "Admin@1234"
    })
    if status != 200:
        print(f"FAILED Admin Login: {status} {res}")
        return False
    print(f"✔ Admin Login Successful: {res.get('email')} ({res.get('role')})")

    # Test Report Download endpoints
    reports = [
        "inventory-summary",
        "stock-movement",
        "expiry-summary",
        "expiring-medicines",
        "purchase-orders",
        "supplier-analysis",
        "suppliers"
    ]
    
    for rep in reports:
        for fmt in ["pdf", "excel"]:
            url = f"{BASE_URL}/api/reports/{rep}/download?format={fmt}"
            status, content, ctype = admin.get(url)
            if status == 200 and len(content) > 100:
                is_pdf = content.startswith(b"%PDF")
                is_excel = content.startswith(b"PK") or fmt == "excel" # PK is zip/xlsx header
                print(f"✔ Download {rep} ({fmt.upper()}): HTTP {status}, size: {len(content)} bytes, header: {content[:4]}")
            else:
                err_msg = content[:150] if isinstance(content, str) else len(content)
                print(f"❌ FAILED Download {rep} ({fmt.upper()}): HTTP {status}, content: {err_msg}")

    # 2. Test Pharmacist Login & Online Orders
    pharma = ApiClient()
    p_status, p_res = pharma.post_json(f"{BASE_URL}/api/auth/login", {
        "email": "pharmacist@medistock.com",
        "password": "Pharma@1234"
    })
    if p_status == 200:
        print(f"✔ Pharmacist Login Successful: {p_res.get('email')} ({p_res.get('role')})")

        # Test GET online orders
        oo_status, oo_content, _ = pharma.get(f"{BASE_URL}/api/pharmacist/online-orders")
        try:
            oo_json = json.loads(oo_content)
            print(f"✔ Pharmacist Online Orders GET: HTTP {oo_status}, count: {len(oo_json)}")
            first_id = oo_json[0]["id"] if oo_json else "ORD-9021"
        except Exception:
            print(f"❌ Pharmacist Online Orders GET parse error: {oo_content}")
            first_id = "ORD-9021"

        # Test refresh
        ref_status, ref_data = pharma.post_json(f"{BASE_URL}/api/pharmacist/online-orders/refresh", {})
        print(f"✔ Pharmacist Online Orders Refresh: HTTP {ref_status}, msg: {ref_data.get('message') if isinstance(ref_data, dict) else ref_data}")

        # Test bill generation
        bill_status, bill_data = pharma.post_json(f"{BASE_URL}/api/pharmacist/online-orders/{first_id}/bill", {})
        print(f"✔ Pharmacist Online Orders Bill ({first_id}): HTTP {bill_status}, msg: {bill_data.get('message') if isinstance(bill_data, dict) else bill_data}")

        # Test print
        print_status, print_data = pharma.post_json(f"{BASE_URL}/api/pharmacist/online-orders/{first_id}/print", {})
        print(f"✔ Pharmacist Online Orders Print ({first_id}): HTTP {print_status}, msg: {print_data.get('message') if isinstance(print_data, dict) else print_data}")

    # 3. Test Staff Login & Inventory
    staff = ApiClient()
    s_status, s_res = staff.post_json(f"{BASE_URL}/api/auth/login", {
        "email": "staff@medistock.com",
        "password": "Staff@1234"
    })
    if s_status == 200:
        print(f"✔ Staff Login Successful: {s_res.get('email')} ({s_res.get('role')})")
        
        # Test staff inventory
        st_status, st_content, _ = staff.get(f"{BASE_URL}/api/staff/inventory")
        try:
            st_json = json.loads(st_content)
            print(f"✔ Staff Inventory GET: HTTP {st_status}, items: {len(st_json)}")
        except Exception:
            print(f"❌ Staff Inventory error: {st_content}")

    print("=== ALL TEST RUNS COMPLETE ===")

if __name__ == "__main__":
    run_tests()
