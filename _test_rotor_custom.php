<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cipher = app(App\Services\CipherService::class);
$game = app(App\Services\GameService::class);

echo "=== Rotor Level Full Flow Test ===\n\n";

$user = App\Models\User::first();
$rotorLevel = App\Models\Level::where('cipher_type', 'rotor')->first();

if (!$rotorLevel || !$user) {
    echo "FAIL: Missing data (user or rotor level)\n";
    exit(1);
}

echo "User: " . $user->email . "\n";
echo "Rotor level: " . $rotorLevel->name . " (rotor_count=" . $rotorLevel->rotor_count . ")\n\n";

// Start new session
$session = $game->startGame($user, $rotorLevel);
echo "Step 1: Game started. Session id=" . $session->id . "\n";
echo "   rotor_positions (target): " . implode(',', $session->rotor_positions) . "\n";
echo "   plaintext (first 40): " . substr($rotorLevel->plaintext, 0, 40) . "...\n";
echo "   ciphertext (first 40): " . substr($rotorLevel->ciphertext, 0, 40) . "...\n";
echo "   initial partial_solution length: " . strlen($session->partial_solution ?? '') . "\n\n";

// For rotor level, seed uses target_positions: [17] for single, [5,13,21] for triple
// Game initializes at 0, player needs to find correct positions
$correctPositions = $rotorLevel->rotor_count === 1 ? [17] : [5, 13, 21];
echo "Step 2: Update each rotor to CORRECT target positions [" . implode(',', $correctPositions) . "]\n";
$result = null;
foreach ($correctPositions as $idx => $pos) {
    $result = $game->updateRotor($session, $idx, $pos);
    $session = $session->fresh();
}
echo "   partial_solution present: " . (!empty($result['partial_solution']) ? 'YES' : 'NO') . "\n";
echo "   partial_solution (first 40): " . substr($result['partial_solution'] ?? '', 0, 40) . "...\n";

// Re-fetch session
$session = $session->fresh();
echo "   saved partial_solution length: " . strlen($session->partial_solution ?? '') . "\n";
echo "   saved partial_solution matches plaintext: " . ($session->partial_solution === $rotorLevel->plaintext ? 'YES (pass)' : 'NO') . "\n\n";

// Submit
echo "Step 3: Submit solution\n";
$submitResult = $game->submitSolution($session);
echo "   success: " . ($submitResult['success'] ? 'TRUE' : 'FALSE') . "\n";
if (isset($submitResult['accuracy'])) echo "   accuracy: " . $submitResult['accuracy'] . "\n";
if (isset($submitResult['final_score'])) echo "   final_score: " . $submitResult['final_score'] . "\n";
if (isset($submitResult['message'])) echo "   message: " . $submitResult['message'] . "\n";

echo "\n=== Custom Level CRUD Test ===\n\n";

// Test custom level controller via artisan
$customData = [
    'name' => 'Test Custom Caesar',
    'description' => 'A test custom caesar cipher level',
    'difficulty' => 'easy',
    'base_score' => 100,
    'hint_penalty' => 10,
    'cipher_type' => 'caesar',
    'plaintext' => 'THIS IS A CUSTOM CAESAR CHALLENGE FOR TESTING',
    'caesar_shift' => 5,
    'hints' => "Try shift 5\nHint 2",
];

echo "Step 4: Create custom level (caesar, shift=5)\n";
$custom = App\Models\Level::create([
    'name' => $customData['name'],
    'description' => $customData['description'],
    'difficulty' => $customData['difficulty'],
    'base_score' => $customData['base_score'],
    'hint_penalty' => $customData['hint_penalty'],
    'rotor_count' => 0,
    'cipher_type' => $customData['cipher_type'],
    'plaintext' => $customData['plaintext'],
    'ciphertext' => $cipher->caesarEncrypt($customData['plaintext'], 5),
    'solution_hints' => ['Try shift 5', 'Hint 2'],
    'frequency_data' => $cipher->analyzeFrequency($cipher->caesarEncrypt($customData['plaintext'], 5)),
    'is_custom' => true,
    'created_by' => $user->id,
    'is_active' => true,
    'sort_order' => 999,
]);
echo "   Created custom level id=" . $custom->id . "\n";
echo "   ciphertext: " . $custom->ciphertext . "\n";
echo "   is_custom: " . ($custom->is_custom ? 'true' : 'false') . "\n\n";

// Start a game with custom level
echo "Step 5: Start game on custom level\n";
$customSession = $game->startGame($user, $custom);
echo "   Session created: id=" . $customSession->id . ", level=" . $customSession->level->name . "\n";
echo "   level is_custom: " . ($customSession->level->is_custom ? 'true' : 'false') . "\n";

// Submit correct solution for custom caesar
$decrypted = $cipher->caesarDecrypt($custom->ciphertext, 5);
echo "   Decrypted with shift=5: $decrypted\n";
$customSession->partial_solution = $decrypted;
$customSession->save();
$submitCustom = $game->submitSolution($customSession->fresh());
echo "Step 6: Submit solution for custom level\n";
echo "   success: " . ($submitCustom['success'] ? 'TRUE (pass)' : 'FALSE') . "\n";
if (isset($submitCustom['final_score'])) echo "   final_score: " . $submitCustom['final_score'] . "\n";
if (isset($submitCustom['message']) && !$submitCustom['success']) echo "   message: " . $submitCustom['message'] . "\n";

// Cleanup test custom level
$custom->delete();
echo "\nCleanup: deleted test custom level\n";

echo "\n=== All core tests finished ===\n";
