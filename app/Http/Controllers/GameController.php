<?php

namespace App\Http\Controllers;

use App\Models\GameSession;
use App\Models\Level;
use App\Services\GameService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\View\View;

class GameController extends Controller
{
    public function __construct(
        protected GameService $gameService
    ) {}

    public function show(Request $request, GameSession $session): View
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $gameState = $this->gameService->getGameState($session);

        return view('game.show', [
            'session' => $session,
            'gameState' => $gameState,
            'isCompleted' => in_array($session->status, ['completed', 'failed', 'abandoned']),
        ]);
    }

    public function start(Request $request, Level $level): RedirectResponse
    {
        $session = $this->gameService->startGame($request->user(), $level);
        return redirect()->route('game.show', $session);
    }

    public function updateRotor(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $validated = $request->validate([
            'rotor_index' => 'required|integer|min:0',
            'position' => 'required|integer|min:0|max:25',
        ]);

        $result = $this->gameService->updateRotor(
            $session,
            $validated['rotor_index'],
            $validated['position']
        );

        return response()->json($result);
    }

    public function updateSubstitution(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $validated = $request->validate([
            'cipher_char' => 'required|string|size:1|regex:/[A-Za-z]/',
            'plain_char' => 'nullable|string|size:1|regex:/[A-Za-z]/',
        ]);

        $result = $this->gameService->updateSubstitution(
            $session,
            $validated['cipher_char'],
            $validated['plain_char'] ?? null
        );

        return response()->json($result);
    }

    public function updateCaesar(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $validated = $request->validate([
            'shift' => 'required|integer|min:0|max:25',
        ]);

        $result = $this->gameService->updateCaesar(
            $session,
            $validated['shift']
        );

        return response()->json($result);
    }

    public function updateVigenere(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $validated = $request->validate([
            'key' => 'nullable|string|max:30|regex:/^[A-Za-z]*$/',
        ]);

        $result = $this->gameService->updateVigenere(
            $session,
            $validated['key'] ?? ''
        );

        return response()->json($result);
    }

    public function addNote(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:2000',
            'category' => 'nullable|string|in:general,frequency,pattern,rotor',
        ]);

        $result = $this->gameService->addNote(
            $session,
            $validated['content'],
            $validated['category'] ?? 'general'
        );

        return response()->json($result);
    }

    public function useHint(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $result = $this->gameService->useHint($session);
        return response()->json($result);
    }

    public function undo(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $result = $this->gameService->undoAction($session);
        return response()->json($result);
    }

    public function submit(Request $request, GameSession $session): JsonResponse
    {
        if ($session->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => '无权操作'], 403);
        }

        $result = $this->gameService->submitSolution($session);
        return response()->json($result);
    }

    public function abandon(Request $request, GameSession $session): RedirectResponse
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $this->gameService->abandonGame($session);
        return redirect()->route('dashboard');
    }

    public function history(Request $request, GameSession $session): View
    {
        if ($session->user_id !== $request->user()->id) {
            abort(403);
        }

        $histories = $session->actionHistories()
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        $hintUses = $session->hintUses()->orderBy('created_at', 'asc')->get();
        $notes = $session->notes()->orderBy('created_at', 'desc')->get();

        return view('game.history', compact('session', 'histories', 'hintUses', 'notes'));
    }
}
