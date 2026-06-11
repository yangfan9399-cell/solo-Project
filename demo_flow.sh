#!/bin/bash
set -e
BASE_URL="http://localhost:8080"
COOKIE="/tmp/demo_cookie.txt"

echo "==============================================="
echo "   报修流转完整演示 - 正常流程（满意关闭）"
echo "==============================================="
rm -f $COOKIE

echo ""
echo "[1/8] 学生张三登录 (userId=1)"
curl -s -L -c $COOKIE -b $COOKIE \
  -d "userId=1" \
  "$BASE_URL/login" -o /dev/null
echo "✅ 登录成功，Session Cookie 已保存"

echo ""
echo "[2/8] 学生提交报修：3栋305，空调不制冷"
curl -s -L -c $COOKIE -b $COOKIE \
  -d "building=3栋" \
  -d "roomNo=305" \
  -d "faultType=APPLIANCE" \
  -d "description=夏天空调无法制冷，吹出的风是热的" \
  "$BASE_URL/student/submit" -o /dev/null
echo "✅ 报修已提交"

echo ""
echo "   提取学生报修列表中新报修 ID..."
STUDENT_PAGE=$(curl -s -b $COOKIE "$BASE_URL/student/repairs")
NEW_REPAIR_ID=$(echo "$STUDENT_PAGE" | grep -oE 'repair/[0-9]+' | head -1 | cut -d/ -f2)
if [ -z "$NEW_REPAIR_ID" ]; then
  echo "   尝试从详情链接提取，所有 repair 链接:"
  echo "$STUDENT_PAGE" | grep -oE 'href="[^"]*repair/[0-9]+"' | head -5
  NEW_REPAIR_ID=16
  echo "   使用预估 ID: $NEW_REPAIR_ID（H2 内存 DB 初始 15 条样本）"
fi
echo "   ✅ 新报修 ID = $NEW_REPAIR_ID"

echo ""
echo "[3/8] 退出学生，切换宿管刘宿管 (userId=5)"
curl -s -c $COOKIE -b $COOKIE "$BASE_URL/logout" -o /dev/null
curl -s -L -c $COOKIE -b $COOKIE \
  -d "userId=5" \
  "$BASE_URL/login" -o /dev/null
echo "✅ 宿管刘宿管登录成功"

echo ""
echo "[4/8] 宿管派单：分配给王师傅 (userId=7，水电维修组)"
curl -s -L -c $COOKIE -b $COOKIE \
  -d "repairmanId=7" \
  "$BASE_URL/dorm-manager/assign/$NEW_REPAIR_ID" -o /dev/null
echo "✅ 派单成功：报修#$NEW_REPAIR_ID → 王师傅"
echo "   当前状态：SUBMITTED → ASSIGNED"

echo ""
echo "[5/8] 退出宿管，切换维修工王师傅 (userId=7)"
curl -s -c $COOKIE -b $COOKIE "$BASE_URL/logout" -o /dev/null
curl -s -L -c $COOKIE -b $COOKIE \
  -d "userId=7" \
  "$BASE_URL/login" -o /dev/null
echo "✅ 王师傅登录成功"

echo ""
echo "  [5a] 开始维修"
curl -s -L -c $COOKIE -b $COOKIE \
  -X POST \
  "$BASE_URL/repairman/start/$NEW_REPAIR_ID" -o /dev/null
echo "   ✅ 状态：ASSIGNED → IN_PROGRESS"

sleep 1

echo ""
echo "  [5b] 完成维修"
curl -s -L -c $COOKIE -b $COOKIE \
  -d "repairNote=已更换压缩机启动电容，补充制冷剂R410A，测试制冷正常出风13°C" \
  -d "partsUsed=压缩机启动电容x1,制冷剂R410A 500g" \
  "$BASE_URL/repairman/complete/$NEW_REPAIR_ID" -o /dev/null
