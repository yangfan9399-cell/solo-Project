import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const application = await prisma.interlibraryApplication.findUnique({
    where: { id: params.id },
    include: {
      reader: true,
      book: {
        include: {
          library: true,
        },
      },
      library: true,
      historyNodes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      returnRecord: true,
      overdueRecord: true,
    },
  });

  if (!application) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ application });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action");
  const applicationId = params.id;

  const application = await prisma.interlibraryApplication.findUnique({
    where: { id: applicationId },
    include: { reader: true },
  });

  if (!application) {
    return redirect("/");
  }

  switch (action) {
    case "contact": {
      // 馆员联系外馆
      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "CONTACTING",
          processedByStaffId: "staff-001",
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "CONTACTING",
          operatorId: "staff-001",
          operatorRole: "馆员",
          operatorName: "张馆员",
          description: "开始联系外馆",
        },
      });
      break;
    }

    case "approve": {
      // 外馆同意借书
      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "APPROVED",
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "APPROVED",
          operatorId: "external-001",
          operatorRole: "外馆",
          operatorName: "外馆管理员",
          description: "外馆同意借书",
        },
      });
      break;
    }

    case "reject": {
      const reason = formData.get("reason") as string;
      // 外馆拒借
      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "REJECTED",
          rejectReason: reason,
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "REJECTED",
          operatorId: "external-001",
          operatorRole: "外馆",
          operatorName: "外馆管理员",
          description: `外馆拒借：${reason}`,
        },
      });
      break;
    }

    case "transit": {
      const logisticsNumber = formData.get("logisticsNumber") as string;
      // 图书运输中
      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "IN_TRANSIT",
          logisticsStatus: "IN_TRANSIT",
          logisticsNumber,
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "IN_TRANSIT",
          operatorId: "logistics-001",
          operatorRole: "物流",
          operatorName: "物流公司",
          description: `图书已发出，物流单号：${logisticsNumber}`,
        },
      });
      break;
    }

    case "arrive": {
      // 图书到馆
      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "ARRIVED",
          logisticsStatus: "ARRIVED",
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "ARRIVED",
          operatorId: "staff-001",
          operatorRole: "馆员",
          operatorName: "张馆员",
          description: "图书已到达本馆",
        },
      });
      break;
    }

    case "notify": {
      // 流通管理员通知取书
      const borrowStartDate = new Date();
      const borrowEndDate = new Date();
      borrowEndDate.setDate(borrowEndDate.getDate() + 30); // 30天借阅期

      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "READY_FOR_PICKUP",
          borrowStartDate,
          borrowEndDate,
          processedByCirculationId: "circulation-001",
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "READY_FOR_PICKUP",
          operatorId: "circulation-001",
          operatorRole: "流通管理员",
          operatorName: "李流通",
          description: `已通知读者取书，借阅期限：${borrowStartDate.toLocaleDateString("zh-CN")} 至 ${borrowEndDate.toLocaleDateString("zh-CN")}`,
        },
      });
      break;
    }

    case "borrow": {
      // 读者取书
      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: {
          status: "BORROWED",
        },
      });
      await prisma.historyNode.create({
        data: {
          applicationId,
          status: "BORROWED",
          operatorId: application.readerId,
          operatorRole: "读者",
          operatorName: application.reader.name,
          description: "读者已取书",
        },
      });
      break;
    }

    case "return": {
      const condition = formData.get("condition") as string;
      const damageStatus = formData.get("damageStatus") as string | null;
      const damageDescription = formData.get("damageDescription") as string | null;

      // 馆际负责人复核归还
      const actualReturnDate = new Date();
      const isOverdue = application.borrowEndDate && actualReturnDate > application.borrowEndDate;

      const updateData: any = {
        status: isOverdue ? "OVERDUE" : "RETURNED",
        actualReturnDate,
        processedByManagerId: "manager-001",
      };

      if (damageStatus) {
        updateData.status = "DAMAGED";
        updateData.damageStatus = damageStatus;
        updateData.damageDescription = damageDescription;
      }

      await prisma.interlibraryApplication.update({
        where: { id: applicationId },
        data: updateData,
      });

      // 创建归还记录
      await prisma.returnRecord.create({
        data: {
          applicationId,
          returnDate: actualReturnDate,
          returnedBy: application.reader.name,
          receivedBy: "王馆际",
          condition,
          notes: damageDescription,
        },
      });

      // 如果逾期，创建逾期记录
      if (isOverdue && application.borrowEndDate) {
        const overdueDays = Math.ceil(
          (actualReturnDate.getTime() - application.borrowEndDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const fineAmount = overdueDays * 0.5; // 每天0.5元

        await prisma.overdueRecord.create({
          data: {
            applicationId,
            readerId: application.readerId,
            overdueDays,
            fineAmount,
            paidStatus: false,
          },
        });
      }

      await prisma.historyNode.create({
        data: {
          applicationId,
          status: isOverdue ? "OVERDUE" : "RETURNED",
          operatorId: "manager-001",
          operatorRole: "馆际负责人",
          operatorName: "王馆际",
          description: damageStatus 
            ? `图书已归还（有破损：${damageDescription}）` 
            : isOverdue 
              ? `图书已归还（逾期${Math.ceil((actualReturnDate.getTime() - application.borrowEndDate!.getTime()) / (1000 * 60 * 60 * 24))}天）`
              : "图书已正常归还",
        },
      });
      break;
    }
  }

  return redirect(`/application/${applicationId}`);
}

