import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader({}: LoaderFunctionArgs) {
  const readers = await prisma.reader.findMany();
  const books = await prisma.book.findMany({
    include: {
      library: true,
    },
  });

  return json({ readers, books });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const readerId = formData.get("readerId") as string;
  const bookId = formData.get("bookId") as string;

  // 检查读者是否有逾期未还的申请（状态为 OVERDUE）
  const overdueApplication = await prisma.interlibraryApplication.findFirst({
    where: {
      readerId,
      status: "OVERDUE",
    },
  });

  if (overdueApplication) {
    return json({ error: "您有逾期未还的图书，暂时无法申请新的馆际互借" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { library: true },
  });

  if (!book) {
    return json({ error: "图书不存在" }, { status: 400 });
  }

  // 创建申请
  const application = await prisma.interlibraryApplication.create({
    data: {
      readerId,
      bookId,
      libraryId: book.libraryId,
      status: "PENDING",
    },
  });

  // 创建历史节点
  await prisma.historyNode.create({
    data: {
      applicationId: application.id,
      status: "PENDING",
      operatorId: readerId,
      operatorRole: "读者",
      operatorName: "读者",
      description: "提交馆际互借申请",
    },
  });

  return redirect(`/application/${application.id}`);
}

export default function Apply() {
  const { readers, books } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
        ← 返回首页
      </a>

      <h1>提交馆际互借申请</h1>

      <Form method="post" style={{ maxWidth: "600px" }}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            选择读者：
          </label>
          <select name="readerId" required style={{ width: "100%", padding: "10px", fontSize: "16px" }}>
            <option value="">请选择读者</option>
            {readers.map((reader) => (
              <option key={reader.id} value={reader.id}>
                {reader.name} ({reader.studentId}) - {reader.college}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
            选择图书：
          </label>
          <select name="bookId" required style={{ width: "100%", padding: "10px", fontSize: "16px" }}>
            <option value="">请选择图书</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} - {book.author} ({book.library.name})
              </option>
            ))}
          </select>
        </div>

        <button type="submit" style={{
          padding: "12px 24px",
          backgroundColor: "#1976d2",
          color: "white",
          border: "none",
          borderRadius: "4px",
          fontSize: "16px",
          cursor: "pointer"
        }}>
          提交申请
        </button>
      </Form>
    </div>
  );
}