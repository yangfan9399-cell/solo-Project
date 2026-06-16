<?php

namespace App\Http\Controllers;

use App\Models\Level;
use App\Services\CipherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CustomLevelController extends Controller
{
    public function __construct(
        protected CipherService $cipherService
    ) {}

    public function index(Request $request): View
    {
        $customLevels = Level::where('is_custom', true)
            ->where('created_by', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return view('custom-levels.index', compact('customLevels'));
    }

    public function create(Request $request): View
    {
        $cipherTypes = [
            'caesar' => '凯撒密码 (Caesar Cipher)',
            'substitution' => '单表替换密码 (Monoalphabetic Substitution)',
            'vigenere' => '维吉尼亚密码 (Vigenère Cipher)',
            'rotor' => '转轮密码 (Rotor Cipher)',
        ];

        $difficulties = [
            'easy' => '入门 (Easy)',
            'medium' => '进阶 (Medium)',
            'hard' => '困难 (Hard)',
            'expert' => '专家 (Expert)',
        ];

        return view('custom-levels.create', compact('cipherTypes', 'difficulties'));
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'difficulty' => 'required|in:easy,medium,hard,expert',
            'base_score' => 'required|integer|min:10|max:10000',
            'hint_penalty' => 'required|integer|min:5|max:500',
            'time_bonus_threshold' => 'nullable|integer|min:30',
            'cipher_type' => 'required|in:caesar,substitution,vigenere,rotor',
            'plaintext' => 'required|string|min:10|max:5000',
            'caesar_shift' => 'nullable|integer|min:1|max:25',
            'substitution_key' => 'nullable|string',
            'vigenere_key' => 'nullable|string|min:3|max:20|alpha',
            'rotor_count' => 'nullable|integer|min:1|max:5',
            'rotor_seed' => 'nullable|integer',
            'rotor_target_positions' => 'nullable|string',
            'hints' => 'nullable|string',
        ]);

        $plaintext = strtoupper(preg_replace('/[^A-Za-z\s]/', '', $validated['plaintext']));
        $ciphertext = '';
        $rotorConfig = null;

        switch ($validated['cipher_type']) {
            case 'caesar':
                $shift = $validated['caesar_shift'] ?? rand(1, 25);
                $ciphertext = $this->cipherService->caesarEncrypt($plaintext, $shift);
                break;

            case 'substitution':
                $key = $validated['substitution_key'] ?? null;
                $table = $this->parseSubstitutionKey($key);
                $ciphertext = '';
                foreach (str_split($plaintext) as $char) {
                    $upper = strtoupper($char);
                    if (isset($table[$upper])) {
                        $ciphertext .= ctype_upper($char) ? $table[$upper] : strtolower($table[$upper]);
                    } else {
                        $ciphertext .= $char;
                    }
                }
                break;

            case 'vigenere':
                $vkey = $validated['vigenere_key'] ?? 'SECRET';
                $ciphertext = $this->vigenereEncrypt($plaintext, strtoupper($vkey));
                break;

            case 'rotor':
                $rotorCount = $validated['rotor_count'] ?? 1;
                $rotorSeed = $validated['rotor_seed'] ?? rand(1, 9999);
                $rotors = $this->cipherService->generateDefaultRotors($rotorCount, $rotorSeed);
                $rotorConfig = $rotors;

                $positions = [];
                if (!empty($validated['rotor_target_positions'])) {
                    $positions = array_map('intval', explode(',', $validated['rotor_target_positions']));
                }
                if (count($positions) < $rotorCount) {
                    for ($i = count($positions); $i < $rotorCount; $i++) {
                        $positions[] = rand(0, 25);
                    }
                }
                $positions = array_slice($positions, 0, $rotorCount);

                $ciphertext = $this->cipherService->rotorEncrypt($plaintext, $positions, $rotors);
                break;
        }

        $hints = [];
        if (!empty($validated['hints'])) {
            $hints = array_values(array_filter(array_map('trim', explode("\n", $validated['hints']))));
        }

        $level = Level::create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'difficulty' => $validated['difficulty'],
            'base_score' => $validated['base_score'],
            'hint_penalty' => $validated['hint_penalty'],
            'time_bonus_threshold' => $validated['time_bonus_threshold'],
            'rotor_count' => $validated['cipher_type'] === 'rotor' ? ($validated['rotor_count'] ?? 1) : 0,
            'cipher_type' => $validated['cipher_type'],
            'plaintext' => $plaintext,
            'ciphertext' => $ciphertext,
            'rotor_config' => $rotorConfig,
            'solution_hints' => $hints,
            'frequency_data' => $this->cipherService->analyzeFrequency($ciphertext),
            'is_custom' => true,
            'created_by' => $request->user()->id,
            'is_active' => true,
            'sort_order' => 999,
        ]);

        return redirect()->route('custom-levels.show', $level)
            ->with('success', '自定义谜题已创建！');
    }

    public function show(Request $request, Level $level): View
    {
        if ($level->is_custom && $level->created_by !== $request->user()->id) {
            abort(403);
        }

        return view('custom-levels.show', compact('level'));
    }

    public function encrypt(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'cipher_type' => 'required|in:caesar,substitution,vigenere,rotor',
            'plaintext' => 'required|string|min:5',
            'caesar_shift' => 'nullable|integer|min:1|max:25',
            'substitution_key' => 'nullable|string',
            'vigenere_key' => 'nullable|string|min:3|max:20|alpha',
            'rotor_count' => 'nullable|integer|min:1|max:5',
            'rotor_seed' => 'nullable|integer',
            'rotor_target_positions' => 'nullable|string',
        ]);

        $plaintext = strtoupper(preg_replace('/[^A-Za-z\s]/', '', $validated['plaintext']));
        $ciphertext = '';
        $rotorConfig = null;

        switch ($validated['cipher_type']) {
            case 'caesar':
                $shift = $validated['caesar_shift'] ?? rand(1, 25);
                $ciphertext = $this->cipherService->caesarEncrypt($plaintext, $shift);
                break;

            case 'substitution':
                $table = $this->parseSubstitutionKey($validated['substitution_key'] ?? null);
                $ciphertext = '';
                foreach (str_split($plaintext) as $char) {
                    $upper = strtoupper($char);
                    if (isset($table[$upper])) {
                        $ciphertext .= ctype_upper($char) ? $table[$upper] : strtolower($table[$upper]);
                    } else {
                        $ciphertext .= $char;
                    }
                }
                break;

            case 'vigenere':
                $vkey = $validated['vigenere_key'] ?? 'SECRET';
                $ciphertext = $this->vigenereEncrypt($plaintext, strtoupper($vkey));
                break;

            case 'rotor':
                $rotorCount = $validated['rotor_count'] ?? 1;
                $rotorSeed = $validated['rotor_seed'] ?? rand(1, 9999);
                $rotors = $this->cipherService->generateDefaultRotors($rotorCount, $rotorSeed);
                $rotorConfig = $rotors;

                $positions = [];
                if (!empty($validated['rotor_target_positions'])) {
                    $positions = array_map('intval', explode(',', $validated['rotor_target_positions']));
                }
                if (count($positions) < $rotorCount) {
                    for ($i = count($positions); $i < $rotorCount; $i++) {
                        $positions[] = rand(0, 25);
                    }
                }
                $positions = array_slice($positions, 0, $rotorCount);

                $ciphertext = $this->cipherService->rotorEncrypt($plaintext, $positions, $rotors);
                break;
        }

        return response()->json([
            'success' => true,
            'plaintext' => $plaintext,
            'ciphertext' => $ciphertext,
            'frequency_analysis' => $this->cipherService->analyzeFrequency($ciphertext),
        ]);
    }

    public function destroy(Request $request, Level $level): RedirectResponse
    {
        if (!$level->is_custom || $level->created_by !== $request->user()->id) {
            abort(403);
        }

        $level->delete();

        return redirect()->route('custom-levels.index')
            ->with('success', '自定义谜题已删除。');
    }

    protected function parseSubstitutionKey(?string $key): array
    {
        $alphabet = str_split(CipherService::ALPHABET);

        if (empty($key)) {
            $shuffled = $alphabet;
            shuffle($shuffled);
            return array_combine($alphabet, $shuffled);
        }

        $key = strtoupper(preg_replace('/[^A-Za-z]/', '', $key));
        $table = [];
        $used = [];
        $keyChars = str_split($key);
        $keyIndex = 0;

        foreach ($alphabet as $letter) {
            while ($keyIndex < count($keyChars) && in_array($keyChars[$keyIndex], $used)) {
                $keyIndex++;
            }
            if ($keyIndex < count($keyChars)) {
                $table[$letter] = $keyChars[$keyIndex];
                $used[] = $keyChars[$keyIndex];
                $keyIndex++;
            } else {
                foreach ($alphabet as $l) {
                    if (!in_array($l, $used)) {
                        $table[$letter] = $l;
                        $used[] = $l;
                        break;
                    }
                }
            }
        }

        return $table;
    }

    protected function vigenereEncrypt(string $text, string $key): string
    {
        $result = '';
        $keyLength = strlen($key);
        $keyIndex = 0;

        foreach (str_split($text) as $char) {
            if (ctype_alpha($char)) {
                $shift = ord($key[$keyIndex % $keyLength]) - ord('A');
                $base = ctype_upper($char) ? ord('A') : ord('a');
                $result .= chr((ord($char) - $base + $shift) % 26 + $base);
                $keyIndex++;
            } else {
                $result .= $char;
            }
        }

        return $result;
    }
}
