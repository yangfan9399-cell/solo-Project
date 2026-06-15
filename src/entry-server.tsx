import { renderSync } from "solid-start/entry-server";
import Root from "./root";

// 中间件工厂类型 - 无需严格匹配，用 any 适配 solid-start 内部复杂签名
const exchange: any = renderSync(Root);

const handler: (event: any) => Promise<Response> = exchange({
  forward: async () =>
    new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain" },
    }),
});

export default async function (event: any): Promise<Response> {
  try {
    const res = await handler(event);
    return res;
  } catch (e: any) {
    console.error("Entry server error:", e);
    if (e instanceof Response) return e;
    return new Response(
      JSON.stringify({ error: e?.message || String(e) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
