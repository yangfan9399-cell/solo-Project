import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';
import { manifest } from '@qwik-client-manifest';

const fetch = createQwikCity({ render, qwikCityPlan, manifest });

export { fetch };
