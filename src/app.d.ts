import type { Player, GameState, GameResult, Level } from './types';

declare global {
  namespace App {
    interface Locals {
      currentPlayer: Player | null;
    }
    interface PageData {
      player?: Player | null;
      levels?: Level[];
      gameState?: GameState;
      gameResult?: GameResult;
      history?: GameResult[];
    }
    interface Error {
      message: string;
      code?: string;
    }
  }
}

export {};
