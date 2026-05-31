import { component$, Slot } from '@builder.io/qwik';
import { Sidebar } from './sidebar';
import { Header } from './header';

export const Layout = component$(() => {
  return (
    <div class="flex min-h-screen">
      <Sidebar />
      <div class="flex-1 flex flex-col">
        <Header />
        <main class="flex-1 p-6 overflow-auto">
          <Slot />
        </main>
      </div>
    </div>
  );
});
