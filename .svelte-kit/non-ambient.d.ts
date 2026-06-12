
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
		RouteId(): "/" | "/api" | "/api/exceptions" | "/api/records" | "/api/records/[id]" | "/api/records/[id]/process" | "/api/records/[id]/reprocess" | "/api/records/[id]/review" | "/api/statistics" | "/api/users" | "/dashboard" | "/process" | "/process/[id]" | "/records" | "/records/[id]" | "/review" | "/review/[id]";
		RouteParams(): {
			"/api/records/[id]": { id: string };
			"/api/records/[id]/process": { id: string };
			"/api/records/[id]/reprocess": { id: string };
			"/api/records/[id]/review": { id: string };
			"/process/[id]": { id: string };
			"/records/[id]": { id: string };
			"/review/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/exceptions": Record<string, never>;
			"/api/records": { id?: string | undefined };
			"/api/records/[id]": { id: string };
			"/api/records/[id]/process": { id: string };
			"/api/records/[id]/reprocess": { id: string };
			"/api/records/[id]/review": { id: string };
			"/api/statistics": Record<string, never>;
			"/api/users": Record<string, never>;
			"/dashboard": Record<string, never>;
			"/process": { id?: string | undefined };
			"/process/[id]": { id: string };
			"/records": { id?: string | undefined };
			"/records/[id]": { id: string };
			"/review": { id?: string | undefined };
			"/review/[id]": { id: string }
		};
		Pathname(): "/" | "/api/exceptions" | "/api/records" | `/api/records/${string}` & {} | `/api/records/${string}/process` & {} | `/api/records/${string}/reprocess` & {} | `/api/records/${string}/review` & {} | "/api/statistics" | "/api/users" | "/dashboard" | "/process" | `/process/${string}` & {} | `/records/${string}` & {} | "/review" | `/review/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}