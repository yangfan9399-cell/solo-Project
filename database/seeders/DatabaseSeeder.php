<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\User;
use App\Services\CipherService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function __construct(
        protected CipherService $cipherService
    ) {}

    public function run(): void
    {
        $this->createUsers();
        $this->createLevels();
    }

    protected function createUsers(): void
    {
        if (!User::where('email', 'player@example.com')->exists()) {
            $user = User::create([
                'name' => '密码破译者',
                'email' => 'player@example.com',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]);

            $user->profiles()->create([
                'display_name' => '博物馆学徒',
                'total_score' => 0,
                'games_played' => 0,
                'games_won' => 0,
                'current_streak' => 0,
                'best_streak' => 0,
                'hints_used_total' => 0,
            ]);
        }

        if (!User::where('email', 'master@example.com')->exists()) {
            $user = User::create([
                'name' => '大师',
                'email' => 'master@example.com',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]);

            $user->profiles()->create([
                'display_name' => '密码大师',
                'total_score' => 15680,
                'games_played' => 42,
                'games_won' => 35,
                'current_streak' => 7,
                'best_streak' => 12,
                'hints_used_total' => 23,
            ]);
        }
    }

    protected function createLevels(): void
    {
        $cipherService = $this->cipherService;

        $levels = [
            [
                'name' => '凯撒的秘密',
                'description' => '古罗马凯撒大帝使用的经典密码，将每个字母向后固定偏移。',
                'difficulty' => 'easy',
                'base_score' => 100,
                'hint_penalty' => 15,
                'time_bonus_threshold' => 120,
                'rotor_count' => 0,
                'cipher_type' => 'caesar',
                'plaintext' => 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG',
                'shift' => 7,
                'hints' => [
                    '凯撒密码将所有字母偏移固定数量的位置。',
                    '尝试使用频率分析，最常见的密文字母很可能对应 E 或 T。',
                    '字母 E 是英文中最常用的字母 (12.7%)，其次是 T (9.1%) 和 A (8.2%)。',
                    '偏移量是 7，即 A→H, B→I...',
                ],
            ],
            [
                'name' => '简单替换',
                'description' => '每个明文字母被唯一的密文字母替换，字母频率分析是关键。',
                'difficulty' => 'easy',
                'base_score' => 200,
                'hint_penalty' => 25,
                'time_bonus_threshold' => 180,
                'rotor_count' => 0,
                'cipher_type' => 'substitution',
                'plaintext' => 'TO BE OR NOT TO BE THAT IS THE QUESTION WHETHER TIS NOBLER IN THE MIND TO SUFFER THE SLINGS AND ARROWS OF OUTRAGEOUS FORTUNE',
                'substitution_key' => [
                    'A' => 'Q', 'B' => 'W', 'C' => 'E', 'D' => 'R', 'E' => 'T',
                    'F' => 'Y', 'G' => 'U', 'H' => 'I', 'I' => 'O', 'J' => 'P',
                    'K' => 'A', 'L' => 'S', 'M' => 'D', 'N' => 'F', 'O' => 'G',
                    'P' => 'H', 'Q' => 'J', 'R' => 'K', 'S' => 'L', 'T' => 'Z',
                    'U' => 'X', 'V' => 'C', 'W' => 'V', 'X' => 'B', 'Y' => 'N', 'Z' => 'M',
                ],
                'hints' => [
                    '替换密码中，字母频率保持不变，只是字母被替换了。',
                    '最常见的密文字母大概率对应 E、T、A 或 O。',
                    '单个字母的单词几乎总是 A 或 I。',
                    '注意 THE、AND、ING 等常见的单词模式。',
                    '密文中最常见的字母是 T，对应明文 E；最常见的双字母是 ZI，对应 TH。',
                ],
            ],
            [
                'name' => '古典挑战',
                'description' => '一段来自经典文学的密文，耐心分析字母频率和常见模式。',
                'difficulty' => 'medium',
                'base_score' => 400,
                'hint_penalty' => 40,
                'time_bonus_threshold' => 300,
                'rotor_count' => 0,
                'cipher_type' => 'substitution',
                'plaintext' => 'IT WAS THE BEST OF TIMES IT WAS THE WORST OF TIMES IT WAS THE AGE OF WISDOM IT WAS THE AGE OF FOOLISHNESS',
                'substitution_key' => [
                    'A' => 'K', 'B' => 'X', 'C' => 'P', 'D' => 'B', 'E' => 'M',
                    'F' => 'J', 'G' => 'V', 'H' => 'C', 'I' => 'R', 'J' => 'Q',
                    'K' => 'Z', 'L' => 'G', 'M' => 'L', 'N' => 'T', 'O' => 'N',
                    'P' => 'F', 'Q' => 'W', 'R' => 'S', 'S' => 'D', 'T' => 'H',
                    'U' => 'Y', 'V' => 'O', 'W' => 'U', 'X' => 'E', 'Y' => 'A', 'Z' => 'I',
                ],
                'hints' => [
                    '注意重复出现的单词模式，IT WAS THE 出现了多次。',
                    '最常见的密文字母 M 对应明文 E。',
                    '三字母词 HCM 出现频率最高，对应 THE。',
                    '两字母词 RC 出现多次，对应 IT。',
                    '完整替换：M=E, H=T, C=H, R=I, N=O, S=S, T=N, L=M, G=L, B=D, K=A, F=P, J=F, V=G, Y=U, U=W, X=B, P=C, O=N, A=K, Z=I, Q=J, E=X, W=U',
                ],
            ],
            [
                'name' => '转轮初试',
                'description' => '使用单转轮加密的消息，调整转轮位置找到正确配置。',
                'difficulty' => 'medium',
                'base_score' => 500,
                'hint_penalty' => 50,
                'time_bonus_threshold' => 240,
                'rotor_count' => 1,
                'cipher_type' => 'rotor',
                'plaintext' => 'WELCOME TO THE CIPHER MUSEUM WHERE HISTORY AND CRYPTOGRAPHY MEET',
                'rotor_seed' => 42,
                'initial_positions' => [0],
                'target_positions' => [17],
                'hints' => [
                    '转轮密码通过转轮的旋转来改变每个字母的替换方式。',
                    '调整转轮位置，观察解密结果中是否出现有意义的单词片段。',
                    '尝试找常见单词如 THE、AND、ING 的模式。',
                    '第一个转轮的初始位置应设为 17。',
                ],
            ],
            [
                'name' => '维吉尼亚的考验',
                'description' => '以法国外交官命名的多表替换密码，关键词是关键。',
                'difficulty' => 'hard',
                'base_score' => 800,
                'hint_penalty' => 80,
                'time_bonus_threshold' => 400,
                'rotor_count' => 0,
                'cipher_type' => 'vigenere',
                'plaintext' => 'CRYPTGRAPHY IS THE PRACTICE AND STUDY OF TECHNIQUES FOR SECURE COMMUNICATION IN THE PRESENCE OF ADVERSARIES',
                'vigenere_key' => 'SECRET',
                'hints' => [
                    '维吉尼亚密码使用关键词进行多表替换，相当于多个凯撒密码交替使用。',
                    '使用 Kasiski 检验或弗里德曼检验来确定关键词长度。',
                    '确定关键词长度后，将密文按长度分组，对每组分别进行频率分析。',
                    '关键词长度是 6。',
                    '关键词是 SECRET。',
                ],
            ],
            [
                'name' => '三转轮之谜',
                'description' => '三转轮加密系统，模拟二战时期的经典密码机。',
                'difficulty' => 'hard',
                'base_score' => 1000,
                'hint_penalty' => 100,
                'time_bonus_threshold' => 500,
                'rotor_count' => 3,
                'cipher_type' => 'rotor',
                'plaintext' => 'IN WORLD WAR TWO GERMANY USED THE ENIGMA MACHINE TO SEND ENCRYPTED MESSAGES THAT WERE EVENTUALLY BROKEN BY ALLIED CODEBREAKERS',
                'rotor_seed' => 1939,
                'initial_positions' => [0, 0, 0],
                'target_positions' => [5, 13, 21],
                'hints' => [
                    '多转轮密码中，每个转轮处理完后会将信号传给下一个转轮。',
                    '每个转轮的转动频率不同，第一个转轮每输入一个字母就转动一格。',
                    '尝试系统性地调整转轮位置，或寻找有意义的解密片段。',
                    '历史提示：Enigma 机器的破解改变了二战的进程。',
                    '三个转轮的位置分别是 5、13、21。',
                ],
            ],
            [
                'name' => '博物馆的终极秘密',
                'description' => '密码博物馆最深处的终极挑战，只有真正的大师才能破译。',
                'difficulty' => 'expert',
                'base_score' => 2000,
                'hint_penalty' => 150,
                'time_bonus_threshold' => 600,
                'rotor_count' => 0,
                'cipher_type' => 'substitution',
                'plaintext' => 'THE HISTORY OF CRYPTOGRAPHY SPANS THOUSANDS OF YEARS FROM ANCIENT CIVILIZATIONS USING SIMPLE SUBSTITUTION CIPHERS TO MODERN COMPUTERS EMPLOYING COMPLEX ALGORITHMS THAT PROTECT OUR DIGITAL COMMUNICATIONS EVERY DAY',
                'substitution_key' => [
                    'A' => 'Z', 'B' => 'Y', 'C' => 'X', 'D' => 'W', 'E' => 'V',
                    'F' => 'U', 'G' => 'T', 'H' => 'S', 'I' => 'R', 'J' => 'Q',
                    'K' => 'P', 'L' => 'O', 'M' => 'N', 'N' => 'M', 'O' => 'L',
                    'P' => 'K', 'Q' => 'J', 'R' => 'I', 'S' => 'H', 'T' => 'G',
                    'U' => 'F', 'V' => 'E', 'W' => 'D', 'X' => 'C', 'Y' => 'B', 'Z' => 'A',
                ],
                'hints' => [
                    '这是一个名为 Atbash 的古老替换密码，字母表被完全反转。',
                    'A 对应 Z，B 对应 Y，C 对应 X，依此类推。',
                    '第一个字母 T 对应 G，第二个 H 对应 S，第三个 E 对应 V。',
                    '完整映射：A↔Z, B↔Y, C↔X, D↔W, E↔V, F↔U, G↔T, H↔S, I↔R, J↔Q, K↔P, L↔O, M↔N',
                ],
            ],
        ];

        foreach ($levels as $index => $levelData) {
            $existing = Level::where('name', $levelData['name'])->first();
            if ($existing) {
                continue;
            }

            $ciphertext = '';
            $rotorConfig = null;
            $frequencyData = null;

            switch ($levelData['cipher_type']) {
                case 'caesar':
                    $ciphertext = $cipherService->caesarEncrypt($levelData['plaintext'], $levelData['shift']);
                    break;

                case 'substitution':
                    $table = $levelData['substitution_key'];
                    $ciphertext = '';
                    foreach (str_split($levelData['plaintext']) as $char) {
                        $upper = strtoupper($char);
                        if (isset($table[$upper])) {
                            $ciphertext .= ctype_upper($char) ? $table[$upper] : strtolower($table[$upper]);
                        } else {
                            $ciphertext .= $char;
                        }
                    }
                    break;

                case 'rotor':
                    $rotors = $cipherService->generateDefaultRotors($levelData['rotor_count'], $levelData['rotor_seed']);
                    $rotorConfig = $rotors;
                    $ciphertext = $cipherService->rotorEncrypt(
                        $levelData['plaintext'],
                        $levelData['target_positions'],
                        $rotors
                    );
                    break;

                case 'vigenere':
                    $ciphertext = $this->vigenereEncrypt($levelData['plaintext'], $levelData['vigenere_key']);
                    break;
            }

            $frequencyData = $cipherService->analyzeFrequency($ciphertext);

            Level::create([
                'name' => $levelData['name'],
                'description' => $levelData['description'],
                'difficulty' => $levelData['difficulty'],
                'base_score' => $levelData['base_score'],
                'hint_penalty' => $levelData['hint_penalty'],
                'time_bonus_threshold' => $levelData['time_bonus_threshold'],
                'rotor_count' => $levelData['rotor_count'],
                'cipher_type' => $levelData['cipher_type'],
                'plaintext' => $levelData['plaintext'],
                'ciphertext' => $ciphertext,
                'rotor_config' => $rotorConfig,
                'solution_hints' => $levelData['hints'],
                'frequency_data' => $frequencyData,
                'is_custom' => false,
                'is_active' => true,
                'sort_order' => $index,
            ]);
        }
    }

    protected function vigenereEncrypt(string $text, string $key): string
    {
        $result = '';
        $keyLength = strlen($key);
        $keyIndex = 0;

        foreach (str_split($text) as $char) {
            if (ctype_alpha($char)) {
                $shift = ord(strtoupper($key[$keyIndex % $keyLength])) - ord('A');
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
