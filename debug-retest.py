import json
import urllib.request

BASE = "http://localhost:3001/api"

def get(path):
    with urllib.request.urlopen(BASE + path) as resp:
        return json.loads(resp.read())

# Find the browser-created anomaly
anomalies = get("/anomalies")["data"]
browser_anom = [a for a in anomalies if a["sensor_code"] == "WD-BROWSER-001"]
if browser_anom:
    a = browser_anom[0]
    print(f"Anomaly: id={a['id']}, sensor={a['sensor_code']}, status={a['status']}")
    print(f"  pre={a['pre_calibration']}, post={a['post_calibration']}, dev={a['deviation']}")

    # Check retests
    retests = get(f"/retests/{a['id']}")
    print(f"  Retests: {json.dumps(retests, ensure_ascii=False)}")

    # Check transitions
    trans = get(f"/transitions/{a['id']}")
    print(f"  Transitions: {json.dumps(trans, ensure_ascii=False)}")
else:
    print("WD-BROWSER-001 not found")
