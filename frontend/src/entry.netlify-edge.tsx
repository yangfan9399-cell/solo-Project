/* WHAT IS THIS FILE? */
/**
 * WHAT IS THIS FILE?
 *
 * Entry point for Netlify Edge Functions.
 *
 */
import { createQwikCity } from '@builder.io/qwik-city/middleware/netlify-edge';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

const { handle } = createQwikCity({ render, qwikCityPlan });

export { handle };
