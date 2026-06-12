#!/bin/bash
OID="1124ee18-c901-47c6-8238-537683990743"
C="/tmp/e2e2.txt"

step() { echo ""; echo "====== $1 ======"; }

psql_check() { psql -d reservoir_gate -t -c "SELECT status FROM \"DispatchOrder\" WHERE id='$OID';"; }

step "0. 初始状态"
psql_check

step "① 受理 (PENDING_ACCEPT → PROCESSING)"
curl -s -c $C -b $C -X POST http://localhost:3000/api/switch-user -H "Content-Type: application/json" -d '{"userId":"user-op-001"}' -o /dev/null
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/accept" -H "Content-Type: application/json" -d '{}' -o /dev/null -w "HTTP: %{http_code}\n"
psql_check

step "② 执行数据"
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/process" -H "Content-Type: application/json" -d '{"actualOpening":"2.5","actualFlow":"600","businessRecord":"执行完成"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql_check

step "③ 补充材料"
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/supplement" -H "Content-Type: application/json" -d '{"businessRecord":"已补充汛前检修记录","siteDescription":"碧溪水库5号闸门运行正常"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql_check

step "④ 提交复核"
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/submit-review" -H "Content-Type: application/json" -d '{"conclusion":"材料齐全，申请复核","evidenceBasis":"1.检修记录 2.运行参数"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql_check

step "⑤ 复核退回"
curl -s -c $C -b $C -X POST http://localhost:3000/api/switch-user -H "Content-Type: application/json" -d '{"userId":"user-rv-001"}' -o /dev/null
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/review" -H "Content-Type: application/json" -d '{"isApproved":false,"conclusion":"需补充监理确认","opinion":"缺少监理签字","blockReason":"缺少监理确认","remedyPath":"补充监理确认书"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql_check

step "⑥ 补证后再提交"
curl -s -c $C -b $C -X POST http://localhost:3000/api/switch-user -H "Content-Type: application/json" -d '{"userId":"user-op-001"}' -o /dev/null
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/supplement" -H "Content-Type: application/json" -d '{"businessRecord":"已补充监理确认书","siteDescription":"监理已现场签字确认"}' -o /dev/null -w "补充材料 HTTP: %{http_code}\n"
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/submit-review" -H "Content-Type: application/json" -d '{"conclusion":"已补充监理确认，重新申请复核"}' -o /dev/null -w "提交复核 HTTP: %{http_code}\n"
psql_check

step "⑦ 复核通过"
curl -s -c $C -b $C -X POST http://localhost:3000/api/switch-user -H "Content-Type: application/json" -d '{"userId":"user-rv-001"}' -o /dev/null
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/review" -H "Content-Type: application/json" -d '{"isApproved":true,"conclusion":"复核通过","opinion":"材料完整"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql_check

step "⑧ 归档"
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/archive" -H "Content-Type: application/json" -d '{"archiveReason":"流程合规，完成归档"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql -d reservoir_gate -t -c "SELECT status, \"isArchived\" FROM \"DispatchOrder\" WHERE id='$OID';"

step "⑨ 重新处理"
curl -s -c $C -b $C -X POST http://localhost:3000/api/switch-user -H "Content-Type: application/json" -d '{"userId":"user-admin-001"}' -o /dev/null
curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/reopen" -H "Content-Type: application/json" -d '{"reopenReason":"补充新佐证材料"}' -o /dev/null -w "HTTP: %{http_code}\n"
psql -d reservoir_gate -t -c "SELECT status, \"isArchived\" FROM \"DispatchOrder\" WHERE id='$OID';"

step "⑩ 经办人越权测试"
curl -s -c $C -b $C -X POST http://localhost:3000/api/switch-user -H "Content-Type: application/json" -d '{"userId":"user-op-001"}' -o /dev/null
echo -n "经办人调复核: " && curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/review" -H "Content-Type: application/json" -d '{"isApproved":true,"conclusion":"越权测试"}' | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).error)"
echo ""
echo -n "经办人调归档: " && curl -s -b $C -X POST "http://localhost:3000/api/orders/$OID/archive" -H "Content-Type: application/json" -d '{"archiveReason":"越权测试"}' | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).error)"
echo ""

step "完整节点序列 (PostgreSQL)"
psql -d reservoir_gate -c "SELECT \"nodeType\", \"operatorName\" FROM \"OrderNode\" WHERE \"orderId\"='$OID' ORDER BY \"createdAt\" ASC;"
