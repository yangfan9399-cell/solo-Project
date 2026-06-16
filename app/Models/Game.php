<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'player_id',
        'level_id',
        'status',
        'score',
        'current_round',
        'questions_asked',
        'clues_distributed',
        'spoiler_risk_accumulated',
        'started_at',
        'ended_at',
        'final_analysis',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    public function player(): BelongsTo
    {
        return $this->belongsTo(Player::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function distributedClues(): HasMany
    {
        return $this->hasMany(DistributedClue::class);
    }

    public function playerQuestions(): HasMany
    {
        return $this->hasMany(PlayerQuestion::class);
    }

    public function operationHistories(): HasMany
    {
        return $this->hasMany(OperationHistory::class)->orderBy('sequence_number');
    }

    public function getUndoableOperations(): Collection
    {
        return $this->operationHistories()
            ->where('can_undo', true)
            ->orderByDesc('sequence_number')
            ->get();
    }

    public function getDistributedClueCards(): Collection
    {
        return ClueCard::whereIn('id', $this->distributedClues->pluck('clue_card_id'))->get();
    }

    public function getUndistributedClueCards(): Collection
    {
        $distributedIds = $this->distributedClues->pluck('clue_card_id');
        return ClueCard::where('level_id', $this->level_id)
            ->whereNotIn('id', $distributedIds)
            ->orderBy('reveal_order')
            ->get();
    }

    public function getRequiredCluesFoundCount(): int
    {
        $requiredClueIds = $this->level->requiredClues->pluck('id');
        return $this->distributedClues->whereIn('clue_card_id', $requiredClueIds)->count();
    }

    public function getMissedRequiredClues(): Collection
    {
        $requiredClueIds = $this->level->requiredClues->pluck('id');
        $distributedIds = $this->distributedClues->pluck('clue_card_id');
        $missedIds = $requiredClueIds->diff($distributedIds);
        return ClueCard::whereIn('id', $missedIds)->get();
    }

    public function getElapsedMinutes(): int
    {
        return Carbon::now()->diffInMinutes($this->started_at);
    }

    public function getRemainingMinutes(): int
    {
        $elapsed = $this->getElapsedMinutes();
        $remaining = $this->level->time_limit_minutes - $elapsed;
        return max(0, $remaining);
    }

    public function isTimeUp(): bool
    {
        return $this->getRemainingMinutes() <= 0;
    }

    public function canSolve(): bool
    {
        return $this->getRequiredCluesFoundCount() >= $this->level->required_clues_to_solve;
    }

    public function calculateScore(): int
    {
        $score = 0;

        $distributedRequired = $this->getRequiredCluesFoundCount();
        $totalRequired = $this->level->requiredClues->count();
        if ($totalRequired > 0) {
            $score += ($distributedRequired / $totalRequired) * 50;
        }

        $totalClues = $this->level->clueCards->count();
        $distributedClues = $this->distributedClues->count();
        if ($totalClues > 0) {
            $score += ($distributedClues / $totalClues) * 20;
        }

        $relevantQuestions = $this->playerQuestions->where('is_relevant', true)->count();
        $totalQuestions = max(1, $this->playerQuestions->count());
        $questionQuality = ($relevantQuestions / $totalQuestions) * 15;
        $score += $questionQuality;

        $spoilerPenalty = min(15, $this->spoiler_risk_accumulated / 10);
        $score -= $spoilerPenalty;

        if (!$this->isTimeUp()) {
            $timeBonus = max(0, 15 - ($this->getElapsedMinutes() / 2));
            $score += $timeBonus;
        }

        return max(0, min(100, (int) round($score)));
    }

    public function isWin(): bool
    {
        return $this->status === 'won';
    }

    public function isPlaying(): bool
    {
        return $this->status === 'playing';
    }

    public function advanceRound(): void
    {
        $this->current_round += 1;
        $this->save();
    }

    public function addSpoilerRisk(int $risk): void
    {
        $this->spoiler_risk_accumulated += $risk;
        $this->save();
    }
}
