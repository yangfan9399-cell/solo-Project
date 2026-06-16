<?php

namespace Database\Seeders;

use App\Models\Level;
use App\Models\ClueCard;
use App\Models\Player;
use Illuminate\Database\Seeder;

class GameDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedPlayers();
        $this->seedLevel1();
        $this->seedLevel2();
    }

    private function seedPlayers(): void
    {
        Player::create([
            'name' => '新手侦探',
            'avatar' => '🕵️',
            'total_score' => 0,
            'games_played' => 0,
            'games_won' => 0,
        ]);

        Player::create([
            'name' => '推理大师',
            'avatar' => '🧠',
            'total_score' => 245,
            'games_played' => 5,
            'games_won' => 3,
        ]);
    }

    private function seedLevel1(): void
    {
        $level = Level::create([
            'title' => '古堡晚宴谋杀案',
            'description' => '一场奢华的古堡晚宴上，富翁维克多在书房被发现死亡。你作为被邀请的侦探，需要通过询问和收集线索，找出真正的凶手。',
            'story_intro' => '夜幕降临，风雨交加。著名收藏家维克多·霍金斯在自己的古堡举办了一场私人晚宴。宾客包括：他的侄女艾玛、生意伙伴理查德、私人医生索菲亚、以及老管家詹姆斯。晚上11点，一声惨叫划破夜空——维克多被发现死在书房，一把古董匕首插在胸口。房间从内部上锁，窗户紧闭。你，在场的名侦探，需要在30分钟内揭开这个密室杀人案的真相。',
            'truth_reveal' => '凶手是侄女艾玛。她因为欠下巨额赌债，而维克多在遗嘱修改前威胁要剥夺她的继承权。案发当晚，艾玛用从管家处偷来的备用钥匙进入书房，与维克多发生争执后用古董匕首将其杀害。之后她从内部反锁房门，通过壁炉的秘密通道（她小时候就知道的密道）离开，造成密室假象。沾有灰烬的黑色丝绒披肩、壁炉旁的脚印、以及她手腕上被壁炉架划伤的新鲜伤口，都是关键证据。',
            'difficulty' => 2,
            'max_score' => 100,
            'time_limit_minutes' => 30,
            'required_clues_to_solve' => 5,
        ]);

        $clues = [
            [
                'title' => '沾灰的黑色丝绒披肩',
                'content' => '在二楼走廊的杂物间发现一条女士黑色丝绒披肩，肩部和袖口沾有壁炉灰烬。披肩刺绣上有字母"E"。',
                'category' => 'physical',
                'importance_score' => 90,
                'spoiler_risk' => 65,
                'reveal_order' => 5,
                'is_required' => true,
                'icon' => '🧣',
            ],
            [
                'title' => '壁炉旁的脚印',
                'content' => '书房壁炉内侧发现了两个浅浅的脚印，尺码约为37码，似乎有人从壁炉通道进出。壁炉的砖块有被移动过的痕迹。',
                'category' => 'scene',
                'importance_score' => 85,
                'spoiler_risk' => 55,
                'reveal_order' => 6,
                'is_required' => true,
                'icon' => '👣',
            ],
            [
                'title' => '艾玛的赌债通知书',
                'content' => '在艾玛的手包夹层中找到一张赌场的催债通知书，金额高达50万美元，最后还款日就是案发后第二天。',
                'category' => 'document',
                'importance_score' => 80,
                'spoiler_risk' => 45,
                'reveal_order' => 4,
                'is_required' => true,
                'icon' => '💸',
            ],
            [
                'title' => '遗嘱修改草稿',
                'content' => '维克多书桌上有一份未签署的遗嘱修改草稿，内容显示他计划将艾玛从主要继承人名单中移除，捐出大部分财产给慈善机构。',
                'category' => 'document',
                'importance_score' => 75,
                'spoiler_risk' => 40,
                'reveal_order' => 3,
                'is_required' => true,
                'icon' => '📋',
            ],
            [
                'title' => '手腕上的新鲜伤口',
                'content' => '注意到艾玛左手手腕内侧有一道新鲜的划伤，伤口边缘沾有少量铁锈。她解释说是被树枝刮伤，但古堡周围没有树木。',
                'category' => 'testimony',
                'importance_score' => 70,
                'spoiler_risk' => 50,
                'reveal_order' => 7,
                'is_required' => true,
                'icon' => '🩹',
            ],
            [
                'title' => '管家的钥匙记录',
                'content' => '管家詹姆斯的钥匙登记簿显示，三天前艾玛曾向管家借用"书房备用钥匙"，理由是"帮伯父取一份文件"，但至今未归还。',
                'category' => 'document',
                'importance_score' => 65,
                'spoiler_risk' => 35,
                'reveal_order' => 2,
                'is_required' => false,
                'icon' => '🔑',
            ],
            [
                'title' => '古董匕首',
                'content' => '凶器是维克多收藏的一把18世纪古董匕首，平时锁在展示柜中。展示柜没有被撬动痕迹，说明凶手知道密码或有钥匙。',
                'category' => 'physical',
                'importance_score' => 60,
                'spoiler_risk' => 20,
                'reveal_order' => 1,
                'is_required' => false,
                'icon' => '🗡️',
            ],
            [
                'title' => '理查德的财务困境',
                'content' => '生意伙伴理查德的公司最近濒临破产，他急需维克多的投资渡过难关。但案发当晚两人在书房发生了激烈争吵。',
                'category' => 'testimony',
                'importance_score' => 45,
                'spoiler_risk' => 10,
                'reveal_order' => 8,
                'is_required' => false,
                'icon' => '💼',
            ],
            [
                'title' => '医生的处方',
                'content' => '索菲亚医生当晚给维克多开了安眠药处方，但尸检报告显示维克多体内安眠药剂量极低，不足以致昏迷。',
                'category' => 'document',
                'importance_score' => 40,
                'spoiler_risk' => 5,
                'reveal_order' => 9,
                'is_required' => false,
                'icon' => '💊',
            ],
            [
                'title' => '破碎的酒杯',
                'content' => '书房地上有一只破碎的水晶酒杯，里面残留的红酒检测出微量镇静剂。但维克多是被刀刺死，并非中毒。',
                'category' => 'physical',
                'importance_score' => 35,
                'spoiler_risk' => 15,
                'reveal_order' => 10,
                'is_required' => false,
                'icon' => '🍷',
            ],
        ];

        foreach ($clues as $index => $clue) {
            $clue['level_id'] = $level->id;
            $clue['related_clue_ids'] = $this->getRelatedClues($index);
            ClueCard::create($clue);
        }
    }

    private function seedLevel2(): void
    {
        $level = Level::create([
            'title' => '美术馆消失的名画',
            'description' => '市立美术馆价值连城的名画《黄昏的低语》在开展前夜神秘消失。监控系统当晚恰好"故障"，你需要找出监守自盗的内部人员。',
            'story_intro' => '市立美术馆即将举办年度大展，核心展品是估值5000万的印象派名画《黄昏的低语》。开展前夜，安保主管例行巡查时发现画框空空如也，画作不翼而飞。当晚的监控系统恰好"因为维护而关闭了两个小时"。嫌疑人包括：馆长陈文博、策展人林晓月、资深修复师马师傅、以及当晚值班的保安赵磊。时间紧迫，你必须在25分钟内追回名画！',
            'truth_reveal' => '盗窃案的主谋是策展人林晓月，保安赵磊是她的同伙。林晓月因为 secretly 欠了地下钱庄一大笔钱，被迫参与这次盗窃。她利用职务之便提前关闭了监控，并复制了保险库的门禁卡。赵磊则负责在值班时打掩护，故意在巡查记录上造假。画作被暂时藏在修复室的一幅待修复油画的画框夹层中——这就是为什么马师傅的修复记录上有一张未登记入库的"匿名作品"。林晓月手机里删除的转账记录、修复室的异常出入日志、以及赵磊鞋上沾有的修复室专用颜料，共同指向了这个真相。',
            'difficulty' => 3,
            'max_score' => 120,
            'time_limit_minutes' => 25,
            'required_clues_to_solve' => 6,
        ]);

        $clues = [
            [
                'title' => '删除的转账记录',
                'content' => '通过技术恢复，在林晓月的手机中发现了被删除的银行转账记录——案发前三天，有一笔50万的不明款项转入她的账户。',
                'category' => 'digital',
                'importance_score' => 95,
                'spoiler_risk' => 70,
                'reveal_order' => 7,
                'is_required' => true,
                'icon' => '📱',
            ],
            [
                'title' => '修复室的异常日志',
                'content' => '修复室的门禁记录显示，案发当晚11点45分（监控关闭期间），有人用林晓月的工号刷卡进入了修复室，停留了约15分钟。',
                'category' => 'digital',
                'importance_score' => 85,
                'spoiler_risk' => 60,
                'reveal_order' => 6,
                'is_required' => true,
                'icon' => '💾',
            ],
            [
                'title' => '鞋底的特殊颜料',
                'content' => '保安赵磊的鞋底沾有修复室才会使用的一种稀有矿物颜料。赵磊声称从未进入过修复室。',
                'category' => 'physical',
                'importance_score' => 80,
                'spoiler_risk' => 50,
                'reveal_order' => 8,
                'is_required' => true,
                'icon' => '👟',
            ],
            [
                'title' => '未登记的匿名油画',
                'content' => '修复室里有一幅标注为"匿名捐赠，待修复"的油画，但在美术馆的藏品登记系统中完全找不到这件作品的入库记录。',
                'category' => 'physical',
                'importance_score' => 90,
                'spoiler_risk' => 75,
                'reveal_order' => 9,
                'is_required' => true,
                'icon' => '🖼️',
            ],
            [
                'title' => '复制的门禁卡',
                'content' => '在赵磊的更衣柜夹层中找到一张复制的保险库门禁卡，卡面上有林晓月的指纹残留。',
                'category' => 'physical',
                'importance_score' => 75,
                'spoiler_risk' => 55,
                'reveal_order' => 5,
                'is_required' => true,
                'icon' => '💳',
            ],
            [
                'title' => '虚假的巡查记录',
                'content' => '赵磊的巡查记录显示他当晚12点整巡查过展厅，但展厅的温湿度传感器记录显示11:55到12:10之间没有人出入展厅。',
                'category' => 'document',
                'importance_score' => 70,
                'spoiler_risk' => 40,
                'reveal_order' => 4,
                'is_required' => true,
                'icon' => '📝',
            ],
            [
                'title' => '馆长的压力',
                'content' => '馆长陈文博最近面临董事会的巨大压力——如果这次展览不成功，他很可能被解雇。他曾说过"为了成功不惜一切代价"。',
                'category' => 'testimony',
                'importance_score' => 35,
                'spoiler_risk' => 15,
                'reveal_order' => 1,
                'is_required' => false,
                'icon' => '😰',
            ],
            [
                'title' => '修复师的旧怨',
                'content' => '马师傅年轻时曾因一幅画的修复争议与当时的副馆长陈文博结怨，两人至今关系紧张。',
                'category' => 'testimony',
                'importance_score' => 30,
                'spoiler_risk' => 10,
                'reveal_order' => 2,
                'is_required' => false,
                'icon' => '😠',
            ],
            [
                'title' => '监控维护工单',
                'content' => '一份监控系统维护工单显示，当晚的监控关闭是林晓月作为策展人签字批准的，理由是"为明天展览调整灯光"。',
                'category' => 'document',
                'importance_score' => 65,
                'spoiler_risk' => 35,
                'reveal_order' => 3,
                'is_required' => false,
                'icon' => '📹',
            ],
            [
                'title' => '可疑的访客',
                'content' => '美术馆后门的监控（不在关闭范围内）拍到一辆黑色轿车当晚10点半驶入停车场，车牌被遮盖，司机戴着帽子和口罩。',
                'category' => 'digital',
                'importance_score' => 40,
                'spoiler_risk' => 20,
                'reveal_order' => 10,
                'is_required' => false,
                'icon' => '🚗',
            ],
            [
                'title' => '消失的画框',
                'content' => '原画作的画框被留在原地，但画框背后的固定钉是用专业修复工具取下的，说明作案者有修复经验或熟悉画作装裱。',
                'category' => 'scene',
                'importance_score' => 55,
                'spoiler_risk' => 30,
                'reveal_order' => 11,
                'is_required' => false,
                'icon' => '🔨',
            ],
        ];

        foreach ($clues as $index => $clue) {
            $clue['level_id'] = $level->id;
            $clue['related_clue_ids'] = $this->getRelatedClues($index);
            ClueCard::create($clue);
        }
    }

    private function getRelatedClues(int $currentIndex): array
    {
        $relations = [
            0 => [1, 4],
            1 => [0, 2],
            2 => [3, 5],
            3 => [2, 6],
            4 => [0, 1],
            5 => [2, 6],
            6 => [3, 5],
            7 => [8],
            8 => [7, 9],
            9 => [8],
            10 => [0],
        ];
        return $relations[$currentIndex] ?? [];
    }
}
