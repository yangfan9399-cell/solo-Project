from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, time, timedelta
import random

from core.models import (
    CoreSample, Cutter, CuttingPurpose, CuttingTask,
    BatchVersion, AnomalyRecord
)


class Command(BaseCommand):
    help = '初始化岩心样本切割排程系统的样例数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样例数据...')

        CuttingPurpose.objects.all().delete()
        Cutter.objects.all().delete()
        CoreSample.objects.all().delete()
        CuttingTask.objects.all().delete()
        BatchVersion.objects.all().delete()
        AnomalyRecord.objects.all().delete()

        self._create_purposes()
        self._create_cutters()
        self._create_samples()
        self._create_tasks()
        self._create_batch_version()

        from core.services import detect_all_anomalies
        detect_all_anomalies()

        self.stdout.write(self.style.SUCCESS('样例数据初始化完成！'))
        self.stdout.write(f'  - 切割目的: {CuttingPurpose.objects.count()} 种')
        self.stdout.write(f'  - 切割机: {Cutter.objects.count()} 台')
        self.stdout.write(f'  - 岩心样本: {CoreSample.objects.count()} 个')
        self.stdout.write(f'  - 切割任务: {CuttingTask.objects.count()} 个')
        self.stdout.write(f'  - 批次版本: {BatchVersion.objects.count()} 个')
        self.stdout.write(f'  - 异常记录: {AnomalyRecord.objects.count()} 条')

    def _create_purposes(self):
        purposes = [
            {'code': 'POR', 'name': '孔隙度分析', 'standard_loss_rate': 2.5, 'typical_length': 0.05, 'requires_quality_check': True, 'sort_order': 1},
            {'code': 'PER', 'name': '渗透率测试', 'standard_loss_rate': 3.0, 'typical_length': 0.05, 'requires_quality_check': True, 'sort_order': 2},
            {'code': 'PET', 'name': '岩电参数', 'standard_loss_rate': 2.0, 'typical_length': 0.03, 'requires_quality_check': False, 'sort_order': 3},
            {'code': 'MIN', 'name': '矿物分析', 'standard_loss_rate': 4.0, 'typical_length': 0.02, 'requires_quality_check': False, 'sort_order': 4},
            {'code': 'ORG', 'name': '有机地化', 'standard_loss_rate': 3.5, 'typical_length': 0.05, 'requires_quality_check': True, 'sort_order': 5},
            {'code': 'RES', 'name': '储层敏感性', 'standard_loss_rate': 5.0, 'typical_length': 0.08, 'requires_quality_check': True, 'sort_order': 6},
            {'code': 'SCAL', 'name': '相对渗透率', 'standard_loss_rate': 4.5, 'typical_length': 0.06, 'requires_quality_check': True, 'sort_order': 7},
            {'code': 'GEO', 'name': '地质力学', 'standard_loss_rate': 3.0, 'typical_length': 0.1, 'requires_quality_check': True, 'sort_order': 8},
        ]
        for p in purposes:
            CuttingPurpose.objects.create(**p)
        self.stdout.write('  切割目的创建完成')

    def _create_cutters(self):
        cutters = [
            {'cutter_no': 'CUT-001', 'name': '金刚石切割机A', 'cutter_type': 'diamond', 'status': 'available',
             'max_cut_length': 1.0, 'min_cut_length': 0.01, 'daily_capacity': 12.0, 'blade_loss_rate': 2.5,
             'work_start_time': time(8, 0), 'work_end_time': time(18, 0), 'location': '一号实验室-101室',
             'last_maintenance': date.today() - timedelta(days=15)},
            {'cutter_no': 'CUT-002', 'name': '金刚石切割机B', 'cutter_type': 'diamond', 'status': 'available',
             'max_cut_length': 1.5, 'min_cut_length': 0.005, 'daily_capacity': 8.0, 'blade_loss_rate': 2.0,
             'work_start_time': time(8, 0), 'work_end_time': time(20, 0), 'location': '一号实验室-102室',
             'last_maintenance': date.today() - timedelta(days=7)},
            {'cutter_no': 'CUT-003', 'name': '激光切割机A', 'cutter_type': 'laser', 'status': 'busy',
             'max_cut_length': 0.5, 'min_cut_length': 0.002, 'daily_capacity': 5.0, 'blade_loss_rate': 0.5,
             'work_start_time': time(9, 0), 'work_end_time': time(17, 0), 'location': '二号实验室-201室',
             'last_maintenance': date.today() - timedelta(days=3)},
            {'cutter_no': 'CUT-004', 'name': '带锯切割机A', 'cutter_type': 'band_saw', 'status': 'maintenance',
             'max_cut_length': 2.0, 'min_cut_length': 0.02, 'daily_capacity': 15.0, 'blade_loss_rate': 6.0,
             'work_start_time': time(7, 0), 'work_end_time': time(19, 0), 'location': '加工车间-A区',
             'last_maintenance': date.today() - timedelta(days=30),
             'next_maintenance': date.today() + timedelta(days=2)},
            {'cutter_no': 'CUT-005', 'name': '精密金刚石切割机', 'cutter_type': 'diamond', 'status': 'available',
             'max_cut_length': 0.8, 'min_cut_length': 0.003, 'daily_capacity': 6.0, 'blade_loss_rate': 1.5,
             'work_start_time': time(8, 30), 'work_end_time': time(17, 30), 'location': '精密实验室-301室',
             'last_maintenance': date.today() - timedelta(days=5)},
        ]
        for c in cutters:
            Cutter.objects.create(**c)
        self.stdout.write('  切割机创建完成')

    def _create_samples(self):
        wells = ['庆探1井', '庆探2井', '庆探3井', '华1井', '华2井',
                  '长庆-平1', '长庆-平2', '苏里格X井', '苏里格X-平1', '靖边探1']
        lithologies = ['砂岩', '泥岩', '灰岩', '白云岩', '粉砂岩', '泥质砂岩', '砂质泥岩', '碳酸盐岩']
        formations = ['延长组', '延安组', '富县组', '刘家沟组', '石盒子组', '山西组', '太原组', '马家沟组']
        priorities = ['urgent', 'high', 'medium', 'medium', 'medium', 'low']
        statuses = ['pending', 'pending', 'in_progress', 'completed', 'on_hold']

        for i in range(1, 16):
            well = random.choice(wells)
            lithology = random.choice(lithologies)
            formation = random.choice(formations)
            depth_start = round(random.uniform(1000, 4500), 2)
            total_length = round(random.uniform(0.5, 5.0), 2)
            remaining_ratio = random.uniform(0.1, 0.95)
            remaining = round(total_length * remaining_ratio, 2)
            
            sample = CoreSample(
                sample_no=f'YX-{date.today().strftime("%Y%m")}-{i:03d}',
                well_name=well,
                depth_start=depth_start,
                depth_end=depth_start + total_length,
                total_length=total_length,
                remaining_length=remaining,
                lithology=lithology,
                formation=formation,
                priority=random.choice(priorities),
                status=random.choice(statuses),
                storage_location=f'{random.choice(["A","B","C"])}区-{random.randint(1,10)}号架-{random.randint(1, 5)}层',
                description=f'{well} {formation} {lithology}岩心样本，用于{random.choice(["储层评价", "含油性分析", "物性分析"])}研究。',
                collected_date=date.today() - timedelta(days=random.randint(1, 90)),
            )
            sample.save()
        self.stdout.write('  岩心样本创建完成')

    def _create_tasks(self):
        samples = list(CoreSample.objects.all())
        cutters = list(Cutter.objects.filter(status__in=['available', 'busy']))
        purposes = list(CuttingPurpose.objects.filter(is_active=True))
        today = date.today()

        task_counter = 1
        for sample in samples:
            num_tasks = random.randint(1, 4)
            for j in range(num_tasks):
                purpose = random.choice(purposes)
                planned_length = round(random.uniform(0.05, 0.5), 3)
                status = random.choice(['pending', 'scheduled', 'in_progress', 'completed', 'completed'])
                day_offset = random.choice([0, 0, 0, 1, -1, -2, -3])
                scheduled = today + timedelta(days=day_offset)
                
                start_hour = random.randint(8, 16)
                start_minute = random.choice([0, 15, 30, 45])
                duration = random.uniform(0.5, 3.0)
                end_hour = min(int(start_hour + duration), 23)
                end_minute = int((start_minute + (duration % 1) * 60) % 60)
                
                actual_cut = None
                loss = 0.0
                if status == 'completed':
                    actual_cut = round(planned_length * random.uniform(0.9, 1.1), 3)
                    loss = round(planned_length * purpose.standard_loss_rate / 100 * random.uniform(0.8, 1.8), 4)
                
                task = CuttingTask(
                    task_no=f'TASK-{today.strftime("%Y%m%d")}-{task_counter:04d}',
                    core_sample=sample,
                    cutter=random.choice(cutters) if status != 'pending' else None,
                    purpose=purpose,
                    status=status,
                    planned_cut_length=planned_length,
                    actual_cut_length=actual_cut,
                    loss_length=loss,
                    slice_count=random.randint(1, 10),
                    slice_thickness=purpose.typical_length,
                    scheduled_date=scheduled,
                    scheduled_start_time=time(start_hour, start_minute) if status in ['scheduled', 'in_progress', 'completed'] else None,
                    scheduled_end_time=time(end_hour, end_minute) if status in ['scheduled', 'in_progress', 'completed'] else None,
                    actual_start_time=timezone.now() - timedelta(hours=random.randint(1, 8)) if status in ['in_progress', 'completed'] else None,
                    actual_end_time=timezone.now() - timedelta(hours=random.randint(0, 3)) if status == 'completed' else None,
                    operator=random.choice(['张工', '李工', '王工', '赵工', '']),
                    quality_checked=random.choice([True, False]) if status == 'completed' and purpose.requires_quality_check else False,
                    quality_result=random.choice(['合格', '合格', '合格', '待复检']) if status == 'completed' and purpose.requires_quality_check else '',
                    remarks='',
                )
                if status == 'completed':
                    remarks_options = ['', '', '注意端面平整度良好', '需复测', '客户加急处理', '表面有微裂纹']
                    task.remarks = random.choice(remarks_options)
                task.save()
                task_counter += 1

        urgent_samples = [s for s in samples if s.priority == 'urgent']
        for sample in urgent_samples:
            if sample.cutting_tasks.count() == 0:
                purpose = random.choice(purposes)
                CuttingTask.objects.create(
                    task_no=f'TASK-{today.strftime("%Y%m%d")}-{task_counter:04d}',
                    core_sample=sample,
                    cutter=random.choice(cutters),
                    purpose=purpose,
                    status='scheduled',
                    planned_cut_length=round(random.uniform(0.1, 0.3), 3),
                    slice_count=random.randint(2, 5),
                    slice_thickness=purpose.typical_length,
                    scheduled_date=today,
                    scheduled_start_time=time(9, 0),
                    scheduled_end_time=time(11, 0),
                    remarks='紧急任务，优先处理',
                )
                task_counter += 1

        self.stdout.write('  切割任务创建完成')

    def _create_batch_version(self):
        today = date.today()
        batch_no = f'BATCH-{today.strftime("%Y%m%d")}'
        
        from core.services import create_batch_version
        batch = create_batch_version(
            batch_no=batch_no,
            batch_type='daily',
            description=f'{today.strftime("%Y年%m月%d日")}日排程批次',
            created_by='系统初始化',
        )

        batch2_no = f'BATCH-{(today - timedelta(days=1)).strftime("%Y%m%d")}'
        batch2 = create_batch_version(
            batch_no=batch2_no,
            batch_type='daily',
            description=f'{(today - timedelta(days=1)).strftime("%Y年%m月%d日")}日排程批次（历史）',
            created_by='系统初始化',
        )

        project_batch_no = 'BATCH-PROJECT-QINGTAN'
        BatchVersion.objects.create(
            version_no=f'{project_batch_no}-v01',
            batch_no=project_batch_no,
            batch_type='project',
            description='庆探区块项目批次',
            created_by='系统初始化',
            is_current=False,
        )

        self.stdout.write('  批次版本创建完成')
