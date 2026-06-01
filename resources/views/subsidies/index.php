<div class="card">
    <div class="card-header">
        <h1 class="card-title">油补核算</h1>
        <a href="/subsidies/create" class="btn btn-primary">新增核算</a>
    </div>
    
    <?php if (empty($subsidies)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">💰</div>
            <p>暂无油补核算记录</p>
            <a href="/subsidies/create" class="btn btn-primary mt-2">开始核算</a>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>核算编号</th>
                    <th>作业类型</th>
                    <th>面积</th>
                    <th>补贴合计</th>
                    <th>核算状态</th>
                    <th>结算状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($subsidies as $subsidy): ?>
                <?php $relatedSettlement = $settlementsBySubsidy[$subsidy['id']] ?? null; ?>
                <tr>
                    <td><strong><?php echo e($subsidy['subsidy_no']); ?></strong></td>
                    <td><?php echo e(Booking::operationTypes()[$subsidy['operation_type']] ?? $subsidy['operation_type']); ?></td>
                    <td><?php echo formatArea($subsidy['area']); ?></td>
                    <td><strong><?php echo formatMoney($subsidy['total_subsidy']); ?></strong></td>
                    <td><?php echo statusBadge($subsidy['status'], Subsidy::statusLabels()); ?></td>
                    <td>
                        <?php if ($relatedSettlement): ?>
                            <a href="/settlements/<?php echo $relatedSettlement['id']; ?>" style="text-decoration:none;">
                                <?php echo statusBadge($relatedSettlement['status'], Settlement::statusLabels()); ?>
                            </a>
                        <?php else: ?>
                            <span style="background:#fff3cd;color:#856404;padding:0.25rem 0.5rem;border-radius:9999px;font-size:0.75rem;font-weight:600;">待生成</span>
                        <?php endif; ?>
                    </td>
                    <td>
                        <a href="/subsidies/<?php echo $subsidy['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                        <?php if (!$relatedSettlement): ?>
                            <form method="POST" action="/subsidies/<?php echo $subsidy['id']; ?>/settle" style="display:inline;" onsubmit="return confirm('确认生成结算单？');">
                                <button type="submit" class="btn btn-sm btn-primary">生成结算</button>
                            </form>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
