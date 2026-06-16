import { useState, useEffect } from 'react';
import InstrumentArchive from '@/components/InstrumentArchive';
import { getCurrentPlayerId } from '@/utils/storage';

function ArchiveIsland() {
  const [playerId, setPlayerId] = useState<string>('guest');

  useEffect(() => {
    const id = getCurrentPlayerId() || 'guest';
    setPlayerId(id);
    window.addEventListener('profile-changed', (() => {
      const newId = getCurrentPlayerId() || 'guest';
      setPlayerId(newId);
    }) as EventListener);
  }, []);

  return <InstrumentArchive playerId={playerId} />;
}

export default ArchiveIsland;
