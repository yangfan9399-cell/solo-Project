import { component$ } from '@builder.io/qwik';
import { QwikCityProvider, RouterOutlet, ServiceWorkerRegister } from '@builder.io/qwik-city';
import { GameStoreProvider } from './components/game-store';
import './global.css';

export default component$(() => {
  return (
    <QwikCityProvider>
      <head>
        <meta charset="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#8B4513" />
        <meta name="description" content="旧书店盲盒定价经营游戏 - 给旧书盲盒估价，从书况、题签、藏书章、绝版程度和顾客偏好中挖掘真正的价值" />
        <title>旧书店盲盒定价经营游戏</title>
      </head>
      <body lang="zh-CN">
        <GameStoreProvider>
          <RouterOutlet />
        </GameStoreProvider>
        <ServiceWorkerRegister />
      </body>
    </QwikCityProvider>
  );
});
