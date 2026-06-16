<?php $__env->startSection('title', '控制台'); ?>

<?php $__env->startSection('content'); ?>
<h1 style="font-size: 2rem; margin-bottom: 1.5rem;">🎮 控制台</h1>

<div class="grid grid-4" style="margin-bottom: 2rem;">
    <div class="card stat-card">
        <div class="stat-value"><?php echo e($stats['total_score']); ?></div>
        <div class="stat-label">累计得分</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value"><?php echo e($stats['games_won']); ?>/<?php echo e($stats['games_played']); ?></div>
        <div class="stat-label">胜场/总场次</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value"><?php echo e($stats['win_rate']); ?>%</div>
        <div class="stat-label">胜率</div>
    </div>
    <div class="card stat-card">
        <div class="stat-value"><?php echo e($stats['current_streak']); ?>🔥</div>
        <div class="stat-label">当前连胜 (最佳: <?php echo e($stats['best_streak']); ?>)</div>
    </div>
</div>

<div class="grid grid-2" style="margin-bottom: 2rem;">
    <div class="card">
        <div class="flex justify-between items-center mb-3">
            <h2 class="card-title" style="margin: 0;">📋 关卡列表</h2>
            <a href="<?php echo e(route('custom-levels.index')); ?>" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.85rem;">🎨 我的自定义谜题</a>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <?php $__currentLoopData = $levels; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $level): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <div style="background: rgba(15,23,42,0.6); padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(99,102,241,0.2);">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <div class="font-bold text-lg">
                                <?php echo e($level->name); ?>

                                <?php if($level->is_custom): ?>
                                    <span class="badge badge-medium" style="font-size: 0.7rem; vertical-align: middle;">自定义</span>
                                <?php endif; ?>
                            </div>
                            <div class="text-sm text-muted mt-1"><?php echo e($level->description); ?></div>
                        </div>
                        <span class="badge badge-<?php echo e($level->difficulty); ?>"><?php echo e($level->difficulty_label); ?></span>
                    </div>
                    <div class="flex justify-between items-center mt-3">
                        <div class="text-sm">
                            <span class="text-warning font-bold"><?php echo e($level->base_score); ?></span> 基础分 ·
                            <span class="text-info"><?php echo e($level->rotor_count); ?></span> 转轮 ·
                            <span class="text-danger"><?php echo e($level->hint_penalty); ?></span> 提示扣分
                        </div>
                        <form method="POST" action="<?php echo e(route('game.start', $level)); ?>">
                            <?php echo csrf_field(); ?>
                            <button type="submit" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">
                                开始挑战
                            </button>
                        </form>
                    </div>
                </div>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
        </div>
    </div>

    <div>
        <?php if($inProgressGames->count() > 0): ?>
            <div class="card" style="margin-bottom: 1.5rem;">
                <h2 class="card-title">⏸️ 进行中的游戏</h2>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <?php $__currentLoopData = $inProgressGames; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $game): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <div class="flex justify-between items-center" style="background: rgba(245,158,11,0.1); padding: 0.75rem 1rem; border-radius: 0.5rem; border-left: 3px solid #f59e0b;">
                            <div>
                                <div class="font-bold"><?php echo e($game->level->name); ?></div>
                                <div class="text-sm text-muted">开始于 <?php echo e($game->started_at->format('H:i')); ?> · 已扣分 <?php echo e($game->penalty_score); ?></div>
                            </div>
                            <a href="<?php echo e(route('game.show', $game)); ?>" class="btn btn-warning" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">继续</a>
                        </div>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </div>
            </div>
        <?php endif; ?>

        <div class="card">
            <h2 class="card-title">🏆 排行榜 TOP 10</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(99,102,241,0.2);">
                        <th style="text-align: left; padding: 0.5rem; color: #94a3b8;">#</th>
                        <th style="text-align: left; padding: 0.5rem; color: #94a3b8;">玩家</th>
                        <th style="text-align: right; padding: 0.5rem; color: #94a3b8;">分数</th>
                        <th style="text-align: right; padding: 0.5rem; color: #94a3b8;">胜率</th>
                    </tr>
                </thead>
                <tbody>
                    <?php $__currentLoopData = $leaderboard; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $entry): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                        <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                            <td style="padding: 0.5rem;">
                                <span class="<?php if($entry['rank'] == 1): ?> text-warning <?php elseif($entry['rank'] == 2): ?> text-muted <?php elseif($entry['rank'] == 3): ?> text-danger <?php endif; ?> font-bold">
                                    <?php echo e($entry['rank']); ?>

                                </span>
                            </td>
                            <td style="padding: 0.5rem;"><?php echo e($entry['name']); ?></td>
                            <td style="padding: 0.5rem; text-align: right;" class="font-bold text-warning"><?php echo e($entry['total_score']); ?></td>
                            <td style="padding: 0.5rem; text-align: right;" class="text-success"><?php echo e($entry['win_rate']); ?>%</td>
                        </tr>
                    <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<div class="card">
    <h2 class="card-title">📜 最近游戏记录</h2>
    <?php if($recentGames->count() > 0): ?>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="border-bottom: 1px solid rgba(99,102,241,0.2);">
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">关卡</th>
                    <th style="text-align: left; padding: 0.75rem; color: #94a3b8;">状态</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">得分</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">提示使用</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">时间</th>
                    <th style="text-align: right; padding: 0.75rem; color: #94a3b8;">操作</th>
                </tr>
            </thead>
            <tbody>
                <?php $__currentLoopData = $recentGames; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $game): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                    <tr style="border-bottom: 1px solid rgba(99,102,241,0.1);">
                        <td style="padding: 0.75rem;">
                            <span class="font-bold"><?php echo e($game->level->name); ?></span>
                            <span class="badge badge-<?php echo e($game->level->difficulty); ?>" style="margin-left: 0.5rem;"><?php echo e($game->level->difficulty_label); ?></span>
                        </td>
                        <td style="padding: 0.75rem;">
                            <span class="<?php if($game->status === 'completed'): ?> text-success <?php elseif($game->status === 'in_progress'): ?> text-warning <?php else: ?> text-danger <?php endif; ?> font-bold">
                                <?php echo e($game->status_label); ?>

                            </span>
                        </td>
                        <td style="padding: 0.75rem; text-align: right;" class="font-bold text-warning"><?php echo e($game->final_score); ?></td>
                        <td style="padding: 0.75rem; text-align: right;"><?php echo e($game->hints_used); ?></td>
                        <td style="padding: 0.75rem; text-align: right;" class="text-muted text-sm"><?php echo e($game->started_at->format('m-d H:i')); ?></td>
                        <td style="padding: 0.75rem; text-align: right;">
                            <a href="<?php echo e(route('game.history', $game)); ?>" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">查看历史</a>
                        </td>
                    </tr>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </tbody>
        </table>
    <?php else: ?>
        <p class="text-muted">还没有游戏记录，选择一个关卡开始挑战吧！</p>
    <?php endif; ?>
</div>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', array_diff_key(get_defined_vars(), ['__data' => 1, '__path' => 1]))->render(); ?><?php /**PATH /Users/yangfan/Desktop/trae-solo-generated-projects/q-333/resources/views/dashboard.blade.php ENDPATH**/ ?>