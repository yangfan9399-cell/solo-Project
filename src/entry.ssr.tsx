import { renderToStream } from '@builder.io/qwik/server';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import { Root } from './root';
import type { RenderToStreamOptions, RenderToStreamResult } from '@builder.io/qwik/server';

export default function (opts: RenderToStreamOptions): Promise<RenderToStreamResult> {
  return renderToStream(
    (
      <QwikCityProvider>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body lang="zh-CN">
          <Root />
          <ServiceWorkerRegister />
        </body>
      </QwikCityProvider>
    ),
    opts
  );
}
