#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
潮汐钟塔航线推演局 - 后端结算服务
使用 Python 标准库，无需额外依赖。
"""

import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = BASE_DIR
PORT = 8123

LEVEL_MULTIPLIERS = {
    "jia":  {"base": 10, "reward": 6,  "risk": 8,  "fail": 15, "step": 4},
    "ding": {"base": 12, "reward": 8,  "risk": 10, "fail": 20, "step": 5},
    "yi":   {"base": 10, "reward": 6,  "risk": 9,  "fail": 18, "step": 4},
}

LEVEL_INFO = {
    "jia":  {"name": "甲局 · 启蒙教学", "lightTarget": 70},
    "ding": {"name": "丁局 · 资源短缺", "lightTarget": 90},
    "yi":   {"name": "乙局 · 隐藏条件", "lightTarget": 80},
}


def calculate_settlement(level_id, game_state, history=None):
    mult = LEVEL_MULTIPLIERS.get(level_id, LEVEL_MULTIPLIERS["jia"])
    info = LEVEL_INFO.get(level_id, LEVEL_INFO["jia"])

    light_value = game_state.get("lightValue", 0)
    reward_d = game_state.get("rewardD", 0)
    risk_a = game_state.get("riskA", 0)
    fail_b = game_state.get("failB", 0)
    trace_slot_max = game_state.get("traceSlotMax", 8)
    used_steps = game_state.get("usedSteps", 0)
    hidden_flag = game_state.get("hiddenFlag", False)
    status = game_state.get("status", "playing")

    base_score = light_value * mult["base"]
    reward_bonus = reward_d * mult["reward"]
    risk_penalty = risk_a * mult["risk"]
    fail_penalty = fail_b * mult["fail"]
    step_bonus = max(0, (trace_slot_max - used_steps) * mult["step"])
    hidden_bonus = 200 if hidden_flag else 0

    total = base_score + reward_bonus - risk_penalty - fail_penalty + step_bonus + hidden_bonus

    victory = status == "victory"

    if total >= 800:
        rank = "甲+"
    elif total >= 600:
        rank = "甲"
    elif total >= 450:
        rank = "乙+"
    elif total >= 300:
        rank = "乙"
    elif total >= 150:
        rank = "丙+"
    else:
        rank = "丙"

    grade = rank if victory else "未通过"

    result = {
        "victory": victory,
        "grade": grade,
        "rank": rank,
        "total": total,
        "level": {
            "id": level_id,
            "name": info["name"],
            "lightTarget": info["lightTarget"]
        },
        "factors": {
            "lightValue": light_value,
            "rewardD": reward_d,
            "riskA": risk_a,
            "failB": fail_b,
            "traceSlotMax": trace_slot_max,
            "usedSteps": used_steps,
            "hiddenFlag": hidden_flag
        },
        "breakdown": {
            "baseScore": base_score,
            "rewardBonus": reward_bonus,
            "riskPenalty": risk_penalty,
            "failPenalty": fail_penalty,
            "stepBonus": step_bonus,
            "hiddenBonus": hidden_bonus
        },
        "multipliers": {
            "baseMult": mult["base"],
            "rewMult": mult["reward"],
            "riskMult": mult["risk"],
            "failMult": mult["fail"],
            "stepMult": mult["step"]
        },
        "history": history or [],
        "forced": True
    }

    return result


class SettlementHandler(BaseHTTPRequestHandler):

    def log_message(self, format, *args):
        pass

    def _send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def _send_html(self, status, content):
        body = content.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, filepath, content_type):
        try:
            with open(filepath, "rb") as f:
                data = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (IOError, OSError):
            self._send_html(404, "<h1>404 Not Found</h1>")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/health":
            self._send_json(200, {"status": "ok", "service": "潮汐钟塔结算服务"})
            return

        if path == "/" or path == "":
            self._send_file(os.path.join(STATIC_DIR, "index.html"), "text/html; charset=utf-8")
            return

        if path.startswith("/api/"):
            self._send_json(404, {"error": "Unknown API endpoint", "path": path})
            return

        safe_path = os.path.normpath(path).lstrip("/")
        full_path = os.path.join(STATIC_DIR, safe_path)

        if not full_path.startswith(STATIC_DIR):
            self._send_html(403, "<h1>403 Forbidden</h1>")
            return

        if not os.path.isfile(full_path):
            self._send_html(404, "<h1>404 Not Found</h1>")
            return

        ext = os.path.splitext(full_path)[1].lower()
        mime_map = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon",
        }
        content_type = mime_map.get(ext, "application/octet-stream")
        self._send_file(full_path, content_type)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/recalculate":
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = self.rfile.read(content_length).decode("utf-8")
            try:
                payload = json.loads(raw_body)
            except json.JSONDecodeError:
                self._send_json(400, {"error": "Invalid JSON body"})
                return

            level_id = payload.get("levelId")
            game_state = payload.get("gameState")
            history = payload.get("history", [])

            if not level_id or not game_state:
                self._send_json(400, {
                    "error": "Missing required fields",
                    "required": ["levelId", "gameState"]
                })
                return

            if level_id not in LEVEL_MULTIPLIERS:
                self._send_json(400, {
                    "error": "Unknown level",
                    "levelId": level_id,
                    "available": list(LEVEL_MULTIPLIERS.keys())
                })
                return

            result = calculate_settlement(level_id, game_state, history)
            result["backend"] = True
            result["server"] = "tidal-tower-settlement/v1"

            self._send_json(200, result)
            return

        self._send_json(404, {"error": "Unknown API endpoint", "path": path})


def main():
    port = PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    server = HTTPServer(("0.0.0.0", port), SettlementHandler)
    print(f"潮汐钟塔航线推演局 - 后端结算服务启动")
    print(f"  端口: {port}")
    print(f"  静态文件目录: {STATIC_DIR}")
    print(f"  API: GET  /api/health")
    print(f"  API: POST /api/recalculate")
    print(f"  访问: http://localhost:{port}")
    print("  按 Ctrl+C 停止")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
        server.server_close()


if __name__ == "__main__":
    main()
