import { createRequestHandler } from "@remix-run/express";
import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.use(express.json({ limit: "10mb" }));

app.all(
  "*",
  createRequestHandler({
    build: await import("./build/server/index.js"),
  })
);

app.listen(PORT, () => {
  console.log(`沙盘地形等高线描绘工具 已启动: http://localhost:${PORT}`);
});
