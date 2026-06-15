export function GET() {
  return new Response(
    JSON.stringify({
      success: true,
      pong: Date.now(),
      message: "茶园调度服务器运行中",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
