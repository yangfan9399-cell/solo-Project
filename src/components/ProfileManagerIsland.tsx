import { useState, useEffect } from 'react';
import ProfileManager from '@/components/ProfileManager';
import type { PlayerProfile } from '@/types/game';
import { setCurrentPlayerId } from '@/utils/storage';

function ProfileManagerIsland() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vl_current_player');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        (window as any).__currentPlayer = parsed;
      } catch {}
    }
  }, []);

  function handleProfileSelected(p: PlayerProfile) {
    (window as any).__currentPlayer = p;
    setCurrentPlayerId(p.id);
    setProfile(p);
    window.dispatchEvent(new CustomEvent('profile-changed', { detail: p }));
  }

  return <ProfileManager onProfileSelected={handleProfileSelected} />;
}

export default ProfileManagerIsland;
