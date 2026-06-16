import json
from django.db import migrations


LEVELS_DATA = [
    {
        'level_number': 1,
        'title': '初学乍练',
        'description': '你的第一个活字排版任务。一位书商需要印制一张简单的春联上联，字数不多，请仔细排版。',
        'target_text': '春回大地',
        'difficulty': 1,
        'time_limit': 90,
        'ink_budget': 60,
        'pass_score': 50,
        'error_penalty': 5,
        'inverted_penalty': 8,
        'ink_waste_penalty': 2,
        'base_reward': 80,
        'char_pool': json.dumps(list('春夏秋冬回地天人大地山河江海云风'), ensure_ascii=False),
    },
    {
        'level_number': 2,
        'title': '两行短诗',
        'description': '一位诗人需要印制两句诗稿。注意诗句的顺序和每个字的准确，倒字是大忌！',
        'target_text': '白日依山尽黄河入海流',
        'difficulty': 1,
        'time_limit': 120,
        'ink_budget': 80,
        'pass_score': 55,
        'error_penalty': 5,
        'inverted_penalty': 8,
        'ink_waste_penalty': 2,
        'base_reward': 120,
        'char_pool': json.dumps(list('白日依山尽黄河入海流红月靠水来东西南北风云雨雪'), ensure_ascii=False),
    },
    {
        'level_number': 3,
        'title': '匠人入门',
        'description': '官府需要一份告示，字数更多，要求也更高。错字会影响官府威严，务必小心！',
        'target_text': '奉天承运皇帝诏曰天下太平',
        'difficulty': 2,
        'time_limit': 150,
        'ink_budget': 100,
        'pass_score': 60,
        'error_penalty': 6,
        'inverted_penalty': 10,
        'ink_waste_penalty': 3,
        'base_reward': 180,
        'char_pool': json.dumps(list('奉天承运皇帝诏曰天下太平民安国宁王道正德仁义礼智信忠孝廉'), ensure_ascii=False),
    },
    {
        'level_number': 4,
        'title': '经卷雕版',
        'description': '寺庙需要印制一段经文。经文不可有丝毫差错，否则视为亵渎，务必逐字校对！',
        'target_text': '色不异空空不异色色即是空空即是色',
        'difficulty': 2,
        'time_limit': 180,
        'ink_budget': 120,
        'pass_score': 65,
        'error_penalty': 7,
        'inverted_penalty': 12,
        'ink_waste_penalty': 3,
        'base_reward': 220,
        'char_pool': json.dumps(list('色不异空即是受想行识亦复如是有生灭垢净增减眼耳鼻舌身意'), ensure_ascii=False),
    },
    {
        'level_number': 5,
        'title': '百家姓册',
        'description': '书坊接到一部百家姓首篇的印制订单，字数多且重复少，需要极高的专注力！',
        'target_text': '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨',
        'difficulty': 2,
        'time_limit': 180,
        'ink_budget': 130,
        'pass_score': 60,
        'error_penalty': 6,
        'inverted_penalty': 10,
        'ink_waste_penalty': 3,
        'base_reward': 260,
        'char_pool': json.dumps(list('赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜'), ensure_ascii=False),
    },
    {
        'level_number': 6,
        'title': '圣旨全文',
        'description': '朝廷急令！一份完整圣旨需要印制，不容有失。错一字则满盘皆输！',
        'target_text': '奉天承运皇帝诏曰朕惟治天下以安民为本安民以足食为先故命有司轻徭薄赋与民休息钦此',
        'difficulty': 3,
        'time_limit': 240,
        'ink_budget': 160,
        'pass_score': 70,
        'error_penalty': 8,
        'inverted_penalty': 15,
        'ink_waste_penalty': 4,
        'base_reward': 400,
        'char_pool': json.dumps(list('奉天承运皇帝诏曰朕惟治天下以安民为本足食先故命有司轻徭薄赋与休息钦此国太平正德仁义礼智'), ensure_ascii=False),
    },
    {
        'level_number': 7,
        'title': '四书章句',
        'description': '大儒委托印制《论语》开篇，文字深奥，要求严谨。校对不仔细则谬以千里！',
        'target_text': '子曰学而时习之不亦说乎有朋自远方来不亦乐乎人不知而不愠不亦君子乎',
        'difficulty': 3,
        'time_limit': 240,
        'ink_budget': 170,
        'pass_score': 72,
        'error_penalty': 8,
        'inverted_penalty': 15,
        'ink_waste_penalty': 4,
        'base_reward': 450,
        'char_pool': json.dumps(list('子曰学而时习之不亦说乎有朋自远方来乐人知愠君为政以德譬如北辰居其所众星共'), ensure_ascii=False),
    },
    {
        'level_number': 8,
        'title': '大师考核',
        'description': '这是铸字工坊的终极考核！一部完整的古文需要排版印制，时限紧张，要求极高。只有真正的大师才能通过！',
        'target_text': '先天下之忧而忧后天下之乐而乐居庙堂之高则忧其民处江湖之远则忧其君',
        'difficulty': 3,
        'time_limit': 300,
        'ink_budget': 200,
        'pass_score': 75,
        'error_penalty': 10,
        'inverted_penalty': 18,
        'ink_waste_penalty': 5,
        'base_reward': 600,
        'char_pool': json.dumps(list('先天下之忧而忧后乐居庙堂之高则民处江湖远其君山川风月草木鱼鸟进退存亡得失成败'), ensure_ascii=False),
    },
]


def seed_levels(apps, schema_editor):
    Level = apps.get_model('workshop', 'Level')
    for data in LEVELS_DATA:
        Level.objects.update_or_create(
            level_number=data['level_number'],
            defaults=data,
        )


def reverse_seed(apps, schema_editor):
    Level = apps.get_model('workshop', 'Level')
    level_numbers = [d['level_number'] for d in LEVELS_DATA]
    Level.objects.filter(level_number__in=level_numbers).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('workshop', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_levels, reverse_seed),
    ]
