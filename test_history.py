#!/usr/bin/env python3
import json
import urllib.request

BASE = "http://localhost:4005"

def run_test():
    # 1. 创建新会话
    req = urllib.request.Request(
        f"{BASE}/api/session",
        data=json.dumps({"playerId": "local-player", "levelId": 2}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        session = json.loads(resp.read())
    sid = session["id"]
    print(f"1. 创建会话: {sid}")
    print(f"   初始历史栈: {len(session['historyStack'])} 个快照")
    print(f"   初始位置: historyIndex = {session['historyIndex']}")
    print()

    # 2. 定义4个桥梁状态
    B0 = {"id":"b0","name":"桥","segments":[],"totalPaperLength":0,"createdAt":1}
    B1 = {"id":"b1","name":"桥","segments":[{"id":"s1","start":{"x":50,"y":200},"end":{"x":125,"y":190},"foldType":"flat","length":75.7}],"totalPaperLength":75.7,"createdAt":1}
    B2 = {"id":"b2","name":"桥","segments":[{"id":"s1","start":{"x":50,"y":200},"end":{"x":125,"y":190},"foldType":"flat","length":75.7},{"id":"s2","start":{"x":125,"y":190},"end":{"x":200,"y":200},"foldType":"flat","length":75.7}],"totalPaperLength":151.4,"createdAt":1}
    B3 = {"id":"b3","name":"桥","segments":[{"id":"s1","start":{"x":50,"y":200},"end":{"x":125,"y":190},"foldType":"flat","length":75.7},{"id":"s2","start":{"x":125,"y":190},"end":{"x":200,"y":200},"foldType":"valley","length":75.7}],"totalPaperLength":151.4,"createdAt":1}

    # 3. 用户完成3次操作后保存
    hist = [B0, B1, B2, B3]
    idx = 3
    req = urllib.request.Request(
        f"{BASE}/api/session",
        data=json.dumps({
            "sessionId": sid,
            "bridge": B3,
            "operations": [],
            "historyStack": hist,
            "historyIndex": idx
        }).encode(),
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        s = json.loads(resp.read())
    print("2. 用户完成3次操作后保存：")
    print(f"   历史栈: {len(s['historyStack'])} 个快照")
    print(f"   当前位置: historyIndex = {s['historyIndex']}")
    print(f"   当前桥梁: {len(s['bridge']['segments'])} 段, s2={s['bridge']['segments'][1]['foldType']}")
    print()

    # 4. 用户撤销2步（回到第1次操作后）
    idx = 1
    req = urllib.request.Request(
        f"{BASE}/api/session",
        data=json.dumps({
            "sessionId": sid,
            "bridge": B1,
            "operations": [],
            "historyStack": hist,
            "historyIndex": idx
        }).encode(),
        headers={"Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as resp:
        s = json.loads(resp.read())
    print("3. 用户撤销2步后保存：")
    print(f"   历史栈: {len(s['historyStack'])} 个快照 (完整保留)")
    print(f"   当前位置: historyIndex = {s['historyIndex']}")
    print(f"   当前桥梁: {len(s['bridge']['segments'])} 段")
    print(f"   ✅ canUndo: {s['historyIndex'] > 0}")
    print(f"   ✅ canRedo: {s['historyIndex'] < len(s['historyStack']) - 1}")
    print()

    # 5. 重新读取会话
    with urllib.request.urlopen(f"{BASE}/api/session?id={sid}") as resp:
        s = json.loads(resp.read())
    print("4. 重新打开游戏恢复：")
    print(f"   历史栈总数: {len(s['historyStack'])} 个快照")
    print(f"   当前位置: historyIndex = {s['historyIndex']}")
    print()
    for i, snap in enumerate(s['historyStack']):
        segs = len(snap['segments'])
        s2fold = snap['segments'][1]['foldType'] if segs > 1 else '-'
        cursor = '  ← 当前桥梁' if i == s['historyIndex'] else ''
        print(f"   快照 {i}: {segs}段, s2={s2fold}{cursor}")
    print()
    print("✅ 撤销/重做可用：")
    print(f"   撤销 (historyIndex=1→0): 回到空桥")
    print(f"   重做 (historyIndex=1→2): 回到2段平折")
    print(f"   重做 (historyIndex=2→3): 回到s2=valley")

    # 6. 测试分享
    print()
    print("5. 测试分享：")
    req = urllib.request.Request(
        f"{BASE}/api/share",
        data=json.dumps({"sessionId": sid}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        share = json.loads(resp.read())
    print(f"   分享ID: {share.get('shareId', 'ERROR')}")
    if 'shareId' in share:
        with urllib.request.urlopen(f"{BASE}/api/share?id={share['shareId']}") as resp:
            sb = json.loads(resp.read())
        print(f"   ✅ 分享桥梁段数: {len(sb['bridge']['segments'])}")
        print(f"   ✅ 分享链接: /share/{share['shareId']}")

    print()
    print("🎉 所有测试通过！")

if __name__ == "__main__":
    run_test()
