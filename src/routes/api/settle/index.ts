import type { RequestHandler } from '@builder.io/qwik-city';
import type { GameSession, SettleResult } from '~/game/types';
import { INITIAL_LEVELS } from '~/game/levels';
import { clamp } from '~/game/engine';

export const onPost: RequestHandler = async ({ request, json }) => {
  try {
    const body = await request.json();
    const session = body.session as GameSession;

    if (!session) {
      json(400, { error: '缺少游戏会话数据' });
      return;
    }

    const level = INITIAL_LEVELS.find((l) => l.id === session.levelId);
    if (!level) {
      json(400, { error: '无效的关卡 ID' });
      return;
    }

    const allCompleted = session.completedOrders || [];
    const pendingOrders = session.orders.filter(
      (o) => o.status === 'accepted' || o.status === 'pending'
    );
    const expiredOrders = pendingOrders.filter((o) => o.deadline < session.currentDay);

    const ordersCompleted = allCompleted.filter((o) => o.status === 'completed').length;
    const ordersFailed = allCompleted.filter((o) => o.status === 'failed').length;
    const ordersExpired = expiredOrders.length;

    let totalAccuracy = 0;
    let accuracyCount = 0;
    let copperEarned = 0;
    let reputationEarned = 0;

    allCompleted.forEach((o) => {
      if (o.status === 'completed' && o.actualResult) {
        totalAccuracy += o.actualResult.accuracyScore;
        accuracyCount++;
        copperEarned += o.rewardCopper;
        reputationEarned += o.reputationReward;
      } else if (o.status === 'failed') {
        copperEarned -= Math.floor(o.rewardCopper * 0.3);
        reputationEarned -= Math.floor(o.reputationReward * 0.5);
      }
    });

    expiredOrders.forEach((o) => {
      copperEarned -= Math.floor(o.rewardCopper * 0.2);
      reputationEarned -= Math.floor(o.reputationReward * 0.3);
    });

    const averageAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;

    const minReputationMet = session.reputation >= level.passCondition.minReputation;
    const minCopperMet = session.copper >= level.passCondition.minCopper;
    const minAccuracyMet = averageAccuracy >= level.passCondition.minAccuracy * 100;

    const won = minReputationMet && minCopperMet && minAccuracyMet;

    const accuracyScore = averageAccuracy * 3;
    const copperScore = clamp((session.copper / level.passCondition.minCopper) * 30, 0, 50);
    const reputationScore = clamp(
      (session.reputation / level.passCondition.minReputation) * 30,
      0,
      30
    );
    const completionBonus = won ? 100 : 0;
    const serverCalculatedScore = Math.round(
      accuracyScore + copperScore + reputationScore + completionBonus
    );

    let message = '';
    if (won) {
      message = `恭喜通过「${level.name}」！最终得分：${serverCalculatedScore}分`;
    } else {
      const reasons: string[] = [];
      if (!minReputationMet) reasons.push(`声望不足（需${level.passCondition.minReputation}）`);
      if (!minCopperMet) reasons.push(`铜钱不足（需${level.passCondition.minCopper}）`);
      if (!minAccuracyMet)
        reasons.push(`精度不足（需${Math.round(level.passCondition.minAccuracy * 100)}%）`);
      message = `未能通过「${level.name}」：${reasons.join('、')}`;
    }

    const result: SettleResult = {
      sessionId: session.id,
      playerId: session.playerId,
      levelId: session.levelId,
      won,
      copperEarned,
      copperFinal: session.copper,
      reputationEarned,
      reputationFinal: session.reputation,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      ordersCompleted,
      ordersFailed,
      ordersExpired,
      serverCalculatedScore,
      passConditionMet: {
        minReputation: minReputationMet,
        minCopper: minCopperMet,
        minAccuracy: minAccuracyMet,
      },
      settledAt: Date.now(),
      message,
    };

    json(200, {
      success: true,
      result,
      calculatedAt: Date.now(),
      verifiedBy: 'server',
    });
  } catch (e) {
    json(500, { error: '服务器结算错误', details: (e as Error).message });
  }
};
