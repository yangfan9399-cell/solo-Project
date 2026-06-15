import { component$, useContext, $, useSignal } from '@builder.io/qwik';
import { DocumentHead } from '@builder.io/qwik-city';
import { GameContext, createGameStore, provideGameStore } from '~/components/game-store';
import { ClueCard } from '~/components/ClueCard';
import { BlindBoxCard } from '~/components/BlindBoxCard';
import { CustomerCard } from '~/components/CustomerCard';
import { FeedbackCard } from '~/components/FeedbackCard';
import { PriceCurveChart } from '~/components/PriceCurveChart';
import { BlindBoxComparison } from '~/components/BlindBoxComparison';
import { LedgerView } from '~/components/LedgerView';
import type { Customer } from '~/types/game';

export default component$(() => {
  const store = createGameStore();
  provideGameStore(store);
  
  return (
    <div class="min-h-screen paper-texture">
      <GameHeader />
      <div class="max-w-7xl mx-auto px-4 py-8">
        <GameIntro />
      </div>
    </div>
  );
});

const GameHeader = component$(() => {
  return (
    <header class="bg-gradient-to-r from-book-brown to-book-sepia text-white py-6 shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">📚 旧书店盲盒定价经营游戏</h1>
            <p class="text-amber-200 mt-1">给旧书盲盒估价，从线索中挖掘真正的价值</p>
          </div>
          <div class="text-right">
            <p class="text-sm text-amber-200">用你的眼光赚取利润</p>
          </div>
        </div>
      </div>
    </header>
  );
});

