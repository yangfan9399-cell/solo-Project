<?php

namespace App\Http\Controllers;

use App\Models\Decoration;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DecorationController extends Controller
{
    public function index()
    {
        $stats = [
            'total' => Decoration::count(),
            'pending' => Decoration::where('status', 'pending')->count(),
            'submitted' => Decoration::where('status', 'submitted')->count(),
            'engineer_approved' => Decoration::where('status', 'engineer_approved')->count(),
            'fire_approved' => Decoration::where('status', 'fire_approved')->count(),
            'approved' => Decoration::where('status', 'approved')->count(),
            'rejected' => Decoration::where('status', 'rejected')->count(),
        ];

        $recent = Decoration::orderBy('created_at', 'desc')->take(5)->get();

        return Inertia::render('Dashboard', compact('stats', 'recent'));
    }

    public function applications()
    {
        $applications = Decoration::orderBy('created_at', 'desc')->get();

        return Inertia::render('Applications', compact('applications'));
    }

    public function show($id)
    {
        $application = Decoration::findOrFail($id);

        return Inertia::render('ApplicationDetail', compact('application'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'merchant_name' => 'required|string|max:255',
            'merchant_type' => 'required|string|max:100',
            'floor' => 'required|string|max:50',
            'shop_number' => 'required|string|max:50',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'construction_scope' => 'nullable|string',
            'hoarding_type' => 'required|string|max:100',
            'hoarding_width' => 'required|numeric|min:0',
            'hoarding_height' => 'required|numeric|min:0',
            'hoarding_description' => 'nullable|string',
            'fire_materials' => 'nullable|string',
            'fire_materials_complete' => 'boolean',
            'restricted_time' => 'nullable|string',
            'time_conflict' => 'boolean',
            'hoarding_dimension_ok' => 'boolean',
        ]);

        $decoration = Decoration::create($validated);
        $decoration->update(['status' => 'submitted']);

        return redirect()->route('application.show', $decoration->id);
    }

    public function engineerReview(Request $request, $id)
    {
        $request->validate([
            'approved' => 'required|boolean',
            'comment' => 'nullable|string',
        ]);

        $decoration = Decoration::findOrFail($id);

        if ($request->approved) {
            $decoration->update([
                'status' => 'engineer_approved',
                'engineer_comment' => $request->comment,
                'engineer_reviewed_at' => now(),
            ]);
        } else {
            $decoration->update([
                'status' => 'rejected',
                'engineer_comment' => $request->comment,
                'engineer_reviewed_at' => now(),
                'reject_reason' => $request->comment,
            ]);
        }

        return redirect()->route('application.show', $id);
    }

    public function fireReview(Request $request, $id)
    {
        $request->validate([
            'approved' => 'required|boolean',
            'comment' => 'nullable|string',
        ]);

        $decoration = Decoration::findOrFail($id);

        if ($request->approved) {
            $decoration->update([
                'status' => 'fire_approved',
                'fire_comment' => $request->comment,
                'fire_reviewed_at' => now(),
            ]);
        } else {
            $decoration->update([
                'status' => 'rejected',
                'fire_comment' => $request->comment,
                'fire_reviewed_at' => now(),
                'reject_reason' => $request->comment,
            ]);
        }

        return redirect()->route('application.show', $id);
    }

    public function managerApproval(Request $request, $id)
    {
        $request->validate([
            'approved' => 'required|boolean',
            'comment' => 'nullable|string',
        ]);

        $decoration = Decoration::findOrFail($id);

        if (!$decoration->fire_materials_complete) {
            return back()->with('error', '消防材料缺失，禁止开工');
        }

        if ($request->approved) {
            $decoration->update([
                'status' => 'approved',
                'manager_comment' => $request->comment,
                'manager_approved_at' => now(),
            ]);
        } else {
            $decoration->update([
                'status' => 'rejected',
                'manager_comment' => $request->comment,
                'manager_approved_at' => now(),
                'reject_reason' => $request->comment,
            ]);
        }

        return redirect()->route('application.show', $id);
    }

    public function destroy($id)
    {
        $decoration = Decoration::findOrFail($id);
        $decoration->delete();

        return redirect()->route('applications');
    }

    public function kanban()
    {
        $byFloor = Decoration::select('floor', \DB::raw('count(*) as count'))
            ->groupBy('floor')
            ->get();

        $byType = Decoration::select('merchant_type', \DB::raw('count(*) as count'))
            ->groupBy('merchant_type')
            ->get();

        $byRejectReason = Decoration::where('status', 'rejected')
            ->select('reject_reason', \DB::raw('count(*) as count'))
            ->groupBy('reject_reason')
            ->get();

        $byStatus = Decoration::select('status', \DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        $applications = Decoration::all();

        return Inertia::render('Kanban', compact('byFloor', 'byType', 'byRejectReason', 'byStatus', 'applications'));
    }
}
