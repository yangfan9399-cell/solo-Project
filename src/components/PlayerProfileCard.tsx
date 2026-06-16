import { component$, $ } from '@builder.io/qwik';
import type { PlayerProfile } from '~/game/types';
import { getReputationLevelName } from '~/game/engine';

interface PlayerProfileCardProps {
  player: PlayerProfile;
  onNameChange$?: (name: string) => void;
  onReset$?: () => void;
}

export const PlayerProfileCard = component$<PlayerProfileCardProps>((props) => {
  const { player, onNameChange$, onReset$ } = props;
  const reputationName = getReputationLevelName(player.reputation);

  const handleNameInput = $((e: Event) => {
    const target = e.target as HTMLInputElement;
    if (onNameChange$) onNameChange$(target.value);
  });

  return (
    <div class="panel">
      <h3 class="panel-title">匠人档案</h3>

      <div class="input-group">
        <label>名号</label>
        <input
          type="text"
          value={player.name}
          onInput$={handleNameInput}
          placeholder="请输入您的名号"
          maxlength={20}
        />
      </div>

      <div class="stat">
        <span class="stat-label">声望等级</span>
        <span class="stat-value text-accent">{reputationName}</span>
      </div>
      <div class="stat">
        <span class="stat-label">当前声望</span>
        <span class="stat-value text-success">{player.reputation}</span>
      </div>
      <div class="stat">
        <span class="stat-label">铜钱积蓄</span>
        <span class="stat-value text-accent">{player.copper} 文</span>
      </div>
      <div class="stat">
        <span class="stat-label">历史最高精度</span>
        <span class="stat-value">{player.bestAccuracy}%</span>
      </div>
      <div class="stat">
        <span class="stat-label">累计完成订单</span>
        <span class="stat-value text-success">{player.totalOrdersCompleted}</span>
      </div>
      <div class="stat">
        <span class="stat-label">累计失败订单</span>
        <span class="stat-value text-danger">{player.totalOrdersFailed}</span>
      </div>
      <div class="stat">
        <span class="stat-label">当前关卡</span>
        <span class="stat-value">第 {player.currentLevel} 关</span>
      </div>
      <div class="stat">
        <span class="stat-label">已通关</span>
        <span class="stat-value">{player.completedLevels.length} 关</span>
      </div>

      {onReset$ && (
        <button
          class="btn btn-danger"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick$={() => {
            if (confirm('确定要重置所有游戏数据吗？此操作不可恢复。')) {
              onReset$();
            }
          }}
        >
          重置所有数据
        </button>
      )}
    </div>
  );
});
