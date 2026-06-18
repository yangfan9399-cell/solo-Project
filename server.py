#!/usr/bin/env python3
import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

LEVELS = {
    "ren": {
        "id": "ren",
        "initialState": {
            "unlockValue": 10,
            "unlockSlots": 5,
            "traceMarks": 2,
            "renRisk": 0,
            "dingReward": 1,
            "maoFailFactor": 0
        },
        "maxTurns": 8,
        "victoryThreshold": 50,
        "failThreshold": 10
    },
    "ding": {
        "id": "ding",
        "initialState": {
            "unlockValue": 5,
            "unlockSlots": 2,
            "traceMarks": 0,
            "renRisk": 0,
            "dingReward": 2,
            "maoFailFactor": 0
        },
        "maxTurns": 10,
        "victoryThreshold": 60
    },
    "mao": {
        "id": "mao",
        "initialState": {
            "unlockValue": 8,
            "unlockSlots": 4,
            "traceMarks": 0,
            "renRisk": 0,
            "dingReward": 1,
            "maoFailFactor": 0
        },
        "maxTurns": 12,
        "victoryThreshold": 80,
        "failThreshold": 8
    }
}

STATIC_DIR = os.path.dirname(os.path.abspath(__file__))

class MossPostOfficeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

    def normalize_path(self, path):
        if path.endswith('/') and path != '/':
            path = path[:-1]
        return path

    def do_GET(self):
        parsed = urlparse(self.path)
        path = self.normalize_path(parsed.path)
        self.log_message("GET path: %s", path)

        if path == "/" or path == "":
            path = "/index.html"

        if path.startswith("/api"):
            self.handle_api_get(path)
            return

        self.serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = self.normalize_path(parsed.path)
        self.log_message("POST path: %s", path)

        if path.startswith("/api"):
            self.handle_api_post(path)
            return

        self.send_error(404, "Not Found")

    def serve_static(self, path):
        filepath = os.path.join(STATIC_DIR, path.lstrip("/"))

        if not os.path.isfile(filepath):
            self.send_error(404, "File Not Found")
            return

        ext = os.path.splitext(filepath)[1].lower()
        content_types = {
            ".html": "text/html; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".js": "application/javascript; charset=utf-8",
            ".json": "application/json; charset=utf-8",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml",
            ".ico": "image/x-icon"
        }
        content_type = content_types.get(ext, "application/octet-stream")

        try:
            with open(filepath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_error(500, f"Server Error: {e}")

    def handle_api_get(self, path):
        if path == "/api/levels":
            self.send_json_response(200, {"levels": list(LEVELS.keys())})
        elif path == "/api/health":
            self.send_json_response(200, {"status": "ok", "service": "苔藓邮站后端服务"})
        else:
            self.send_error(404, "API Not Found")

    def handle_api_post(self, path):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            data = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json_response(400, {"error": "Invalid JSON"})
            return

        if path == "/api/recalculate":
            self.handle_recalculate(data)
        else:
            self.send_error(404, "API Not Found")

    def handle_recalculate(self, data):
        level_id = data.get("levelId")
        history = data.get("history", [])
        hidden_triggered = data.get("hiddenTriggered", False)

        if not level_id or level_id not in LEVELS:
            self.send_json_response(400, {"error": "无效的局ID"})
            return

        level_config = LEVELS[level_id]
        state = self.simulate_from_history(level_config, history)
        settlement = self.calculate_settlement(level_config, state, len(history), hidden_triggered)

        self.send_json_response(200, {
            "status": "success",
            "message": "苔藓邮站后端重算完成",
            "levelId": level_id,
            "steps": len(history),
            "finalState": state,
            "settlement": settlement,
            "calculatedAt": self.log_date_time_string()
        })

    def simulate_from_history(self, level_config, history):
        state = dict(level_config["initialState"])
        level_id = level_config["id"]

        for step in history:
            effect = step.get("effect", {})
            for key in ["unlockValue", "unlockSlots", "traceMarks", "renRisk", "dingReward", "maoFailFactor"]:
                if key in effect:
                    change = effect[key]
                    if key == "unlockValue" and level_id == "ding" and change > 0:
                        change = change * state["dingReward"]
                    state[key] = round(state[key] + change, 2)
            if state["unlockSlots"] < 0:
                state["unlockSlots"] = 0
            if state["traceMarks"] < 0:
                state["traceMarks"] = 0
            if state["renRisk"] < 0:
                state["renRisk"] = 0
            if state["maoFailFactor"] < 0:
                state["maoFailFactor"] = 0

        return state

    def calculate_settlement(self, level_config, state, steps, hidden_triggered):
        level_id = level_config["id"]
        result = {}

        if level_id == "ren":
            base = int(state["unlockValue"] * 10)
            trace_bonus = int(state["traceMarks"] * 20)
            slot_bonus = int(state["unlockSlots"] * 5)
            risk_penalty = int(state["renRisk"] * 8)
            total = max(0, base + trace_bonus + slot_bonus - risk_penalty)
            is_win = state["unlockValue"] >= 50 and state["renRisk"] < 10

            result = {
                "base": base,
                "traceBonus": trace_bonus,
                "slotBonus": slot_bonus,
                "riskPenalty": -risk_penalty,
                "total": total,
                "isWin": is_win,
                "formula": "解锁值×10 + 溯源痕×20 + 解锁槽×5 - 壬号风险×8"
            }

        elif level_id == "ding":
            base = int(state["unlockValue"] * 15)
            reward_multiplier = round(state["dingReward"], 1)
            trace_bonus = int(state["traceMarks"] * 25)
            slot_bonus = int(state["unlockSlots"] * 10)
            total = max(0, int((base + trace_bonus + slot_bonus) * reward_multiplier))
            is_win = state["unlockValue"] >= 60 and state["unlockSlots"] >= 0

            result = {
                "base": base,
                "rewardMultiplier": reward_multiplier,
                "traceBonus": trace_bonus,
                "slotBonus": slot_bonus,
                "total": total,
                "isWin": is_win,
                "formula": "(解锁值×15 + 溯源痕×25 + 解锁槽×10) × 丁号奖励倍率"
            }

        elif level_id == "mao":
            base = int(state["unlockValue"] * 12)
            trace_bonus = int(state["traceMarks"] * 30)
            slot_penalty = int(max(0, 4 - state["unlockSlots"]) * 5)
            fail_penalty = int(state["maoFailFactor"] * 15)
            hidden_bonus = 500 if hidden_triggered else 0
            total = max(0, base + trace_bonus - slot_penalty - fail_penalty + hidden_bonus)
            is_win = hidden_triggered or (state["unlockValue"] >= 80 and state["maoFailFactor"] < 8)

            result = {
                "base": base,
                "traceBonus": trace_bonus,
                "slotPenalty": -slot_penalty,
                "failPenalty": -fail_penalty,
                "hiddenBonus": hidden_bonus,
                "total": total,
                "isWin": is_win,
                "isHidden": hidden_triggered,
                "formula": "解锁值×12 + 溯源痕×30 - 解锁槽损耗 - 卯号失败因子×15 (+隐藏奖励500)"
            }

        result["steps"] = steps
        return result

    def send_json_response(self, status_code, data):
        content = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)


def main():
    port = 8765
    server = HTTPServer(("0.0.0.0", port), MossPostOfficeHandler)
    print(f"🌿 苔藓邮站后端服务启动：http://localhost:{port}")
    print(f"   API 端点: POST http://localhost:{port}/api/recalculate")
    print(f"   健康检查: GET  http://localhost:{port}/api/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
        server.server_close()


if __name__ == "__main__":
    main()
