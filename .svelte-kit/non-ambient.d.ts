
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/anomalies" | "/draft" | "/draft/[id]" | "/export" | "/reviews";
		RouteParams(): {
			"/draft/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/anomalies": Record<string, never>;
			"/draft": { id?: string | undefined };
			"/draft/[id]": { id: string };
			"/export": Record<string, never>;
			"/reviews": Record<string, never>
		};
		Pathname(): "/" | "/anomalies" | `/draft/${string}` & {} | "/export" | "/reviews";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}