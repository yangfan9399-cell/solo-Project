/* eslint-disable */
import "@builder.io/qwik-city";
import type {
  QwikCityRequestContext,
  RequestEvent,
} from "@builder.io/qwik-city/middleware.request";

declare global {
  interface QwikCityPlatform {}
}

declare module "@builder.io/qwik-city/middleware.request" {
  interface Platform {
    /**
     * Directory of the `routes` folder.
     * This is an internal property.
     */
    routesDir: string;
  }
}
