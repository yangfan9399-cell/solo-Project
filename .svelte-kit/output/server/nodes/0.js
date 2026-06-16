

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const imports = ["_app/immutable/nodes/0.CYzSzukj.js","_app/immutable/chunks/Dq3zgFJu.js","_app/immutable/chunks/Dl1H4qAb.js"];
export const stylesheets = ["_app/immutable/assets/0.BEk65je2.css"];
export const fonts = [];
