import { MetaProvider, Title, Meta } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "solid-start";
import { Suspense } from "solid-js";
import "./root.css";

export default function Root() {
  return (
    <MetaProvider>
      <Html lang="zh-CN">
        <Head>
          <Title>悬崖茶园采摘索道调度游戏</Title>
          <Meta charset="utf-8" />
          <Meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Body>
          <Suspense>
            <Router>
              <FileRoutes />
            </Router>
          </Suspense>
        </Body>
      </Html>
    </MetaProvider>
  );
}

function Html(props: { lang: string; children: any }) {
  return (
    <html lang={props.lang}>
      {props.children}
    </html>
  );
}

function Head(props: { children: any }) {
  return <head>{props.children}</head>;
}

function Body(props: { children: any }) {
  return <body>{props.children}</body>;
}
