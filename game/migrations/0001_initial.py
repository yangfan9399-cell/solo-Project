from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Level',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='关卡名称')),
                ('description', models.TextField(blank=True, verbose_name='关卡描述')),
                ('grid_width', models.IntegerField(default=5, verbose_name='网格宽度')),
                ('grid_height', models.IntegerField(default=5, verbose_name='网格高度')),
                ('addresses', models.JSONField(verbose_name='地址列表')),
                ('roads', models.JSONField(verbose_name='道路连接')),
                ('letters', models.JSONField(verbose_name='待送信件')),
                ('post_office', models.JSONField(verbose_name='邮局位置')),
                ('max_steps', models.IntegerField(default=20, verbose_name='最大步数')),
                ('min_solution', models.JSONField(blank=True, null=True, verbose_name='最短解')),
                ('min_folds', models.IntegerField(default=0, verbose_name='最少折叠次数')),
                ('fold_directions', models.JSONField(default=list, verbose_name='允许的折叠方向')),
                ('required_folds', models.JSONField(default=list, verbose_name='必须的折叠方向')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['id'],
            },
        ),
        migrations.CreateModel(
            name='GameSession',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(max_length=64, unique=True, verbose_name='局次ID')),
                ('current_state', models.JSONField(verbose_name='当前地图状态')),
                ('fold_count', models.IntegerField(default=0, verbose_name='折叠次数')),
                ('step_count', models.IntegerField(default=0, verbose_name='已用步数')),
                ('postman_position', models.JSONField(verbose_name='邮差当前位置')),
                ('delivered_letters', models.JSONField(default=list, verbose_name='已送达信件')),
                ('remaining_letters', models.JSONField(default=list, verbose_name='剩余信件')),
                ('status', models.CharField(choices=[('playing', '进行中'), ('won', '胜利'), ('lost', '失败'), ('abandoned', '已放弃')], default='playing', max_length=20, verbose_name='游戏状态')),
                ('score', models.IntegerField(default=0, verbose_name='分数')),
                ('started_at', models.DateTimeField(auto_now_add=True, verbose_name='开始时间')),
                ('ended_at', models.DateTimeField(blank=True, null=True, verbose_name='结束时间')),
                ('level', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='game.level', verbose_name='关卡')),
                ('player', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.user', verbose_name='玩家')),
            ],
            options={
                'ordering': ['-started_at'],
            },
        ),
        migrations.CreateModel(
            name='FoldHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fold_number', models.IntegerField(verbose_name='折叠序号')),
                ('direction', models.CharField(choices=[('horizontal_up', '向上折叠'), ('horizontal_down', '向下折叠'), ('vertical_left', '向左折叠'), ('vertical_right', '向右折叠')], max_length=20, verbose_name='折叠方向')),
                ('fold_line', models.IntegerField(verbose_name='折叠线位置')),
                ('crease_lines', models.JSONField(verbose_name='折痕位置')),
                ('merged_cells', models.JSONField(verbose_name='合并的单元格')),
                ('new_adjacencies', models.JSONField(verbose_name='新增相邻关系')),
                ('removed_adjacencies', models.JSONField(verbose_name='移除的相邻关系')),
                ('state_before', models.JSONField(verbose_name='折叠前状态')),
                ('state_after', models.JSONField(verbose_name='折叠后状态')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='折叠时间')),
                ('game_session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='fold_histories', to='game.gamesession', verbose_name='局次')),
            ],
            options={
                'ordering': ['game_session', 'fold_number'],
            },
        ),
        migrations.CreateModel(
            name='DeliveryDetail',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('step_number', models.IntegerField(verbose_name='步骤序号')),
                ('action', models.CharField(choices=[('move', '移动'), ('deliver', '投递'), ('fold', '折叠'), ('undo', '撤销')], max_length=20, verbose_name='动作类型')),
                ('from_position', models.JSONField(blank=True, null=True, verbose_name='起始位置')),
                ('to_position', models.JSONField(blank=True, null=True, verbose_name='目标位置')),
                ('letter_color', models.CharField(blank=True, max_length=20, null=True, verbose_name='信件颜色')),
                ('address_id', models.CharField(blank=True, max_length=50, null=True, verbose_name='地址ID')),
                ('step_cost', models.IntegerField(default=1, verbose_name='步数消耗')),
                ('is_valid', models.BooleanField(default=True, verbose_name='是否有效')),
                ('error_message', models.TextField(blank=True, verbose_name='错误信息')),
                ('state_before', models.JSONField(verbose_name='动作前状态')),
                ('state_after', models.JSONField(verbose_name='动作后状态')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='执行时间')),
                ('fold_history', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='game.foldhistory', verbose_name='关联折叠记录')),
                ('game_session', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='delivery_details', to='game.gamesession', verbose_name='局次')),
            ],
            options={
                'ordering': ['game_session', 'step_number'],
            },
        ),
        migrations.CreateModel(
            name='GameResult',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_success', models.BooleanField(verbose_name='是否成功')),
                ('final_score', models.IntegerField(verbose_name='最终分数')),
                ('steps_used', models.IntegerField(verbose_name='使用步数')),
                ('folds_used', models.IntegerField(verbose_name='使用折叠次数')),
                ('delivered_count', models.IntegerField(verbose_name='送达信件数')),
                ('total_letters', models.IntegerField(verbose_name='总信件数')),
                ('optimal_steps', models.IntegerField(blank=True, null=True, verbose_name='最短解步数')),
                ('optimal_folds', models.IntegerField(blank=True, null=True, verbose_name='最短解折叠次数')),
                ('is_optimal', models.BooleanField(default=False, verbose_name='是否达到最短解')),
                ('special_addresses_unlocked', models.JSONField(default=list, verbose_name='解锁的特殊地址')),
                ('required_folds_used', models.JSONField(default=list, verbose_name='使用的必需折叠')),
                ('score_breakdown', models.JSONField(verbose_name='分数明细')),
                ('final_rank', models.CharField(blank=True, max_length=20, null=True, verbose_name='评级')),
                ('validated_at', models.DateTimeField(auto_now_add=True, verbose_name='验证时间')),
                ('game_session', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='result', to='game.gamesession', verbose_name='局次')),
            ],
        ),
    ]
