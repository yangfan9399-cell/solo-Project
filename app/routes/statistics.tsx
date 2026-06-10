import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader({}: LoaderFunctionArgs) {
  // 按学院统计
  const applications = await prisma.interlibraryApplication.findMany({
    include: {
      reader: true,
      library: true,
    },
  });

  const collegeStats: Record<string, number> = {};
  applications.forEach((app) => {
    const college = app.reader.college;
    collegeStats[college] = (collegeStats[college] || 0) + 1;
  });

  // 按外馆统计
  const libraryStats: Record<string, number> = {};
  applications.forEach((app) => {
    const library = app.library.name;
    libraryStats[library] = (libraryStats[library] || 0) + 1;
  });

  // 按拒借原因统计
  const rejectReasonStats: Record<string, number> = {};
  applications
    .filter((app) => app.status === "REJECTED" && app.rejectReason)
    .forEach((app) => {
      const reason = app.rejectReason!;
      rejectReasonStats[reason] = (rejectReasonStats[reason] || 0) + 1;
    });

  // 按借阅周期统计
  const completedApps = applications.filter(
    (app) => app.borrowStartDate && app.actualReturnDate
  );
  const borrowPeriodStats: Record<string, number> = {};
  completedApps.forEach((app) => {
    if (app.borrowStartDate && app.actualReturnDate) {
      const days = Math.ceil(
        (app.actualReturnDate.getTime() - app.borrowStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const period =
        days <= 7
          ? "1周内"
          : days <= 14
          ? "1-2周"
          : days <= 21
          ? "2-3周"
          : days <= 30
          ? "3-4周"
          : "超过4周";
      borrowPeriodStats[period] = (borrowPeriodStats[period] || 0) + 1;
    }
  });

  // 状态统计
  const statusStats: Record<string, number> = {};
  applications.forEach((app) => {
    const status = app.status;
    statusStats[status] = (statusStats[status] || 0) + 1;
  });

  return json({
    collegeStats,
    libraryStats,
    rejectReasonStats,
    borrowPeriodStats,
    statusStats,
    totalApplications: applications.length,
  });
}

export default function Statistics() {
  const data = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
        ← 返回首页
      </a>

      <h1>统计报表</h1>

      <div style={{ marginBottom: "30px" }}>
        <h2>总体概况</h2>
        <p style={{ fontSize: "24px", fontWeight: "bold" }}>
          总申请数：{data.totalApplications}
        </p>
      </div>

      {/* 按学院统计 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>按学院统计</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                学院
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                申请数
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.collegeStats)
              .sort((a, b) => b[1] - a[1])
              .map(([college, count]) => (
                <tr key={college}>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>{college}</td>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>{count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 按外馆统计 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>按外馆统计</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                外馆
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                申请数
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.libraryStats)
              .sort((a, b) => b[1] - a[1])
              .map(([library, count]) => (
                <tr key={library}>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>{library}</td>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>{count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 拒借原因统计 */}
      {Object.keys(data.rejectReasonStats).length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h2>按拒借原因统计</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                  拒借原因
                </th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                  拒借数
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.rejectReasonStats)
                .sort((a, b) => b[1] - a[1])
                .map(([reason, count]) => (
                  <tr key={reason}>
                    <td style={{ border: "1px solid #ddd", padding: "12px" }}>{reason}</td>
                    <td style={{ border: "1px solid #ddd", padding: "12px" }}>{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 按借阅周期统计 */}
      {Object.keys(data.borrowPeriodStats).length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <h2>按借阅周期统计</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                  借阅周期
                </th>
                <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                  数量
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.borrowPeriodStats)
                .sort((a, b) => {
                  const order = ["1周内", "1-2周", "2-3周", "3-4周", "超过4周"];
                  return order.indexOf(a[0]) - order.indexOf(b[0]);
                })
                .map(([period, count]) => (
                  <tr key={period}>
                    <td style={{ border: "1px solid #ddd", padding: "12px" }}>{period}</td>
                    <td style={{ border: "1px solid #ddd", padding: "12px" }}>{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 状态统计 */}
      <div style={{ marginBottom: "30px" }}>
        <h2>申请状态统计</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                状态
              </th>
              <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>
                数量
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.statusStats)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => (
                <tr key={status}>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                    {getStatusText(status)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "12px" }}>{count}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
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