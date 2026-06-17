import { component$, Slot } from '@builder.io/qwik';
import { AppLayout } from '~/components/layout';

export default component$(() => {
  return (
    <AppLayout>
      <Slot />
    </AppLayout>
  );
});
