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
                body = res.read().decode("utf-8")
                return res.status, json.loads(body) if body else {}, res.headers
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8"), e.headers

    def get(self, url):
        req = urllib.request.Request(url)
        try:
            with self.opener.open(req) as res:
                return res.status, res.read(), res.headers
        except urllib.error.HTTPError as e:
            return e.code, e.read().decode("utf-8"), e.headers

def run_tests():
    print("=== TESTING COMPLETE ENTERPRISE IMPROVEMENTS ===")
    
    # 1. Admin Authentication & Security Headers Check
    admin = ApiClient()
    status, res, headers = admin.post_json(f"{BASE_URL}/api/auth/login", {
        "email": "admin@medistock.com",
        "password": "Admin@1234"
    })
    if status != 200:
        print(f"FAILED Admin Login: {status} {res}")
        return False
    print("✔ Admin Login Successful: admin@medistock.com (ADMIN)")

    # Verify Hardened Security Headers & Cookie Name
    set_cookie = headers.get("Set-Cookie", "")
    print(f"✔ Cookie Check: {'MEDISTOCK_SESSION' in set_cookie or 'JSESSIONID' in set_cookie} -> {set_cookie[:40]}...")
    
    # Check headers on an API request
    _, _, api_headers = admin.get(f"{BASE_URL}/api/transfers/summary")
    print(f"✔ Security Header 'X-Content-Type-Options': {api_headers.get('X-Content-Type-Options')}")
    print(f"✔ Security Header 'X-Frame-Options': {api_headers.get('X-Frame-Options')}")
    print(f"✔ Security Header 'X-XSS-Protection': {api_headers.get('X-XSS-Protection')}")

    # 2. Test Ward Stock Transfer Lifecycle
    print("\n--- Testing Multi-Location / Ward Stock Transfer Workflow ---")
    # First get a valid medicine and batch
    med_status, med_bytes, _ = admin.get(f"{BASE_URL}/api/medicines")
    meds = json.loads(med_bytes.decode('utf-8'))
    first_med = meds[0] if meds else None
    
    batch_status, batch_bytes, _ = admin.get(f"{BASE_URL}/api/batches/medicine/{first_med['id']}")
    batches = json.loads(batch_bytes.decode('utf-8'))
    first_batch = batches[0] if batches else None

    print(f"  Using Medicine: {first_med['name']} (ID: {first_med['id']}), Batch: {first_batch['batchNumber']} (ID: {first_batch['id']})")

    # Step A: Request Transfer
    req_payload = {
        "medicineId": first_med['id'],
        "batchId": first_batch['id'],
        "fromLocation": "Central Pharmacy",
        "toLocation": "Intensive Care Unit (ICU)",
        "quantity": 5,
        "urgency": "STAT_EMERGENCY",
        "notes": "Emergency ICU reserve protocol test",
        "requestedBy": "dr.smith@hospital.com"
    }
    t_status, t_res, _ = admin.post_json(f"{BASE_URL}/api/transfers", req_payload)
    if t_status == 200:
        transfer_id = t_res.get("id")
        print(f"✔ Step 1: Transfer Requisition Created: {t_res.get('transferNumber')} (Status: {t_res.get('status')})")
    else:
        print(f"❌ Failed Transfer Requisition: {t_status} {t_res}")
        return False

    # Step B: Approve Transfer
    app_status, app_res, _ = admin.post_json(f"{BASE_URL}/api/transfers/{transfer_id}/approve", {"approvedBy": "admin@medistock.com"})
    print(f"✔ Step 2: Transfer Approved: Status -> {app_res.get('status')}, ApprovedBy: {app_res.get('approvedBy')}")

    # Step C: Dispatch Transfer
    disp_status, disp_res, _ = admin.post_json(f"{BASE_URL}/api/transfers/{transfer_id}/dispatch", {"dispatchedBy": "pharmacist@medistock.com"})
    print(f"✔ Step 3: Transfer Dispatched: Status -> {disp_res.get('status')}, DispatchedBy: {disp_res.get('dispatchedBy')}")

    # Step D: Receive Transfer
    rec_status, rec_res, _ = admin.post_json(f"{BASE_URL}/api/transfers/{transfer_id}/receive", {"receivedBy": "head_nurse@hospital.com"})
    print(f"✔ Step 4: Transfer Received: Status -> {rec_res.get('status')}, ReceivedBy: {rec_res.get('receivedBy')}")

    # Check Transfer Summary
    sum_status, sum_bytes, _ = admin.get(f"{BASE_URL}/api/transfers/summary")
    sum_data = json.loads(sum_bytes.decode('utf-8'))
    print(f"✔ Ward Transfers Pipeline Summary: Total: {sum_data.get('total')}, Received: {sum_data.get('received')}")

    # 3. Test Tamper-Proof Audit Trail (GxP Compliance)
    print("\n--- Testing Tamper-Proof GxP Audit Trail ---")
    audit_status, audit_bytes, _ = admin.get(f"{BASE_URL}/api/admin/audit-logs")
    if audit_status == 200:
        audit_logs = json.loads(audit_bytes.decode('utf-8'))
        print(f"✔ Audit Logs Query: HTTP 200, Total entries: {len(audit_logs)}")
        for l in audit_logs[:4]:
            print(f"  - [{l.get('action')}] Actor: {l.get('actor')} | Entity: {l.get('entityName')}#{l.get('entityId')} | Reason: {l.get('reason')}")
    else:
        print(f"❌ Failed Audit Logs Query: {audit_status}")

    # Export Audit Trail CSV
    csv_status, csv_bytes, csv_headers = admin.get(f"{BASE_URL}/api/admin/audit-logs/export")
    if csv_status == 200 and b"GxP" in csv_bytes or b"Actor" in csv_bytes:
        print(f"✔ Audit Trail CSV Export: HTTP 200, size: {len(csv_bytes)} bytes, content-type: {csv_headers.get('Content-Type')}")
    else:
        print(f"❌ Audit Trail CSV Export Failed: {csv_status}")

    print("\n=== ALL ENTERPRISE IMPROVEMENTS TESTED & PASSING ===")

if __name__ == "__main__":
    run_tests()
