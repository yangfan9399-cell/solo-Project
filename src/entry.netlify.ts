import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import type { QwikCityPlan } from '@builder.io/qwik-city';
import type { ServerRenderOptions } from '@builder.io/qwik-city/middleware/request-handler';
import render from './entry.ssr';

const qwikCityPlan: QwikCityPlan = {
  routes: [],
};

const options: ServerRenderOptions = {
  render,
  qwikCityPlan,
};

export default createQwikCity(options);
