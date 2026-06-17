import { component$, useSignal, $, useComputed$ } from '@builder.io/qwik';
import { routeLoader$, Link } from '@builder.io/qwik-city';
import { sampleBoxDao, sectionDao } from '~/server/dao';
import { AnomalyBadge } from '~/components/badges';
import type { SampleBox, BoxSlot } from '~/types/mineral';

type BoxDetail = SampleBox & { slots: BoxSlot[]; sectionCount: number };

export const useBoxList = routeLoader$(async () => {
  const boxes = await sampleBoxDao.list();
  
  const boxesWithDetails: (BoxDetail & { 
    slots: (BoxSlot & { mineralName?: string; thinSectionNumber?: string; anomalyCount?: number })[] 
  })[] = [];

  for (const box of boxes) {
    const detail = (await sampleBoxDao.getById(box.id)) as any;
    if (detail) {
      const slotsWithInfo = await Promise.all(detail.slots.map(async (slot: BoxSlot) => {
        if (slot.sectionId) {
          const section = await sectionDao.getById(slot.sectionId);
          if (section) {
            return {
              ...slot,
              mineralName: section.mineralName,
              thinSectionNumber: section.thinSectionNumber,
              anomalyCount: section.anomalies.filter((a: any) => !a.resolvedAt).length,
            };
          }
        }
        return slot;
      }));
      boxesWithDetails.push({ ...detail, slots: slotsWithInfo });
    }
  }

  return {
    boxes: boxesWithDetails,
    totalBoxes: boxes.length,
    totalSlots: boxesWithDetails.reduce((sum, b) => sum + b.rows * b.columns, 0),
    usedSlots: boxesWithDetails.reduce((sum, b) => sum + b.sectionCount, 0),
  };
});

