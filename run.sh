#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

rm -f /tmp/cbcp_backend.log /tmp/cbcp_backend.pid

echo "=== 启动后端服务 ==="
( cd backend && npx ts-node-dev src/index.ts > /tmp/cbcp_backend.log 2>&1 & echo $! > /tmp/cbcp_backend.pid )
BACKEND_PID=$(cat /tmp/cbcp_backend.pid)
echo "后端 PID: $BACKEND_PID"

echo "=== 等待后端就绪 (最多 15 秒) ==="
for i in $(seq 1 15); do
  if curl -s --max-time 1 http://localhost:41621/api/levels > /dev/null 2>&1; then
    echo "后端就绪 (耗时 ${i}s)"
    break
  fi
  sleep 1
done

if ! curl -s --max-time 1 http://localhost:41621/api/levels > /dev/null 2>&1; then
  echo "❌ 后端启动失败"
  cat /tmp/cbcp_backend.log
  exit 1
fi

echo ""
echo "=== 运行 API 测试 ==="
python3 test_api.py
TEST_EXIT=$?

echo ""
echo "=== 启动前端开发服务器 ==="
echo "前端端口 41620 (Vite dev)"
echo "API 代理 /api → http://localhost:41621"
echo ""
echo "============================================"
echo "  访问: http://localhost:41620"
echo "  后端 API: http://localhost:41621/api/levels"
echo "  前端: (阻塞式启动中，请 Ctrl+C 停止全部)"
echo "============================================"
echo ""

if [ $TEST_EXIT -eq 0 ]; then
  echo "✅ API 测试通过，启动前端..."
  cd frontend && npx vite --port 41620
else
  echo "❌ API 测试失败 (exit=$TEST_EXIT)，不启动前端"
  echo ""
  echo "后端日志:"
  cat /tmp/cbcp_backend.log
  kill $BACKEND_PID 2>/dev/null
  exit $TEST_EXIT
fi
