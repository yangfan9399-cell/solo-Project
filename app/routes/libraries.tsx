import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { prisma } from "~/db.server";

export async function loader({}: LoaderFunctionArgs) {
  const libraries = await prisma.externalLibrary.findMany({
    include: {
      books: true,
    },
  });

  return json({ libraries });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("_action") as string;

  if (action === "createLibrary") {
    const name = formData.get("name") as string;
    const address = formData.get("address") as string;
    const contact = formData.get("contact") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string;

    await prisma.externalLibrary.create({
      data: {
        name,
        address,
        contact,
        phone,
        email,
      },
    });
  } else if (action === "createBook") {
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const isbn = formData.get("isbn") as string;
    const publisher = formData.get("publisher") as string;
    const publishYear = parseInt(formData.get("publishYear") as string);
    const libraryId = formData.get("libraryId") as string;

    await prisma.book.create({
      data: {
        title,
        author,
        isbn,
        publisher,
        publishYear,
        libraryId,
      },
    });
  }

  return redirect("/libraries");
}

export default function Libraries() {
  const { libraries } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      <a href="/" style={{ color: "#1976d2", textDecoration: "none" }}>
        ← 返回首页
      </a>

      <h1>外馆管理</h1>

      {/* 创建外馆表单 */}
      <div style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
        <h2>添加新外馆</h2>
        <Form method="post">
          <input type="hidden" name="_action" value="createLibrary" />
          <div style={{ marginBottom: "10px" }}>
            <label>馆名：</label>
            <input type="text" name="name" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>地址：</label>
            <input type="text" name="address" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>联系人：</label>
            <input type="text" name="contact" required style={{ marginLeft: "10px", padding: "5px" }} />
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
            backgroundColor: "#f57c00",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
            添加外馆
          </button>
        </Form>
      </div>

      {/* 创建图书表单 */}
      <div style={{ marginBottom: "30px", padding: "20px", backgroundColor: "#fff3e0", borderRadius: "8px" }}>
        <h2>添加图书</h2>
        <Form method="post">
          <input type="hidden" name="_action" value="createBook" />
          <div style={{ marginBottom: "10px" }}>
            <label>所属外馆：</label>
            <select name="libraryId" required style={{ marginLeft: "10px", padding: "5px" }}>
              <option value="">请选择外馆</option>
              {libraries.map((lib) => (
                <option key={lib.id} value={lib.id}>{lib.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>书名：</label>
            <input type="text" name="title" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>作者：</label>
            <input type="text" name="author" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>ISBN：</label>
            <input type="text" name="isbn" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>出版社：</label>
            <input type="text" name="publisher" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label>出版年份：</label>
            <input type="number" name="publishYear" required style={{ marginLeft: "10px", padding: "5px" }} />
          </div>
          <button type="submit" style={{
            padding: "10px 20px",
            backgroundColor: "#f57c00",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
            添加图书
          </button>
        </Form>
      </div>

      {/* 外馆列表 */}
      <h2>外馆列表</h2>
      {libraries.map((library) => (
        <div key={library.id} style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
          <h3>{library.name}</h3>
          <div style={{ marginBottom: "10px" }}>
            <strong>地址：</strong> {library.address}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>联系人：</strong> {library.contact}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>电话：</strong> {library.phone}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>邮箱：</strong> {library.email}
          </div>
          <div style={{ marginBottom: "10px" }}>
            <strong>图书数量：</strong> {library.books.length}
          </div>
          {library.books.length > 0 && (
            <div>
              <strong>图书列表：</strong>
              <ul style={{ marginTop: "5px" }}>
                {library.books.map((book) => (
                  <li key={book.id}>
                    {book.title} - {book.author} (ISBN: {book.isbn})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}