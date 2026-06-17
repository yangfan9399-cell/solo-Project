<?php

namespace App\Http\Controllers;

use App\Models\Plate;
use App\Models\Order;
use App\Models\VersionHistory;
use App\Models\Maintenance;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PlateController extends Controller
{
    public function dashboard()
    {
        $totalPlates = Plate::count();
        $activePlates = Plate::active()->count();
        $warningPlates = Plate::warning()->count();
        $retiredPlates = Plate::where('status', '已报废')->count();

        $totalUsage = Plate::sum('usage_count');
        $totalOrders = Order::count();
        $totalOrderQuantity = Order::sum('quantity');
        $totalMaintenanceCost = Maintenance::sum('cost');

        $overdueMaintenance = Plate::whereDate('next_maintenance_date', '<', Carbon::today())
            ->whereNotNull('next_maintenance_date')
            ->whereNotIn('status', ['已报废'])
            ->withCount('maintenances')
            ->get();

        $highUsagePlates = Plate::active()
            ->whereColumn('usage_count', '>=', DB::raw('max_usage * 0.85'))
            ->get();

        $pendingMaintenance = Maintenance::where('status', '待处理')
            ->orWhere('status', '进行中')
            ->with('plate')
            ->orderBy('maintenance_date')
            ->get();

        $ongoingOrders = Order::where('status', '进行中')
            ->with('plate')
            ->orderBy('delivery_date')
            ->limit(8)
            ->get();

        $recentlyUsed = Plate::active()
            ->whereNotNull('last_used_at')
            ->orderBy('last_used_at', 'desc')
            ->limit(6)
            ->get();

        $materialStats = Plate::select('material', DB::raw('count(*) as count'))
            ->groupBy('material')
            ->pluck('count', 'material');

        $statusStats = Plate::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        $abnormalities = [];
        foreach (Plate::active()->get() as $plate) {
            $issues = [];
            if ($plate->is_overdue_maintenance) {
                $days = abs($plate->maintenance_days_left);
                $issues[] = "保养逾期 {$days} 天";
            }
            if ($plate->usage_count > $plate->max_usage) {
                $issues[] = "使用次数超上限 " . ($plate->usage_count - $plate->max_usage) . " 次";
            } elseif ($plate->usage_rate >= 95) {
                $issues[] = "使用率达 {$plate->usage_rate}%，接近上限";
            }
            if ($plate->status === '维修中') {
                $issues[] = "当前处于维修状态";
            }
            if (!empty($issues)) {
                $abnormalities[] = [
                    'plate' => $plate,
                    'issues' => $issues,
                ];
            }
        }

        return view('dashboard', compact(
            'totalPlates',
            'activePlates',
            'warningPlates',
            'retiredPlates',
            'totalUsage',
            'totalOrders',
            'totalOrderQuantity',
            'totalMaintenanceCost',
            'overdueMaintenance',
            'highUsagePlates',
            'pendingMaintenance',
            'ongoingOrders',
            'recentlyUsed',
            'materialStats',
            'statusStats',
            'abnormalities'
        ));
    }

    public function index(Request $request)
    {
        $query = Plate::withCount(['orders', 'versionHistories', 'maintenances']);

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('plate_code', 'like', "%{$search}%")
                    ->orWhere('pattern_name', 'like', "%{$search}%")
                    ->orWhere('applicable_books', 'like', "%{$search}%")
                    ->orWhere('pattern_description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('remark', 'like', "%{$search}%");
            });
        }

        if ($status = $request->get('status')) {
            if ($status === 'warning') {
                $query->warning();
            } elseif ($status === 'active') {
                $query->active();
            } else {
                $query->where('status', $status);
            }
        }

        if ($material = $request->get('material')) {
            $query->where('material', $material);
        }

        if ($minWidth = $request->get('min_width')) {
            $query->where('plate_width', '>=', floatval($minWidth));
        }
        if ($maxWidth = $request->get('max_width')) {
            $query->where('plate_width', '<=', floatval($maxWidth));
        }

        $usageFilter = $request->get('usage_filter');
        if ($usageFilter) {
            switch ($usageFilter) {
                case 'high':
                    $query->whereColumn('usage_count', '>=', DB::raw('max_usage * 0.85'));
                    break;
                case 'medium':
                    $query->whereColumn('usage_count', '>=', DB::raw('max_usage * 0.5'))
                        ->whereColumn('usage_count', '<', DB::raw('max_usage * 0.85'));
                    break;
                case 'low':
                    $query->whereColumn('usage_count', '<', DB::raw('max_usage * 0.5'));
                    break;
            }
        }

        if ($book = $request->get('book')) {
            $query->where('applicable_books', 'like', "%{$book}%");
        }

        $sort = $request->get('sort', 'updated_at');
        $dir = $request->get('dir', 'desc');
        $allowedSorts = ['plate_code', 'pattern_name', 'usage_count', 'created_at', 'updated_at', 'next_maintenance_date', 'max_usage'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $dir === 'asc' ? 'asc' : 'desc');
        }

        $perPage = intval($request->get('per_page', 15));
        $plates = $query->paginate($perPage)->appends($request->all());

        $materials = Plate::distinct()->pluck('material');
        $statuses = Plate::getStatusOptions();

        $stats = [
            'total' => Plate::count(),
            'warning' => Plate::warning()->count(),
            'active' => Plate::active()->count(),
            'normal' => Plate::where('status', '正常')->count(),
            'maintenance' => Plate::where('status', '待保养')->count(),
            'repairing' => Plate::where('status', '维修中')->count(),
            'retired' => Plate::where('status', '已报废')->count(),
        ];

        return view('plates.index', compact('plates', 'materials', 'statuses', 'request', 'stats'));
    }

    public function show(Plate $plate)
    {
        $plate->load(['orders', 'versionHistories', 'maintenances']);

        $totalOrderValue = $plate->orders->sum(fn($o) => $o->total_amount ?? 0);
        $totalOrderQty = $plate->orders->sum('quantity');
        $totalMaintenanceCost = $plate->maintenances->sum('cost');

        $currentVersion = $plate->versionHistories->first();

        return view('plates.show', compact(
            'plate',
            'totalOrderValue',
            'totalOrderQty',
            'totalMaintenanceCost',
            'currentVersion'
        ));
    }

    public function create()
    {
        $materials = Plate::getMaterialOptions();
        $statuses = array_filter(Plate::getStatusOptions(), fn($s) => $s !== '已报废');
        return view('plates.create', compact('materials', 'statuses'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'plate_code' => 'required|unique:plates,plate_code|max:50',
            'pattern_name' => 'required|max:200',
            'pattern_description' => 'nullable|string',
            'applicable_books' => 'required|string',
            'plate_width' => 'required|numeric|min:1|max:9999',
            'plate_height' => 'required|numeric|min:1|max:9999',
            'plate_thickness' => 'required|numeric|min:0.5|max:10',
            'material' => 'required|max:30',
            'usage_count' => 'integer|min:0',
            'max_usage' => 'required|integer|min:100',
            'status' => 'required|max:20',
            'location' => 'nullable|max:100',
            'manufacture_date' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date',
            'remark' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $plate = Plate::create($validated);

            VersionHistory::create([
                'plate_id' => $plate->id,
                'version_code' => 'V1.0',
                'batch_number' => 'B' . date('Ymd') . '-A',
                'change_type' => '初始创建',
                'change_description' => '系统新增烫金版记录',
                'operator' => auth()->check() ? auth()->user()->name : '系统管理员',
                'changed_at' => Carbon::now(),
                'plate_width' => $plate->plate_width,
                'plate_height' => $plate->plate_height,
                'material' => $plate->material,
                'snapshot_data' => $plate->toArray(),
            ]);

            DB::commit();
            return redirect()->route('plates.show', $plate)
                ->with('success', "烫金版 {$plate->plate_code} 创建成功！已生成初始版本记录 V1.0");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->withErrors(['error' => '创建失败：' . $e->getMessage()]);
        }
    }

    public function edit(Plate $plate)
    {
        $materials = Plate::getMaterialOptions();
        $statuses = Plate::getStatusOptions();
        $changeTypes = ['图案修改', '尺寸调整', '材质更换', '维护记录', '修复重做', '其他变更'];
        return view('plates.edit', compact('plate', 'materials', 'statuses', 'changeTypes'));
    }

    public function update(Request $request, Plate $plate)
    {
        $validated = $request->validate([
            'plate_code' => 'required|max:50|unique:plates,plate_code,' . $plate->id,
            'pattern_name' => 'required|max:200',
            'pattern_description' => 'nullable|string',
            'applicable_books' => 'required|string',
            'plate_width' => 'required|numeric|min:1|max:9999',
            'plate_height' => 'required|numeric|min:1|max:9999',
            'plate_thickness' => 'required|numeric|min:0.5|max:10',
            'material' => 'required|max:30',
            'usage_count' => 'integer|min:0',
            'max_usage' => 'required|integer|min:100',
            'status' => 'required|max:20',
            'location' => 'nullable|max:100',
            'manufacture_date' => 'nullable|date',
            'last_used_at' => 'nullable|date',
            'next_maintenance_date' => 'nullable|date',
            'remark' => 'nullable|string',
            'change_type' => 'nullable|max:30',
            'change_description' => 'nullable|string',
            'version_note' => 'nullable|boolean',
            '_lock_updated_at' => 'required|date_format:Y-m-d H:i:s',
            '_force_update' => 'nullable|boolean',
        ]);

        if (!$plate->can_edit) {
            return back()->withInput()->withErrors(['error' => "当前版本状态为「{$plate->status}」，不允许编辑修改。如需修改请先启封或修改状态。"]);
        }

        $lockUpdatedAt = Carbon::createFromFormat('Y-m-d H:i:s', $validated['_lock_updated_at']);
        $dbUpdatedAt = $plate->updated_at;
        $hasConflict = $dbUpdatedAt->gt($lockUpdatedAt);
        $forceUpdate = $request->boolean('_force_update', false);

        if ($hasConflict && !$forceUpdate) {
            $conflictVersion = $plate->versionHistories()->where('changed_at', '>', $lockUpdatedAt)->first();
            $message = "⚠️ 版本冲突：该烫金版已于 {$dbUpdatedAt->format('Y-m-d H:i')} 被";
            $message .= $conflictVersion ? "「{$conflictVersion->operator}」修改（{$conflictVersion->change_type}）" : "其他操作修改";
            $message .= "，您的编辑基于旧版本数据。请确认变更内容后勾选「强制保存并生成冲突版本」继续，或取消刷新后重试。";
            return back()->withInput()->withErrors(['conflict_warning' => $message]);
        }

        $createVersion = $request->boolean('version_note', false);
        $changeType = $request->get('change_type');
        $changeDescription = $request->get('change_description');

        $changedFields = [];
        foreach ($validated as $key => $value) {
            if (in_array($key, ['change_type', 'change_description', 'version_note', 'last_used_at', '_lock_updated_at', '_force_update'])) continue;
            if ($plate->$key != $value) {
                $changedFields[] = $key;
            }
        }

        DB::beginTransaction();
        try {
            $oldSnapshot = $plate->toArray();
            $plate->update($validated);

            if ($createVersion || !empty($changedFields) || $hasConflict) {
                $lastVersion = $plate->versionHistories()->first();
                $lastVerNum = 0;
                if ($lastVersion && preg_match('/V(\d+)\.(\d+)/', $lastVersion->version_code, $m)) {
                    $lastVerNum = intval($m[1]) * 10 + intval($m[2]);
                }
                $newVerNum = $lastVerNum + 1;
                $major = intval($newVerNum / 10);
                $minor = $newVerNum % 10;
                $batchSuffix = chr(65 + ($plate->versionHistories()->count() % 26));

                if (!$changeType) {
                    if ($hasConflict) {
                        $changeType = '冲突保留';
                    } elseif (in_array('plate_width', $changedFields) || in_array('plate_height', $changedFields) || in_array('plate_thickness', $changedFields)) {
                        $changeType = '尺寸调整';
                    } elseif (in_array('material', $changedFields)) {
                        $changeType = '材质更换';
                    } elseif (in_array('pattern_name', $changedFields) || in_array('pattern_description', $changedFields)) {
                        $changeType = '图案修改';
                    } else {
                        $changeType = '维护记录';
                    }
                }

                VersionHistory::create([
                    'plate_id' => $plate->id,
                    'version_code' => "V{$major}.{$minor}",
                    'batch_number' => 'B' . date('Ymd') . '-' . $batchSuffix,
                    'change_type' => $changeType,
                    'change_description' => $hasConflict ? ("[冲突保留] " . ($changeDescription ?: "更新字段: " . implode(', ', $changedFields))) : ($changeDescription ?: ("更新字段: " . implode(', ', $changedFields))),
                    'operator' => auth()->check() ? auth()->user()->name : '系统管理员',
                    'changed_at' => Carbon::now(),
                    'plate_width' => $plate->plate_width,
                    'plate_height' => $plate->plate_height,
                    'material' => $plate->material,
                    'snapshot_data' => [
                        'before' => $oldSnapshot,
                        'after' => $plate->toArray(),
                        'changed_fields' => $changedFields,
                        'conflict' => $hasConflict,
                        'conflict_with' => $dbUpdatedAt->toDateTimeString(),
                    ],
                ]);
            }

            DB::commit();
            return redirect()->route('plates.show', $plate)
                ->with('success', $hasConflict ? '烫金版信息已更新（冲突版本已保留）！' : '烫金版信息已更新！');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->withErrors(['error' => '更新失败：' . $e->getMessage()]);
        }
    }

    public function destroy(Plate $plate)
    {
        $code = $plate->plate_code;
        $plate->delete();
        return redirect()->route('plates.index')
            ->with('success', "烫金版 {$code} 已删除");
    }

    public function recordUsage(Request $request, Plate $plate)
    {
        $validated = $request->validate([
            'count' => 'required|integer|min:1',
            'note' => 'nullable|string',
        ]);

        $count = $validated['count'];
        $plate->increment('usage_count', $count);
        $plate->update(['last_used_at' => Carbon::now()]);

        return back()->with('success', "已登记使用 {$count} 次，累计使用 {$plate->usage_count} 次");
    }

    public function addOrder(Request $request, Plate $plate)
    {
        $validated = $request->validate([
            'order_number' => 'required|unique:orders,order_number|max:50',
            'book_title' => 'required|max:200',
            'customer_name' => 'nullable|max:150',
            'quantity' => 'required|integer|min:1',
            'order_date' => 'required|date',
            'delivery_date' => 'nullable|date',
            'status' => 'required|max:20',
            'unit_price' => 'nullable|numeric|min:0',
            'remark' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $order = $plate->orders()->create($validated);
            if ($validated['status'] === '已完成') {
                $plate->increment('usage_count', $order->quantity);
                $plate->update(['last_used_at' => Carbon::now()]);
            }
            DB::commit();
            return back()->with('success', "订单 {$order->order_number} 已添加");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->withErrors(['order_error' => '订单创建失败：' . $e->getMessage()]);
        }
    }

    public function updateOrderStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|max:20',
        ]);

        $oldStatus = $order->status;
        $newStatus = $validated['status'];

        DB::beginTransaction();
        try {
            $order->update($validated);
            if ($oldStatus !== '已完成' && $newStatus === '已完成') {
                $order->plate->increment('usage_count', $order->quantity);
                $order->plate->update(['last_used_at' => Carbon::now()]);
            }
            DB::commit();
            return back()->with('success', "订单状态已更新为 {$newStatus}");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => '更新失败：' . $e->getMessage()]);
        }
    }

    public function addMaintenance(Request $request, Plate $plate)
    {
        $validated = $request->validate([
            'maintenance_type' => 'required|max:50',
            'description' => 'nullable|string',
            'operator' => 'nullable|max:100',
            'maintenance_date' => 'required|date',
            'next_maintenance_date' => 'nullable|date',
            'cost' => 'nullable|numeric|min:0',
            'status' => 'required|max:20',
            'remark' => 'nullable|string',
        ]);

        DB::beginTransaction();
        try {
            $maint = $plate->maintenances()->create($validated);

            if ($maint->status === '已完成' && $maint->next_maintenance_date) {
                $plate->update(['next_maintenance_date' => $maint->next_maintenance_date]);
                if ($plate->status === '待保养') {
                    $plate->update(['status' => '正常']);
                }
            }

            if (in_array($maint->maintenance_type, ['更换重做', '修复重做', '图案修复', '抛光修复'])) {
                $lastVersion = $plate->versionHistories()->first();
                $lastVerNum = 0;
                if ($lastVersion && preg_match('/V(\d+)\.(\d+)/', $lastVersion->version_code, $m)) {
                    $lastVerNum = intval($m[1]) * 10 + intval($m[2]);
                }
                $newVerNum = $lastVerNum + 1;
                $major = intval($newVerNum / 10);
                $minor = $newVerNum % 10;

                VersionHistory::create([
                    'plate_id' => $plate->id,
                    'version_code' => "V{$major}.{$minor}",
                    'batch_number' => 'B' . date('Ymd') . '-M',
                    'change_type' => '修复重做',
                    'change_description' => "保养记录关联：{$maint->maintenance_type} - {$maint->description}",
                    'operator' => $maint->operator,
                    'changed_at' => Carbon::parse($maint->maintenance_date),
                    'plate_width' => $plate->plate_width,
                    'plate_height' => $plate->plate_height,
                    'material' => $plate->material,
                ]);
            }

            DB::commit();
            return back()->with('success', "保养记录已添加");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withInput()->withErrors(['maint_error' => '保养记录创建失败：' . $e->getMessage()]);
        }
    }

    public function export(Request $request)
    {
        $query = Plate::withCount(['orders', 'maintenances']);

        if ($status = $request->get('status')) {
            if ($status === 'warning') {
                $query->warning();
            } elseif ($status === 'active') {
                $query->active();
            } else {
                $query->where('status', $status);
            }
        }
        if ($material = $request->get('material')) {
            $query->where('material', $material);
        }

        $plates = $query->orderBy('plate_code')->get();

        $filename = '烫金版台账摘要_' . Carbon::now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($plates) {
            $handle = fopen('php://output', 'w');
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, [
                '版号', '图案名称', '图案描述', '适用书名',
                '宽度(mm)', '高度(mm)', '厚度(mm)', '材质',
                '使用次数', '上限次数', '使用率(%)', '状态',
                '存放位置', '制作日期', '最近使用', '下次保养',
                '关联订单数', '保养次数', '累计保养成本', '异常标记', '备注'
            ]);

            foreach ($plates as $plate) {
                $flags = [];
                if (!$plate->is_retired) {
                    if ($plate->is_overdue_maintenance) $flags[] = '保养逾期';
                    if ($plate->is_over_usage) $flags[] = '超期使用';
                    elseif ($plate->is_high_usage) $flags[] = '高频使用';
                    if ($plate->status === '待保养') $flags[] = '待保养';
                    if ($plate->status === '维修中') $flags[] = '维修中';
                }

                fputcsv($handle, [
                    $plate->plate_code,
                    $plate->pattern_name,
                    $plate->pattern_description,
                    str_replace("\n", '; ', $plate->applicable_books),
                    $plate->plate_width,
                    $plate->plate_height,
                    $plate->plate_thickness,
                    $plate->material,
                    $plate->usage_count,
                    $plate->max_usage,
                    $plate->usage_rate,
                    $plate->status,
                    $plate->location,
                    $plate->manufacture_date ? $plate->manufacture_date->format('Y-m-d') : '',
                    $plate->last_used_at ? $plate->last_used_at->format('Y-m-d H:i') : '',
                    $plate->next_maintenance_date ? $plate->next_maintenance_date->format('Y-m-d') : '',
                    $plate->orders_count,
                    $plate->maintenances_count,
                    $plate->maintenances->sum('cost'),
                    implode('|', $flags),
                    $plate->remark,
                ]);
            }

            fputcsv($handle, []);
            fputcsv($handle, ['=== 统计摘要 ===']);
            fputcsv($handle, ['导出总数', $plates->count()]);
            fputcsv($handle, ['在用版数', $plates->where('status', '正常')->count()]);
            fputcsv($handle, ['异常版数', $plates->filter(fn($p) => $p->is_warning)->count()]);
            fputcsv($handle, ['累计使用总次数', $plates->sum('usage_count')]);
            fputcsv($handle, ['累计保养总成本', number_format($plates->sum(fn($p) => $p->maintenances->sum('cost')), 2) . ' 元']);
            fputcsv($handle, ['导出时间', Carbon::now()->format('Y-m-d H:i:s')]);

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function versionHistory(Plate $plate)
    {
        $histories = $plate->versionHistories()->orderBy('changed_at', 'desc')->get();
        return view('plates.versions', compact('plate', 'histories'));
    }

    public function changeStatus(Request $request, Plate $plate)
    {
        $validated = $request->validate([
            'target_status' => 'required|max:20',
            'remark' => 'nullable|string|max:500',
        ]);

        $target = $validated['target_status'];
        $transitions = $plate->next_status_transitions;
        $allowed = collect($transitions)->pluck('target')->contains($target);

        if (!$allowed) {
            return back()->withErrors(['error' => "无法从当前状态「{$plate->status}」变更为「{$target}」"]);
        }

        $changeTypeMap = [
            '待审批' => '提交审批',
            '已驳回' => '审批驳回',
            '待归档' => '申请归档',
            '已归档' => '确认归档',
            '正常' => in_array($plate->status, ['待审批']) ? '审批通过' : (in_array($plate->status, ['已归档']) ? '启封复用' : '维护记录'),
        ];

        DB::beginTransaction();
        try {
            $oldSnapshot = $plate->toArray();
            $changeType = $changeTypeMap[$target] ?? '状态变更';

            $plate->update(['status' => $target]);

            $lastVersion = $plate->versionHistories()->first();
            $lastVerNum = 0;
            if ($lastVersion && preg_match('/V(\d+)\.(\d+)/', $lastVersion->version_code, $m)) {
                $lastVerNum = intval($m[1]) * 10 + intval($m[2]);
            }
            $newVerNum = $lastVerNum + 1;
            $major = intval($newVerNum / 10);
            $minor = $newVerNum % 10;
            $batchSuffix = chr(65 + ($plate->versionHistories()->count() % 26));

            $changeDescription = "状态变更：{$plate->status} → {$target}";
            if (!empty($validated['remark'])) {
                $changeDescription .= "。备注：{$validated['remark']}";
            }

            VersionHistory::create([
                'plate_id' => $plate->id,
                'version_code' => "V{$major}.{$minor}",
                'batch_number' => 'B' . date('Ymd') . '-' . $batchSuffix,
                'change_type' => $changeType,
                'change_description' => $changeDescription,
                'operator' => auth()->check() ? auth()->user()->name : '系统管理员',
                'changed_at' => Carbon::now(),
                'plate_width' => $plate->plate_width,
                'plate_height' => $plate->plate_height,
                'material' => $plate->material,
                'snapshot_data' => [
                    'before' => $oldSnapshot,
                    'after' => $plate->toArray(),
                    'changed_fields' => ['status'],
                    'remark' => $validated['remark'] ?? null,
                ],
            ]);

            DB::commit();
            return back()->with('success', "状态已变更为「{$target}」");
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => '状态变更失败：' . $e->getMessage()]);
        }
    }

    public function compareVersions(Request $request, Plate $plate)
    {
        $vh1Id = $request->get('vh1');
        $vh2Id = $request->get('vh2');
        $histories = $plate->versionHistories()->orderBy('changed_at', 'desc')->get();

        if (!$vh1Id || !$vh2Id) {
            return view('plates.compare', [
                'plate' => $plate,
                'histories' => $histories,
                'vh1' => null,
                'vh2' => null,
                'changes' => null,
            ]);
        }

        $vh1 = $plate->versionHistories()->findOrFail($vh1Id);
        $vh2 = $plate->versionHistories()->findOrFail($vh2Id);

        if ($vh1->changed_at->gt($vh2->changed_at)) {
            [$vh1, $vh2] = [$vh2, $vh1];
        }

        $changes = [];
        $fields = [
            'plate_code' => '版号',
            'pattern_name' => '图案名称',
            'pattern_description' => '图案描述',
            'applicable_books' => '适用书名',
            'plate_width' => '宽度(mm)',
            'plate_height' => '高度(mm)',
            'plate_thickness' => '厚度(mm)',
            'material' => '材质',
            'usage_count' => '使用次数',
            'max_usage' => '寿命上限',
            'status' => '状态',
            'location' => '存放位置',
            'manufacture_date' => '制作日期',
            'next_maintenance_date' => '下次保养',
            'remark' => '备注',
        ];

        $data1 = $vh1->snapshot_data['after'] ?? $vh1->snapshot_data['before'] ?? [];
        $data2 = $vh2->snapshot_data['after'] ?? [];

        foreach ($fields as $field => $label) {
            $v1 = $data1[$field] ?? null;
            $v2 = $data2[$field] ?? null;
            if ($v1 != $v2) {
                $changes[] = [
                    'field' => $field,
                    'label' => $label,
                    'before' => $v1,
                    'after' => $v2,
                ];
            }
        }

        return view('plates.compare', compact('plate', 'histories', 'vh1', 'vh2', 'changes'));
    }

    public function review()
    {
        $totalPlates = Plate::count();
        $statusStats = Plate::selectRaw('status, count(*) as count')->groupBy('status')->pluck('count', 'status')->toArray();
        $activePlates = Plate::active()->count();
        $warningPlates = Plate::warning()->count();
        $retiredPlates = Plate::whereIn('status', ['已报废', '已归档'])->count();
        $pendingApproval = Plate::where('status', '待审批')->count();
        $pendingArchive = Plate::where('status', '待归档')->count();

        $totalUsage = Plate::sum('usage_count');
        $totalVersions = \App\Models\VersionHistory::count();
        $totalMaintenances = \App\Models\Maintenance::count();
        $totalMaintenanceCost = \App\Models\Maintenance::sum('cost');
        $totalOrders = \App\Models\Order::count();
        $totalOrderQty = \App\Models\Order::sum('quantity');

        $versionTypeStats = \App\Models\VersionHistory::selectRaw('change_type, count(*) as count')
            ->groupBy('change_type')->orderBy('count', 'desc')->pluck('count', 'change_type')->toArray();

        $recentChanges = \App\Models\VersionHistory::with('plate')
            ->orderBy('changed_at', 'desc')->limit(10)->get();

        $highValuePlates = Plate::withCount('orders')
            ->orderBy('orders_count', 'desc')->limit(5)->get();

        return view('review', compact(
            'totalPlates',
            'statusStats',
            'activePlates',
            'warningPlates',
            'retiredPlates',
            'pendingApproval',
            'pendingArchive',
            'totalUsage',
            'totalVersions',
            'totalMaintenances',
            'totalMaintenanceCost',
            'totalOrders',
            'totalOrderQty',
            'versionTypeStats',
            'recentChanges',
            'highValuePlates'
        ));
    }
}