export default component$(() => {
  const data = useBoxList();
  const selectedBoxId = useSignal<number | null>(data.value.boxes[0]?.id || null);
  const viewMode = useSignal<'grid' | '3d'>('grid');
  const hoveredSlot = useSignal<{ row: number; col: number } | null>(null);
  const rotateX = useSignal(15);
  const rotateY = useSignal(-25);

  const selectedBox = useComputed$(() => {
    return data.value.boxes.find(b => b.id === selectedBoxId.value);
  });

  const utilizationRate = useComputed$(() => {
    return data.value.totalSlots > 0 
      ? Math.round((data.value.usedSlots / data.value.totalSlots) * 100) 
      : 0;
  });

  const getSlotPosition = (row: number, col: number) => {
    return `${String.fromCharCode(65 + row)}${col + 1}`;
  };

  const handleMouseMove = $((e: MouseEvent) => {
    if (viewMode.value !== '3d') return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 50;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 50;
    rotateY.value = -25 + x;
    rotateX.value = 15 - y;
  });

  const handleMouseLeave = $(() => {
    rotateX.value = 15;
    rotateY.value = -25;
  });

  return (
    <div class="p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-mineral-50">样本盒管理</h1>
          <p class="text-mineral-400 mt-1">
            管理薄片样本的储存位置，支持可视化格子布局
          </p>
        </div>
        <div class="flex gap-2">
          <div class="flex bg-mineral-800 rounded-lg overflow-hidden">
            <button
              onClick$={() => viewMode.value = 'grid'}
              class={[
                'px-4 py-2 text-sm transition-colors',
                viewMode.value === 'grid' 
                  ? 'bg-mineral-600 text-white' 
                  : 'text-mineral-400 hover:text-mineral-200'
              ]}
            >
              平面视图
            </button>
            <button
              onClick$={() => viewMode.value = '3d'}
              class={[
                'px-4 py-2 text-sm transition-colors',
                viewMode.value === '3d' 
                  ? 'bg-mineral-600 text-white' 
                  : 'text-mineral-400 hover:text-mineral-200'
              ]}
            >
              3D 视图
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">样本盒总数</p>
          <p class="text-2xl font-bold text-mineral-100">{data.value.totalBoxes}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">总格子数</p>
          <p class="text-2xl font-bold text-purple-400">{data.value.totalSlots}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">已使用</p>
          <p class="text-2xl font-bold text-green-400">{data.value.usedSlots}</p>
        </div>
        <div class="card p-4">
          <p class="text-mineral-500 text-sm">利用率</p>
          <p class="text-2xl font-bold text-blue-400">{utilizationRate.value}%</p>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-6">
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-mineral-400 px-1">样本盒列表</h3>
          <div class="space-y-2">
            {data.value.boxes.map(box => (
              <button
                key={box.id}
                onClick$={() => selectedBoxId.value = box.id}
                class={[
                  'w-full p-4 rounded-lg border text-left transition-all',
                  selectedBoxId.value === box.id
                    ? 'bg-mineral-700/50 border-mineral-500'
                    : 'bg-mineral-800/30 border-mineral-700 hover:border-mineral-600'
                ]}
              >
                <div class="flex items-start justify-between">
                  <div>
                    <p class="font-medium text-mineral-100">{box.name}</p>
                    <p class="text-xs text-mineral-500 font-mono">{box.code}</p>
                    {box.location && (
                      <p class="text-xs text-mineral-500 mt-1">📍 {box.location}</p>
                    )}
                  </div>
                  <div class="text-right">
                    <p class="text-sm text-mineral-300">
                      {box.sectionCount}/{box.rows * box.columns}
                    </p>
                    <div class="w-16 h-1.5 bg-mineral-700 rounded-full mt-1 overflow-hidden">
                      <div 
                        class="h-full bg-green-500 transition-all"
                        style={{ width: `${(box.sectionCount / (box.rows * box.columns)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div class="col-span-3">
          {selectedBox.value ? (
            <div class="card p-6">
              <div class="flex items-start justify-between mb-6">
                <div>
                  <h2 class="text-xl font-bold text-mineral-100">{selectedBox.value.name}</h2>
                  <p class="text-mineral-400 mt-1">
                    <span class="font-mono">{selectedBox.value.code}</span>
                    {selectedBox.value.location && <span class="mx-2">·</span>}
                    {selectedBox.value.location && <span>📍 {selectedBox.value.location}</span>}
                    <span class="mx-2">·</span>
                    <span>{selectedBox.value.rows} × {selectedBox.value.columns} 格</span>
                  </p>
                  {selectedBox.value.description && (
                    <p class="text-mineral-500 text-sm mt-2">{selectedBox.value.description}</p>
                  )}
                </div>
                <div class="flex items-center gap-4">
                  <div class="text-right">
                    <p class="text-sm text-mineral-500">使用情况</p>
                    <p class="text-2xl font-bold text-mineral-100">
                      {selectedBox.value.sectionCount} <span class="text-sm text-mineral-500">/ {selectedBox.value.rows * selectedBox.value.columns}</span>
                    </p>
                  </div>
                </div>
              </div>

              {!selectedBox.value ? (
                <div class="text-center py-12 text-mineral-500">
                  <p>请选择一个样本盒</p>
                </div>
              ) : viewMode.value === 'grid' ? (
                <div 
                  class="grid gap-2"
                  style={{ 
                    gridTemplateColumns: `repeat(${selectedBox.value.columns}, 1fr)`,
                  }}
                >
                  {selectedBox.value!.slots.map((slot, idx) => {
                    const position = getSlotPosition(
                      Math.floor(idx / selectedBox.value!.columns),
                      idx % selectedBox.value!.columns
                    );
                    const isEmpty = !slot.sectionId;
                    
                    return (
                      <div
                        key={`${slot.row}-${slot.col}`}
                        class={[
                          'aspect-square rounded-lg border-2 p-2 transition-all hover:scale-105 relative group',
                          isEmpty
                            ? 'border-dashed border-mineral-700 bg-mineral-800/30 hover:border-mineral-500'
                            : 'border-mineral-600 bg-mineral-700/50 hover:border-mineral-400'
                        ]}
                        onMouseEnter$={() => hoveredSlot.value = { row: slot.row, col: slot.col }}
                        onMouseLeave$={() => hoveredSlot.value = null}
                      >
                        <div class="absolute top-1 left-2 text-xs font-mono text-mineral-500">
                          {position}
                        </div>
                        
                        {isEmpty ? (
                          <div class="h-full flex flex-col items-center justify-center text-mineral-600">
                            <span class="text-2xl">+</span>
                            <span class="text-xs mt-1">空位</span>
                          </div>
                        ) : (
                          <Link
                            href={`/sections/${slot.sectionId}`}
                            class="h-full flex flex-col items-center justify-center text-center"
                          >
                            <p class="text-xs font-medium text-mineral-100 line-clamp-2">
                              {(slot as any).mineralName}
                            </p>
                            <p class="text-[10px] text-mineral-500 font-mono mt-1">
                              {(slot as any).thinSectionNumber}
                            </p>
                            {(slot as any).anomalyCount > 0 && (
                              <div class="absolute top-1 right-1">
                                <AnomalyBadge count={(slot as any).anomalyCount} />
                              </div>
                            )}
                          </Link>
                        )}

                        {slot.label && !isEmpty && (
                          <div class="absolute bottom-1 left-1 right-1 text-[9px] text-center text-mineral-400 truncate">
                            {slot.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  class="relative h-96 flex items-center justify-center cursor-pointer"
                  onMouseMove$={handleMouseMove}
                  onMouseLeave$={handleMouseLeave}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    class="relative transition-transform duration-200"
                    style={{
                      transform: `rotateX(${rotateX.value}deg) rotateY(${rotateY.value}deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <div
                      class="grid gap-1 p-4 bg-mineral-800 rounded-lg shadow-2xl"
                      style={{
                        gridTemplateColumns: `repeat(${selectedBox.value.columns}, minmax(0, 1fr))`,
                        transform: 'translateZ(0)',
                      }}
                    >
                      {selectedBox.value!.slots.map((slot, idx) => {
                        const position = getSlotPosition(
                          Math.floor(idx / selectedBox.value!.columns),
                          idx % selectedBox.value!.columns
                        );
                        const isEmpty = !slot.sectionId;
                        const isHovered = hoveredSlot.value?.row === slot.row && hoveredSlot.value?.col === slot.col;
                        
                        return (
                          <div
                            key={`3d-${slot.row}-${slot.col}`}
                            class={[
                              'w-16 h-16 rounded border-2 p-1 transition-all relative',
                              isEmpty
                                ? 'border-dashed border-mineral-600 bg-mineral-700/30'
                                : 'border-mineral-500 bg-mineral-600/50',
                              isHovered && 'ring-2 ring-mineral-400 scale-110 z-10'
                            ]}
                            style={{
                              transform: isHovered ? 'translateZ(20px)' : 'translateZ(0)',
                              boxShadow: isHovered ? '0 10px 30px rgba(0,0,0,0.5)' : 'none',
                            }}
                            onMouseEnter$={() => hoveredSlot.value = { row: slot.row, col: slot.col }}
                            onMouseLeave$={() => hoveredSlot.value = null}
                          >
                            <div class="absolute top-0.5 left-1 text-[9px] font-mono text-mineral-500">
                              {position}
                            </div>
                            {!isEmpty && (slot as any).mineralName && (
                              <div class="h-full flex flex-col items-center justify-center text-center mt-2">
                                <p class="text-[9px] font-medium text-mineral-100 leading-tight">
                                  {(slot as any).mineralName}
                                </p>
                              </div>
                            )}
                            {isEmpty && (
                              <div class="h-full flex items-center justify-center text-mineral-600 text-xl">
                                +
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      class="absolute inset-0 bg-mineral-900/50 rounded-lg"
                      style={{
                        transform: 'translateZ(-10px) scale(1.02)',
                        filter: 'blur(10px)',
                      }}
                    ></div>
                  </div>

                  <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-mineral-500 text-xs">
                    移动鼠标以旋转视角
                  </div>
                </div>
              )}

              {hoveredSlot.value && selectedBox.value && (
                <div class="mt-4 p-3 bg-mineral-800/50 rounded-lg">
                  <p class="text-sm text-mineral-400">
                    选中位置: <span class="font-mono text-mineral-200">
                      {getSlotPosition(hoveredSlot.value.row, hoveredSlot.value.col)}
                    </span>
                    {(() => {
                      const slot = selectedBox.value!.slots.find(
                        s => s.row === hoveredSlot.value!.row && s.col === hoveredSlot.value!.col
                      );
                      if (slot?.sectionId) {
                        return (
                          <>
                            <span class="mx-2">·</span>
                            <Link href={`/sections/${slot.sectionId}`} class="text-mineral-200 hover:text-mineral-50 underline">
                              {(slot as any).mineralName} - {(slot as any).thinSectionNumber}
                            </Link>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </p>
                </div>
              )}

              <div class="mt-6 flex items-center gap-6 text-xs text-mineral-500">
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border-2 border-solid border-mineral-600 bg-mineral-700/50"></div>
                  <span>已占用</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border-2 border-dashed border-mineral-700 bg-mineral-800/30"></div>
                  <span>空位</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-4 h-4 rounded border-2 border-red-500 bg-red-900/30 flex items-center justify-center text-[10px] text-red-300">!</div>
                  <span>有异常</span>
                </div>
              </div>
            </div>
          ) : (
            <div class="card p-12 text-center text-mineral-500">
              <span class="text-5xl block mb-4">📦</span>
              <p class="text-lg">请选择一个样本盒</p>
              <p class="text-sm mt-2">或创建新的样本盒</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
