import { renderSync } from "solid-start/entry-server";
import Root from "./root";

const exchange = renderSync(Root);

const handler = exchange({
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
