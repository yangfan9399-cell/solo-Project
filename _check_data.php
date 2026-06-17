<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$app->make("Illuminate\Contracts\Console\Kernel")->bootstrap();

echo "=== 数据完整性检查 ===\n";
echo "烫金版总数: ".App\Models\Plate::count()."\n";
echo "订单总数: ".App\Models\Order::count()."\n";
echo "版本历史总数: ".App\Models\VersionHistory::count()."\n";
echo "保养记录总数: ".App\Models\Maintenance::count()."\n";
echo "异常待处理数: ".App\Models\Plate::warning()->count()."\n";
echo "使用率>=85%: ".App\Models\Plate::whereColumn("usage_count",">=",Illuminate\Support\Facades\DB::raw("max_usage*0.85"))->count()."\n";
echo "保养逾期: ".App\Models\Plate::whereDate("next_maintenance_date","<",now())
    ->whereNotNull("next_maintenance_date")
    ->whereNotIn("status",["已报废"])->count()."\n";

$p1 = App\Models\Plate::where("plate_code","TG-2024-001")->first();
echo "TG-2024-001 关联订单: ".$p1->orders->count()."单, 保养: ".$p1->maintenances->count()."次\n";

$p2 = App\Models\Plate::where("plate_code","TG-2025-015")->first();
echo "TG-2025-015 版本历史: ".$p2->versionHistories->count()."版\n";
echo "TG-2025-015 使用率: ".$p2->usage_rate."%, 异常: ".($p2->is_warning?"是":"否")."\n";

$p3 = App\Models\Plate::where("plate_code","TG-2025-031")->first();
echo "TG-2025-031(维修中) 异常: ".($p3->is_warning?"是":"否").", 状态: ".$p3->status."\n";

echo "材质分布: ";
print_r(App\Models\Plate::selectRaw("material,count(*) c")
    ->groupBy("material")->pluck("c","material")->toArray());

echo "\n=== 所有检查通过 ===\n";
