import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader({}: LoaderFunctionArgs) {
  const readers = await prisma.reader.findMany({
    include: {
      overdueRecords: {
        where: {
          paidStatus: false,
        },
      },
    },
  });

  return json({ readers });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  if (action === "create") {
    const name = formData.get("name") as string;
    const studentId = formData.get("studentId") as string;
    const college = formData.get("college") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    await prisma.reader.create({
      data: {
        name,
        studentId,
        college,
        phone,
        email,
      },
    });
  } else if (action === "pay") {
    const overdueId = formData.get("overdueId") as string;
    await prisma.overdueRecord.update({
      where: { id: overdueId },
      data: { paidStatus: true },
    });
  }

  return redirect("/readers");
}

export default function Readers() {
  const { readers } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
        ← 返回首页
      </a>

      <h1>读者管理</h1>

      {/* 创建读者表单 */}
      <div style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <h2>添加新读者</h2>
        <Form method="post">
          <input type="hidden" name="_action" value="create" />
          <div style={{ marginBottom: "10px" }}>
            <label>姓名：</label>
            <input type="text" name="name" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>学号：</label>
            <input type="text" name="studentId" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>学院：</label>
            <input type="text" name="college" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>电话：</label>
            <input type="text" name="phone" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>邮箱：</label>
            <input type="email" name="email" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <button type="submit" style={{
            padding: "10px 20px",
            backgroundColor: "#1976d2",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
            添加读者
          </button>
        </Form>
      </div>

      {/* 读者列表 */}
      <h2>读者列表</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>姓名</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>学号</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>学院</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>电话</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>邮箱</th>
            <th style={{ border: "1px solid #ddd", padding: "12px", textAlign: "left" }}>逾期状态</th>
          </tr>
        </thead>
        <tbody>
          {readers.map((reader) => (
            <tr key={reader.id}>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{reader.name}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{reader.studentId}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{reader.college}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{reader.phone}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>{reader.email}</td>
              <td style={{ border: "1px solid #ddd", padding: "12px" }}>
                {reader.overdueRecords.length > 0 ? (
                  <div>
                    <span style={{ color: "#f44336", fontWeight: "bold" }}>
                      有逾期记录（{reader.overdueRecords.length}条）
                    </span>
                    {reader.overdueRecords.map((record) => (
                      <div key={record.id} style={{ marginTop: "5px" }}>
                        <Form method="post">
                          <input type="hidden" name="_action" value="pay" />
                          <input type="hidden" name="overdueId" value={record.id} />
                          <span>逾期{record.overdueDays}天，罚款¥{record.fineAmount.toFixed(2)}</span>
                          <button type="submit" style={{
                            marginLeft: "10px",
                            padding: "3px 8px",
                            backgroundColor: "#4caf50",
                            color: "white",
                            border: "none",
                            borderRadius: "3px",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}>
                            缴纳罚款
                          </button>
                        </Form>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: "#4caf50" }}>正常</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}