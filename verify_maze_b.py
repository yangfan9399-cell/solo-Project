import json
import urllib.request

BASE = 'http://localhost:3002'

req = urllib.request.Request(
    f'{BASE}/api/sessions',
    data=json.dumps({'mazeKey': 'B'}).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
resp = urllib.request.urlopen(req)
ses = json.loads(resp.read())
sid = ses['id']
print(f'Session: {sid}')
print(f'Start: pos={ses["currentPos"]}, light={ses["field"]["lightValue"]}, reverse={ses["field"]["reverseMark"]}')

# Row 0: S . r g . R . R E   
# Row 1: . # . # . # . . #   
# Row 2: . ! . H . r . . T   
# Row 3: # . . . . . . # .   (7,3)=#
# Row 4: . T . r . g . H .   
# Row 5: . # . . # . # . .   
# Row 6: R . . ! . . R g .   

path = [
    (1,0), (2,0), (3,0), (4,0), (5,0),   # r1 at (2,0), R at (5,0)+3
    (6,0), (7,0),                          # R at (7,0)+2
    (7,1), (7,2), (6,2), (5,2),           # r2 at (5,2)
    (5,3), (5,4),                          # g at (5,4)+1
    (4,4), (3,4),                          # r3 -> HIDDEN TRIGGER! +8lv +3D
    (4,4), (5,4), (6,4), (7,4),           # H at (7,4) -> +4lv +2D
    (6,4), (6,3), (6,2), (7,2),           # back up via (6,3) not (7,3)
    (7,1), (7,0), (8,0)                   # to end
]

for x, y in path:
    req = urllib.request.Request(
        f'{BASE}/api/sessions/{sid}/move',
        data=json.dumps({'x': x, 'y': y}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    try:
        resp = urllib.request.urlopen(req)
        s = json.loads(resp.read())
        f = s['field']
        events = s['steps'][-1]['eventsTriggered']
        ev_str = f' events={events}' if events else ''
        print(f'  ->({x},{y}) light={f["lightValue"]} reverse={f["reverseMark"]} risk={f["riskA"]} reward={f["rewardD"]} fail={f["failureB"]} hidden={s["hiddenTriggered"]} status={s["status"]}{ev_str}')
        if s['status'] != 'playing':
            break
    except urllib.error.HTTPError as e:
        err = json.loads(e.read().decode())
        print(f'  ->({x},{y}) ERROR: {err["error"]}')
        break

req2 = urllib.request.Request(f'{BASE}/api/sessions/{sid}/settlement')
resp2 = urllib.request.urlopen(req2)
settle = json.loads(resp2.read())
print(f'\n=== Settlement ===')
print(f'Final Score: {settle["finalScore"]}')
print(f'Grade: {settle["grade"]}')
for d in settle['details']:
    print(f'  {d}')
