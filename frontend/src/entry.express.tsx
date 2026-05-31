/* WHAT IS THIS FILE? */
/**
 * WHAT IS THIS FILE?
 *
 * Entry point for the Express adapter.
 *
 */
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

const { createApp, router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
});

export { createApp, router, notFound };