export default function ApplicationDetail() {
  const { application } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
        ← 返回首页
      </a>

      <h1>申请详情</h1>

      {/* 基本信息 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>基本信息</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <strong>申请ID：</strong> {application.id}
          </div>
          <div>
            <strong>状态：</strong>
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "bold",
              backgroundColor: getStatusColor(application.status),
              color: "white",
              marginLeft: "8px"
            }}>
              {getStatusText(application.status)}
            </span>
          </div>
          <div>
            <strong>申请时间：</strong> {new Date(application.createdAt).toLocaleString("zh-CN")}
          </div>
          {application.rejectReason && (
            <div>
              <strong>拒借原因：</strong> {application.rejectReason}
            </div>
          )}
        </div>
      </div>

      {/* 读者信息 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>读者信息</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <strong>姓名：</strong> {application.reader.name}
          </div>
          <div>
            <strong>学号：</strong> {application.reader.studentId}
          </div>
          <div>
            <strong>学院：</strong> {application.reader.college}
          </div>
          <div>
            <strong>电话：</strong> {application.reader.phone}
          </div>
          <div>
            <strong>邮箱：</strong> {application.reader.email}
          </div>
        </div>
      </div>

      {/* 图书信息 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>图书信息</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <strong>书名：</strong> {application.book.title}
          </div>
          <div>
            <strong>作者：</strong> {application.book.author}
          </div>
          <div>
            <strong>ISBN：</strong> {application.book.isbn}
          </div>
          <div>
            <strong>出版社：</strong> {application.book.publisher}
          </div>
          <div>
            <strong>出版年份：</strong> {application.book.publishYear}
          </div>
        </div>
      </div>

      {/* 外馆信息 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>外馆信息</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <strong>馆名：</strong> {application.library.name}
          </div>
          <div>
            <strong>地址：</strong> {application.library.address}
          </div>
          <div>
            <strong>联系人：</strong> {application.library.contact}
          </div>
          <div>
            <strong>电话：</strong> {application.library.phone}
          </div>
          <div>
            <strong>邮箱：</strong> {application.library.email}
          </div>
        </div>
      </div>

      {/* 物流信息 */}
      {application.logisticsStatus && (
        <div style={{ marginBottom: "30px" }}>
          <h2>物流信息</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <strong>物流状态：</strong> {getLogisticsStatusText(application.logisticsStatus)}
            </div>
            {application.logisticsNumber && (
              <div>
                <strong>物流单号：</strong> {application.logisticsNumber}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 借阅期限 */}
      {application.borrowStartDate && application.borrowEndDate && (
        <div style={{ marginBottom: "30px" }}>
          <h2>借阅期限</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <strong>开始日期：</strong> {new Date(application.borrowStartDate).toLocaleDateString("zh-CN")}
            </div>
            <div>
              <strong>截止日期：</strong> {new Date(application.borrowEndDate).toLocaleDateString("zh-CN")}
            </div>
            {application.actualReturnDate && (
              <div>
                <strong>实际归还日期：</strong> {new Date(application.actualReturnDate).toLocaleDateString("zh-CN")}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 破损信息 */}
      {application.damageStatus && (
        <div style={{ marginBottom: "30px" }}>
          <h2>破损信息</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <strong>破损程度：</strong> {getDamageStatusText(application.damageStatus)}
            </div>
            {application.damageDescription && (
              <div>
                <strong>破损描述：</strong> {application.damageDescription}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 逾期信息 */}
      {application.overdueRecord && (
        <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#ffebee", borderRadius: "8px" }}>
          <h2>逾期信息</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
            <div>
              <strong>逾期天数：</strong> {application.overdueRecord.overdueDays} 天
            </div>
            <div>
              <strong>罚款金额：</strong> ¥{application.overdueRecord.fineAmount.toFixed(2)}
            </div>
            <div>
              <strong>缴纳状态：</strong> {application.overdueRecord.paidStatus ? "已缴纳" : "未缴纳"}
            </div>
          </div>
        </div>
      )}

      {/* 历史节点 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>历史节点</h2>
        <div style={{ borderLeft: "3px solid #1976d2", paddingLeft: "20px" }}>
          {application.historyNodes.map((node, index) => (
            <div key={node.id} style={{ marginBottom: "20px", position: "relative" }}>
              <div style={{
                position: "absolute",
                left: "-26px",
                top: "5px",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#1976d2"
              }} />
              <div style={{ backgroundColor: "#f5f5f5", padding: "10px", borderRadius: "4px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {getStatusText(node.status)}
                </div>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  {node.description}
                </div>
                <div style={{ fontSize: "12px", color: "#999", marginTop: "5px" }}>
                  {node.operatorName} ({node.operatorRole}) - {new Date(node.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>操作</h2>
        
        {application.status === "PENDING" && (
          <Form method="post" style={{ marginBottom: "10px" }}>
            <input type="hidden" name="action" value="contact" />
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              开始联系外馆（馆员）
            </button>
          </Form>
        )}

        {application.status === "CONTACTING" && (
          <>
            <Form method="post" style={{ marginBottom: "10px" }}>
              <input type="hidden" name="action" value="approve" />
              <button type="submit" style={{
                padding: "10px 20px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                marginRight: "10px"
              }}>
                外馆同意借书
              </button>
            </Form>
            <Form method="post" style={{ marginBottom: "10px" }}>
              <input type="hidden" name="action" value="reject" />
              <div style={{ marginBottom: "10px" }}>
                <label>拒借原因：</label>
                <select name="reason" style={{ marginLeft: "10px", padding: "5px" }}>
                  <option value="图书已借出">图书已借出</option>
                  <option value="图书破损">图书破损</option>
                  <option value="馆藏珍贵不予外借">馆藏珍贵不予外借</option>
                  <option value="其他原因">其他原因</option>
                </select>
              </div>
              <button type="submit" style={{
                padding: "10px 20px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}>
                外馆拒借
              </button>
            </Form>
          </>
        )}

        {application.status === "APPROVED" && (
          <Form method="post" style={{ marginBottom: "10px" }}>
            <input type="hidden" name="action" value="transit" />
            <div style={{ marginBottom: "10px" }}>
              <label>物流单号：</label>
              <input type="text" name="logisticsNumber" required style={{ marginLeft: "10px", padding: "5px" }} />
            </div>
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#00bcd4",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              图书已发出（运输中）
            </button>
          </Form>
        )}

        {application.status === "IN_TRANSIT" && (
          <Form method="post" style={{ marginBottom: "10px" }}>
            <input type="hidden" name="action" value="arrive" />
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              图书已到馆
            </button>
          </Form>
        )}

        {application.status === "ARRIVED" && (
          <Form method="post" style={{ marginBottom: "10px" }}>
            <input type="hidden" name="action" value="notify" />
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#ff5722",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              通知读者取书（流通管理员）
            </button>
          </Form>
        )}

        {application.status === "READY_FOR_PICKUP" && (
          <Form method="post" style={{ marginBottom: "10px" }}>
            <input type="hidden" name="action" value="borrow" />
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#607d8b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              读者已取书
            </button>
          </Form>
        )}

        {application.status === "BORROWED" && (
          <Form method="post" style={{ marginBottom: "10px" }}>
            <input type="hidden" name="action" value="return" />
            <div style={{ marginBottom: "10px" }}>
              <label>图书状况：</label>
              <select name="condition" style={{ marginLeft: "10px", padding: "5px" }}>
                <option value="良好">良好</option>
                <option value="一般">一般</option>
                <option value="破损">破损</option>
              </select>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>破损程度（如有）：</label>
              <select name="damageStatus" style={{ marginLeft: "10px", padding: "5px" }}>
                <option value="">无破损</option>
                <option value="MINOR">轻微破损</option>
                <option value="MODERATE">中度破损</option>
                <option value="SEVERE">严重破损</option>
              </select>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>破损描述（如有）：</label>
              <input type="text" name="damageDescription" style={{ marginLeft: "10px", padding: "5px", width: "300px" }} />
            </div>
            <button type="submit" style={{
              padding: "10px 20px",
              backgroundColor: "#8bc34a",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}>
              复核归还（馆际负责人）
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "#ff9800",
    CONTACTING: "#2196f3",
    REJECTED: "#f44336",
    APPROVED: "#4caf50",
    IN_TRANSIT: "#00bcd4",
    ARRIVED: "#9c27b0",
    READY_FOR_PICKUP: "#ff5722",
    BORROWED: "#607d8b",
    RETURNED: "#8bc34a",
    OVERDUE: "#e91e63",
    DAMAGED: "#795548",
  };
  return colors[status] || "#757575";
}

function getStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING: "待处理",
    CONTACTING: "联系外馆中",
    REJECTED: "已拒借",
    APPROVED: "已同意",
    IN_TRANSIT: "运输中",
    ARRIVED: "已到馆",
    READY_FOR_PICKUP: "等待取书",
    BORROWED: "已借出",
    RETURNED: "已归还",
    OVERDUE: "逾期未还",
    DAMAGED: "图书破损",
  };
  return texts[status] || status;
}

function getLogisticsStatusText(status: string): string {
  const texts: Record<string, string> = {
    PENDING_PICKUP: "等待取件",
    IN_TRANSIT: "运输中",
    ARRIVED: "已到达",
    RETURNED: "已归还",
  };
  return texts[status] || status;
}

function getDamageStatusText(status: string): string {
  const texts: Record<string, string> = {
    MINOR: "轻微破损",
    MODERATE: "中度破损",
    SEVERE: "严重破损",
  };
  return texts[status] || status;
}