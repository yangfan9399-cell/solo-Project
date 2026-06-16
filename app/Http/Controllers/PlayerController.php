<?php

namespace App\Http\Controllers;

use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;

class PlayerController extends Controller
{
    public function index()
    {
        $players = Player::orderBy('total_score', 'desc')->get();
        $currentPlayerId = Session::get('player_id');
        return view('players.index', compact('players', 'currentPlayerId'));
    }

    public function create()
    {
        $avatars = ['🕵️', '🧠', '🔍', '🎭', '🦉', '🐱', '🦊', '🐻', '🦁', '🐯'];
        return view('players.create', compact('avatars'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50|unique:players,name',
            'avatar' => 'required|string|max:5',
        ]);

        $player = Player::create($validated);
        Session::put('player_id', $player->id);

        return redirect()->route('home')->with('success', "欢迎，{$player->name}！档案已创建。");
    }

    public function select(Player $player)
    {
        Session::put('player_id', $player->id);
        return redirect()->route('home')->with('success', "已切换到侦探：{$player->name}");
    }

    public function logout()
    {
        Session::forget('player_id');
        return redirect()->route('players.index')->with('info', '已退出当前侦探档案');
    }

    public function show(Player $player)
    {
        $recentGames = $player->games()
            ->with('level')
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return view('players.show', compact('player', 'recentGames'));
    }
}
