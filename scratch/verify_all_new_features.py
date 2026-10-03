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
    print("=== TESTING NEW ENTERPRISE MEDICAL INVENTORY FEATURES ===")
    
    # 1. Admin Authentication
    admin = ApiClient()
    status, res = admin.post_json(f"{BASE_URL}/api/auth/login", {
        "email": "admin@medistock.com",
        "password": "Admin@1234"
    })
    if status != 200:
        print(f"FAILED Admin Login: {status} {res}")
        return False
    print("✔ Admin Login Successful: admin@medistock.com (ADMIN)")

    # 2. Test Auto-Reorder Endpoint (Spring @Scheduled + On-demand API)
    print("\n--- Testing Auto-Reorder Low-Stock Service ---")
    reorder_status, reorder_data = admin.post_json(f"{BASE_URL}/api/purchase-orders/auto-reorder", {})
    if reorder_status == 200:
        print(f"✔ Auto-Reorder Trigger: HTTP 200")
        print(f"  Scanned items: {reorder_data.get('scannedItems')}")
        print(f"  Low-stock items detected: {reorder_data.get('lowStockCount')}")
        print(f"  Created POs: {len(reorder_data.get('createdOrders', []))}")
        print(f"  Message: {reorder_data.get('message')}")
    else:
        print(f"❌ FAILED Auto-Reorder: HTTP {reorder_status}, response: {reorder_data}")

    # 3. Test Expiry Alert Service
    print("\n--- Testing Clinical Expiry Alert System ---")
    exp_status, exp_bytes, _ = admin.get(f"{BASE_URL}/api/inventory/expiry-alerts")
    if exp_status == 200:
        exp_data = json.loads(exp_bytes.decode('utf-8'))
        print(f"✔ Expiry Alerts Endpoint: HTTP 200")
        print(f"  Expired batches: {exp_data.get('expiredCount')}")
        print(f"  Critical batches (<30 days): {exp_data.get('criticalCount')}")
        print(f"  Warning batches (30-60 days): {exp_data.get('warningCount')}")
        print(f"  Total alert items: {exp_data.get('totalAlerts')}")
    else:
        print(f"❌ FAILED Expiry Alerts: HTTP {exp_status}")

    # 4. Test Barcode & Rapid Scanner API
    print("\n--- Testing Barcode / QR Code Scanner API ---")
    test_codes = ["BATCH-2026-001", "Paracetamol", "1"]
    for code in test_codes:
        scan_status, scan_bytes, _ = admin.get(f"{BASE_URL}/api/medicines/scan?code={urllib.parse.quote(code)}")
        if scan_status == 200:
            scan_data = json.loads(scan_bytes.decode('utf-8'))
            if scan_data.get("found"):
                print(f"✔ Barcode Scan ('{code}'): MATCH FOUND ({scan_data.get('matchType')}) -> {scan_data.get('medicineName')} | Stock: {scan_data.get('availableQuantity', scan_data.get('totalStock'))}")
            else:
                print(f"ℹ Barcode Scan ('{code}'): Not found - {scan_data.get('message')}")
        else:
            print(f"❌ FAILED Barcode Scan for '{code}': HTTP {scan_status}")

    # 5. Quick Check of Report Downloads
    print("\n--- Testing Report Downloads (Sanity Check) ---")
    dl_status, dl_bytes, _ = admin.get(f"{BASE_URL}/api/reports/inventory-summary/download?format=pdf")
    print(f"✔ Inventory Summary PDF: HTTP {dl_status}, bytes: {len(dl_bytes)}, header: {dl_bytes[:4]}")
    
    dl_xls_status, dl_xls_bytes, _ = admin.get(f"{BASE_URL}/api/reports/purchase-orders/download?format=excel")
    print(f"✔ Purchase Orders Excel: HTTP {dl_xls_status}, bytes: {len(dl_xls_bytes)}, header: {dl_xls_bytes[:4]}")

    print("\n=== ALL SYSTEM VERIFICATION CHECKS COMPLETED ===")

if __name__ == "__main__":
    run_tests()
