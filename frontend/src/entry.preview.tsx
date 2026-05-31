/**
 * WHAT IS THIS FILE?
 *
 * Entry point for the Static Site Generation (SSG).
 *
 */
import qwikCityPlan from '@qwik-city-plan';
import { manifest } from '@qwik-client-manifest';
import render from './entry.ssr';
import type { StaticGenerateRenderOptions } from '@builder.io/qwik-city/static';

export default {
  render,
  qwikCityPlan,
  manifest,
  base: '/',
  inspect: false,
} satisfies StaticGenerateRenderOptions;
