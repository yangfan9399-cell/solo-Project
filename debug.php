<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$question = '那把古董匕首是怎么回事？凶手是怎么拿到那把匕首的？';
$game = App\Models\Game::find(1);
$question = mb_strtolower($question);
$undistributedClues = $game->getUndistributedClueCards();

echo '问题: ' . $question . PHP_EOL;
echo '---' . PHP_EOL;

foreach ($undistributedClues as $clue) {
    $clueText = mb_strtolower($clue->title . ' ' . $clue->content);
    $questionWords = preg_split('/[，。？！、\s]+/u', $question, -1, PREG_SPLIT_NO_EMPTY);
    $matchCount = 0;
    
    echo '线索: ' . $clue->title . ' (ID:' . $clue->id . ')' . PHP_EOL;
    echo '分词结果: ' . implode('|', $questionWords) . PHP_EOL;
    
    foreach ($questionWords as $word) {
        if (mb_strlen($word) >= 2 && str_contains($clueText, $word)) {
            echo '  ✅ 匹配: "' . $word . '"' . PHP_EOL;
            $matchCount++;
        }
    }
    
    echo '  匹配数: ' . $matchCount . PHP_EOL;
    echo '---' . PHP_EOL;
}
