import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import render from './entry.ssr';

export default createQwikCity({
  render: render as unknown as any,
  qwikCityPlan: { routes: [] } as any,
} as any);
