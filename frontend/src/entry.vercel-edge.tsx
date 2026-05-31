/* WHAT IS THIS FILE? */
/**
 * WHAT IS THIS FILE?
 *
 * Entry point for Vercel's Edge Functions.
 *
 */
import { createQwikCity } from '@builder.io/qwik-city/middleware/vercel-edge';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

const { handle } = createQwikCity({ render, qwikCityPlan });

export { handle };
