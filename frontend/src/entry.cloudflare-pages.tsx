/* WHAT IS THIS FILE? */
/**
 * WHAT IS THIS FILE?
 *
 * Entry point for the Cloudflare Pages adapter.
 *
 */
import { createQwikCity } from '@builder.io/qwik-city/middleware/cloudflare-pages';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

const { onRequest } = createQwikCity({ render, qwikCityPlan });

export { onRequest };
