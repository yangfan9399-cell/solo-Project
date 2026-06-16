<?php

namespace App\Services;

use App\Models\GameSession;
use App\Models\Level;
use App\Models\PlayerProfile;
use App\Models\ScoreLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ScoreService
{
    public function __construct(
        protected CipherService $cipherService
    ) {}

    public function calculateFinalScore(GameSession $session): array
    {
        $level = $session->level;
        $baseScore = $level->base_score;

        $hintPenalty = $session->hints_used * $level->hint_penalty;

        $durationBonus = 0;
        if ($level->time_bonus_threshold && $session->duration_seconds) {
            if ($session->duration_seconds <= $level->time_bonus_threshold) {
                $timeRatio = 1 - ($session->duration_seconds / $level->time_bonus_threshold);
                $durationBonus = (int)($baseScore * 0.3 * $timeRatio);
            }
        }

        $difficultyMultiplier = match ($level->difficulty) {
            'easy' => 1.0,
            'medium' => 1.5,
            'hard' => 2.0,
            'expert' => 3.0,
            default => 1.0,
        };

        $solutionAccuracy = 0;
        if ($session->solution_verified) {
            $verification = $this->cipherService->verifySolution(
                $session->partial_solution ?? '',
                $level->plaintext
            );
            $solutionAccuracy = $verification['accuracy'];
        }

        $accuracyMultiplier = $solutionAccuracy / 100;

        $subtotal = (int)(($baseScore + $durationBonus) * $difficultyMultiplier * $accuracyMultiplier);
        $finalScore = max(0, $subtotal - $hintPenalty);

        $streakBonus = 0;
        if ($session->status === 'completed') {
            $profile = $session->playerProfile;
            if ($profile && $profile->current_streak > 0) {
                $streakBonus = min(100, $profile->current_streak * 5);
            }
        }

        $finalScore += $streakBonus;

        return [
            'base_score' => $baseScore,
            'hint_penalty' => $hintPenalty,
            'hints_used' => $session->hints_used,
            'duration_bonus' => $durationBonus,
            'difficulty_multiplier' => $difficultyMultiplier,
            'solution_accuracy' => $solutionAccuracy,
            'accuracy_multiplier' => $accuracyMultiplier,
            'streak_bonus' => $streakBonus,
            'subtotal' => $subtotal,
            'final_score' => $finalScore,
            'breakdown' => [
                '基础分' => $baseScore,
                '难度加成 (x' . $difficultyMultiplier . ')' => (int)($baseScore * ($difficultyMultiplier - 1)),
                '时间奖励' => $durationBonus,
                '准确率加成' => $solutionAccuracy < 100 ? "(-" . (100 - $solutionAccuracy) . "%)" : '完美!',
                '提示扣分' => -$hintPenalty,
                '连胜奖励' => $streakBonus,
            ],
        ];
    }

    public function applyScore(GameSession $session): int
    {
        $scoreData = $this->calculateFinalScore($session);
        $finalScore = $scoreData['final_score'];

        DB::transaction(function () use ($session, $finalScore, $scoreData) {
            $session->current_score = $finalScore;
            $session->save();

            $profile = $session->playerProfile;
            if ($profile) {
                $profile->total_score += $finalScore;
                $profile->games_played += 1;

                if ($session->status === 'completed') {
                    $profile->games_won += 1;
                    $profile->current_streak += 1;
                    if ($profile->current_streak > $profile->best_streak) {
                        $profile->best_streak = $profile->current_streak;
                    }
                } elseif ($session->status === 'failed' || $session->status === 'abandoned') {
                    $profile->current_streak = 0;
                }

                $profile->hints_used_total += $session->hints_used;
                $profile->save();
            }

            ScoreLog::create([
                'user_id' => $session->user_id,
                'game_session_id' => $session->id,
                'score_change' => $finalScore,
                'reason' => $session->status === 'completed' ? '关卡通关' : ($session->status === 'failed' ? '关卡失败' : '放弃关卡'),
                'metadata' => $scoreData,
                'created_at' => now(),
            ]);
        });

        return $finalScore;
    }

    public function calculateHintPenalty(Level $level, int $hintsUsed): int
    {
        return $level->hint_penalty * $hintsUsed;
    }

    public function getLeaderboard(int $limit = 10): array
    {
        return PlayerProfile::with('user')
            ->orderByDesc('total_score')
            ->orderBy('games_played', 'desc')
            ->limit($limit)
            ->get()
            ->map(fn($p) => [
                'rank' => 0,
                'name' => $p->display_name,
                'user_name' => $p->user?->name,
                'total_score' => $p->total_score,
                'games_played' => $p->games_played,
                'games_won' => $p->games_won,
                'win_rate' => $p->win_rate,
                'best_streak' => $p->best_streak,
            ])
            ->toArray();
    }

    public function getUserStats(User $user): array
    {
        $profile = $user->profiles()->first();
        if (!$profile) {
            return [
                'total_score' => 0,
                'games_played' => 0,
                'games_won' => 0,
                'win_rate' => 0,
                'current_streak' => 0,
                'best_streak' => 0,
                'hints_used_total' => 0,
                'average_score_per_game' => 0,
            ];
        }

        return [
            'total_score' => $profile->total_score,
            'games_played' => $profile->games_played,
            'games_won' => $profile->games_won,
            'win_rate' => $profile->win_rate,
            'current_streak' => $profile->current_streak,
            'best_streak' => $profile->best_streak,
            'hints_used_total' => $profile->hints_used_total,
            'average_score_per_game' => $profile->games_played > 0
                ? round($profile->total_score / $profile->games_played, 1)
                : 0,
        ];
    }
}
