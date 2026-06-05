<?php

namespace App\Http\Controllers;

use App\Models\WasteBatch;
use App\Models\WasteCategory;
use App\Models\StorageLocation;
use App\Models\ProcessHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class WasteBatchController extends Controller
{
    public function index(): Response
    {
        $batches = WasteBatch::with(['wasteCategory', 'storageLocation', 'createdBy'])
            ->latest()
            ->paginate(10);

        return Inertia::render('WasteBatches/Index', [
            'batches' => $batches,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('WasteBatches/Create', [
            'categories' => WasteCategory::where('is_active', true)->get(),
            'locations' => StorageLocation::where('is_active', true)->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'waste_category_id' => 'required|exists:waste_categories,id',
            'storage_location_id' => 'required|exists:storage_locations,id',
            'weight' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'production_date' => 'required|date',
        ]);

        $batchNumber = 'WB' . date('Ymd') . str_pad(WasteBatch::count() + 1, 4, '0', STR_PAD_LEFT);

        $batch = WasteBatch::create([
            'batch_number' => $batchNumber,
            ...$validated,
            'status' => 'stored',
            'created_by' => auth()->id(),
        ]);

        ProcessHistory::create([
            'processable_type' => WasteBatch::class,
            'processable_id' => $batch->id,
            'action' => '暂存登记',
            'from_status' => null,
            'to_status' => 'stored',
            'remark' => '危废暂存登记完成',
            'performed_by' => auth()->id(),
        ]);

        return redirect()->route('waste-batches.show', $batch)
            ->with('success', '危废暂存登记成功');
    }

    public function show(WasteBatch $wasteBatch): Response
    {
        $wasteBatch->load([
            'wasteCategory',
            'storageLocation',
            'createdBy',
            'transferRequest.carrier',
            'transferRequest.manifestForm',
            'transferRequest.review.reviewedBy',
            'processHistories.performedBy',
        ]);

        return Inertia::render('WasteBatches/Show', [
            'batch' => $wasteBatch,
        ]);
    }
}
