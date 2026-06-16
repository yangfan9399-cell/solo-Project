/* eslint-disable */
import type { RenderOptions } from "@builder.io/qwik/server";
import { render } from "@builder.io/qwik/server";
import Root from "./root";

export default function (opts: RenderOptions) {
  return render(<Root />, opts);
}