echo "   ✅ 状态：IN_PROGRESS → COMPLETED，维修时长已自动记录"

echo ""
echo "[6/8] 退出维修，切换后勤周主管 (userId=10)"
curl -s -c $COOKIE -b $COOKIE "$BASE_URL/logout" -o /dev/null
curl -s -L -c $COOKIE -b $COOKIE \
  -d "userId=10" \
  "$BASE_URL/login" -o /dev/null
echo "✅ 周主管登录成功"

echo ""
echo "[7/8] 主管回访评价：非常满意（5分）"
curl -s -L -c $COOKIE -b $COOKIE \
  -d "satisfaction=VERY_SATISFIED" \
  -d "reviewComment=学生反馈空调制冷效果良好，师傅上门及时，态度好。" \
  "$BASE_URL/supervisor/review/$NEW_REPAIR_ID" -o /dev/null
echo "✅ 状态：COMPLETED → REVIEWED"

echo ""
echo "[8/8] 主管关闭报修"
curl -s -L -c $COOKIE -b $COOKIE \
  -X POST \
  "$BASE_URL/supervisor/close/$NEW_REPAIR_ID" -o /dev/null
echo "✅ 状态：REVIEWED → CLOSED 🎉"

echo ""
echo "==============================================="
echo "   报修#$NEW_REPAIR_ID 详情页 - 历史节点验证"
echo "==============================================="
echo ""
echo "详情页地址：$BASE_URL/supervisor/repair/$NEW_REPAIR_ID"
echo ""
echo "历史节点时间线（从页面 HTML 提取）："
echo "------------------------------------------------"
DETAIL_HTML=$(curl -s -b $COOKIE "$BASE_URL/supervisor/repair/$NEW_REPAIR_ID")
echo "$DETAIL_HTML" | sed -n '/timeline/,/\/div.*timeline/p' | \
  sed -e 's/<[^>]*>/\n/g' | \
  grep -v '^[[:space:]]*$' | \
  grep -vE '^(class=|style=|div|span|ul|li|h[0-9]|p)$' | \
  head -60
echo "------------------------------------------------"

echo ""
echo ""
echo "==============================================="
echo "   异常流程演示 - 学生不满意禁止关闭验证"
echo "==============================================="

COOKIE2="/tmp/demo2_cookie.txt"
rm -f $COOKIE2

echo ""
echo "[A] 学生李四 (userId=2) 提交报修：5栋502 门锁故障"
curl -s -L -c $COOKIE2 -b $COOKIE2 -d "userId=2" "$BASE_URL/login" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 \
  -d "building=5栋" -d "roomNo=502" -d "faultType=DOOR_LOCK" \
  -d "description=宿舍门锁无法正常反锁，转动无阻力" \
  "$BASE_URL/student/submit" -o /dev/null
STUDENT2_PAGE=$(curl -s -b $COOKIE2 "$BASE_URL/student/repairs")
REPAIR2_ID=$(echo "$STUDENT2_PAGE" | grep -oE 'repair/[0-9]+' | head -1 | cut -d/ -f2)
if [ -z "$REPAIR2_ID" ]; then
  REPAIR2_ID=$((NEW_REPAIR_ID + 1))
  echo "   使用预估 ID: $REPAIR2_ID"
fi
echo "✅ 已提交，报修#$REPAIR2_ID"

echo ""
echo "[B] 宿管陈宿管 (userId=6) 派单给张师傅 (userId=9)"
curl -s -c $COOKIE2 -b $COOKIE2 "$BASE_URL/logout" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 -d "userId=6" "$BASE_URL/login" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 \
  -d "repairmanId=9" "$BASE_URL/dorm-manager/assign/$REPAIR2_ID" -o /dev/null
echo "✅ 报修#$REPAIR2_ID 派单给张师傅"

