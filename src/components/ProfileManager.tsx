import { useState, useEffect } from 'react';
import type { PlayerProfile } from '@/types/game';
import {
  savePlayer,
  loadPlayer,
  listPlayers,
  deletePlayer,
  setCurrentPlayerId,
  getCurrentPlayerId,
  generateId,
} from '@/utils/storage';

interface ProfileManagerProps {
  onProfileSelected: (profile: PlayerProfile) => void;
}

const AVATARS = ['🎸', '🎻', '🎺', '🪕'];

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#1a1a2e',
    minHeight: '100vh',
    padding: '24px',
    color: '#e0e0e0',
    fontFamily: 'sans-serif',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#ffffff',
  },
  profileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  profileCard: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    fontSize: '32px',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileStats: {
    fontSize: '14px',
    color: '#a0a0a0',
    marginTop: '4px',
  },
  badge: {
    backgroundColor: '#e94560',
    color: '#ffffff',
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '10px',
    marginLeft: '8px',
  },
  button: {
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#0f3460',
    color: '#e0e0e0',
  },
  deleteButton: {
    backgroundColor: '#533460',
    color: '#e0e0e0',
  },
  createSection: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#0f3460',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '8px 12px',
    color: '#ffffff',
    fontSize: '14px',
    width: '200px',
    marginBottom: '12px',
    outline: 'none',
  },
  avatarSelector: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
  },
  avatarOption: {
    fontSize: '32px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    border: '2px solid transparent',
    transition: 'border-color 0.2s',
  },
  avatarOptionSelected: {
    fontSize: '32px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    border: '2px solid #e94560',
    backgroundColor: '#0f3460',
  },
  createButton: {
    backgroundColor: '#e94560',
    color: '#ffffff',
  },
  confirmOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  confirmDialog: {
    backgroundColor: '#16213e',
    borderRadius: '8px',
    padding: '24px',
    textAlign: 'center',
    minWidth: '280px',
  },
  confirmText: {
    marginBottom: '16px',
    color: '#e0e0e0',
  },
  confirmButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
};

function ProfileManager({ onProfileSelected }: ProfileManagerProps) {
  const [profiles, setProfiles] = useState<PlayerProfile[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    refreshProfiles();
    const id = getCurrentPlayerId();
    if (id) {
      const profile = loadPlayer(id);
      if (profile) {
        setCurrentId(id);
        onProfileSelected(profile);
      }
    }
  }, []);

  function refreshProfiles() {
    setProfiles(listPlayers());
  }

  function handleSelect(profile: PlayerProfile) {
    setCurrentPlayerId(profile.id);
    setCurrentId(profile.id);
    onProfileSelected(profile);
  }

  function handleDelete(id: string) {
    deletePlayer(id);
    if (currentId === id) {
      setCurrentId(null);
    }
    setDeleteTarget(null);
    refreshProfiles();
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const profile: PlayerProfile = {
      id: generateId(),
      name: trimmed,
      avatar,
      totalScore: 0,
      completedLevels: [],
      bestScores: {},
      instruments: [],
      createdAt: Date.now(),
    };
    savePlayer(profile);
    setCurrentPlayerId(profile.id);
    setCurrentId(profile.id);
    onProfileSelected(profile);
    setName('');
    setAvatar(AVATARS[0]);
    refreshProfiles();
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>玩家档案</div>

      {profiles.length > 0 && (
        <div style={styles.profileList}>
          {profiles.map((p) => (
            <div key={p.id} style={styles.profileCard}>
              <span style={styles.avatar}>{p.avatar}</span>
              <div style={styles.profileInfo}>
                <span style={styles.profileName}>
                  {p.name}
                  {currentId === p.id && <span style={styles.badge}>当前玩家</span>}
                </span>
                <div style={styles.profileStats}>
                  总分: {p.totalScore} | 已完成: {p.completedLevels.length} 关
                </div>
              </div>
              <button
                style={{ ...styles.button, ...styles.selectButton }}
                onClick={() => handleSelect(p)}
              >
                选择
              </button>
              <button
                style={{ ...styles.button, ...styles.deleteButton }}
                onClick={() => setDeleteTarget(p.id)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.createSection}>
        <div style={styles.sectionTitle}>创建新档案</div>
        <input
          style={styles.input}
          type="text"
          maxLength={12}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入名字（最多12字）"
        />
        <div style={styles.avatarSelector}>
          {AVATARS.map((a) => (
            <span
              key={a}
              style={avatar === a ? styles.avatarOptionSelected : styles.avatarOption}
              onClick={() => setAvatar(a)}
            >
              {a}
            </span>
          ))}
        </div>
        <button
          style={{ ...styles.button, ...styles.createButton }}
          onClick={handleCreate}
        >
          创建
        </button>
      </div>

      {deleteTarget && (
        <div style={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmText}>确定要删除该档案吗？此操作不可撤销。</div>
            <div style={styles.confirmButtons}>
              <button
                style={{ ...styles.button, ...styles.deleteButton }}
                onClick={() => handleDelete(deleteTarget)}
              >
                确定
              </button>
              <button
                style={{ ...styles.button, ...styles.selectButton }}
                onClick={() => setDeleteTarget(null)}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileManager;
