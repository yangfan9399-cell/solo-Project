<?php

namespace App\Http\Controllers;

use App\Models\ClueCard;
use App\Models\DistributedClue;
use App\Models\Game;
use App\Models\Level;
use App\Models\OperationHistory;
use App\Models\Player;
use App\Models\PlayerQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Carbon\Carbon;

class GameController extends Controller
{
    public function home()
    {
        $playerId = Session::get('player_id');
        if (!$playerId) {
            return redirect()->route('players.index')->with('warning', '请先选择或创建侦探档案');
        }

        $player = Player::findOrFail($playerId);
        $levels = Level::withCount('clueCards')->get();
        $activeGames = Game::where('player_id', $playerId)
            ->where('status', 'playing')
            ->with('level')
            ->get();

        return view('home', compact('player', 'levels', 'activeGames'));
    }

    public function levels()
    {
        $levels = Level::withCount('clueCards', 'requiredClues')->get();
        return view('levels.index', compact('levels'));
    }

    public function showLevel(Level $level)
    {
        $clueCount = $level->clueCards()->count();
        $requiredCount = $level->requiredClues()->count();
        return view('levels.show', compact('level', 'clueCount', 'requiredCount'));
    }

    public function startGame(Level $level)
    {
        $playerId = Session::get('player_id');
        if (!$playerId) {
            return redirect()->route('players.index')->with('warning', '请先选择或创建侦探档案');
        }

        $existingActiveGame = Game::where('player_id', $playerId)
            ->where('level_id', $level->id)
            ->where('status', 'playing')
            ->first();

        if ($existingActiveGame) {
            return redirect()->route('games.play', $existingActiveGame)
                ->with('info', '你有一局正在进行的游戏，已恢复进度');
        }

        $game = Game::create([
            'player_id' => $playerId,
            'level_id' => $level->id,
            'status' => 'playing',
            'score' => 0,
            'current_round' => 1,
            'started_at' => Carbon::now(),
        ]);

        $this->recordOperation($game, 'start_game', [
            'level_id' => $level->id,
            'level_title' => $level->title,
        ]);

        return redirect()->route('games.play', $game)->with('success', '游戏开始！祝你好运，侦探！');
    }

    public function play(Game $game)
    {
        $this->authorizeGameAccess($game);

        if (!$game->isPlaying()) {
            return redirect()->route('games.result', $game);
        }

        $player = $game->player;
        $level = $game->level;
        $distributedClues = $game->getDistributedClueCards();
        $undistributedClues = $game->getUndistributedClueCards();
        $playerQuestions = $game->playerQuestions()->orderBy('round_number', 'desc')->get();
        $operationHistory = $game->getUndoableOperations();
        $requiredFound = $game->getRequiredCluesFoundCount();
        $requiredTotal = $level->requiredClues->count();
        $canSolve = $game->canSolve();
        $missedClues = $game->getMissedRequiredClues();

        $spoilerRisk = $this->calculateCurrentSpoilerRisk($game);

        return view('games.play', compact(
            'game',
            'player',
            'level',
            'distributedClues',
            'undistributedClues',
            'playerQuestions',
            'operationHistory',
            'requiredFound',
            'requiredTotal',
            'canSolve',
            'missedClues',
            'spoilerRisk'
        ));
    }

