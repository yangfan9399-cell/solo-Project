import { useState, useEffect } from 'react';
import GamePlay from '@/components/GamePlay';
import { getCurrentPlayerId } from '@/utils/storage';

interface GamePlayIslandProps {
  levelId: string;
}

function GamePlayIsland({ levelId }: GamePlayIslandProps) {
  const [playerId, setPlayerId] = useState<string>('guest');
  const [resumeSessionId, setResumeSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const id = getCurrentPlayerId() || 'guest';
    setPlayerId(id);
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    if (sessionId) {
      setResumeSessionId(sessionId);
    }
  }, []);

  return <GamePlay levelId={levelId} playerId={playerId} resumeSessionId={resumeSessionId} />;
}

export default GamePlayIsland;
