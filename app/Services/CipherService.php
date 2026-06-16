<?php

namespace App\Services;

class CipherService
{
    public const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    public const ENGLISH_FREQUENCY = [
        'A' => 8.167, 'B' => 1.492, 'C' => 2.782, 'D' => 4.253, 'E' => 12.702,
        'F' => 2.228, 'G' => 2.015, 'H' => 6.094, 'I' => 6.966, 'J' => 0.153,
        'K' => 0.772, 'L' => 4.025, 'M' => 2.406, 'N' => 6.749, 'O' => 7.507,
        'P' => 1.929, 'Q' => 0.095, 'R' => 5.987, 'S' => 6.327, 'T' => 9.056,
        'U' => 2.758, 'V' => 0.978, 'W' => 2.360, 'X' => 0.150, 'Y' => 1.974,
        'Z' => 0.074,
    ];

    public function analyzeFrequency(string $text): array
    {
        $text = strtoupper(preg_replace('/[^A-Za-z]/', '', $text));
        $total = strlen($text);
        $counts = array_fill_keys(str_split(self::ALPHABET), 0);

        foreach (str_split($text) as $char) {
            if (isset($counts[$char])) {
                $counts[$char]++;
            }
        }

        $frequencies = [];
        foreach ($counts as $char => $count) {
            $frequencies[$char] = [
                'count' => $count,
                'percentage' => $total > 0 ? round($count / $total * 100, 2) : 0,
                'expected' => self::ENGLISH_FREQUENCY[$char],
                'difference' => $total > 0 ? round(($count / $total * 100) - self::ENGLISH_FREQUENCY[$char], 2) : -self::ENGLISH_FREQUENCY[$char],
            ];
        }

        uasort($frequencies, fn($a, $b) => $b['count'] - $a['count']);

        return $frequencies;
    }

    public function findRepeatedPatterns(string $text, int $minLength = 3): array
    {
        $text = strtoupper(preg_replace('/[^A-Za-z]/', '', $text));
        $patterns = [];
        $len = strlen($text);

        for ($size = $minLength; $size <= min(8, floor($len / 2)); $size++) {
            for ($i = 0; $i <= $len - $size * 2; $i++) {
                $pattern = substr($text, $i, $size);
                $positions = [];
                $pos = $i;

                while (($pos = strpos($text, $pattern, $pos)) !== false) {
                    $positions[] = $pos;
                    $pos++;
                }

                if (count($positions) >= 2) {
                    $distances = [];
                    for ($j = 1; $j < count($positions); $j++) {
                        $distances[] = $positions[$j] - $positions[$j - 1];
                    }
                    $patterns[$pattern] = [
                        'count' => count($positions),
                        'positions' => $positions,
                        'distances' => $distances,
                        'gcd' => $this->gcdArray($distances),
                    ];
                }
            }
        }

        uasort($patterns, fn($a, $b) => $b['count'] - $a['count']);
        return array_slice($patterns, 0, 20, true);
    }

    public function analyzeNGrams(string $text, int $n = 2): array
    {
        $text = strtoupper(preg_replace('/[^A-Za-z]/', '', $text));
        $ngrams = [];
        $len = strlen($text);

        for ($i = 0; $i <= $len - $n; $i++) {
            $ngram = substr($text, $i, $n);
            if (!isset($ngrams[$ngram])) {
                $ngrams[$ngram] = 0;
            }
            $ngrams[$ngram]++;
        }

        arsort($ngrams);
        return array_slice($ngrams, 0, 15, true);
    }

    public function caesarEncrypt(string $text, int $shift): string
    {
        return $this->shiftText($text, $shift);
    }

    public function caesarDecrypt(string $text, int $shift): string
    {
        return $this->shiftText($text, -$shift);
    }

    private function shiftText(string $text, int $shift): string
    {
        $shift = (($shift % 26) + 26) % 26;
        $result = '';

        foreach (str_split($text) as $char) {
            if (ctype_alpha($char)) {
                $base = ctype_upper($char) ? ord('A') : ord('a');
                $result .= chr((ord($char) - $base + $shift) % 26 + $base);
            } else {
                $result .= $char;
            }
        }

        return $result;
    }

    public function substitutionDecrypt(string $text, array $table): string
    {
        $result = '';

        foreach (str_split($text) as $char) {
            $upperChar = strtoupper($char);
            if (isset($table[$upperChar]) && $table[$upperChar] !== null) {
                $result .= ctype_upper($char) ? $table[$upperChar] : strtolower($table[$upperChar]);
            } elseif (ctype_alpha($char)) {
                $result .= ctype_upper($char) ? '?' : '?';
            } else {
                $result .= $char;
            }
        }

        return $result;
    }

