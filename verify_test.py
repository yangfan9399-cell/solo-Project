import urllib.request, json

def api(method, path, body=None):
    url = 'http://localhost:3000' + path
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers={'Content-Type':'application/json'}, method=method)
    return json.loads(urllib.request.urlopen(req).read())

print("=== Phase 1: Play multiple steps ===")
start_data = api('POST', '/api/games/shen/start', {'sessionId':'e2e_test2'})
s0 = start_data['state']
print(f"Started: node={s0['currentNode']} cal={s0['calibrationMarks']} strip={s0['strippingValue']}")

replay_data = [{'turn': 0, 'action': 'start', 'payload': None, 'randomOutcomes': None, 'state': s0}]

data = api('POST', '/api/sessions/e2e_test2/action', {'action':'move','payload':{'nodeId':'n1'}})
s = data['state']
ro = data.get('randomOutcomes')
replay_data.append({'turn': s['turn'], 'action':'move', 'payload':{'nodeId':'n1'}, 'randomOutcomes': ro, 'state': s})
print(f"Move n1: node={s['currentNode']} cal={s['calibrationMarks']} strip={s['strippingValue']} events={len(s['eventLog'])} ro={ro}")

data = api('POST', '/api/sessions/e2e_test2/action', {'action':'end_turn'})
s = data['state']
ro = data.get('randomOutcomes')
replay_data.append({'turn': s['turn'], 'action':'end_turn', 'payload':None, 'randomOutcomes': ro, 'state': s})
print(f"End turn1: turn={s['turn']} cal={s['calibrationMarks']} strip={s['strippingValue']} events={len(s['eventLog'])}")

data = api('POST', '/api/sessions/e2e_test2/action', {'action':'move','payload':{'nodeId':'n3'}})
s = data['state']
ro = data.get('randomOutcomes')
replay_data.append({'turn': s['turn'], 'action':'move', 'payload':{'nodeId':'n3'}, 'randomOutcomes': ro, 'state': s})
print(f"Move n3: node={s['currentNode']} cal={s['calibrationMarks']} strip={s['strippingValue']} events={len(s['eventLog'])} ro={ro}")

data = api('POST', '/api/sessions/e2e_test2/action', {'action':'end_turn'})
s = data['state']
ro = data.get('randomOutcomes')
replay_data.append({'turn': s['turn'], 'action':'end_turn', 'payload':None, 'randomOutcomes': ro, 'state': s})
print(f"End turn2: turn={s['turn']} cal={s['calibrationMarks']} strip={s['strippingValue']} events={len(s['eventLog'])}")

data = api('POST', '/api/sessions/e2e_test2/action', {'action':'use_slot','payload':{'type':'calibrate'}})
s = data['state']
ro = data.get('randomOutcomes')
replay_data.append({'turn': s['turn'], 'action':'use_slot', 'payload':{'type':'calibrate'}, 'randomOutcomes': ro, 'state': s})
print(f"Slot calibrate: cal={s['calibrationMarks']} slots={s['usedSlots']}/{s['rehearsalSlots']}")

direct_state = {
    'cal': s['calibrationMarks'],
    'strip': s['strippingValue'],
    'node': s['currentNode'],
    'events': len(s['eventLog']),
    'risk_events': len([e for e in s['eventLog'] if 'risk' in e.get('type','')]),
    'reward_events': len([e for e in s['eventLog'] if 'reward' in e.get('type','')]),
}
print(f"\nDirect state: {direct_state}")

print("\n=== Phase 2: Save replay to server (simulating frontend saveReplayToServer) ===")
api('POST', '/api/replay/save', {'sessionId':'e2e_test2', 'replayData': replay_data})
print("Replay saved to server")

print("\n=== Phase 3: Settlement recalculates from replay ===")
data = api('POST', '/api/sessions/e2e_test2/settlement', {})
r = data['settlement']['finalState']
recalc_state = {
    'cal': r['calibrationMarks'],
    'strip': r['strippingValue'],
    'node': r['currentNode'],
    'events': len(r.get('eventLog', [])),
    'risk_events': len([e for e in r.get('eventLog', []) if 'risk' in e.get('type','')]),
    'reward_events': len([e for e in r.get('eventLog', []) if 'reward' in e.get('type','')]),
}
print(f"Recalc state: {recalc_state}")
print(f"recalculated: {data['settlement'].get('recalculated')}")

match = direct_state == recalc_state
print(f"\n=== RESULT: Direct vs Recalc {'MATCH' if match else 'MISMATCH'} ===")
if not match:
    for k in direct_state:
        if direct_state[k] != recalc_state.get(k):
            print(f"  DIFF {k}: direct={direct_state[k]} recalc={recalc_state.get(k)}")
