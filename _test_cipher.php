<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cipher = app(App\Services\CipherService::class);

echo "=== Cipher Service Tests ===\n\n";

// 1. Rotor test
$rotors = $cipher->generateDefaultRotors(1, 42);
$plain = 'HELLO WORLD';
$positions = [7];
$encrypted = $cipher->rotorEncrypt($plain, $positions, $rotors);
$decrypted = $cipher->rotorDecrypt($encrypted, $positions, $rotors);
echo "1. Rotor test: " . ($decrypted === $plain ? 'PASS' : 'FAIL') . "\n";
echo "   Plain:     $plain\n";
echo "   Encrypted: $encrypted\n";
echo "   Decrypted: $decrypted\n\n";

// 2. Caesar test
$caesarEnc = $cipher->caesarEncrypt('HELLO', 3);
$caesarDec = $cipher->caesarDecrypt($caesarEnc, 3);
echo "2. Caesar test: " . ($caesarDec === 'HELLO' ? 'PASS' : 'FAIL') . "\n";
echo "   (shift=3): $caesarEnc -> $caesarDec\n\n";

// 3. Substitution test
$subTable = ['A'=>'Q','B'=>'W','C'=>'E','D'=>'R','E'=>'T','F'=>'Y','G'=>'U','H'=>'I','I'=>'O','J'=>'P','K'=>'A','L'=>'S','M'=>'D','N'=>'F','O'=>'G','P'=>'H','Q'=>'J','R'=>'K','S'=>'L','T'=>'Z','U'=>'X','V'=>'C','W'=>'V','X'=>'B','Y'=>'N','Z'=>'M'];
$subEnc = $cipher->substitutionEncrypt('HELLO', $subTable);
$subDec = $cipher->substitutionDecrypt($subEnc, $subTable);
echo "3. Substitution test: " . ($subDec === 'HELLO' ? 'PASS' : 'FAIL') . "\n";
echo "   HELLO -> $subEnc -> $subDec\n\n";

// 4. Frequency analysis
$freq = $cipher->analyzeFrequency('HELLO WORLD');
echo "4. Frequency analysis: PASS (returned " . count($freq) . " letters, top: " . array_key_first($freq) . ")\n\n";

// 5. Verify solution
$v = $cipher->verifySolution('HELLO WORLD', 'HELLO WORLD');
echo "5. Verify solution exact match: " . ($v ? 'PASS' : 'FAIL') . "\n";
$v2 = $cipher->verifySolution('hello world', 'HELLO WORLD');
echo "6. Verify solution case insensitive: " . ($v2 ? 'PASS' : 'FAIL') . "\n";
$v3 = $cipher->verifySolution('WRONG', 'HELLO');
echo "7. Verify solution wrong: " . (!$v3 ? 'PASS' : 'FAIL') . "\n\n";

// 8. GameService rotor integration test
$game = app(App\Services\GameService::class);
$user = App\Models\User::first();
$rotorLevel = App\Models\Level::where('cipher_type', 'rotor')->first();
if ($rotorLevel && $user) {
    $session = $game->startGame($user, $rotorLevel);
    $targetPositions = $session->rotor_positions;
    echo "8. Rotor level session created: id=" . $session->id . ", positions=" . implode(',', $targetPositions) . "\n";
    // Update rotor with target positions (simulating correct answer)
    $result = $game->updateRotor($session, $targetPositions);
    echo "9. After updateRotor (correct positions):\n";
    echo "   partial_solution present: " . (!empty($result['partial_solution']) ? 'YES' : 'NO') . "\n";
    echo "   partial_solution length: " . strlen($result['partial_solution'] ?? '') . "\n";
    // Submit
    $submitResult = $game->submitSolution($session);
    echo "10. Submit solution: " . ($submitResult['success'] ? 'SUCCESS (pass)' : 'FAILED') . "\n";
    if (!$submitResult['success']) {
        echo "    accuracy: " . ($submitResult['accuracy'] ?? 'N/A') . ", message: " . ($submitResult['message'] ?? '') . "\n";
    }
}

echo "\n=== All tests finished ===\n";
