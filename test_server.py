#!/usr/bin/env python3
import subprocess
import time
import sys
import os
import signal

PORT = 8765

def start_server():
    env = os.environ.copy()
    proc = subprocess.Popen(
        [sys.executable, 'server.py'],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env
    )
    time.sleep(2)
    return proc

def test_api():
    import urllib.request
    import json

    base = f'http://localhost:{PORT}'

    print(f"\n=== 测试健康检查 ===")
    try:
        req = urllib.request.Request(f'{base}/api/health', method='GET')
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("✅ 健康检查通过:", data)
    except Exception as e:
        print("❌ 健康检查失败:", e)
        return False

    print(f"\n=== 测试结算重算 (壬局) ===")
    try:
        payload = {
            'levelId': 'ren',
            'history': [
                {'effect': {'unlockValue': 3, 'unlockSlots': -1, 'renRisk': -1}},
                {'effect': {'unlockValue': 5, 'traceMarks': 1, 'unlockSlots': -1}}
            ],
            'hiddenTriggered': False
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f'{base}/api/recalculate',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            print("✅ 重算成功:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print("❌ 重算失败:", e)
        return False

    print(f"\n=== 测试结算重算 (卯局隐藏结局) ===")
    try:
        payload = {
            'levelId': 'mao',
            'history': [
                {'effect': {'unlockValue': 2, 'traceMarks': 2}},
                {'effect': {'unlockValue': 3, 'traceMarks': 2, 'maoFailFactor': 1}},
                {'effect': {'unlockValue': 1, 'traceMarks': 3}}
            ],
            'hiddenTriggered': True
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            f'{base}/api/recalculate',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode('utf-8'))
            print("✅ 卯局隐藏结局重算成功:")
            print(json.dumps(result, ensure_ascii=False, indent=2))
    except Exception as e:
        print("❌ 卯局重算失败:", e)
        return False

    return True

if __name__ == '__main__':
    print("正在启动苔藓邮站后端服务...")
    server = start_server()
    try:
        success = test_api()
        if success:
            print("\n🎉 所有测试通过！后端服务运行正常。")
            print(f"请访问 http://localhost:{PORT}/ 体验游戏")
            print("\n服务器保持运行中，按 Ctrl+C 停止...")
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\n正在停止服务器...")
        else:
            print("\n❌ 部分测试失败")
            server.terminate()
            sys.exit(1)
    finally:
        if server.poll() is None:
            server.terminate()
            server.wait()