    public function rotorEncrypt(string $text, array $rotorPositions, array $rotorConfigs): string
    {
        $result = '';
        $pos = $rotorPositions;

        foreach (str_split($text) as $char) {
            if (ctype_alpha($char)) {
                $upper = strtoupper($char);
                $idx = ord($upper) - ord('A');

                for ($i = 0; $i < count($rotorConfigs); $i++) {
                    $rotor = $rotorConfigs[$i];
                    $shift = $pos[$i] ?? 0;
                    $wiring = $rotor['wiring'];
                    $idx = (strpos($wiring, self::ALPHABET[($idx + $shift) % 26])) % 26;
                }

                $result .= ctype_upper($char) ? self::ALPHABET[$idx] : strtolower(self::ALPHABET[$idx]);

                $pos[0] = ($pos[0] + 1) % 26;
                for ($i = 0; $i < count($pos) - 1; $i++) {
                    if ($pos[$i] === 0) {
                        $pos[$i + 1] = ($pos[$i + 1] + 1) % 26;
                    }
                }
            } else {
                $result .= $char;
            }
        }

        return $result;
    }

    public function rotorDecrypt(string $text, array $rotorPositions, array $rotorConfigs): string
    {
        $result = '';
        $pos = $rotorPositions;

        foreach (str_split($text) as $char) {
            if (ctype_alpha($char)) {
                $upper = strtoupper($char);
                $idx = ord($upper) - ord('A');

                for ($i = count($rotorConfigs) - 1; $i >= 0; $i--) {
                    $rotor = $rotorConfigs[$i];
                    $shift = $pos[$i] ?? 0;
                    $wiring = $rotor['wiring'];
                    $tempIdx = strpos(self::ALPHABET, $wiring[$idx]);
                    $idx = (($tempIdx - $shift) % 26 + 26) % 26;
                }

                $result .= ctype_upper($char) ? self::ALPHABET[$idx] : strtolower(self::ALPHABET[$idx]);

                $pos[0] = ($pos[0] + 1) % 26;
                for ($i = 0; $i < count($pos) - 1; $i++) {
                    if ($pos[$i] === 0) {
                        $pos[$i + 1] = ($pos[$i + 1] + 1) % 26;
                    }
                }
            } else {
                $result .= $char;
            }
        }

        return $result;
    }

    public function vigenereDecrypt(string $text, string $key): string
    {
        $result = '';
        $keyLength = strlen($key);
        $keyIndex = 0;

        foreach (str_split($text) as $char) {
            if (ctype_alpha($char)) {
                $shift = ord(strtoupper($key[$keyIndex % $keyLength])) - ord('A');
                $base = ctype_upper($char) ? ord('A') : ord('a');
                $result .= chr((ord($char) - $base - $shift + 26) % 26 + $base);
                $keyIndex++;
            } else {
                $result .= $char;
            }
        }

        return $result;
    }

    public function calculateIndexOfCoincidence(string $text): float
    {
        $text = strtoupper(preg_replace('/[^A-Za-z]/', '', $text));
        $n = strlen($text);

        if ($n <= 1) {
            return 0.0;
        }

        $freq = count_chars($text, 1);
        $sum = 0;
        foreach ($freq as $count) {
            $sum += $count * ($count - 1);
        }

        return round($sum / ($n * ($n - 1)), 4);
    }

    private function gcdArray(array $numbers): int
    {
        if (empty($numbers)) {
            return 0;
        }

        $gcd = $numbers[0];
        for ($i = 1; $i < count($numbers); $i++) {
            $gcd = $this->gcd($gcd, $numbers[$i]);
        }

        return $gcd;
    }

    private function gcd(int $a, int $b): int
    {
        while ($b != 0) {
            $temp = $b;
            $b = $a % $b;
            $a = $temp;
        }
        return $a;
    }

    public function verifySolution(string $userSolution, string $correctSolution): array
    {
        $userClean = strtoupper(preg_replace('/[^A-Za-z]/', '', $userSolution));
        $correctClean = strtoupper(preg_replace('/[^A-Za-z]/', '', $correctSolution));

        if ($userClean === $correctClean) {
            return ['correct' => true, 'accuracy' => 100];
        }

        $len = max(strlen($userClean), strlen($correctClean));
        if ($len === 0) {
            return ['correct' => false, 'accuracy' => 0];
        }

        $matches = 0;
        $minLen = min(strlen($userClean), strlen($correctClean));
        for ($i = 0; $i < $minLen; $i++) {
            if ($userClean[$i] === $correctClean[$i]) {
                $matches++;
            }
        }

        return [
            'correct' => false,
            'accuracy' => round($matches / $len * 100, 2),
            'correct_length' => strlen($correctClean),
            'user_length' => strlen($userClean),
        ];
    }

    public function generateRotorConfig(int $seed = null): array
    {
        if ($seed !== null) {
            mt_srand($seed);
        }

        $alphabet = str_split(self::ALPHABET);
        shuffle($alphabet);

        return [
            'wiring' => implode('', $alphabet),
            'notch' => mt_rand(0, 25),
        ];
    }

    public function generateDefaultRotors(int $count, int $baseSeed = 42): array
    {
        $rotors = [];
        for ($i = 0; $i < $count; $i++) {
            $rotors[] = $this->generateRotorConfig($baseSeed + $i);
        }
        return $rotors;
    }
}
