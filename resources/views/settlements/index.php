<div class="card">
    <div class="card-header">
        <h1 class="card-title">费用结算</h1>
    </div>
    
    <?php if (empty($settlements)): ?>
        <div class="empty-state">
            <div class="empty-state-icon">💳</div>
            <p>暂无结算记录</p>
        </div>
    <?php else: ?>
        <table>
            <thead>
                <tr>
                    <th>结算单号</th>
                    <th>作业费</th>
                    <th>燃油费</th>
                    <th>补贴抵扣</th>
                    <th>实付金额</th>
                    <th>状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($settlements as $settlement): ?>
                <tr>
                    <td><strong><?php echo e($settlement['settlement_no']); ?></strong></td>
                    <td><?php echo formatMoney($settlement['operation_fee']); ?></td>
                    <td><?php echo formatMoney($settlement['fuel_cost']); ?></td>
                    <td class="text-success">-<?php echo formatMoney($settlement['subsidy_amount']); ?></td>
                    <td><strong><?php echo formatMoney($settlement['total_amount']); ?></strong></td>
                    <td><?php echo statusBadge($settlement['status'], Settlement::statusLabels()); ?></td>
                    <td>
                        <a href="/settlements/<?php echo $settlement['id']; ?>" class="btn btn-sm btn-outline">查看</a>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    <?php endif; ?>
</div>
