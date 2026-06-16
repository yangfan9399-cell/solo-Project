
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
		RouteId(): "/" | "/api" | "/api/games" | "/api/games/[id]" | "/api/games/[id]/settle" | "/api/levels" | "/api/levels/[id]" | "/api/players" | "/api/players/[id]" | "/game" | "/game/[id]";
		RouteParams(): {
			"/api/games/[id]": { id: string };
			"/api/games/[id]/settle": { id: string };
			"/api/levels/[id]": { id: string };
			"/api/players/[id]": { id: string };
			"/game/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string | undefined };
			"/api": { id?: string | undefined };
			"/api/games": { id?: string | undefined };
			"/api/games/[id]": { id: string };
			"/api/games/[id]/settle": { id: string };
			"/api/levels": { id?: string | undefined };
			"/api/levels/[id]": { id: string };
			"/api/players": { id?: string | undefined };
			"/api/players/[id]": { id: string };
			"/game": { id?: string | undefined };
			"/game/[id]": { id: string }
		};
		Pathname(): "/" | "/api/games" | `/api/games/${string}` & {} | `/api/games/${string}/settle` & {} | "/api/levels" | `/api/levels/${string}` & {} | "/api/players" | `/api/players/${string}` & {} | `/game/${string}` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}