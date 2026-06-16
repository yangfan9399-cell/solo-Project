<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\ArchiveBox;
use App\Models\Clue;
use App\Models\Player;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->createPlayers();
        $this->createLevel1();
        $this->createLevel2();
        $this->createLevel3();
    }

    private function createPlayers(): void
    {
        Player::firstOrCreate(
            ['name' => '档案员学徒'],
            [
                'total_score' => 0,
                'games_played' => 0,
                'games_won' => 0,
                'best_streak' => 0,
                'current_streak' => 0,
            ]
        );

        Player::firstOrCreate(
            ['name' => '资深馆员'],
            [
                'total_score' => 3500,
                'games_played' => 5,
                'games_won' => 3,
                'best_streak' => 3,
                'current_streak' => 0,
            ]
        );
    }

    private function createLevel1(): void
    {
        $level = Level::firstOrCreate(
            ['name' => '失踪的档案'],
            [
                'description' => '一批档案的索引卡被打乱了。根据残留的线索，将每个档案盒放回正确的楼层。',
                'difficulty' => 1,
                'floor_count' => 3,
                'base_score' => 1000,
                'time_bonus_seconds' => 300,
                'undo_penalty' => 20,
            ]
        );

        $boxes = [
            ['label' => 'A-01', 'era' => '1980年代', 'classification' => '秘密', 'correct_floor' => 2, 'color' => '#8b5cf6'],
            ['label' => 'A-02', 'era' => '1990年代', 'classification' => '内部', 'correct_floor' => 1, 'color' => '#3b82f6'],
            ['label' => 'A-03', 'era' => '2000年代', 'classification' => '公开', 'correct_floor' => 3, 'color' => '#10b981'],
            ['label' => 'A-04', 'era' => '1980年代', 'classification' => '绝密', 'correct_floor' => 2, 'color' => '#ef4444'],
            ['label' => 'A-05', 'era' => '1990年代', 'classification' => '秘密', 'correct_floor' => 1, 'color' => '#f59e0b'],
        ];

        foreach ($boxes as $i => $box) {
            ArchiveBox::firstOrCreate(
                ['level_id' => $level->id, 'label' => $box['label']],
                array_merge($box, ['level_id' => $level->id, 'sort_order' => $i])
            );
        }

        $clues = [
            ['content' => '所有80年代的档案都放在第2层。', 'type' => 'era', 'is_noise' => false, 'sort_order' => 1],
            ['content' => '公开级档案全部存放在第3层。', 'type' => 'classification', 'is_noise' => false, 'sort_order' => 2],
            ['content' => 'A-02和A-05存放在同一楼层。', 'type' => 'same_floor', 'is_noise' => false, 'sort_order' => 3],
            ['content' => '绝密级档案存放在第3层。', 'type' => 'classification', 'is_noise' => true, 'sort_order' => 4],
            ['content' => 'A-03的密级是最低的。', 'type' => 'classification', 'is_noise' => false, 'sort_order' => 5],
        ];

        foreach ($clues as $clue) {
            Clue::firstOrCreate(
                ['level_id' => $level->id, 'content' => $clue['content']],
                array_merge($clue, ['level_id' => $level->id])
            );
        }
    }

    private function createLevel2(): void
    {
        $level = Level::firstOrCreate(
            ['name' => '混乱的索引'],
            [
                'description' => '索引系统遭到破坏，更多的档案需要归位。注意：有些线索可能是被人故意篡改的噪声信息。',
                'difficulty' => 2,
                'floor_count' => 4,
                'base_score' => 1500,
                'time_bonus_seconds' => 420,
                'undo_penalty' => 25,
            ]
        );

        $boxes = [
            ['label' => 'B-01', 'era' => '1970年代', 'classification' => '秘密', 'correct_floor' => 2, 'color' => '#8b5cf6'],
            ['label' => 'B-02', 'era' => '1980年代', 'classification' => '绝密', 'correct_floor' => 4, 'color' => '#ef4444'],
            ['label' => 'B-03', 'era' => '1990年代', 'classification' => '内部', 'correct_floor' => 1, 'color' => '#3b82f6'],
            ['label' => 'B-04', 'era' => '2000年代', 'classification' => '公开', 'correct_floor' => 3, 'color' => '#10b981'],
            ['label' => 'B-05', 'era' => '1980年代', 'classification' => '内部', 'correct_floor' => 2, 'color' => '#6366f1'],
            ['label' => 'B-06', 'era' => '1990年代', 'classification' => '秘密', 'correct_floor' => 1, 'color' => '#f59e0b'],
            ['label' => 'B-07', 'era' => '2000年代', 'classification' => '秘密', 'correct_floor' => 3, 'color' => '#ec4899'],
            ['label' => 'B-08', 'era' => '1970年代', 'classification' => '绝密', 'correct_floor' => 4, 'color' => '#dc2626'],
        ];

        foreach ($boxes as $i => $box) {
            ArchiveBox::firstOrCreate(
                ['level_id' => $level->id, 'label' => $box['label']],
                array_merge($box, ['level_id' => $level->id, 'sort_order' => $i])
            );
        }

        $clues = [
            ['content' => '绝密级档案全部存放在最深的第4层。', 'type' => 'classification', 'is_noise' => false, 'sort_order' => 1],
            ['content' => '1990年代的档案都在第1层。', 'type' => 'era', 'is_noise' => false, 'sort_order' => 2],
            ['content' => '公开级档案在第2层。', 'type' => 'classification', 'is_noise' => true, 'sort_order' => 3],
            ['content' => 'B-02和B-08在同一楼层。', 'type' => 'same_floor', 'is_noise' => false, 'sort_order' => 4],
            ['content' => '2000年代的档案全部在第3层。', 'type' => 'era', 'is_noise' => false, 'sort_order' => 5],
            ['content' => 'B-01的密级是绝密。', 'type' => 'classification', 'is_noise' => true, 'sort_order' => 6],
            ['content' => 'B-03和B-06都在入口层（第1层）。', 'type' => 'same_floor', 'is_noise' => false, 'sort_order' => 7],
            ['content' => 'B-05的年代比B-03更早。', 'type' => 'era', 'is_noise' => false, 'sort_order' => 8],
        ];

        foreach ($clues as $clue) {
            Clue::firstOrCreate(
                ['level_id' => $level->id, 'content' => $clue['content']],
                array_merge($clue, ['level_id' => $level->id])
            );
        }
    }

    private function createLevel3(): void
    {
        $level = Level::firstOrCreate(
            ['name' => '尘封的秘密'],
            [
                'description' => '地下档案馆最深处的档案被重新翻出。更多楼层、更多档案、更多噪声线索。你能找出真相吗？',
                'difficulty' => 3,
                'floor_count' => 5,
                'base_score' => 2500,
                'time_bonus_seconds' => 600,
                'undo_penalty' => 30,
            ]
        );

        $boxes = [
            ['label' => 'C-01', 'era' => '1960年代', 'classification' => '绝密', 'correct_floor' => 5, 'color' => '#dc2626'],
            ['label' => 'C-02', 'era' => '1970年代', 'classification' => '秘密', 'correct_floor' => 4, 'color' => '#8b5cf6'],
            ['label' => 'C-03', 'era' => '1980年代', 'classification' => '内部', 'correct_floor' => 3, 'color' => '#3b82f6'],
            ['label' => 'C-04', 'era' => '1990年代', 'classification' => '公开', 'correct_floor' => 1, 'color' => '#10b981'],
            ['label' => 'C-05', 'era' => '2000年代', 'classification' => '公开', 'correct_floor' => 1, 'color' => '#14b8a6'],
            ['label' => 'C-06', 'era' => '1970年代', 'classification' => '绝密', 'correct_floor' => 5, 'color' => '#b91c1c'],
            ['label' => 'C-07', 'era' => '1980年代', 'classification' => '秘密', 'correct_floor' => 4, 'color' => '#a855f7'],
            ['label' => 'C-08', 'era' => '1990年代', 'classification' => '内部', 'correct_floor' => 2, 'color' => '#0ea5e9'],
            ['label' => 'C-09', 'era' => '2000年代', 'classification' => '内部', 'correct_floor' => 2, 'color' => '#06b6d4'],
            ['label' => 'C-10', 'era' => '1960年代', 'classification' => '秘密', 'correct_floor' => 4, 'color' => '#7c3aed'],
            ['label' => 'C-11', 'era' => '1980年代', 'classification' => '绝密', 'correct_floor' => 5, 'color' => '#991b1b'],
            ['label' => 'C-12', 'era' => '1990年代', 'classification' => '秘密', 'correct_floor' => 3, 'color' => '#d97706'],
        ];

        foreach ($boxes as $i => $box) {
            ArchiveBox::firstOrCreate(
                ['level_id' => $level->id, 'label' => $box['label']],
                array_merge($box, ['level_id' => $level->id, 'sort_order' => $i])
            );
        }

        $clues = [
            ['content' => '所有绝密级档案都在第5层。', 'type' => 'classification', 'is_noise' => false, 'sort_order' => 1],
            ['content' => '公开级档案都在第1层。', 'type' => 'classification', 'is_noise' => false, 'sort_order' => 2],
            ['content' => '所有1960年代的档案都是绝密。', 'type' => 'era_class', 'is_noise' => true, 'sort_order' => 3],
            ['content' => 'C-04和C-05在同一层。', 'type' => 'same_floor', 'is_noise' => false, 'sort_order' => 4],
            ['content' => '1980年代的档案分布在第3、4、5层。', 'type' => 'era', 'is_noise' => false, 'sort_order' => 5],
            ['content' => 'C-08和C-09都在第2层。', 'type' => 'same_floor', 'is_noise' => false, 'sort_order' => 6],
            ['content' => '秘密级档案都在第4层。', 'type' => 'classification', 'is_noise' => true, 'sort_order' => 7],
            ['content' => 'C-01和C-06、C-11在同一楼层。', 'type' => 'same_floor', 'is_noise' => false, 'sort_order' => 8],
            ['content' => '2000年代的档案密级都不是秘密。', 'type' => 'era_class', 'is_noise' => false, 'sort_order' => 9],
            ['content' => 'C-10的密级是内部。', 'type' => 'classification', 'is_noise' => true, 'sort_order' => 10],
            ['content' => '第3层有内部级和秘密级两种档案。', 'type' => 'floor_class', 'is_noise' => false, 'sort_order' => 11],
            ['content' => 'C-07比C-03的密级更高。', 'type' => 'classification', 'is_noise' => false, 'sort_order' => 12],
        ];

        foreach ($clues as $clue) {
            Clue::firstOrCreate(
                ['level_id' => $level->id, 'content' => $clue['content']],
                array_merge($clue, ['level_id' => $level->id])
            );
        }
    }
}
