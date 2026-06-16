import { useState, useEffect } from 'react';
import LevelSelector from '@/components/LevelSelector';
import type { Level, PlayerProfile } from '@/types/game';
import { loadPlayer, getCurrentPlayerId } from '@/utils/storage';

interface LevelSelectorIslandProps {
  levels: Level[];
}

function LevelSelectorIsland({ levels }: LevelSelectorIslandProps) {
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    loadProfile();
    window.addEventListener('profile-changed', ((e: CustomEvent) => {
      setPlayerProfile(e.detail);
    }) as EventListener);
  }, []);

  function loadProfile() {
    const id = getCurrentPlayerId();
    if (id) {
      const p = loadPlayer(id);
      if (p) setPlayerProfile(p);
    }
  }

  function handleSelectLevel(levelId: string) {
    window.location.href = '/play/' + levelId;
  }

  function handleResumeSession(sessionId: string) {
    const sessions = playerProfile ? JSON.parse(localStorage.getItem('vl_session_index') || '[]') : [];
    for (const id of sessions) {
      const raw = localStorage.getItem('vl_session_' + id);
      if (raw && id === sessionId) {
        try {
          const session = JSON.parse(raw);
          window.location.href = '/play/' + session.levelId + '?session=' + sessionId;
          return;
        } catch {}
      }
    }
  }

  return (
    <LevelSelector
      levels={levels}
      playerProfile={playerProfile}
      onSelectLevel={handleSelectLevel}
      onResumeSession={handleResumeSession}
    />
  );
}

export default LevelSelectorIsland;
