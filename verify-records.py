import json

with open("data/tea-garden-store.json") as f:
    d = json.load(f)

for k in d:
    if isinstance(d[k], list):
        print(f"{k}: {len(d[k])} 条")
        if d[k]:
            print(f"  字段: {list(d[k][0].keys())}")
    else:
        print(f"{k}: {type(d[k]).__name__}")

print()
if d.get("game_sessions"):
    s = d["game_sessions"][0]
    print("game_sessions[0] (主记录示例 - 局次主数据):")
    for k, v in s.items():
        if isinstance(v, str) and len(v) > 80:
            print(f"  {k}: {v[:80]}...")
        else:
            print(f"  {k}: {v}")

print()
if d.get("game_actions"):
    a = d["game_actions"][0]
    print("game_actions[0] (明细记录示例 - 采茶篮/制茶工位动作):")
    for k, v in a.items():
        if isinstance(v, str) and len(v) > 80:
            print(f"  {k}: {v[:80]}...")
        else:
            print(f"  {k}: {v}")

print()
if d.get("tea_maturity_history"):
    m = d["tea_maturity_history"][-1]
    print("tea_maturity_history[-1] (历史记录示例 - 不同海拔茶青成熟时段):")
    for k, v in m.items():
        print(f"  {k}: {v}")

print()
if d.get("game_results"):
    r = d["game_results"][-2]
    print("game_results[-2] (结果记录before示例 - 山风影响预估):")
    for k, v in r.items():
        if isinstance(v, str) and len(v) > 120:
            print(f"  {k}: {v[:120]}...")
        else:
            print(f"  {k}: {v}")
    r = d["game_results"][-1]
    print("\ngame_results[-1] (结果记录after示例 - 收益结算):")
    for k, v in r.items():
        if isinstance(v, str) and len(v) > 120:
            print(f"  {k}: {v[:120]}...")
        else:
            print(f"  {k}: {v}")
