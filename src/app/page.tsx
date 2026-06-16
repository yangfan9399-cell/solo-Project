"use client";

import { useState, useEffect } from "react";
import { LevelSelect } from "@/components/LevelSelect";
import { GamePage } from "@/components/GamePage";
import type { Level, Player } from "@/types/game";

export default function Home() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initPlayer = async () => {
      let storedPlayerId = localStorage.getItem("paper_bridge_player_id");
      if (!storedPlayerId) {
        storedPlayerId = "local-player";
        localStorage.setItem("paper_bridge_player_id", storedPlayerId);
      }

      try {
        const playerRes = await fetch(`/api/player?id=${storedPlayerId}`);
        if (playerRes.ok) {
          const playerData = await playerRes.json();
          setPlayer(playerData);
        } else {
          const createRes = await fetch("/api/player", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: storedPlayerId,
              name: "折纸大师",
            }),
          });
          if (createRes.ok) {
            const newPlayer = await createRes.json();
            setPlayer(newPlayer);
          }
        }
      } catch (e) {
        console.error("Failed to init player:", e);
        setPlayer({
          id: storedPlayerId,
          name: "折纸大师",
          createdAt: Date.now(),
          totalScore: 0,
          levelsCompleted: 0,
        });
      }

      try {
        const levelsRes = await fetch("/api/levels");
        if (levelsRes.ok) {
          const levelsData = await levelsRes.json();
          setLevels(levelsData);
        }
      } catch (e) {
        console.error("Failed to load levels:", e);
      }

      setLoading(false);
    };

    initPlayer();
  }, []);

  const handleNameChange = async (name: string) => {
    if (!player) return;

    try {
      const res = await fetch("/api/player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: player.id, name }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPlayer(updated);
      }
    } catch (e) {
      setPlayer({ ...player, name });
    }
  };

  const handleSelectLevel = async (level: Level) => {
    if (!player) return;

    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.id,
          levelId: level.id,
        }),
      });

      if (res.ok) {
        const session = await res.json();
        setSessionId(session.id);
        setSelectedLevel(level);
      }
    } catch (e) {
      const fakeId = `session-${Date.now()}`;
      setSessionId(fakeId);
      setSelectedLevel(level);
    }
  };

  const handleBackToLevels = async () => {
    if (player) {
      try {
        const res = await fetch(`/api/player?id=${player.id}`);
        if (res.ok) {
          const updated = await res.json();
          setPlayer(updated);
        }
      } catch (e) {
        // ignore
      }
    }

    setSelectedLevel(null);
    setSessionId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-700 text-xl">加载中...</div>
      </div>
    );
  }

  if (selectedLevel && sessionId) {
    return (
      <GamePage
        level={selectedLevel}
        sessionId={sessionId}
        onBack={handleBackToLevels}
      />
    );
  }

  return (
    <LevelSelect
      levels={levels}
      onSelectLevel={handleSelectLevel}
      playerName={player?.name || "玩家"}
      totalScore={player?.totalScore || 0}
      onNameChange={handleNameChange}
    />
  );
}
