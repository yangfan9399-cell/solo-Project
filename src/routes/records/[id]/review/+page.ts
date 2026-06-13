import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/records/${params.id}`);
  if (!res.ok) throw new Error('记录不存在');
  const record = await res.json();
  return { record };
};
