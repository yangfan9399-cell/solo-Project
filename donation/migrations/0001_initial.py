from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='Donor',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('contact', models.CharField(blank=True, max_length=100)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('address', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='MaterialCategory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Material',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('unit', models.CharField(default='件', max_length=20)),
                ('specification', models.CharField(blank=True, max_length=200)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.materialcategory')),
            ],
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('active', '进行中'), ('completed', '已完成')], default='active', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Recipient',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('contact', models.CharField(blank=True, max_length=100)),
                ('phone', models.CharField(blank=True, max_length=20)),
                ('address', models.TextField(blank=True)),
                ('is_valid', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name='Batch',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.IntegerField()),
                ('received_quantity', models.IntegerField(default=0)),
                ('distributed_quantity', models.IntegerField(default=0)),
                ('expire_date', models.DateField()),
                ('batch_number', models.CharField(max_length=100, unique=True)),
                ('status', models.CharField(choices=[('pending', '待入库'), ('in_stock', '已入库'), ('distributed', '已分配'), ('expired', '已过期')], default='pending', max_length=20)),
                ('storage_location', models.CharField(blank=True, max_length=200)),
                ('received_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('donor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.donor')),
                ('material', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.material')),
                ('operator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='batches', to='auth.user')),
            ],
        ),
        migrations.CreateModel(
            name='DistributionPlan',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.IntegerField()),
                ('planned_date', models.DateField()),
                ('actual_distributed_date', models.DateField(blank=True, null=True)),
                ('status', models.CharField(choices=[('draft', '草稿'), ('approved', '已批准'), ('distributed', '已发放'), ('received', '已签收'), ('archived', '已归档'), ('rejected', '已退回')], default='draft', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('batch', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.batch')),
                ('operator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='distributions', to='auth.user')),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.project')),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.recipient')),
            ],
        ),
        migrations.CreateModel(
            name='Receipt',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity_received', models.IntegerField()),
                ('signed_by', models.CharField(max_length=100)),
                ('signed_at', models.DateTimeField(auto_now_add=True)),
                ('evidence', models.ImageField(blank=True, null=True, upload_to='receipts/')),
                ('notes', models.TextField(blank=True)),
                ('discrepancy_reason', models.CharField(blank=True, choices=[('damage', '物资损坏'), ('loss', '运输丢失'), ('shortage', '数量短缺'), ('other', '其他原因')], max_length=50)),
                ('distribution', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='donation.distributionplan')),
            ],
        ),
        migrations.CreateModel(
            name='AuditRecord',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(choices=[('archive', '归档'), ('investigate', '追查'), ('approve', '批准'), ('reject', '驳回')], max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('auditor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.user')),
                ('distribution', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='donation.distributionplan')),
            ],
        ),
        migrations.CreateModel(
            name='HistoryNode',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node_type', models.CharField(choices=[('receive', '入库'), ('distribute', '分配'), ('sign', '签收'), ('audit', '审计'), ('archive', '归档'), ('approve', '批准'), ('reject', '驳回')], max_length=20)),
                ('description', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('batch', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='donation.batch')),
                ('distribution', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='donation.distributionplan')),
                ('operator', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='auth.user')),
            ],
        ),
    ]
