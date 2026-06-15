// @ts-ignore
import { createQwikCity } from '@builder.io/qwik-city/middleware/request-handler';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

export default createQwikCity({ render, qwikCityPlan });
