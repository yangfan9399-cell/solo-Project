import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader({}: LoaderFunctionArgs) {
  const applications = await prisma.interlibraryApplication.findMany({
    include: {
      reader: true,
      book: {
        include: {
          library: true,
        },
      },
      library: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    inProgress: applications.filter(
      (a) => ["CONTACTING", "APPROVED", "IN_TRANSIT", "ARRIVED", "READY_FOR_PICKUP", "BORROWED"].includes(a.status)
    ).length,
    overdue: applications.filter((a) => a.status === "OVERDUE").length,
    rejected: applications.filter((a) => a.status === "REJECTED").length,
  };

  return json({ applications, stats });
}

export default function Index() {
  const { applications, stats } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <h1>图书馆馆际互借系统</h1>
      
      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <div style={{ padding: "15px", backgroundColor: "#e3f2fd", borderRadius: "8px", flex: 1 }}>
          <h3>总申请数</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.total}</p>
        </div>
        <div style={{ padding: "15px", backgroundColor: "#fff3e0", borderRadius: "8px", flex: 1 }}>
          <h3>待处理</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.pending}</p>
        </div>
        <div style={{ padding: "15px", backgroundColor: "#f1f8e9", borderRadius: "8px", flex: 1 }}>
          <h3>进行中</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.inProgress}</p>
        </div>
        <div style={{ padding: "15px", backgroundColor: "#ffebee", borderRadius: "8px", flex: 1 }}>
          <h3>逾期</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.overdue}</p>
        </div>
        <div style={{ padding: "15px", backgroundColor: "#fce4ec", borderRadius: "8px", flex: 1 }}>
          <h3>已拒借</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>{stats.rejected}</p>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <Link to="/apply" style={{ 
          padding: "10px 20px", 
          backgroundColor: "#1976d2", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "4px",
          marginRight: "10px"
        }}>
          新建申请
        </Link>
        <Link to="/statistics" style={{ 
          padding: "10px 20px", 
          backgroundColor: "#388e3c", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "4px",
          marginRight: "10px"
        }}>
          统计报表
        </Link>
        <Link to="/readers" style={{ 
          padding: "10px 20px", 
          backgroundColor: "#7b1fa2", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "4px",
          marginRight: "10px"
        }}>
          读者管理
        </Link>
        <Link to="/libraries" style={{ 
          padding: "10px 20px", 
          backgroundColor: "#f57c00", 
          color: "white", 
          textDecoration: "none", 
          borderRadius: "4px"
        }}>
          外馆管理
        </Link>
      </div>

      <h2>申请列表</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>申请ID</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>读者</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>图书</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>外馆</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>状态</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>申请时间</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{app.id.substring(0, 8)}...</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{app.reader.name}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{app.book.title}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{app.library.name}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                <span style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                  backgroundColor: getStatusColor(app.status),
                  color: "white"
                }}>
                  {getStatusText(app.status)}
                </span>
              </td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                {new Date(app.createdAt).toLocaleDateString("zh-CN")}
              </td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                <Link to={`/application/${app.id}`} style={{ color: "#1976d2" }}>
                  查看详情
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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