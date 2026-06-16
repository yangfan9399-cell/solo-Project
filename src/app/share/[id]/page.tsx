"use client";

import { useState, useEffect } from "react";
import type { ShareableBridge, Level } from "@/types/game";
import { BridgeCanvas } from "@/components/BridgeCanvas";

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [shareId, setShareId] = useState<string | null>(null);
  const [sharedData, setSharedData] = useState<ShareableBridge | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setShareId(p.id));
  }, [params]);

  useEffect(() => {
    if (!shareId) return;

    const fetchData = async () => {
      try {
        const shareRes = await fetch(`/api/share?id=${shareId}`);
        if (!shareRes.ok) {
          setError("分享不存在或已过期");
          setLoading(false);
          return;
        }

        const shared = await shareRes.json();
        setSharedData(shared);

        const levelRes = await fetch(`/api/levels?id=${shared.levelId}`);
        if (levelRes.ok) {
          const levelData = await levelRes.json();
          setLevel(levelData);
        }
      } catch (e) {
        setError("加载失败");
      }
      setLoading(false);
    };

    fetchData();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-amber-700 text-xl">加载中...</div>
      </div>
    );
  }

  if (error || !sharedData || !level) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold text-amber-900 mb-2">
            {error || "分享不存在"}
          </h1>
          <p className="text-amber-600 mb-6">这个分享链接可能已经过期了</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            返回首页
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">🌉 分享的纸桥</h1>
          <p className="text-amber-600">
            来自 <span className="font-semibold">{sharedData.playerName}</span> 的作品
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border border-amber-200">
          <div className="flex justify-center mb-6">
            {sharedData.bridge && (
              <BridgeCanvas
                segments={sharedData.bridge.segments}
                selectedSegmentId={null}
                onSelectSegment={() => {}}
                onAddSegment={() => {}}
                onMoveSegment={() => {}}
                level={level}
                foldType="flat"
                mode="select"
                isSimulating={false}
                breakPoint={null}
                breakSegmentId={null}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-paper-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-700">
                {sharedData.maxWeight}g
              </div>
              <div className="text-xs text-amber-500">最大承重</div>
            </div>
            <div className="text-center p-3 bg-paper-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-700">
                {sharedData.score}
              </div>
              <div className="text-xs text-amber-500">得分</div>
            </div>
            <div className="text-center p-3 bg-paper-50 rounded-lg">
              <div className="text-2xl font-bold text-amber-700">
                关卡 {sharedData.levelId}
              </div>
              <div className="text-xs text-amber-500">{level.name}</div>
            </div>
          </div>

          <div className="text-center space-y-3">
            <a
              href="/"
              className="inline-block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
            >
              🎮 我也来挑战
            </a>
            <p className="text-xs text-amber-400">
              分享时间: {new Date(sharedData.createdAt).toLocaleString("zh-CN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