    public function distributeClue(Request $request, Game $game)
    {
        $this->authorizeGameAccess($game);
        if (!$game->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $validated = $request->validate([
            'clue_card_id' => 'required|exists:clue_cards,id',
            'reason' => 'nullable|string|max:255',
        ]);

        $clueCard = ClueCard::findOrFail($validated['clue_card_id']);

        $alreadyDistributed = DistributedClue::where('game_id', $game->id)
            ->where('clue_card_id', $clueCard->id)
            ->exists();

        if ($alreadyDistributed) {
            return response()->json(['error' => '该线索已发放'], 400);
        }

        DB::beginTransaction();
        try {
            $stateBefore = [
                'clues_distributed' => $game->clues_distributed,
                'spoiler_risk' => $game->spoiler_risk_accumulated,
            ];

            $distributedClue = DistributedClue::create([
                'game_id' => $game->id,
                'clue_card_id' => $clueCard->id,
                'distributed_at_round' => $game->current_round,
                'distributed_at' => Carbon::now(),
                'distributed_reason' => $validated['reason'] ?? '主持发放',
            ]);

            $game->clues_distributed += 1;
            $game->spoiler_risk_accumulated += $clueCard->spoiler_risk;
            $game->save();

            $this->recordOperation($game, 'distribute_clue', [
                'clue_card_id' => $clueCard->id,
                'clue_title' => $clueCard->title,
                'spoiler_risk' => $clueCard->spoiler_risk,
            ], $stateBefore);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "线索「{$clueCard->title}」已发放",
                'clue' => [
                    'id' => $clueCard->id,
                    'title' => $clueCard->title,
                    'content' => $clueCard->content,
                    'icon' => $clueCard->icon,
                    'category' => $clueCard->getCategoryLabel(),
                    'importance' => $clueCard->importance_score,
                ],
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => '发放线索失败: ' . $e->getMessage()], 500);
        }
    }

    public function askQuestion(Request $request, Game $game)
    {
        $this->authorizeGameAccess($game);
        if (!$game->isPlaying()) {
            return response()->json(['error' => '游戏已结束'], 400);
        }

        $validated = $request->validate([
            'question' => 'required|string|max:500',
        ]);

        $question = $validated['question'];
        $analysis = $this->analyzeQuestion($question, $game);

        DB::beginTransaction();
        try {
            $stateBefore = [
                'questions_asked' => $game->questions_asked,
            ];

            $playerQuestion = PlayerQuestion::create([
                'game_id' => $game->id,
                'question' => $question,
                'host_response' => $analysis['response'],
                'round_number' => $game->current_round,
                'is_relevant' => $analysis['is_relevant'],
                'triggers_clue' => $analysis['triggers_clue'],
                'related_clue_id' => $analysis['related_clue_id'],
                'relevance_score' => $analysis['relevance_score'],
            ]);

            $game->questions_asked += 1;
            $game->save();

            $this->recordOperation($game, 'ask_question', [
                'question_id' => $playerQuestion->id,
                'question' => $question,
                'is_relevant' => $analysis['is_relevant'],
            ], $stateBefore);

            DB::commit();

            return response()->json([
                'success' => true,
                'question' => $question,
                'response' => $analysis['response'],
                'is_relevant' => $analysis['is_relevant'],
                'relevance_score' => $analysis['relevance_score'],
                'round' => $game->current_round,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => '记录提问失败: ' . $e->getMessage()], 500);
        }
    }

    public function advanceRound(Game $game)
    {
        $this->authorizeGameAccess($game);
        if (!$game->isPlaying()) {
            return redirect()->route('games.play', $game)->with('error', '游戏已结束');
        }

        $stateBefore = [
            'current_round' => $game->current_round,
        ];

        $game->advanceRound();

        $this->recordOperation($game, 'advance_round', [
            'from_round' => $stateBefore['current_round'],
            'to_round' => $game->current_round,
        ], $stateBefore);

        return redirect()->route('games.play', $game)->with('info', "已进入第 {$game->current_round} 轮");
    }

    public function undo(Game $game, OperationHistory $operation)
    {
        $this->authorizeGameAccess($game);
        if (!$game->isPlaying() || !$operation->can_undo || $operation->game_id !== $game->id) {
            return back()->with('error', '无法撤销该操作');
        }

        DB::beginTransaction();
        try {
            switch ($operation->operation_type) {
                case 'distribute_clue':
                    $clueId = $operation->payload['clue_card_id'] ?? null;
                    if ($clueId) {
                        DistributedClue::where('game_id', $game->id)
                            ->where('clue_card_id', $clueId)
                            ->delete();
                        $game->clues_distributed = max(0, $game->clues_distributed - 1);
                        $clue = ClueCard::find($clueId);
                        if ($clue) {
                            $game->spoiler_risk_accumulated = max(0, $game->spoiler_risk_accumulated - $clue->spoiler_risk);
                        }
                    }
                    break;
                case 'ask_question':
                    $questionId = $operation->payload['question_id'] ?? null;
                    if ($questionId) {
                        PlayerQuestion::where('id', $questionId)->delete();
                        $game->questions_asked = max(0, $game->questions_asked - 1);
                    }
                    break;
                case 'advance_round':
                    $game->current_round = max(1, $game->current_round - 1);
                    break;
            }

            $operation->can_undo = false;
            $operation->save();
            $game->save();

            $this->recordOperation($game, 'undo', [
                'undone_operation_id' => $operation->id,
                'undone_operation_type' => $operation->operation_type,
            ], null, false);

            DB::commit();
            return back()->with('success', '已撤销上一步操作');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', '撤销失败: ' . $e->getMessage());
        }
    }

    public function submitSolve(Request $request, Game $game)
    {
        $this->authorizeGameAccess($game);
        if (!$game->isPlaying()) {
            return redirect()->route('games.result', $game);
        }

        $validated = $request->validate([
            'accusation' => 'required|string|max:1000',
        ]);

        $isWin = $this->evaluateSolution($validated['accusation'], $game);
        $score = $game->calculateScore();
        $finalAnalysis = $this->generateFinalAnalysis($game, $validated['accusation'], $isWin);

        DB::beginTransaction();
        try {
            $game->status = $isWin ? 'won' : 'lost';
            $game->score = $score;
            $game->ended_at = Carbon::now();
            $game->final_analysis = $finalAnalysis;
            $game->save();

            $game->player->addScore($score, $isWin);

            DB::commit();
            return redirect()->route('games.result', $game);
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', '提交答案失败: ' . $e->getMessage());
        }
    }

    public function result(Game $game)
    {
        $this->authorizeGameAccess($game);
        if ($game->isPlaying()) {
            return redirect()->route('games.play', $game);
        }

        $level = $game->level;
        $player = $game->player;
        $missedClues = $game->getMissedRequiredClues();
        $distributedClues = $game->getDistributedClueCards();
        $totalQuestions = $game->playerQuestions->count();
        $relevantQuestions = $game->playerQuestions->where('is_relevant', true)->count();

        return view('games.result', compact(
            'game',
            'level',
            'player',
            'missedClues',
            'distributedClues',
            'totalQuestions',
            'relevantQuestions'
        ));
    }

    public function scoreEstimate(Game $game)
    {
        $this->authorizeGameAccess($game);
        return response()->json([
            'score' => $game->calculateScore(),
        ]);
    }

    public function abandon(Game $game)
    {
        $this->authorizeGameAccess($game);
        if (!$game->isPlaying()) {
            return back();
        }

        $game->status = 'abandoned';
        $game->ended_at = Carbon::now();
        $game->final_analysis = '玩家主动放弃了本局游戏。';
        $game->save();

        return redirect()->route('home')->with('info', '已放弃本局游戏');
    }

    private function authorizeGameAccess(Game $game): void
    {
        $playerId = Session::get('player_id');
        if (!$playerId || $game->player_id !== $playerId) {
            abort(403, '你无权访问此游戏');
        }
    }

    private function recordOperation(Game $game, string $type, array $payload, ?array $stateBefore = null, bool $canUndo = true): OperationHistory
    {
        $sequence = OperationHistory::where('game_id', $game->id)->max('sequence_number') ?? 0;

        $stateAfter = null;
        if ($stateBefore !== null) {
            $stateAfter = [
                'clues_distributed' => $game->clues_distributed,
                'questions_asked' => $game->questions_asked,
                'current_round' => $game->current_round,
                'spoiler_risk' => $game->spoiler_risk_accumulated,
            ];
        }

        return OperationHistory::create([
            'game_id' => $game->id,
            'operation_type' => $type,
            'payload' => $payload,
            'state_before' => $stateBefore,
            'state_after' => $stateAfter,
            'sequence_number' => $sequence + 1,
            'can_undo' => $canUndo,
        ]);
    }

    private function analyzeQuestion(string $question, Game $game): array
    {
        $question = mb_strtolower($question);
        $undistributedClues = $game->getUndistributedClueCards();

        $relevanceScore = 0;
        $matchedClue = null;
        $isRelevant = false;
        $triggersClue = false;
        $relatedClueId = null;

        $keywords = [
            '谁' => 20, '凶手' => 40, '为什么' => 15, '动机' => 35,
            '怎么' => 15, '如何' => 15, '方法' => 25, '手段' => 30,
            '时间' => 10, '什么时候' => 10, '不在场' => 30,
            '证据' => 25, '线索' => 20, '发现' => 15,
            '钱' => 20, '债务' => 30, '遗嘱' => 30,
            '钥匙' => 25, '房间' => 15, '密室' => 35,
            '画' => 30, '监控' => 25, '保险库' => 30,
            '披肩' => 35, '壁炉' => 30, '脚印' => 30,
            '手腕' => 25, '伤口' => 25, '匕首' => 20,
        ];

        foreach ($keywords as $keyword => $score) {
            if (str_contains($question, $keyword)) {
                $relevanceScore += $score;
                $isRelevant = true;
            }
        }

        foreach ($undistributedClues as $clue) {
            $clueText = mb_strtolower($clue->title . ' ' . $clue->content);
            $matchCount = 0;
            $questionWords = preg_split('/[，。？！、\s]+/u', $question, -1, PREG_SPLIT_NO_EMPTY);

            foreach ($questionWords as $word) {
                if (mb_strlen($word) >= 2 && str_contains($clueText, $word)) {
                    $matchCount++;
                }
            }

            if ($matchCount >= 1 && $relevanceScore >= 30) {
                $matchedClue = $clue;
                break;
            }
        }

        $responses = [
            'high' => [
                '这是一个非常关键的问题。根据我的记录，确实有些东西值得注意...',
                '你问到了点子上！让我仔细想想...或许有些线索可以帮助你。',
                '好问题！这正是案件的核心所在。继续深挖这个方向。',
            ],
            'medium' => [
                '这个问题有些意思。我建议你多关注现场的细节。',
                '嗯，让我想想...你的推理方向可能是对的，但还需要更多证据。',
                '这个角度值得探讨。你可以尝试从相关人员那里获取更多信息。',
            ],
            'low' => [
                '这个问题目前看来与案件关联不大。',
                '我觉得你可能想偏了。让我们把注意力放回更重要的线索上。',
                '暂时没有发现与这个问题相关的信息。',
            ],
        ];

        $level = 'low';
        if ($relevanceScore >= 60) {
            $level = 'high';
        } elseif ($relevanceScore >= 25) {
            $level = 'medium';
        }

        $response = $responses[$level][array_rand($responses[$level])];

        if ($matchedClue && $relevanceScore >= 40) {
            $triggersClue = true;
            $relatedClueId = $matchedClue->id;
            $response .= " 说到这里，我想起了一件事——或许「{$matchedClue->title}」这条线索能给你一些启发。";
        }

        $relevanceScore = min(100, $relevanceScore);

        return [
            'response' => $response,
            'is_relevant' => $isRelevant,
            'relevance_score' => $relevanceScore,
            'triggers_clue' => $triggersClue,
            'related_clue_id' => $relatedClueId,
        ];
    }

    private function evaluateSolution(string $accusation, Game $game): bool
    {
        $accusation = mb_strtolower($accusation);
        $truth = mb_strtolower($game->level->truth_reveal);

        $score = 0;

        if ($game->level_id == 1) {
            if (str_contains($accusation, '艾玛')) $score += 30;
            if (str_contains($accusation, '侄女')) $score += 20;
            if (str_contains($accusation, '赌债') || str_contains($accusation, '钱')) $score += 15;
            if (str_contains($accusation, '遗嘱')) $score += 15;
            if (str_contains($accusation, '壁炉') || str_contains($accusation, '密道')) $score += 15;
            if (str_contains($accusation, '披肩')) $score += 10;
            if (str_contains($accusation, '钥匙')) $score += 10;
        } elseif ($game->level_id == 2) {
            if (str_contains($accusation, '林晓月')) $score += 25;
            if (str_contains($accusation, '策展人')) $score += 15;
            if (str_contains($accusation, '赵磊')) $score += 15;
            if (str_contains($accusation, '保安')) $score += 10;
            if (str_contains($accusation, '修复室')) $score += 15;
            if (str_contains($accusation, '转账') || str_contains($accusation, '钱')) $score += 15;
            if (str_contains($accusation, '门禁卡')) $score += 10;
            if (str_contains($accusation, '监控')) $score += 10;
        }

        $requiredClueRatio = $game->getRequiredCluesFoundCount() / max(1, $game->level->requiredClues->count());
        $score *= (0.5 + 0.5 * $requiredClueRatio);

        return $score >= 50;
    }

    private function generateFinalAnalysis(Game $game, string $accusation, bool $isWin): string
    {
        $lines = [];

        if ($isWin) {
            $lines[] = "🎉 恭喜！你成功破获了这个案件！";
            $lines[] = "";
            $lines[] = "你的推理：「{$accusation}」";
            $lines[] = "";
            $lines[] = "案件分析：";
        } else {
            $lines[] = "😔 很遗憾，你的推理还不够准确。";
            $lines[] = "";
            $lines[] = "你的推理：「{$accusation}」";
            $lines[] = "";
            $lines[] = "案件真相：";
        }

        $lines[] = $game->level->truth_reveal;
        $lines[] = "";

        $missed = $game->getMissedRequiredClues();
        if ($missed->count() > 0) {
            $lines[] = "⚠️ 你遗漏了以下关键线索：";
            foreach ($missed as $clue) {
                $lines[] = "  • {$clue->icon} {$clue->title}";
            }
            $lines[] = "";
        }

        $found = $game->getDistributedClueCards()->where('is_required', true);
        if ($found->count() > 0) {
            $lines[] = "✅ 你成功发现了以下关键线索：";
            foreach ($found as $clue) {
                $lines[] = "  • {$clue->icon} {$clue->title}";
            }
        }

        return implode("\n", $lines);
    }

    private function calculateCurrentSpoilerRisk(Game $game): array
    {
        $total = $game->spoiler_risk_accumulated;
        $level = 'low';
        $label = '✅ 剧透风险低';
        $color = 'green';

        if ($total >= 150) {
            $level = 'critical';
            $label = '🔴 剧透风险极高！';
            $color = 'red';
        } elseif ($total >= 100) {
            $level = 'high';
            $label = '🔶 剧透风险较高';
            $color = 'orange';
        } elseif ($total >= 50) {
            $level = 'medium';
            $label = '⚠️ 剧透风险中等';
            $color = 'yellow';
        }

        return [
            'total' => $total,
            'level' => $level,
            'label' => $label,
            'color' => $color,
        ];
    }
}
