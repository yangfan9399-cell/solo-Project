import { component$, Slot } from '@builder.io/qwik';
import { Layout } from '~/components/layout';
import { useAuthProvider } from '~/context/auth';

export default component$(() => {
  useAuthProvider();
  
  return (
    <Layout>
      <Slot />
    </Layout>
  );
});
