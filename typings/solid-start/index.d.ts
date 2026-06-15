import "solid-js";
import type { Component, JSX } from "solid-js";

export * as default from "solid-start";

export const StartClient: Component;

export function mount<T>(
  component: Component<T>,
  mountNode: HTMLElement | Document
): void;

export function Start(props: any): JSX.Element;
export function FileRoutes(props?: any): JSX.Element;
export function Routes(props?: any): JSX.Element;
export function Route(props?: any): JSX.Element;
export function A(props?: any): JSX.Element;
export function Link(props?: any): JSX.Element;
export function NavLink(props?: any): JSX.Element;

export function createCookieSessionStorage(options?: any): any;
export function createSessionStorage(options?: any): any;
export function createCookie(name: string, options?: any): any;
export function redirect(path: string, init?: any): any;
export function json<T>(data: T, init?: any): any;
export function createServerData(fn: any, options?: any): any;
export function createRouteAction(fn: any, options?: any): any;
export function createRouteData(fn: any, options?: any): any;
export function createRouteMultiAction(fn: any, options?: any): any;
export function createServerAction(fn: any, options?: any): any;
export function createServerMultiAction(fn: any, options?: any): any;
export function useAction<T = any>(): T;
export function useSubmissions(fn?: any): any;
export function useLocation(): any;
export function useNavigate(): any;
export function useParams(): any;
export function useSearchParams(): any;
export function useRouteData(): any;
export function useBeforeLeave(fn: any): void;

export function createResponse(data: any, init?: any): Response;
export function useRequest(): any;
export function useResponse(): any;

export const ServerError: any;

export interface APIEvent {
  request: Request;
  params: Record<string, string>;
  env?: any;
  fetch: typeof fetch;
  response?: any;
  locals?: any;
}

export interface PageEvent {
  request: Request;
  params: Record<string, string>;
  responseHeaders: Headers;
}

export type ServerFunction = (...args: any[]) => Promise<any>;

declare module "solid-start" {
  export function defineRouteAction(fn: any): any;
  export function defineRouteData(fn: any): any;
  export const Head: any;
  export const Html: any;
  export const Body: any;
  export const Meta: any;
  export const Title: any;
  export const Links: any;
  export const Scripts: any;
}

declare module "solid-start/entry-client" {
  export function mount<T>(
    component: Component<T>,
    mountNode: HTMLElement | Document
  ): void;
  export const StartClient: Component;
}

declare module "solid-start/entry-server" {
  import type { PageEvent } from "solid-start";
  export type RenderOutput = any;
  export function renderSync<T>(
    App: Component<T>
  ): (event: PageEvent) => Promise<Response> | Response;
  export function createHandler(
    render: (event: PageEvent) => Promise<Response>
  ): (event: any) => Promise<Response>;
}

declare module "solid-start/data" {
  export function createRouteAction(
    fn: any,
    options?: any
  ): any;
  export function createRouteData(fn: any, options?: any): any;
  export function createRouteMultiAction(fn: any, options?: any): any;
  export function useRouteData(): any;
  export function redirect(path: string, init?: any): Response;
  export function json<T>(data: T, init?: any): Response;
  export function useAction<T = any>(): any;
  export function useSubmissions<T = any>(fn?: any): any;
}

declare module "solid-start/server" {
  export function createServerData(fn: any, options?: any): any;
  export function createServerAction(fn: any, options?: any): any;
  export function createServerMultiAction(fn: any, options?: any): any;
  export function redirect(path: string, init?: any): Response;
  export function json<T>(data: T, init?: any): Response;
  export function fetch(request: RequestInfo, init?: RequestInit): Promise<Response>;
}

declare module "solid-start/root" {
  export const Links: Component;
  export const Meta: Component;
  export const Scripts: Component;
}
