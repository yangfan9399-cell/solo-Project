#!/bin/bash
set -e

BASE="http://localhost:3001"
COOKIES="/tmp/test-cookies.txt"

echo "======================================"
echo "1. 切换到用户 经办人1 (user-op-001)"
curl -s -X POST "$BASE/api/switch-user" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-op-001"}' \
  -c "$COOKIES" -b "$COOKIES" \
  -o /dev/null -w "%{http_code}\n"

echo ""
echo "======================================"
echo "2. 获取订单列表，找到PENDING_ACCEPT订单"
ORDERS=$(curl -s "$BASE/api/orders" -b "$COOKIES")
echo "$ORDERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
pending = [o for o in data if o['status'] == 'PENDING_ACCEPT']
print(f'Total orders: {len(data)}')
print(f'Pending accept: {len(pending)}')
for o in pending[:3]:
    print(f\"  {o['id']} {o['orderNo']} {o['title']}\")
"

# 找第一个 PENDING_ACCEPT
ORDER_ID=$(echo "$ORDERS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
pending = [o for o in data if o['status'] == 'PENDING_ACCEPT']
if pending:
    print(pending[0]['id'])
else:
    print('')
")

if [ -z "$ORDER_ID" ]; then
  echo "No PENDING_ACCEPT found, using first order"
  ORDER_ID=$(echo "$ORDERS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'])")
fi

echo "Using ORDER_ID=$ORDER_ID"

echo ""
echo "======================================"
echo "3. 获取订单详情"
ORDER=$(curl -s "$BASE/api/orders/$ORDER_ID" -b "$COOKIES")
echo "$ORDER" | python3 -c "
import sys, json
o = json.load(sys.stdin)
print(f\"订单号: {o.get('orderNo')}\")
print(f\"状态: {o.get('status')}\")
print(f\"isArchived: {o.get('isArchived')}\")
nodes = o.get('nodes', [])
print(f\"历史节点数: {len(nodes)}\")
for n in nodes:
    print(f\"  [{n['nodeType']}] {n['operatorName']} - {n['actionSummary']}\")
"

echo ""
echo "======================================"
echo "4. 经办人尝试调用 复核接口(应失败 - 无权限)"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/review" \
  -H "Content-Type: application/json" \
  -d '{"isApproved":true,"remark":"经办人越权尝试复核"}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "5. 受理订单 (经办人操作)"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/accept" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "6. 填写执行数据 (经办人操作)"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/process" \
  -H "Content-Type: application/json" \
  -d '{"actualOpening":"2.5","actualFlow":"120.5","amount":"50000","actualExecuteTime":"2025-01-15T10:00:00Z"}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "7. 补充材料 (经办人操作)"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/supplement" \
  -H "Content-Type: application/json" \
  -d '{"supplementNote":"补充现场照片、水位监测记录","supplementAttachments":[{"name":"现场照片.jpg","url":"/imgs/a.jpg"},{"name":"水位记录.pdf","url":"/imgs/b.pdf"}]}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "8. 提交复核 (经办人操作)"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/submit-review" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "9. 切换到复核人张复核"
curl -s -X POST "$BASE/api/switch-user" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-rv-001"}' \
  -c "$COOKIES" -b "$COOKIES" -o /dev/null -w "%{http_code}\n"

echo ""
echo "======================================"
echo "10. 复核人 执行 复核通过"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/review" \
  -H "Content-Type: application/json" \
  -d '{"isApproved":true,"remark":"数据完整、证据充分，同意通过"}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "11. 复核人 归档订单"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/archive" \
  -H "Content-Type: application/json" \
  -d '{"archiveReason":"完成正常闭环归档"}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "12. 最终订单详情 - 检查节点数和状态"
ORDER=$(curl -s "$BASE/api/orders/$ORDER_ID" -b "$COOKIES")
echo "$ORDER" | python3 -c "
import sys, json
o = json.load(sys.stdin)
print(f\"状态: {o.get('status')}\")
print(f\"isArchived: {o.get('isArchived')}\")
nodes = o.get('nodes', [])
print(f\"历史节点数(应为受理+更新+补充+提交+复核+归档=6+初始=7+): {len(nodes)}\")
for i, n in enumerate(nodes):
    print(f\"  {i+1}. [{n['nodeType']}] {n['operatorName']}({n['operatorRole']}) - {n['actionSummary']}\")
"

echo ""
echo "======================================"
echo "13. 切换到管理员李主管 重新处理"
curl -s -X POST "$BASE/api/switch-user" \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-ad-001"}' \
  -c "$COOKIES" -b "$COOKIES" -o /dev/null -w "%{http_code}\n"

echo ""
echo "======================================"
echo "14. 管理员 重新处理(生成新历史节点)"
curl -s -X POST "$BASE/api/orders/$ORDER_ID/reopen" \
  -H "Content-Type: application/json" \
  -d '{"reopenReason":"补充新的关键证据","reopenToStatus":"PROCESSING"}' \
  -b "$COOKIES" | python3 -m json.tool

echo ""
echo "======================================"
echo "15. 再次查看节点 - 应有 REOPEN 节点"
ORDER=$(curl -s "$BASE/api/orders/$ORDER_ID" -b "$COOKIES")
echo "$ORDER" | python3 -c "
import sys, json
o = json.load(sys.stdin)
print(f\"状态: {o.get('status')}\")
print(f\"isArchived: {o.get('isArchived')}\")
nodes = o.get('nodes', [])
print(f\"总节点数: {len(nodes)}\")
for i, n in enumerate(nodes):
    print(f\"  {i+1}. [{n['nodeType']}] {n['operatorName']} - {n.get('actionSummary','')}\")
"

echo ""
echo "======================================"
echo "测试完成！"
