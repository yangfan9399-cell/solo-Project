import { render } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import { Root } from './root';

export default function (opts: { ssrHeadContent: string }) {
  return (
    <QwikCityProvider>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <dangerouslySetInnerHTML content={opts.ssrHeadContent} />
      </head>
      <body lang="zh-CN">
        <Root />
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
}
