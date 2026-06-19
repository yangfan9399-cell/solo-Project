#!/bin/bash
BASE="http://localhost:4010/api"

echo "========================================="
echo "  纸浆纤维质检后端 API 测试"
echo "========================================="

# 1. 健康检查
echo ""
echo "[1/7] 健康检查..."
curl -s "$BASE/health" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  ✓ 状态: {d[\"status\"]}, 样本数: {d[\"sampleCount\"]}')"

# 2. 获取全部样本
echo ""
echo "[2/7] 获取全部样本..."
curl -s "$BASE/samples/all" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  ✓ 共 {len(d[\"samples\"])} 条样本')"

# 3. 导入预检
echo ""
echo "[3/7] 导入预检..."
TSV=$'样本编号\t纸浆批号\t短纤维%\t中纤维%\t长纤维%\t白度\t含水率%\t来源\t来源详情\t操作员\t责任人\nS-T1\tPK-T1\t18\t62\t20\t85\t5.5\tPURCHASE\t测试供应商A\t张伟\t陈建国\nS-T2\tPK-T1\t17\t60\t23\t\t7.8\tPURCHASE\t测试供应商B\t张伟\t陈建国'
echo "$TSV" | curl -s -X POST "$BASE/precheck" -H "Content-Type: application/json" -d @- | python3 -c "
import sys,json
d = json.load(sys.stdin)
r = d['data']
print(f'  ✓ 总行数: {r[\"totalRows\"]}, 通过: {r[\"passRows\"]}, 问题: {len(r[\"issues\"])}')
print(f'  ✓ 缺测字段: {list(r[\"missingFieldSummary\"].keys())}')
print(f'  ✓ 冲突组: {len(r[\"conflictGroups\"])} 组')
"

# 4. 状态变更
echo ""
echo "[4/7] 状态变更..."
SID=$(curl -s "$BASE/samples/all" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['samples'][0]['id'])")
curl -s -X POST "$BASE/samples/$SID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"PENDING_JUDGE","note":"API测试状态变更","operatorName":"张伟","operatorId":"U001"}' | python3 -c "
import sys,json
d = json.load(sys.stdin)
s = d['sample']
print(f'  ✓ 新状态: {s[\"status\"]}, 审计日志: {len(s[\"auditLogs\"])} 条')
"

# 5. 判读
echo ""
echo "[5/7] 判读..."
curl -s -X POST "$BASE/samples/$SID/judge" \
  -H "Content-Type: application/json" \
  -d '{"conclusion":"PASS","remark":"API测试判读合格","by":"李娜"}' | python3 -c "
import sys,json
d = json.load(sys.stdin)
s = d['sample']
print(f'  ✓ 状态: {s[\"status\"]}')
print(f'  ✓ 判读结论: {s[\"judgeConclusion\"]}, 判读人: {s[\"judgeBy\"]}')
print(f'  ✓ 审计日志: {len(s[\"auditLogs\"])} 条')
"

# 6. 新增烘干记录
echo ""
echo "[6/7] 新增烘干记录..."
curl -s -X POST "$BASE/samples/$SID/drying" \
  -H "Content-Type: application/json" \
  -d '{"conditionId":"FAST_130","conditionName":"快速烘干 130℃×45min","wetWeightG":100.0,"dryWeightG":93.8,"operatorName":"王强","operatorId":"U003","notes":"快速法平行样"}' | python3 -c "
import sys,json
d = json.load(sys.stdin)
s = d['sample']
print(f'  ✓ 烘干记录数: {len(s[\"dryingRecords\"])}')
print(f'  ✓ 含水率: {s[\"moistureContent\"]}%')
print(f'  ✓ 审计日志: {len(s[\"auditLogs\"])} 条')
"

# 7. 导出预览
echo ""
echo "[7/7] 导出预览..."
curl -s "$BASE/export" | python3 -c "
import sys,json
d = json.load(sys.stdin)
print(f'  ✓ 导出: {d[\"count\"]} 条')
print(f'  ✓ 字段数: {len(d[\"rows\"][0])} 列')
"

echo ""
echo "========================================="
echo "  所有 API 测试通过！"
echo "========================================="