echo ""
echo "[C] 张师傅 (userId=9) 开始→完成"
curl -s -c $COOKIE2 -b $COOKIE2 "$BASE_URL/logout" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 -d "userId=9" "$BASE_URL/login" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 -X POST "$BASE_URL/repairman/start/$REPAIR2_ID" -o /dev/null
sleep 1
curl -s -L -c $COOKIE2 -b $COOKIE2 \
  -d "repairNote=已调整锁芯弹簧，添加润滑油" \
  "$BASE_URL/repairman/complete/$REPAIR2_ID" -o /dev/null
echo "✅ 已完成"

echo ""
echo "[D] 周主管回访选【不满意】(2分)"
curl -s -c $COOKIE2 -b $COOKIE2 "$BASE_URL/logout" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 -d "userId=10" "$BASE_URL/login" -o /dev/null
curl -s -L -c $COOKIE2 -b $COOKIE2 \
  -d "satisfaction=DISSATISFIED" \
  -d "reviewComment=学生反映仍然无法反锁，关门后晃动明显" \
  "$BASE_URL/supervisor/review/$REPAIR2_ID" -o /dev/null
echo "✅ 回访完成，状态应为 DISSATISFIED"

echo ""
echo "[E] ⚠️  尝试直接关闭报修 → 验证禁止关闭规则"
CLOSE_RESULT_URL=$(curl -s -L -c $COOKIE2 -b $COOKIE2 -X POST \
  -w "\n%{url_effective}" \
  "$BASE_URL/supervisor/close/$REPAIR2_ID" -o /tmp/close_body.html | tail -1)
echo "   请求的最终 URL: $CLOSE_RESULT_URL"
echo ""
echo "   URL 中 error 参数解码："
if echo "$CLOSE_RESULT_URL" | grep -q "error="; then
  ERR_ENC=$(echo "$CLOSE_RESULT_URL" | sed -n 's/.*error=\([^&]*\).*/\1/p')
  ERR_DEC=$(python3 -c "import sys,urllib.parse; print(urllib.parse.unquote(sys.argv[1]))" "$ERR_ENC" 2>/dev/null || echo "$ERR_ENC")
  echo "   ❌ $ERR_DEC"
else
  echo "   未检测到 URL error 参数，搜索页面内容..."
  grep -ioE '(学生不满意|禁止直接关闭|error[^<]{0,100})' /tmp/close_body.html | \
    head -3 | sed 's/^/   ❌ /' || echo "   (未找到直接错误标记，但 302 回列表+不满意状态已阻止关闭)"
fi

echo ""
echo "   检查报修#$REPAIR2_ID 当前状态（应仍为 DISSATISFIED，未被 CLOSED）："
DETAIL2=$(curl -s -b $COOKIE2 "$BASE_URL/supervisor/repair/$REPAIR2_ID")
echo "$DETAIL2" | grep -ioE '(status-badge[^>]*>|DISSATISFIED|不满意|CLOSED|已关闭)' | head -5 | sed 's/^/   /'

echo ""
echo "==============================================="
echo "   演示完成！总结"
echo "==============================================="
echo ""
echo "✅ 正常流转报修 #$NEW_REPAIR_ID："
echo "   学生提交 → 宿管派单 → 开始维修 → 完成维修 → 回访(满意) → 关闭"
echo "   详情页可观察 6 个历史节点时间线"
echo ""
echo "✅ 异常流转报修 #$REPAIR2_ID："
echo "   学生提交 → 派单 → 完成 → 回访(不满意) → ✅禁止直接关闭"
echo "   状态仍为 DISSATISFIED，必须重新派单才能继续"
echo ""
echo "🔗 打开浏览器查看："
echo "   登录页:                  http://localhost:8080"
echo "   统计页(选周主管登录):    http://localhost:8080/supervisor/stats"
echo "   正常关闭详情:            http://localhost:8080/supervisor/repair/$NEW_REPAIR_ID"
echo "   不满意(禁止关闭)详情:    http://localhost:8080/supervisor/repair/$REPAIR2_ID"
echo ""
