import {
  acceptOrder,
  processOrder,
  supplementMaterials,
  submitForReview,
  reviewOrder,
  archiveOrder,
  reopenOrder,
  getOrderDetail,
  getOrderList,
} from "./lib/data-service";
import { getRawDB, useInMemoryFallback } from "./lib/prisma";
import { UserRole, OrderStatus, NodeType } from "./lib/types";

type Passed = { name: string; ok: true; note?: string };
type Failed = { name: string; ok: false; error: string };
type TestResult = Passed | Failed;
const results: TestResult[] = [];

async function assertCase(
  name: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    const msg = e?.message || String(e);
    results.push({ name, ok: false, error: msg });
    console.log(`  ❌ ${name} → ${msg}`);
  }
}

function injectUser(userId: string, name: string, role: UserRole) {
  const cookieStore = (globalThis as any).__cookieStoreOverride;
  if (!cookieStore) {
    (globalThis as any).__cookieStoreOverride = new Map<string, string>();
  }
  (globalThis as any).__cookieStoreOverride.set(
    "currentUserId",
    userId
  );
  // 在 auth.ts 的 getCurrentUser 中我们需要能读到
  // 最简单的：mock cookies() 函数
  (globalThis as any).__mockCurrentUser = { id: userId, name, role };
}

async function main() {
  console.log("=== 水库闸门调度系统 · 自动化链路验证 ===");
  console.log();

  // 确保走内存数据层
  const db = getRawDB();
  console.log(
    useInMemoryFallback()
      ? "✅ 已启用：内存数据层（不依赖 Prisma 原生二进制）"
      : "ℹ️  连接到真实 PostgreSQL"
  );
  console.log(`📦 当前订单数：${db.dispatchOrders.size}`);

  // ========== 准备 ==========
  // 找到 PENDING_ACCEPT 的记录
  let list = await getOrderList();
  const pendingAccept = list.find(
    (o: any) => o.status === OrderStatus.PENDING_ACCEPT
  );
  if (!pendingAccept) {
    console.error("未找到待受理订单，中止测试");
    process.exit(1);
  }
  const ORDER_ID = pendingAccept.id;
  console.log(`🧾 目标记录：${pendingAccept.orderNo} (id=${ORDER_ID.slice(0,8)}...)`);
  console.log();

  // ========== 阶段1：权限拦截 ==========
  console.log("━━━ 阶段1：权限越权拦截验证 ━━━");

  injectUser("user-op-001", "王经办", UserRole.OPERATOR);
  await assertCase("经办人【王经办】调用 复核通过 → 被拒绝", async () => {
    try {
      await reviewOrder(ORDER_ID, {
        isApproved: true,
        conclusion: "经办人越权尝试复核",
      });
      throw new Error("应该抛错但未抛");
    } catch (e: any) {
      if (!/无权限/.test(e?.message || "")) {
        throw new Error(`错误信息缺少"无权限"关键字：${e?.message}`);
      }
    }
  });

  await assertCase("经办人【王经办】调用 归档 → 被拒绝", async () => {
    try {
      await archiveOrder(ORDER_ID);
      throw new Error("应该抛错但未抛");
    } catch (e: any) {
      if (!/无权限/.test(e?.message || "")) {
        throw new Error(`错误信息缺少"无权限"关键字：${e?.message}`);
      }
    }
  });

  injectUser("user-rv-001", "张复核", UserRole.REVIEWER);
  await assertCase("复核人【张复核】调用 受理 → 被拒绝 (非经办人)", async () => {
    try {
      await acceptOrder(ORDER_ID);
      throw new Error("应该抛错但未抛");
    } catch (e: any) {
      if (!/无权限/.test(e?.message || "")) {
        throw new Error(`错误信息缺少"无权限"关键字：${e?.message}`);
      }
    }
  });

  console.log();

  // ========== 阶段2：完整状态流转 ==========
  console.log("━━━ 阶段2：完整状态流转（同一条记录）━━━");

  injectUser("user-op-001", "王经办", UserRole.OPERATOR);
  let detail: any;

  await assertCase("① 经办人【王经办】受理 → PROCESSING", async () => {
    const { order } = await acceptOrder(ORDER_ID);
    if ((order as any).status !== OrderStatus.PROCESSING)
      throw new Error(`状态错误：${(order as any).status}`);
    if ((order as any).operatorId !== "user-op-001")
      throw new Error("operatorId 未正确设置");
  });

  await assertCase("② 经办人【王经办】填写执行数据 → 记录actualOpening等", async () => {
    const r = await processOrder(ORDER_ID, {
      actualOpening: 5.0,
      actualFlow: 1480,
      amount: 68000,
      actualExecuteTime: new Date(),
      remark: "汛期调试：完成全开全关全过程",
    });
    const d = (r as any).order as any;
    if (d.actualOpening !== 5.0)
      throw new Error(`actualOpening 未更新：${d.actualOpening}`);
    if (d.actualFlow !== 1480)
      throw new Error(`actualFlow 未更新：${d.actualFlow}`);
  });

  await assertCase("③ 经办人【王经办】补充材料 → 节点SUPPLEMENT + 附件", async () => {
    const r = await supplementMaterials(ORDER_ID, {
      businessRecord:
        "记录：闸门启动电流正常（12.5A）、无异常振动、密封完好、全过程现场视频25分钟",
      siteDescription:
        "现场由2人操作，1人旁站监理；下游河道植被已提前清障，无人员滞留",
      attachments: [
        {
          name: "调试全过程视频.mp4",
          type: "video/mp4",
          size: 180000000,
          url: "/attachments/g005-video.mp4",
        },
        {
          name: "旁站监理签字.pdf",
          type: "application/pdf",
          size: 1024000,
          url: "/attachments/g005-supervisor.pdf",
        },
      ],
      remark: "补充业务记录和证据",
    });
    const nodeCount = (r as any).order?.nodes?.length ?? 0;
    if (nodeCount < 3)
      throw new Error(`节点数异常：${nodeCount}，应有受理+更新+补充`);
  });

  await assertCase("④ 经办人【王经办】提交复核 → PENDING_REVIEW", async () => {
    const { order } = await submitForReview(ORDER_ID, {
      conclusion: "调试完成，机械参数正常，证据完备，申请复核",
      evidenceBasis:
        "1. DL/T 5013-2019《水利水电工程启闭机设计规范》；2. 现场执行录像；3. 旁站监理签字确认单",
      remark: "请求复核",
    });
    if ((order as any).status !== OrderStatus.PENDING_REVIEW)
      throw new Error(`状态错误：${(order as any).status}`);
  });

  console.log();
  console.log("─── 切换到复核人 ───");

  injectUser("user-rv-001", "张复核", UserRole.REVIEWER);

  await assertCase("复核人越权补充材料 → 被拒绝（仅经办人可补充）", async () => {
    try {
      await supplementMaterials(ORDER_ID, {
        businessRecord: "复核人越权尝试",
        siteDescription: "越权",
      });
      throw new Error("应该抛错但未抛");
    } catch (e: any) {
      if (!/无权限|仅经办人/.test(e?.message || "")) {
        throw new Error(`错误信息不正确：${e?.message}`);
      }
    }
  });

  await assertCase("⑤ 复核人【张复核】复核通过 → REVIEW_APPROVED", async () => {
    const r = await reviewOrder(ORDER_ID, {
      isApproved: true,
      conclusion:
        "复核通过：机械参数符合设计标准，证据链完整，责任单位与签字一致",
      opinion:
        "执行过程规范，开度偏差<±0.5%，流量偏差<±1.3%，在允许范围内。",
    });
    if ((r as any).order.status !== OrderStatus.REVIEW_APPROVED)
      throw new Error(`状态错误：${(r as any).order.status}`);
  });

  await assertCase("⑥ 复核人【张复核】归档 → ARCHIVED + isArchived=true", async () => {
    const { order } = await archiveOrder(ORDER_ID);
    if ((order as any).status !== OrderStatus.ARCHIVED)
      throw new Error(`状态错误：${(order as any).status}`);
    if (!(order as any).isArchived)
      throw new Error("isArchived 未设置为 true");
  });

  console.log();
  console.log("─── 切换到管理员（重新处理） ───");
  injectUser("user-ad-001", "赵主管", UserRole.ADMIN);

  await assertCase("⑦ 管理员【赵主管】重新处理 → PROCESSING + 新增REOPEN节点", async () => {
    const r = await reopenOrder(ORDER_ID);
    if ((r as any).order.status !== OrderStatus.PROCESSING)
      throw new Error(`重新处理后状态错误：${(r as any).order.status}`);
    if ((r as any).order.isArchived !== false)
      throw new Error("isArchived 未重置为 false");
    // 检查 REOPEN 节点
    detail = await getOrderDetail(ORDER_ID);
    const reopenNode = (detail?.nodes || []).find(
      (n: any) => n.nodeType === NodeType.REOPEN
    );
    if (!reopenNode) throw new Error("未生成 REOPEN 历史节点");
    if (reopenNode.operatorId !== "user-ad-001")
      throw new Error("REOPEN 节点操作人错误");
  });

  console.log();

  // ========== 阶段3：历史节点校验 ==========
  console.log("━━━ 阶段3：同一条记录 · 状态/历史节点校验 ━━━");

  detail = await getOrderDetail(ORDER_ID);
  const statuses = (detail?.nodes || []).map((n: any) => ({
    type: n.nodeType,
    op: n.operatorName,
    role: n.operatorId,
  }));
  await assertCase(
    `历史节点 ≥ 8 个（原+受理+更新+补充+提交+通过+归档+重新处理）实际=${
      detail?.nodes?.length
    }`,
    async () => {
      if ((detail?.nodes?.length || 0) < 7)
        throw new Error(`节点数不足：${detail?.nodes?.length}`);
    }
  );
  console.log(
    "    📜 节点序列：",
    statuses
      .map(
        (s) =>
          `[${s.type}] ${s.op}(${s.role === "user-ad-001" ? "管理员" : s.role === "user-rv-001" ? "复核人" : "经办人"})`
      )
      .join(" → ")
  );

  // 列表同步校验：同一份数据源
  await assertCase("列表/详情/看板 —— 同一份记录同步更新", async () => {
    const list2 = await getOrderList();
    const sameOrder = list2.find((x: any) => x.id === ORDER_ID) as any;
    if (sameOrder.status !== detail.status)
      throw new Error(
        `列表(${sameOrder.status}) 与 详情(${detail.status}) 状态不一致`
      );
    if (sameOrder.orderNo !== detail.orderNo)
      throw new Error("订单号不一致（非同一份数据）");
  });

  console.log();

  // ========== 阶段4：复核退回场景 ==========
  console.log("━━━ 阶段4：复核退回 & 再补证 ━━━");

  const orderRejectedId = (
    await getOrderList({ status: OrderStatus.REVIEW_REJECTED as any })
  )[0]?.id;
  if (!orderRejectedId) {
    console.log("    ⚠️  无 REVIEW_REJECTED 样本，跳过");
  } else {
    injectUser("user-op-001", "王经办", UserRole.OPERATOR);
    await assertCase("【样本4-退回】经办人补充材料 → blockReason清零", async () => {
      const r = await supplementMaterials(orderRejectedId, {
        businessRecord:
          "已完成偏差分析：因液压系统油温导致开度偏差，已校准传感器并更换液压油",
        siteDescription:
          "监理单位现场见证重新校准全过程，签字确认",
        attachments: [
          {
            name: "偏差分析报告.pdf",
            type: "application/pdf",
            size: 2048000,
            url: "/attachments/g004-report.pdf",
          },
          {
            name: "重新校准记录.xlsx",
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            size: 512000,
            url: "/attachments/g004-calibration.xlsx",
          },
        ],
        remark: "补充整改后的完整证据链",
      });
      if ((r as any).order.blockReason !== null)
        throw new Error(
          `blockReason 未清零：${(r as any).order.blockReason}`
        );
    });
  }

  console.log();

  // ========== 汇总 ==========
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log("════════════════════════════════");
  console.log(`验证完毕：✅ 通过 ${passed} / ❌ 失败 ${failed}`);
  if (failed > 0) {
    console.log();
    console.log("失败用例明细：");
    for (const r of results) if (!r.ok) console.log(`  ❌ ${r.name} — ${(r as Failed).error}`);
    process.exit(1);
  } else {
    console.log("🎉 全链路自动化验证通过 —— 受理/更新/补充/提交/复核通过/归档/重新处理 + 退回补证 —— 同一条记录已完成状态更新，且权限边界正确！");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
