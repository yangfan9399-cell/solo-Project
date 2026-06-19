import json
import urllib.request

BASE = "http://localhost:3001/api"

def post(path, data):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        return resp.status, json.loads(resp.read())

def get(path):
    with urllib.request.urlopen(BASE + path) as resp:
        return json.loads(resp.read())

print("=== Test 1: Create Anomaly ===")
status, j = post("/anomalies", {
    "sensorCode": "WD-TEST-001",
    "towerPosition": "T99-Z",
    "preCalibration": 100,
    "postCalibration": 200,
    "threshold": 5,
    "handler": "Engineer1",
})
print(f"Status: {status}")
print(f"Created: id={j['data']['id']}, status={j['data']['status']}, sensor={j['data']['sensor_code']}")

print("\n=== Test 2: Create Retest ===")
data = get("/anomalies")["data"]
target = [a for a in data if a["status"] != "closed"][0]
print(f"Using anomaly: {target['id']} {target['sensor_code']} status={target['status']}")

status, j = post("/retests", {
    "anomalyId": target["id"],
    "preCalibration": 100,
    "postCalibration": 102,
    "retester": "Retester1",
})
print(f"Status: {status}")
if "data" in j:
    print(f"Retest: id={j['data']['id']}, deviation={j['data']['deviation']}")
else:
    print(f"Error: {j}")

print("\n=== Test 3: Create Rule ===")
status, j = post("/rules", {
    "name": "TestTempRange",
    "minValue": -50,
    "maxValue": 150,
    "threshold": 3,
})
print(f"Status: {status}")
if "data" in j:
    print(f"Rule: id={j['data']['id']}, version={j['data']['version']}, min={j['data']['min_value']}, max={j['data']['max_value']}")
else:
    print(f"Error: {j}")

print("\n=== Test 4: Verify Transitions after Retest ===")
trans = get(f"/transitions/{target['id']}")["data"]
print(f"Transitions count: {len(trans)}")
for t in trans:
    print(f"  {t['from_status']} -> {t['to_status']} ({t['comment']}) by {t['operator']}")

print("\n=== Test 5: Check updated anomaly status ===")
data2 = get("/anomalies")["data"]
target2 = [a for a in data2 if a["id"] == target["id"]][0]
print(f"Anomaly status after retest: {target2['status']}")
