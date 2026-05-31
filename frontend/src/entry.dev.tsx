/* WHAT IS THIS FILE? */
/**
 * WHAT IS THIS FILE?
 *
 * Entry point for the Vite development server.
 *
 */
import { createQwikCity } from '@builder.io/qwik-city/middleware/node';
import qwikCityPlan from '@qwik-city-plan';
import render from './entry.ssr';

export default createQwikCity({ render, qwikCityPlan });