const GameIntro = component$(() => {
  const store = useContext(GameContext);
  const showSeeds = useSignal(false);
  const seeds = useSignal<any[]>([]);
  
  const startNewGame = $(async () => {
    store.isLoading = true;
    store.error = null;
    
    try {
      const response = await fetch('/api/game/new', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        store.sessionId = data.data.sessionId;
        store.playerId = data.data.playerId;
        store.currentRound = 1;
        store.phase = 'inventory';
        
        await startRound();
      } else {
        store.error = data.error;
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to start game';
    } finally {
      store.isLoading = false;
    }
  });
  
  const startRound = $(async () => {
    if (!store.sessionId) return;
    
    store.isLoading = true;
    store.error = null;
    store.feedback = null;
    store.returnEvent = null;
    store.roundSummary = null;
    store.priceCurve = [];
    store.detailRecords = [];
    store.historyRecords = [];
    store.resultRecords = [];
    
    try {
      const response = await fetch(`/api/game/${store.sessionId}/round`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        store.blindBox = data.data.blindBox;
        store.customer = data.data.customer as Customer;
        store.clues = data.data.clues;
        store.phase = 'pricing';
        store.currentRound = data.data.blindBox ? (store.currentRound || 1) : store.currentRound;
        
        const recordsResponse = await fetch(
          `/api/game/${store.sessionId}/round/${store.currentRound}/records`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              blindBoxId: store.blindBox?.id,
              customerId: store.customer?.id,
            }),
          }
        );
        const recordsData = await recordsResponse.json();
        
        if (recordsData.success) {
          store.mainRecordId = recordsData.data.mainRecordId;
          store.marketSuggestedPrice = recordsData.data.marketSuggestedPrice;
          store.playerPrice = Math.round(recordsData.data.marketSuggestedPrice * 100) / 100;
        }
        
        await loadSessionData();
      } else {
        store.error = data.error;
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to start round';
    } finally {
      store.isLoading = false;
    }
  });
  
  const submitPrice = $(async () => {
    if (!store.sessionId || !store.mainRecordId || !store.blindBox || !store.customer) return;
    
    store.isLoading = true;
    store.error = null;
    
    try {
      const response = await fetch(
        `/api/game/${store.sessionId}/round/${store.currentRound}/price`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mainRecordId: store.mainRecordId,
            playerPrice: store.playerPrice,
            blindBoxId: store.blindBox.id,
            customerId: store.customer.id,
          }),
        }
      );
      const data = await response.json();
      
      if (data.success) {
        store.feedback = data.data.feedback;
        store.returnEvent = data.data.returnEvent;
        store.phase = data.data.returnEvent ? 'return_event' : 'customer_feedback';
        
        const curveResponse = await fetch(
          `/api/game/${store.sessionId}/round/${store.currentRound}/price-curve`
        );
        const curveData = await curveResponse.json();
        if (curveData.success) {
          store.priceCurve = curveData.data.priceCurve;
        }
        
        await loadSessionData();
      } else {
        store.error = data.error;
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to submit price';
    } finally {
      store.isLoading = false;
    }
  });
  
  const settleRound = $(async () => {
    if (!store.sessionId) return;
    
    store.isLoading = true;
    store.error = null;
    
    try {
      const response = await fetch(
        `/api/game/${store.sessionId}/round/${store.currentRound}/score`,
        { method: 'POST' }
      );
      const data = await response.json();
      
      if (data.success) {
        store.roundSummary = data.data.roundSummary;
        store.totalScore += Math.max(0, data.data.score);
        store.phase = 'settled';
        await loadSessionData();
      } else {
        store.error = data.error;
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to settle round';
    } finally {
      store.isLoading = false;
    }
  });
  
  const loadSessionData = $(async () => {
    if (!store.sessionId) return;
    
    try {
      const response = await fetch(`/api/game/${store.sessionId}`);
      const data = await response.json();
      
      if (data.success) {
        store.session = data.data.session;
        store.ledgerEntries = data.data.ledgerEntries;
        store.allRounds = data.data.rounds;
        store.totalScore = data.data.session.total_score;
        store.currentMoney = data.data.session.current_money;
      }
    } catch (e) {
      console.error('Failed to load session data:', e);
    }
  });
  
  const recalculateScore = $(async () => {
    if (!store.sessionId) return;
    
    store.isLoading = true;
    try {
      const response = await fetch(`/api/game/${store.sessionId}/recalculate`, { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        store.totalScore = data.data.newScore;
        store.currentMoney = data.data.session.current_money;
        await loadSessionData();
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to recalculate';
    } finally {
      store.isLoading = false;
    }
  });
  
  const rollbackEntry = $(async (entryId: number, roundNumber: number) => {
    if (!store.sessionId) return;
    
    store.isLoading = true;
    try {
      const response = await fetch(`/api/game/${store.sessionId}/ledger/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roundNumber, entryId }),
      });
      const data = await response.json();
      
      if (data.success) {
        await loadSessionData();
        await recalculateScore();
      } else {
        store.error = data.error;
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to rollback';
    } finally {
      store.isLoading = false;
    }
  });
  
  const loadSeeds = $(async () => {
    store.isLoading = true;
    try {
      const response = await fetch('/api/seeds');
      const data = await response.json();
      if (data.success) {
        seeds.value = data.data;
        showSeeds.value = true;
      }
    } catch (e) {
      store.error = e instanceof Error ? e.message : 'Failed to load seeds';
    } finally {
      store.isLoading = false;
    }
  });

  if (store.sessionId && store.blindBox && store.customer && store.clues) {
    return <GamePlay 
      store={store}
      onSubmitPrice$={submitPrice}
      onSettleRound$={settleRound}
      onNextRound$={startRound}
      onRecalculateScore$={recalculateScore}
      onRollbackEntry$={rollbackEntry}
    />;
  }

  return (
    <div class="space-y-8">
      {store.isLoading && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white p-8 rounded-xl text-center">
            <div class="animate-spin text-4xl mb-4">⏳</div>
            <p class="text-book-brown">处理中...</p>
          </div>
        </div>
      )}
      
      {store.error && (
        <div class="bg-red-100 border-2 border-red-300 text-red-800 p-4 rounded-lg">
          ⚠️ {store.error}
        </div>
      )}
      
      <div class="grid md:grid-cols-2 gap-8">
        <div class="book-card old-book-border">
          <h2 class="text-2xl font-bold text-book-brown mb-4">🎮 游戏规则</h2>
          <div class="space-y-3 text-gray-700">
            <p>每回合你将收到一个盲盒，里面装有若干本旧书。</p>
            <p>根据以下线索估算盲盒价值：</p>
            <ul class="list-disc pl-5 space-y-1">
              <li><span class="text-green-600 font-bold">书况</span>：影响价格系数</li>
              <li><span class="text-blue-600 font-bold">题签</span>：作者或名人签名提字</li>
              <li><span class="text-red-600 font-bold">藏书章</span>：知名收藏家印章</li>
              <li><span class="text-amber-600 font-bold">绝版程度</span>：初版、绝版等稀缺性</li>
              <li><span class="text-purple-600 font-bold">顾客偏好</span>：当前顾客的喜好类型</li>
            </ul>
            <p class="pt-2 border-t border-amber-200">
              <span class="font-bold text-red-600">⚠️ 定价过高</span> 会导致顾客却步，商品积压；
              <span class="font-bold text-orange-600">⚠️ 定价过低</span> 会损失稀缺书的利润！
            </p>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
          <h2 class="text-2xl font-bold text-book-brown mb-4">📊 专属数据结构</h2>
          <div class="space-y-3">
            <div class="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p class="font-bold text-blue-800">📋 主记录</p>
              <p class="text-sm text-gray-600">保存玩家给旧书盲盒估价</p>
            </div>
            <div class="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
              <p class="font-bold text-green-800">📖 明细记录</p>
              <p class="text-sm text-gray-600">保存线索来自书况</p>
            </div>
            <div class="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
              <p class="font-bold text-red-800">🔖 历史记录</p>
              <p class="text-sm text-gray-600">保存藏书章信息</p>
            </div>
            <div class="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
              <p class="font-bold text-amber-800">⭐ 结果记录</p>
              <p class="text-sm text-gray-600">保存绝版程度和顾客偏好</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-4 justify-center">
        <button
          onClick$={startNewGame}
          disabled={store.isLoading}
          class="px-8 py-4 bg-book-brown text-white text-xl font-bold rounded-lg shadow-lg hover:bg-book-sepia transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎯 开始新游戏
        </button>
        <button
          onClick$={loadSeeds}
          disabled={store.isLoading}
          class="px-8 py-4 bg-amber-600 text-white text-xl font-bold rounded-lg shadow-lg hover:bg-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🌱 查看种子样本
        </button>
      </div>
      
      {showSeeds.value && (
        <div class="mt-8">
          <h3 class="text-xl font-bold text-book-brown mb-4">🌱 三个种子样本</h3>
          <div class="grid md:grid-cols-3 gap-4">
            {seeds.value.map((seed: any, i: number) => (
              <div key={seed.id} class="bg-white rounded-lg p-4 border-2 border-amber-200 shadow">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">
                    {i === 0 ? '📉' : i === 1 ? '⚠️' : '🔄'}
                  </span>
                  <h4 class="font-bold text-book-brown">{seed.name}</h4>
                </div>
                <p class="text-sm text-gray-600 mb-3">{seed.description}</p>
                {seed.mainRecords && seed.mainRecords.length > 0 && (
                  <div class="text-xs bg-gray-50 p-2 rounded space-y-1">
                    {seed.mainRecords.map((mr: any) => (
                      <div key={mr.id} class="flex justify-between">
                        <span>定价: ¥{mr.player_price?.toFixed(0) || '-'}</span>
                        <span class={
                          mr.status === 'sold' ? 'text-green-600' :
                          mr.status === 'overstock' ? 'text-red-600' :
                          mr.status === 'returned' ? 'text-orange-600' : 'text-gray-600'
                        }>
                          {mr.status === 'sold' ? '✅ 售出' :
                           mr.status === 'overstock' ? '📦 积压' :
                           mr.status === 'returned' ? '↩️ 退货' : mr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {seed.session_score !== undefined && (
                  <p class="text-sm font-bold text-amber-600 mt-2">
                    最终得分: {seed.session_score}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

interface GamePlayProps {
  store: ReturnType<typeof useContext<typeof GameContext>>;
  onSubmitPrice$: () => Promise<void>;
  onSettleRound$: () => Promise<void>;
  onNextRound$: () => Promise<void>;
  onRecalculateScore$: () => Promise<void>;
  onRollbackEntry$: (entryId: number, roundNumber: number) => Promise<void>;
}

const GamePlay = component$<GamePlayProps>(({
  store,
  onSubmitPrice$,
  onSettleRound$,
  onNextRound$,
  onRecalculateScore$,
  onRollbackEntry$,
}) => {
  return (
    <div class="space-y-6">
      {store.isLoading && (
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white p-8 rounded-xl text-center">
            <div class="animate-spin text-4xl mb-4">⏳</div>
            <p class="text-book-brown">处理中...</p>
          </div>
        </div>
      )}
      
      {store.error && (
        <div class="bg-red-100 border-2 border-red-300 text-red-800 p-4 rounded-lg">
          ⚠️ {store.error}
        </div>
      )}
      
      <div class="flex flex-wrap justify-between items-center bg-white rounded-xl p-4 shadow-lg border-2 border-amber-200">
        <div class="flex items-center gap-6">
          <div class="text-center">
            <p class="text-xs text-gray-500">回合</p>
            <p class="text-2xl font-bold text-book-brown">#{store.currentRound}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">阶段</p>
            <p class="text-lg font-bold text-amber-600">
              {store.phase === 'pricing' ? '定价中' :
               store.phase === 'reveal' ? '揭示中' :
               store.phase === 'customer_feedback' ? '顾客反馈' :
               store.phase === 'return_event' ? '退货事件' :
               store.phase === 'settled' ? '已结算' : store.phase}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-center">
            <p class="text-xs text-gray-500">总积分</p>
            <p class="text-2xl font-bold text-blue-600">{store.totalScore}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500">当前资金</p>
            <p class="text-2xl font-bold text-green-600">¥{store.currentMoney.toFixed(2)}</p>
          </div>
          <button
            onClick$={onRecalculateScore$}
            class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            🔄 重算分数
          </button>
        </div>
      </div>
      
      {store.customer && (
        <CustomerCard customer={store.customer} />
      )}
      
      {store.blindBox && store.phase === 'pricing' && (
        <div class="grid lg:grid-cols-2 gap-6">
          <div>
            <BlindBoxCard blindBox={store.blindBox} revealAll={false} />
          </div>
          
          <div class="space-y-6">
            <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
              <h3 class="text-lg font-bold text-book-brown mb-4">💡 估价线索</h3>
              <div class="space-y-4 max-h-96 overflow-y-auto pr-2">
                {store.clues?.conditionClues.map((clue, i) => (
                  <ClueCard
                    key={`cond-${i}`}
                    type="condition"
                    title={`书籍 ${i + 1} - 书况`}
                    description={clue.desc}
                    icon={clue.hasInscription ? '✍️' : '📖'}
                    value={`×${clue.weight.toFixed(1)}`}
                    hasBonus={clue.hasInscription}
                  />
                ))}
                
                {store.clues?.historyClues.filter(c => c.hasSeal).map((clue, i) => (
                  <ClueCard
                    key={`hist-${i}`}
                    type="history"
                    title={`藏书章 - ${clue.sealName}`}
                    description={`原藏家: ${clue.sealOwner}`}
                    icon="🔖"
                    value="×1.1~1.5"
                    hasBonus={true}
                  />
                ))}
                
                {store.clues?.resultClues.filter(c => c.isRare).map((clue, i) => (
                  <ClueCard
                    key={`res-${i}`}
                    type="result"
                    title={`稀缺版本`}
                    description={clue.rarityDesc}
                    icon="⭐"
                    value={
                      clue.rarityLevel === 'out_of_print' ? '×3.0' :
                      clue.rarityLevel === 'first_edition' ? '×2.5' :
                      clue.rarityLevel === 'rare' ? '×1.8' : '×1.3'
                    }
                    hasBonus={true}
                  />
                ))}
              </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
              <h3 class="text-lg font-bold text-book-brown mb-4">💰 设定价格</h3>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">市场建议参考价</label>
                  <p class="text-2xl font-bold text-blue-600">
                    ¥{store.marketSuggestedPrice?.toFixed(2)}
                  </p>
                </div>
                
                <div>
                  <label class="block text-sm text-gray-600 mb-1">你的定价</label>
                  <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold text-gray-500">¥</span>
                    <input
                      type="number"
                      value={store.playerPrice}
                      onInput$={(e: any) => {
                        store.playerPrice = parseFloat(e.target.value) || 0;
                      }}
                      class="flex-1 px-4 py-3 text-2xl font-bold border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none"
                      min="1"
                      step="1"
                    />
                  </div>
                  <input
                    type="range"
                    min={Math.round((store.marketSuggestedPrice || 100) * 0.2)}
                    max={Math.round((store.marketSuggestedPrice || 100) * 3)}
                    value={store.playerPrice}
                    onInput$={(e: any) => {
                      store.playerPrice = parseFloat(e.target.value);
                    }}
                    class="w-full mt-3 accent-amber-600"
                  />
                  <div class="flex justify-between text-xs text-gray-500 mt-1">
                    <span>¥{Math.round((store.marketSuggestedPrice || 100) * 0.2)}</span>
                    <span>¥{Math.round((store.marketSuggestedPrice || 100) * 3)}</span>
                  </div>
                </div>
                
                <button
                  onClick$={onSubmitPrice$}
                  disabled={store.isLoading || store.playerPrice <= 0}
                  class="w-full py-4 bg-book-brown text-white text-xl font-bold rounded-lg shadow-lg hover:bg-book-sepia transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎯 确认定价
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {store.feedback && (store.phase === 'customer_feedback' || store.phase === 'return_event') && (
        <div class="space-y-6">
          <FeedbackCard feedback={store.feedback} returnEvent={store.returnEvent} />
          
          {store.priceCurve.length > 0 && store.blindBox && (
            <PriceCurveChart
              pricePoints={store.priceCurve}
              playerPrice={store.playerPrice}
              marketPrice={store.marketSuggestedPrice}
              actualValue={store.blindBox.totalActualValue}
            />
          )}
          
          <div class="flex justify-center">
            <button
              onClick$={onSettleRound$}
              class="px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-lg shadow-lg hover:bg-green-700 transition-all"
            >
              📊 结算本轮
            </button>
          </div>
        </div>
      )}
      
      {store.roundSummary && store.phase === 'settled' && (
        <div class="space-y-6">
          <BlindBoxComparison summary={store.roundSummary} />
          
          {store.priceCurve.length > 0 && (
            <PriceCurveChart
              pricePoints={store.priceCurve}
              playerPrice={store.roundSummary.playerPrice}
              marketPrice={store.marketSuggestedPrice}
              actualValue={store.roundSummary.actualValue}
            />
          )}
          
          <LedgerView
            entries={store.ledgerEntries}
            currentMoney={store.currentMoney}
            totalScore={store.totalScore}
            onRollback$={onRollbackEntry$}
            showRollback={true}
          />
          
          <div class="bg-amber-50 rounded-xl p-6 border-2 border-amber-200">
            <h3 class="text-lg font-bold text-amber-800 mb-4">📝 四种记录结构说明</h3>
            <div class="grid md:grid-cols-2 gap-4 text-sm">
              <div class="bg-white p-3 rounded">
                <p class="font-bold text-blue-700">📋 主记录</p>
                <p class="text-gray-600">保存了你对盲盒的估价: ¥{store.roundSummary.playerPrice.toFixed(2)}</p>
              </div>
              <div class="bg-white p-3 rounded">
                <p class="font-bold text-green-700">📖 明细记录</p>
                <p class="text-gray-600">保存了每本书的书况线索和估值系数</p>
              </div>
              <div class="bg-white p-3 rounded">
                <p class="font-bold text-red-700">🔖 历史记录</p>
                <p class="text-gray-600">保存了藏书章信息和价值加成</p>
              </div>
              <div class="bg-white p-3 rounded">
                <p class="font-bold text-amber-700">⭐ 结果记录</p>
                <p class="text-gray-600">保存了绝版程度和顾客偏好匹配度</p>
              </div>
            </div>
          </div>
          
          <div class="flex justify-center gap-4">
            <button
              onClick$={onNextRound$}
              class="px-8 py-4 bg-book-brown text-white text-xl font-bold rounded-lg shadow-lg hover:bg-book-sepia transition-all"
            >
              🔄 下一轮
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export const head: DocumentHead = {
  title: '旧书店盲盒定价经营游戏',
  meta: [
    {
      name: 'description',
      content: '给旧书盲盒估价，从书况、题签、藏书章、绝版程度和顾客偏好中挖掘真正的价值',
    },
  ],
};
