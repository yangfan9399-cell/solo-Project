import { component$, useStore, useContextProvider, Slot, useVisibleTask$ } from '@builder.io/qwik';
import { AppStore, type AppState } from '~/constants';
import type { User } from '~/types';

export default component$(() => {
  const appState = useStore<AppState>({
    currentUser: null,
    isLoading: false,
    error: null,
  });

  useVisibleTask$(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        appState.currentUser = JSON.parse(savedUser) as User;
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
  });

  useContextProvider(AppStore, appState);

  return (
    <>
      <title>古籍修复馆纸张病害诊断与修复排程系统</title>
      <meta name="description" content="古籍修复馆纸张病害诊断与修复排程管理系统" />
      <Slot />
    </>
  );
});
