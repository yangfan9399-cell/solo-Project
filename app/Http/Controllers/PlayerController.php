<?php

namespace App\Http\Controllers;

use App\Models\Level;
use App\Services\ScoreService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class PlayerController extends Controller
{
    public function __construct(
        protected ScoreService $scoreService
    ) {}

    public function dashboard(Request $request): View
    {
        $user = $request->user();
        $stats = $this->scoreService->getUserStats($user);

        $officialLevels = Level::where('is_active', true)
            ->where('is_custom', false)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        $customLevels = Level::where('is_active', true)
            ->where('is_custom', true)
            ->where('created_by', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $levels = $officialLevels->merge($customLevels);

        $recentGames = $user->games()
            ->with('level')
            ->orderBy('started_at', 'desc')
            ->limit(10)
            ->get();

        $inProgressGames = $user->games()
            ->where('status', 'in_progress')
            ->with('level')
            ->orderBy('started_at', 'desc')
            ->get();

        $leaderboard = $this->scoreService->getLeaderboard(10);
        foreach ($leaderboard as $idx => &$entry) {
            $entry['rank'] = $idx + 1;
        }

        return view('dashboard', compact(
            'stats',
            'levels',
            'recentGames',
            'inProgressGames',
            'leaderboard',
            'user'
        ));
    }

    public function profile(Request $request): View
    {
        $user = $request->user();
        $profile = $user->profiles()->first();
        $stats = $this->scoreService->getUserStats($user);

        $allGames = $user->games()
            ->with('level')
            ->orderBy('started_at', 'desc')
            ->paginate(20);

        return view('profile', compact('user', 'profile', 'stats', 'allGames'));
    }
}
