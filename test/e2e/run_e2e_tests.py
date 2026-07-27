import os
import sys
import time
import urllib.request
import json

print("==================================================")
print("     LawVoice E2E Live Automation Test Suite      ")
print("==================================================")
print("Target Frontend URL : http://localhost:5170")
print("Target Backend URL  : http://localhost:8082")
print("--------------------------------------------------")

frontend_url = "http://localhost:5170"
backend_url = "http://localhost:8082"

def test_endpoint(url, description):
    start = time.time()
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            code = response.getcode()
            elapsed = time.time() - start
            print(f"[PASS] {description:<45} | Status: {code} | Time: {elapsed:.2f}s")
            return True
    except Exception as e:
        print(f"[FAIL] {description:<45} | Error: {e}")
        return False

# Execute End-to-End Suite Validations
tests = [
    (frontend_url, "Frontend Web App Home (http://localhost:5170)"),
    (f"{backend_url}/api/ai/status", "Backend AI Status API Endpoint"),
    (f"{backend_url}/api/lawyers", "Backend Lawyer Directory API"),
    (f"{backend_url}/api/rti/my-drafts", "Backend RTI Application Drafts API"),
    (f"{backend_url}/api/deadlines/my-deadlines", "Backend Legal Deadline Tracker API")
]

passed_count = 0
for url, desc in tests:
    if test_endpoint(url, desc):
        passed_count += 1

print("--------------------------------------------------")
print(f"Executed {len(tests)} core verification probes: {passed_count}/{len(tests)} Passed.")
print("==================================================")
