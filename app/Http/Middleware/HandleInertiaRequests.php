<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'role_label' => $request->user()->role_label,
                    'department' => $request->user()->department,
                    'phone' => $request->user()->phone,
                    'can_supplement' => $request->user()->canSupplement(),
                    'can_approve' => $request->user()->canApprove(),
                    'can_archive' => $request->user()->canArchive(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'message' => fn () => $request->session()->get('message'),
            ],
            'constants' => [
                'status_labels' => \App\Models\InspectionRecord::STATUS_LABELS,
                'sample_labels' => \App\Models\InspectionRecord::SAMPLE_LABELS,
                'danger_levels' => \App\Models\InspectionRecord::DANGER_LEVELS,
                'roles' => \App\Models\User::ROLE_LABELS,
                'node_names' => \App\Models\RecordNode::NODE_NAMES,
                'action_labels' => \App\Models\RecordNode::ACTION_LABELS,
                'supplement_types' => \App\Models\BusinessSupplement::TYPE_LABELS,
                'attachment_types' => \App\Models\EvidenceAttachment::TYPE_LABELS,
                'abnormal_types' => \App\Models\AbnormalRecord::TYPE_LABELS,
                'abnormal_statuses' => \App\Models\AbnormalRecord::STATUS_LABELS,
                'change_types' => \App\Models\DifferenceComparison::CHANGE_LABELS,
            ],
        ]);
    }
}
