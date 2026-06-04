/**
 * SSR entry point, in charge of providing the Qwik runtime with the component to render.
 */
import {
  renderToStream,
  type RenderToStreamOptions,
} from "@builder.io/qwik/server";
import { manifest } from "@qwik-client-manifest";
import Root from "./root";

export default function (opts: RenderToStreamOptions) {
  return renderToStream(<Root />, {
    manifest,
    ...opts,
    // Use container attributes to set attributes on the html tag.
    containerAttributes: {
      lang: "zh-CN",
      ...opts.containerAttributes,
    },
    serverData: {
      ...opts.serverData,
    },
  });
}
