import { renderToString, RenderToStringOptions } from '@builder.io/qwik/server';
import { Root } from './root';

export default function (opts: RenderToStringOptions) {
  return renderToString(<Root />, opts);
}
