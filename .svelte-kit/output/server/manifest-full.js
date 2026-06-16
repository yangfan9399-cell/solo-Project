export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.BLsAqs_M.js",app:"_app/immutable/entry/app.DqwyVC2c.js",imports:["_app/immutable/entry/start.BLsAqs_M.js","_app/immutable/chunks/CQ_nzWa-.js","_app/immutable/chunks/Dq3zgFJu.js","_app/immutable/entry/app.DqwyVC2c.js","_app/immutable/chunks/Dq3zgFJu.js","_app/immutable/chunks/Dl1H4qAb.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/games",
				pattern: /^\/api\/games\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/games/_server.ts.js'))
			},
			{
				id: "/api/games/[id]",
				pattern: /^\/api\/games\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/games/_id_/_server.ts.js'))
			},
			{
				id: "/api/games/[id]/settle",
				pattern: /^\/api\/games\/([^/]+?)\/settle\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/games/_id_/settle/_server.ts.js'))
			},
			{
				id: "/api/levels",
				pattern: /^\/api\/levels\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/levels/_server.ts.js'))
			},
			{
				id: "/api/levels/[id]",
				pattern: /^\/api\/levels\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/levels/_id_/_server.ts.js'))
			},
			{
				id: "/api/players",
				pattern: /^\/api\/players\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/players/_server.ts.js'))
			},
			{
				id: "/api/players/[id]",
				pattern: /^\/api\/players\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/players/_id_/_server.ts.js'))
			},
			{
				id: "/game/[id]",
				pattern: /^\/game\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
