<div class="card">
    <div class="card-header">
        <h1 class="card-title">结算详情</h1>
        <a href="/settlements" class="btn btn-outline">返回列表</a>
    </div>
    
    <?php if (!$settlement): ?>
        <div class="alert alert-error">
            <p><strong>错误：</strong>结算记录不存在或已被删除。</p>
            <a href="/settlements" class="btn btn-sm btn-outline mt-1">返回结算列表</a>
        </div>
    <?php else: ?>
    
    <div class="grid grid-2">
        <div>
            <div class="detail-row">
                <span class="detail-label">结算单号</span>
                <span class="detail-value"><strong><?php echo e($settlement['settlement_no'] ?? '-'); ?></strong></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">结算状态</span>
                <span class="detail-value"><?php echo statusBadge($settlement['status'] ?? 'unknown', Settlement::statusLabels()); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">支付时间</span>
                <span class="detail-value"><?php echo formatDateTime($settlement['paid_at'] ?? null); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">支付方式</span>
                <span class="detail-value"><?php echo e(Settlement::paymentMethods()[$settlement['payment_method']] ?? ($settlement['payment_method'] ?? '-')); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">交易流水号</span>
                <span class="detail-value"><?php echo e($settlement['transaction_no'] ?? '-'); ?></span>
            </div>
        </div>
        <div>
            <div class="detail-row">
                <span class="detail-label">作业服务费</span>
                <span class="detail-value"><?php echo formatMoney($settlement['operation_fee'] ?? 0); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">燃油成本</span>
                <span class="detail-value"><?php echo formatMoney($settlement['fuel_cost'] ?? 0); ?></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">补贴抵扣</span>
                <span class="detail-value text-success">-<?php echo formatMoney($settlement['subsidy_amount'] ?? 0); ?></span>
            </div>
            <div class="detail-row" style="background:#f8f9fa;padding:0.5rem;border-radius:6px;">
                <span class="detail-label"><strong>实付金额</strong></span>
                <span class="detail-value"><strong style="font-size:1.25rem;color:#4a7c23;"><?php echo formatMoney($settlement['total_amount'] ?? 0); ?></strong></span>
            </div>
        </div>
    </div>
    
    <?php if (($settlement['status'] ?? '') == 'unpaid'): ?>
    <div class="mt-2">
        <form method="POST" action="/settlements/<?php echo $settlement['id']; ?>/pay">
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">支付方式</label>
                    <select name="payment_method" class="form-control" required>
                        <?php foreach (Settlement::paymentMethods() as $key => $label): ?>
                        <option value="<?php echo $key; ?>"><?php echo e($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">交易流水号</label>
                    <input type="text" name="transaction_no" class="form-control" value="TXN<?php echo date('YmdHis'); ?>" required>
                </div>
            </div>
            <button type="submit" class="btn btn-success" onclick="return confirm('确认支付？');">确认支付</button>
        </form>
    </div>
    <?php endif; ?>
    
    <?php endif; ?>
</div>

<?php if ($settlement): ?>

<?php if (!$subsidy): ?>
<div class="card">
    <h3 class="card-title mb-1">关联油补信息</h3>
    <div class="empty-state">
        <p class="text-muted">⚠️ 该结算暂未关联油补记录</p>
    </div>
</div>
<?php else: ?>
<div class="card">
    <h3 class="card-title mb-1">关联油补信息</h3>
    <div class="grid grid-3">
        <div class="detail-row">
            <span class="detail-label">油补编号</span>
            <span class="detail-value"><?php echo e($subsidy['subsidy_no'] ?? '-'); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">补贴金额</span>
            <span class="detail-value"><?php echo formatMoney($subsidy['total_subsidy'] ?? 0); ?></span>
        </div>
        <div class="detail-row">
            <span class="detail-label">补贴状态</span>
            <span class="detail-value"><?php echo statusBadge($subsidy['status'] ?? 'unknown', Subsidy::statusLabels()); ?></span>
        </div>
    </div>
</div>
<?php endif; ?>

<?php endif; ?>
