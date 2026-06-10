import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { Card, CardBody, CardHeader } from "~/components/ui/Card";
import { Badge, StatusBadge } from "~/components/ui/Badge";
import { Button } from "~/components/ui/Button";
import { Timeline } from "~/components/ui/Timeline";
import { prisma } from "~/db/db.server";

export const loader: LoaderFunction = async ({ params }) => {
  const application = await prisma.borrowApplication.findUnique({
    where: { id: params.id },
    include: {
      classroom: { include: { campus: true } },
      history: { orderBy: { timestamp: "asc" } },
      handovers: true,
      verification: true,
    },
  });

  if (!application) {
    throw new Response("申请不存在", { status: 404 });
  }

  const equipment = await prisma.equipment.findMany({
    where: { classroomId: application.classroomId },
  });

  return json({ application, equipment });
};

export default function ApplicationDetail() {
  const { application, equipment } = useLoaderData<typeof loader>();

  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      APPLICATION_SUBMITTED: "提交申请",
      APPLICATION_APPROVED: "审批通过",
      APPLICATION_REJECTED: "审批拒绝",
      EQUIPMENT_HANDED_OVER: "设备交接",
      IN_USE: "开始使用",
      RETURN_PENDING: "待归还",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
    };
    return actionMap[action] || action;
  };

  const getActionStatus = (action: string, index: number) => {
    if (application.status === "CANCELLED" || application.status === "REJECTED") {
      if (action === "APPLICATION_REJECTED" || action === "CANCELLED") return "completed";
      return "pending";
    }
    if (index === application.history.length - 1) return "active";
    return "completed";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/applications" className="text-primary-600 hover:text-primary-700 text-sm">
          ← 返回申请列表
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">申请详情</h1>
            <p className="mt-2 text-gray-600">申请编号: {application.id}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">教室</p>
              <p className="font-medium text-gray-900">{application.classroom.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">校区</p>
              <p className="font-medium text-gray-900">{application.classroom.campus.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">教室类型</p>
              <p className="font-medium text-gray-900">{application.classroom.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">容纳人数</p>
              <p className="font-medium text-gray-900">{application.classroom.capacity}人</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">借用信息</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">申请人</p>
              <p className="font-medium text-gray-900">{application.applicantName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">开始时间</p>
              <p className="font-medium text-gray-900">
                {new Date(application.startTime).toLocaleString("zh-CN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">结束时间</p>
              <p className="font-medium text-gray-900">
                {new Date(application.endTime).toLocaleString("zh-CN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">借用用途</p>
              <p className="font-medium text-gray-900">{application.purpose}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">设备清单</h3>
          </CardHeader>
          <CardBody>
            {application.handovers.length > 0 ? (
              <div className="space-y-2">
                {application.handovers.map((handover, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span className="text-sm text-gray-900">{handover.equipmentName}</span>
                    <Badge variant="success">x{handover.quantity}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无交接设备</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">归还核验</h3>
          </CardHeader>
          <CardBody>
            {application.verification ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">清洁状态</span>
                  <Badge
                    variant={
                      application.verification.cleaningStatus === "PASSED"
                        ? "success"
                        : application.verification.cleaningStatus === "FAILED"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {application.verification.cleaningStatus === "PASSED"
                      ? "合格"
                      : application.verification.cleaningStatus === "FAILED"
                      ? "不合格"
                      : "待检查"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">核验人</p>
                  <p className="font-medium text-gray-900">{application.verification.verifierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">核验时间</p>
                  <p className="font-medium text-gray-900">
                    {new Date(application.verification.verifiedAt).toLocaleString("zh-CN")}
                  </p>
                </div>
                {application.verification.abnormalReason && (
                  <div>
                    <p className="text-sm text-gray-600">异常原因</p>
                    <Badge variant="danger" className="mt-1">
                      {application.verification.abnormalReason === "EQUIPMENT_LOST"
                        ? "设备遗失"
                        : application.verification.abnormalReason === "CLEANING_FAILED"
                        ? "清洁不合格"
                        : application.verification.abnormalReason}
                    </Badge>
                  </div>
                )}
                {application.verification.cleaningPhoto && (
                  <div>
                    <p className="text-sm text-gray-600">清洁照片</p>
                    <p className="text-sm text-gray-500 mt-1">{application.verification.cleaningPhoto}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暂无核验记录</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">操作</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            {application.status === "PENDING" && (
              <Link to={`/admin/approve/${application.id}`}>
                <Button variant="primary" className="w-full">
                  审批申请
                </Button>
              </Link>
            )}
            {application.status === "APPROVED" && (
              <Link to={`/equipment/handover/${application.id}`}>
                <Button variant="primary" className="w-full">
                  设备交接
                </Button>
              </Link>
            )}
            {application.status === "RETURN_PENDING" && (
              <Link to={`/verify/${application.id}`}>
                <Button variant="success" className="w-full">
                  归还核验
                </Button>
              </Link>
            )}
            {["IN_USE", "COMPLETED", "CANCELLED", "REJECTED"].includes(application.status) && (
              <p className="text-sm text-gray-500 text-center py-4">
                {application.status === "IN_USE"
                  ? "该申请正在使用中"
                  : application.status === "COMPLETED"
                  ? "该申请已完成"
                  : "该申请已结束"}
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">流程节点</h3>
        </CardHeader>
        <CardBody>
          <Timeline
            items={application.history.map((item, idx) => ({
              id: item.id,
              title: formatAction(item.action),
              description: item.note,
              timestamp: new Date(item.timestamp).toLocaleString("zh-CN"),
              status: getActionStatus(item.action, idx),
            }))}
          />
        </CardBody>
      </Card>
    </div>
  );
}
