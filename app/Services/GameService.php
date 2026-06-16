<?php

namespace App\Services;

use App\Models\ActionHistory;
use App\Models\GameNote;
use App\Models\GameSession;
use App\Models\HintUse;
use App\Models\Level;
use App\Models\PlayerProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class GameService
{
    public function __construct(
        protected CipherService $cipherService,
        protected ScoreService $scoreService
    ) {}

    public function startGame(User $user, Level $level): GameSession
    {
        $profile = $user->profiles()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'display_name' => $user->name,
                'total_score' => 0,
                'games_played' => 0,
                'games_won' => 0,
            ]
        );

        $initialRotorPositions = $level->rotor_count > 0
            ? array_fill(0, $level->rotor_count, 0)
            : null;

        $session = GameSession::create([
            'user_id' => $user->id,
            'level_id' => $level->id,
            'player_profile_id' => $profile->id,
            'status' => 'in_progress',
            'current_score' => 0,
            'penalty_score' => 0,
            'hints_used' => 0,
            'rotor_positions' => $initialRotorPositions,
            'substitution_table' => [],
            'partial_solution' => '',
            'metadata' => [
                'caesar_shift' => 0,
                'vigenere_key' => '',
            ],
            'started_at' => now(),
        ]);

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'rotor_change',
            'before_state' => null,
            'after_state' => ['rotor_positions' => $initialRotorPositions],
            'description' => '开始新局：' . $level->name,
            'score_change' => 0,
            'created_at' => now(),
        ]);

        return $session;
    }

    public function updateRotor(GameSession $session, int $rotorIndex, int $newPosition): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $positions = $session->rotor_positions ?? [];
        $oldPositions = $positions;

        if ($rotorIndex >= 0 && $rotorIndex < count($positions)) {
            $positions[$rotorIndex] = (($newPosition % 26) + 26) % 26;
        }

        $session->rotor_positions = $positions;

        $level = $session->level;
        if ($level->cipher_type === 'rotor' && $level->rotor_config) {
            $decrypted = $this->cipherService->rotorDecrypt(
                $level->ciphertext,
                $positions,
                $level->rotor_config
            );
            $session->partial_solution = $decrypted;
        }

        $session->save();

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'rotor_change',
            'before_state' => ['rotor_positions' => $oldPositions, 'partial_solution' => $session->getOriginal('partial_solution')],
            'after_state' => ['rotor_positions' => $positions, 'partial_solution' => $session->partial_solution],
            'description' => "调整转轮 {$rotorIndex} 位置为 {$positions[$rotorIndex]}",
            'score_change' => 0,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'rotor_positions' => $positions,
            'partial_solution' => $session->partial_solution,
        ];
    }

    public function updateCaesar(GameSession $session, int $shift): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $shift = (($shift % 26) + 26) % 26;
        $oldShift = $session->metadata['caesar_shift'] ?? 0;
        $oldPartial = $session->partial_solution;

        $level = $session->level;
        $decrypted = $this->cipherService->caesarDecrypt($level->ciphertext, $shift);

        $metadata = $session->metadata ?? [];
        $metadata['caesar_shift'] = $shift;
        $session->metadata = $metadata;
        $session->partial_solution = $decrypted;
        $session->save();

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'caesar_shift',
            'before_state' => ['caesar_shift' => $oldShift, 'partial_solution' => $oldPartial],
            'after_state' => ['caesar_shift' => $shift, 'partial_solution' => $decrypted],
            'description' => "调整凯撒偏移量为 {$shift}",
            'score_change' => 0,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'caesar_shift' => $shift,
            'partial_solution' => $decrypted,
        ];
    }

    public function updateVigenere(GameSession $session, string $key): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $key = strtoupper(preg_replace('/[^A-Za-z]/', '', $key));
        $oldKey = $session->metadata['vigenere_key'] ?? '';
        $oldPartial = $session->partial_solution;

        $level = $session->level;

        if (empty($key)) {
            $decrypted = '';
        } else {
            $decrypted = $this->cipherService->vigenereDecrypt($level->ciphertext, $key);
        }

        $metadata = $session->metadata ?? [];
        $metadata['vigenere_key'] = $key;
        $session->metadata = $metadata;
        $session->partial_solution = $decrypted;
        $session->save();

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'vigenere_key',
            'before_state' => ['vigenere_key' => $oldKey, 'partial_solution' => $oldPartial],
            'after_state' => ['vigenere_key' => $key, 'partial_solution' => $decrypted],
            'description' => "更新维吉尼亚关键词为 {$key}",
            'score_change' => 0,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'vigenere_key' => $key,
            'partial_solution' => $decrypted,
        ];
    }

    public function updateSubstitution(GameSession $session, string $cipherChar, ?string $plainChar): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $cipherChar = strtoupper($cipherChar);
        $table = $session->substitution_table ?? [];
        $oldTable = $table;

        if ($plainChar === null || $plainChar === '') {
            unset($table[$cipherChar]);
            $actionType = 'substitution_remove';
            $description = "移除替换：{$cipherChar}";
        } else {
            $plainChar = strtoupper($plainChar);

            foreach ($table as $key => $value) {
                if ($value === $plainChar && $key !== $cipherChar) {
                    unset($table[$key]);
                }
            }

            $table[$cipherChar] = $plainChar;
            $actionType = 'substitution_add';
            $description = "设置替换：{$cipherChar} → {$plainChar}";
        }

        $session->substitution_table = $table;
        $session->save();

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => $actionType,
            'before_state' => ['substitution_table' => $oldTable],
            'after_state' => ['substitution_table' => $table],
            'description' => $description,
            'score_change' => 0,
            'created_at' => now(),
        ]);

        $decrypted = $this->cipherService->substitutionDecrypt(
            $session->level->ciphertext,
            $table
        );
        $session->partial_solution = $decrypted;
        $session->save();

        return [
            'success' => true,
            'substitution_table' => $table,
            'partial_solution' => $decrypted,
        ];
    }

    public function addNote(GameSession $session, string $content, string $category = 'general'): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $note = GameNote::create([
            'game_session_id' => $session->id,
            'content' => $content,
            'category' => $category,
        ]);

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'note_add',
            'before_state' => null,
            'after_state' => ['note_id' => $note->id, 'category' => $category],
            'description' => '添加笔记：' . mb_substr($content, 0, 30),
            'score_change' => 0,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'note' => $note,
        ];
    }

    public function useHint(GameSession $session): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $level = $session->level;
        $hints = $level->solution_hints ?? [];
        $hintIndex = $session->hints_used;

        if ($hintIndex >= count($hints)) {
            return ['success' => false, 'message' => '没有更多提示可用'];
        }

        $hintContent = $hints[$hintIndex];
        $penalty = $level->hint_penalty;

        $session->hints_used += 1;
        $session->penalty_score += $penalty;
        $session->save();

        HintUse::create([
            'game_session_id' => $session->id,
            'hint_index' => $hintIndex,
            'hint_content' => $hintContent,
            'penalty_applied' => $penalty,
            'created_at' => now(),
        ]);

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'hint_use',
            'before_state' => ['hints_used' => $hintIndex, 'penalty_score' => $session->penalty_score - $penalty],
            'after_state' => ['hints_used' => $session->hints_used, 'penalty_score' => $session->penalty_score],
            'description' => "使用提示 #{$hintIndex} (扣 {$penalty} 分)",
            'score_change' => -$penalty,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'hint_index' => $hintIndex,
            'hint_content' => $hintContent,
            'penalty' => $penalty,
            'hints_remaining' => count($hints) - $session->hints_used,
        ];
    }

    public function undoAction(GameSession $session): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $lastAction = $session->actionHistories()
            ->whereNotIn('action_type', ['undo', 'submit'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$lastAction) {
            return ['success' => false, 'message' => '没有可撤销的操作'];
        }

        switch ($lastAction->action_type) {
            case 'rotor_change':
                if (isset($lastAction->before_state['rotor_positions'])) {
                    $session->rotor_positions = $lastAction->before_state['rotor_positions'];
                    $level = $session->level;
                    if ($level->cipher_type === 'rotor' && $level->rotor_config) {
                        $decrypted = $this->cipherService->rotorDecrypt(
                            $level->ciphertext,
                            $session->rotor_positions,
                            $level->rotor_config
                        );
                        $session->partial_solution = $decrypted;
                    }
                }
                break;
            case 'substitution_add':
            case 'substitution_remove':
                if (isset($lastAction->before_state['substitution_table'])) {
                    $session->substitution_table = $lastAction->before_state['substitution_table'];
                    $decrypted = $this->cipherService->substitutionDecrypt(
                        $session->level->ciphertext,
                        $session->substitution_table
                    );
                    $session->partial_solution = $decrypted;
                }
                break;
            case 'hint_use':
                if ($session->hints_used > 0) {
                    $session->hints_used -= 1;
                    $penalty = $lastAction->score_change;
                    $session->penalty_score = max(0, $session->penalty_score + $penalty);
                }
                break;
            case 'caesar_shift':
                if (isset($lastAction->before_state['caesar_shift'])) {
                    $metadata = $session->metadata ?? [];
                    $metadata['caesar_shift'] = $lastAction->before_state['caesar_shift'];
                    $session->metadata = $metadata;
                    if (isset($lastAction->before_state['partial_solution'])) {
                        $session->partial_solution = $lastAction->before_state['partial_solution'];
                    }
                }
                break;
            case 'vigenere_key':
                if (isset($lastAction->before_state['vigenere_key'])) {
                    $metadata = $session->metadata ?? [];
                    $metadata['vigenere_key'] = $lastAction->before_state['vigenere_key'];
                    $session->metadata = $metadata;
                    if (isset($lastAction->before_state['partial_solution'])) {
                        $session->partial_solution = $lastAction->before_state['partial_solution'];
                    }
                }
                break;
        }

        $session->save();

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'undo',
            'before_state' => ['undo_target' => $lastAction->action_type],
            'after_state' => null,
            'description' => "撤销操作：{$lastAction->description}",
            'score_change' => 0,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'undone_action' => $lastAction->action_type,
            'session_state' => [
                'rotor_positions' => $session->rotor_positions,
                'substitution_table' => $session->substitution_table,
                'hints_used' => $session->hints_used,
                'penalty_score' => $session->penalty_score,
                'partial_solution' => $session->partial_solution,
            ],
        ];
    }

    public function submitSolution(GameSession $session): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $level = $session->level;

        if ($level->cipher_type === 'rotor' && $level->rotor_config && $session->rotor_positions) {
            $decrypted = $this->cipherService->rotorDecrypt(
                $level->ciphertext,
                $session->rotor_positions,
                $level->rotor_config
            );
            $session->partial_solution = $decrypted;
            $session->save();
        }

        $userSolution = $session->partial_solution ?? '';

        $verification = $this->cipherService->verifySolution($userSolution, $level->plaintext);

        $session->duration_seconds = $session->elapsed_seconds;
        $session->solution_verified = $verification['correct'];

        if ($verification['correct']) {
            $session->status = 'completed';
            $session->completed_at = now();
        } else {
            $session->status = 'failed';
            $session->abandoned_at = now();
        }

        $session->save();

        $finalScore = $this->scoreService->applyScore($session);

        ActionHistory::create([
            'game_session_id' => $session->id,
            'action_type' => 'submit',
            'before_state' => ['solution' => $userSolution],
            'after_state' => ['verification' => $verification, 'final_score' => $finalScore],
            'description' => $verification['correct']
                ? "恭喜通关！最终得分：{$finalScore}"
                : "解答错误（准确率 {$verification['accuracy']}%），得分：{$finalScore}",
            'score_change' => $finalScore,
            'created_at' => now(),
        ]);

        return [
            'success' => true,
            'passed' => $verification['correct'],
            'accuracy' => $verification['accuracy'],
            'final_score' => $finalScore,
            'score_breakdown' => $this->scoreService->calculateFinalScore($session),
            'correct_plaintext' => $verification['correct'] ? null : $level->plaintext,
        ];
    }

    public function abandonGame(GameSession $session): array
    {
        if ($session->status !== 'in_progress') {
            return ['success' => false, 'message' => '游戏已结束'];
        }

        $session->status = 'abandoned';
        $session->abandoned_at = now();
        $session->duration_seconds = $session->elapsed_seconds;
        $session->save();

        $finalScore = $this->scoreService->applyScore($session);

        return [
            'success' => true,
            'final_score' => $finalScore,
        ];
    }

    public function getGameState(GameSession $session): array
    {
        $level = $session->level;

        return [
            'session' => $session,
            'level' => $level,
            'rotor_positions' => $session->rotor_positions,
            'rotor_configs' => $level->rotor_config,
            'substitution_table' => $session->substitution_table ?? [],
            'partial_solution' => $session->partial_solution,
            'ciphertext' => $level->ciphertext,
            'hints_used' => $session->hints_used,
            'hints_total' => count($level->solution_hints ?? []),
            'current_penalty' => $session->penalty_score,
            'frequency_analysis' => $this->cipherService->analyzeFrequency($level->ciphertext),
            'bigrams' => $this->cipherService->analyzeNGrams($level->ciphertext, 2),
            'trigrams' => $this->cipherService->analyzeNGrams($level->ciphertext, 3),
            'patterns' => $level->cipher_type !== 'caesar'
                ? $this->cipherService->findRepeatedPatterns($level->ciphertext)
                : [],
            'index_of_coincidence' => $this->cipherService->calculateIndexOfCoincidence($level->ciphertext),
            'notes' => $session->notes()->orderBy('created_at', 'desc')->get(),
            'elapsed_seconds' => $session->status === 'in_progress' ? $session->elapsed_seconds : $session->duration_seconds,
        ];
    }
}
