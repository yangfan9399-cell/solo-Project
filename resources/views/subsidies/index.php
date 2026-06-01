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
                    <th>油补金额</th>
                    <th>作业补贴</th>
                    <th>补贴合计</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($subsidies as $subsidy): ?>
                <tr>
                    <td><strong><?php echo e($subsidy['subsidy_no']); ?></strong></td>
                    <td><?php echo e(Booking::operationTypes()[$subsidy['operation_type']] ?? $subsidy['operation_type']); ?></td>
                    <td><?php echo formatArea($subsidy['area']); ?></td>
                    <td><?php echo formatMoney($subsidy['fuel_subsidy_amount']); ?></td>
                    <td><?php echo formatMoney($subsidy['operation_subsidy_amount']); ?></td>
                    <td><strong><?php echo formatMoney($subsidy['total_subsidy']); ?></strong></td>
                    <td><?php echo statusBadge($subsidy['status'], Subsidy::statusLabels()); ?></td>
                    <td>
                        <a href="/subsidies/<?php echo $subsidy['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
