<div class="card">
    <div class="card-header">
        <div class="flex items-center justify-between">
            <h1 class="card-title">排班日历</h1>
            <div class="flex gap-1">
                <a href="/schedules/calendar?month=<?php echo $prevMonth; ?>" class="btn btn-outline">◀ 上月</a>
                <strong><?php echo $month; ?></strong>
                <a href="/schedules/calendar?month=<?php echo $nextMonth; ?>" class="btn btn-outline">下月 ▶</a>
            </div>
        </div>
    </div>
    
    <div class="calendar-header">
        <div class="calendar-day-header">日</div>
        <div class="calendar-day-header">一</div>
        <div class="calendar-day-header">二</div>
        <div class="calendar-day-header">三</div>
        <div class="calendar-day-header">四</div>
        <div class="calendar-day-header">五</div>
        <div class="calendar-day-header">六</div>
    </div>
    
    <div class="calendar">
        <?php
        $firstDay = date('w', strtotime($month . '-01'));
        for ($i = 0; $i < $firstDay; $i++):
        ?>
            <div class="calendar-day" style="background:#f8f9fa;"></div>
        <?php endfor; ?>
        
        <?php foreach ($calendar as $date => $events): ?>
            <div class="calendar-day">
                <div class="calendar-day-number"><?php echo date('j', strtotime($date)); ?></div>
                <?php foreach ($events as $event): ?>
                    <div class="calendar-event">
                        <div><?php echo e($event['start_time']); ?></div>
                        <div class="text-sm text-muted">农机 #<?php echo $event['machine_id']; ?></div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endforeach; ?>
    </div>
</div>
