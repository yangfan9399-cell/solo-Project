import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import * as ReactDOMServer from "react-dom/server";
import { ensureSeedData } from "./initData.server";

ensureSeedData();

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  _loadContext: AppLoadContext
) {
  const callbackName = "renderToReadableStream" in ReactDOMServer
    ? (ReactDOMServer as any).renderToReadableStream
    : null;

  let body: BodyInit;
  if (callbackName) {
    body = await callbackName(
      <RemixServer context={remixContext} url={request.url} />,
      {
        signal: request.signal,
        onError(error: unknown) {
          console.error(error);
          responseStatusCode = 500;
        },
      }
    );
  } else {
    body = (ReactDOMServer as any).renderToString(
      <RemixServer context={remixContext} url={request.url} />
    );
  }

  if (isbot(request.headers.get("user-agent") || "") && typeof (body as any)?.allReady) {
    await (body as any).allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
