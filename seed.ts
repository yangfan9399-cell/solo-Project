import { mkdirSync } from "fs";
import { dirname, join } from "path";
import db, { initDB } from "./src/server/db";

const dbPath = process.env.DB_PATH || join(process.cwd(), "data", "library.db");
mkdirSync(dirname(dbPath), { recursive: true });

initDB();

const libraries = [
  { name: "北京大学图书馆", code: "PKU", address: "北京市海淀区颐和园路5号", contact_person: "张馆员", contact_email: "lib@pku.edu.cn", contact_phone: "010-62751234" },
  { name: "清华大学图书馆", code: "THU", address: "北京市海淀区清华园1号", contact_person: "李馆员", contact_email: "lib@tsinghua.edu.cn", contact_phone: "010-62785678" },
  { name: "中国人民大学图书馆", code: "RUC", address: "北京市海淀区中关村大街59号", contact_person: "王馆员", contact_email: "lib@ruc.edu.cn", contact_phone: "010-62519012" },
  { name: "北京师范大学图书馆", code: "BNU", address: "北京市海淀区新街口外大街19号", contact_person: "赵馆员", contact_email: "lib@bnu.edu.cn", contact_phone: "010-58803456" },
  { name: "复旦大学图书馆", code: "FDU", address: "上海市杨浦区邯郸路220号", contact_person: "刘馆员", contact_email: "lib@fudan.edu.cn", contact_phone: "021-65647890" }
];

const readers = [
  { card_number: "R20240001", name: "张三", email: "zhangsan@pku.edu.cn", phone: "13800138001", department: "计算机科学系", status: "active" as const },
  { card_number: "R20240002", name: "李四", email: "lisi@pku.edu.cn", phone: "13800138002", department: "数学系", status: "active" as const },
  { card_number: "R20240003", name: "王五", email: "wangwu@thu.edu.cn", phone: "13800138003", department: "物理系", status: "active" as const },
  { card_number: "R20240004", name: "赵六", email: "zhaoliu@ruc.edu.cn", phone: "13800138004", department: "经济学院", status: "active" as const },
  { card_number: "R20240005", name: "钱七", email: "qianqi@bnu.edu.cn", phone: "13800138005", department: "文学院", status: "active" as const }
];

const books = [
  { isbn: "9787111213826", title: "深入理解计算机系统", author: "Randal E. Bryant", publisher: "机械工业出版社", publish_year: 2016, category: "计算机", location: "A-301", status: "available" as const, library_id: 1 },
  { isbn: "9787111407010", title: "算法导论", author: "Thomas H. Cormen", publisher: "机械工业出版社", publish_year: 2013, category: "计算机", location: "A-302", status: "available" as const, library_id: 2 },
  { isbn: "9787040274301", title: "数学分析", author: "华东师范大学数学系", publisher: "高等教育出版社", publish_year: 2010, category: "数学", location: "B-101", status: "available" as const, library_id: 1 },
  { isbn: "9787040239096", title: "量子力学导论", author: "曾谨言", publisher: "高等教育出版社", publish_year: 2014, category: "物理", location: "C-201", status: "available" as const, library_id: 2 },
  { isbn: "9787300156658", title: "经济学原理", author: "曼昆", publisher: "中国人民大学出版社", publish_year: 2015, category: "经济", location: "D-101", status: "available" as const, library_id: 3 },
  { isbn: "9787020028788", title: "红楼梦", author: "曹雪芹", publisher: "人民文学出版社", publish_year: 2008, category: "文学", location: "E-101", status: "available" as const, library_id: 4 },
  { isbn: "9787108017667", title: "万历十五年", author: "黄仁宇", publisher: "生活·读书·新知三联书店", publish_year: 2014, category: "历史", location: "F-201", status: "available" as const, library_id: 5 },
  { isbn: "9787544731299", title: "百年孤独", author: "加西亚·马尔克斯", publisher: "译林出版社", publish_year: 2011, category: "文学", location: "E-102", status: "available" as const, library_id: 2 },
  { isbn: "9787111544937", title: "设计模式", author: "Erich Gamma", publisher: "机械工业出版社", publish_year: 2017, category: "计算机", location: "A-303", status: "available" as const, library_id: 3 },
  { isbn: "9787115359262", title: "代码整洁之道", author: "Robert C. Martin", publisher: "人民邮电出版社", publish_year: 2014, category: "计算机", location: "A-304", status: "available" as const, library_id: 4 }
];

const insertLibrary = db.prepare(`
  INSERT INTO libraries (name, code, address, contact_person, contact_email, contact_phone)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertReader = db.prepare(`
  INSERT INTO readers (card_number, name, email, phone, department, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertBook = db.prepare(`
  INSERT INTO books (isbn, title, author, publisher, publish_year, category, location, status, library_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertILLRequest = db.prepare(`
  INSERT INTO ill_requests 
  (request_no, reader_id, book_id, requesting_library_id, supplying_library_id, status, purpose, request_date, due_date, renewal_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

console.log("🌱 开始插入种子数据...");

db.transaction(() => {
  console.log("📚 插入图书馆数据...");
  libraries.forEach(lib => insertLibrary.run(lib.name, lib.code, lib.address, lib.contact_person, lib.contact_email, lib.contact_phone));

  console.log("👤 插入读者数据...");
  readers.forEach(reader => insertReader.run(reader.card_number, reader.name, reader.email, reader.phone, reader.department, reader.status));

  console.log("📖 插入图书数据...");
  books.forEach(book => insertBook.run(book.isbn, book.title, book.author, book.publisher, book.publish_year, book.category, book.location, book.status, book.library_id));

  console.log("📋 插入借阅申请数据...");
  const today = new Date();
  const dueDate = new Date(today);
  dueDate.setDate(dueDate.getDate() + 30);
  const overdueDate = new Date(today);
  overdueDate.setDate(overdueDate.getDate() - 15);

  insertILLRequest.run("ILL202406010001", 1, 2, 1, 2, "lending", "research", "2024-05-15", dueDate.toISOString().split("T")[0], 0);
  insertILLRequest.run("ILL202406010002", 2, 5, 1, 3, "matched", "study", "2024-06-01", null, 0);
  insertILLRequest.run("ILL202406010003", 3, 1, 2, 1, "pending", "thesis", "2024-06-01", null, 0);
  insertILLRequest.run("ILL202406010004", 4, 6, 3, 4, "overdue", "research", "2024-04-01", overdueDate.toISOString().split("T")[0], 0);
  insertILLRequest.run("ILL202406010005", 5, 7, 4, 5, "shipped", "study", "2024-05-28", null, 0);
  insertILLRequest.run("ILL202406010006", 1, 8, 1, 2, "completed", "research", "2024-03-01", "2024-04-01", 1);
})();

console.log("✅ 种子数据插入完成！");
console.log("");
console.log("📊 测试账号：");
console.log("  读者证号: R20240001 (张三)");
console.log("  读者证号: R20240002 (李四)");
console.log("");
console.log("🚀 运行 npm run dev 启动开发服务器");
