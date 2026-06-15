import { component$, Slot } from '@builder.io/qwik';
import type { RequestHandler } from '@builder.io/qwik-city';
import { initDb } from '~/server/db';

export const onRequest: RequestHandler = async () => {
  await initDb();
};

export default component$(() => {
  return <Slot />;
});
