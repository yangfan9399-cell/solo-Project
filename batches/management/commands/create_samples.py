from django.core.management.base import BaseCommand
from django.utils import timezone
from batches.models import Batch, StatusHistory
from observations.models import ObservationRecord
from accounts.models import User


class Command(BaseCommand):
    help = '创建预置样本数据'

    def handle(self, *args, **options):
        inspector = User.objects.get(username='inspector1')
        staff = User.objects.get(username='staff1')
        vet = User.objects.get(username='vet1')
        supervisor = User.objects.get(username='supervisor1')
        
        samples = [
            {
                'batch_number': 'BATCH-2024-001',
                'animal_type': '牛',
                'quantity': 50,
                'origin_country': '澳大利亚',
                'entry_date': '2024-01-15',
                'quarantine_site': '北京隔离场A区',
                'status': 'released',
                'vaccine_certificate': True,
                'health_certificate': True,
                'quarantine_certificate': True,
                'observations': [
                    {'date': '2024-01-16', 'temperature': 38.5, 'appetite': 'normal', 'mental_state': 'active', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗50kg', 'water_intake': '正常饮水', 'environment_temp': 25.0, 'environment_humidity': 60.0},
                    {'date': '2024-01-17', 'temperature': 38.3, 'appetite': 'normal', 'mental_state': 'active', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗52kg', 'water_intake': '正常饮水', 'environment_temp': 25.5, 'environment_humidity': 62.0},
                    {'date': '2024-01-18', 'temperature': 38.4, 'appetite': 'normal', 'mental_state': 'active', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗51kg', 'water_intake': '正常饮水', 'environment_temp': 26.0, 'environment_humidity': 61.0},
                ],
                'description': '正常放行样本：所有材料齐全，观察记录完整，兽医同意放行'
            },
            {
                'batch_number': 'BATCH-2024-002',
                'animal_type': '羊',
                'quantity': 100,
                'origin_country': '新西兰',
                'entry_date': '2024-01-18',
                'quarantine_site': '上海隔离场B区',
                'status': 'approving',
                'vaccine_certificate': False,
                'health_certificate': True,
                'quarantine_certificate': True,
                'observations': [
                    {'date': '2024-01-19', 'temperature': 39.0, 'appetite': 'normal', 'mental_state': 'normal', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗80kg', 'water_intake': '正常饮水', 'environment_temp': 24.0, 'environment_humidity': 58.0},
                    {'date': '2024-01-20', 'temperature': 38.8, 'appetite': 'normal', 'mental_state': 'active', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗85kg', 'water_intake': '正常饮水', 'environment_temp': 24.5, 'environment_humidity': 59.0},
                ],
                'description': '疫苗证明缺失样本：缺少疫苗证明文件，放行按钮禁用，显示红色警告'
            },
            {
                'batch_number': 'BATCH-2024-003',
                'animal_type': '猪',
                'quantity': 200,
                'origin_country': '美国',
                'entry_date': '2024-01-20',
                'quarantine_site': '广州隔离场C区',
                'status': 'reviewing',
                'vaccine_certificate': True,
                'health_certificate': True,
                'quarantine_certificate': False,
                'observations': [
                    {'date': '2024-01-21', 'temperature': 39.5, 'appetite': 'normal', 'mental_state': 'active', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗150kg', 'water_intake': '正常饮水', 'environment_temp': 27.0, 'environment_humidity': 65.0},
                    {'date': '2024-01-22', 'temperature': 40.2, 'appetite': 'decreased', 'mental_state': 'lethargic', 'excretion': 'abnormal', 'feeding_record': '食欲下降，饲料消耗减少至100kg', 'water_intake': '饮水减少', 'environment_temp': 27.5, 'environment_humidity': 66.0, 'abnormal_symptoms': '体温升高，精神萎靡，排泄异常'},
                ],
                'description': '观察异常样本：观察记录中发现异常症状，需要兽医复核'
            },
            {
                'batch_number': 'BATCH-2024-004',
                'animal_type': '马',
                'quantity': 20,
                'origin_country': '德国',
                'entry_date': '2024-01-22',
                'quarantine_site': '深圳隔离场D区',
                'status': 'quarantining',
                'vaccine_certificate': True,
                'health_certificate': True,
                'quarantine_certificate': True,
                'observations': [
                    {'date': '2024-01-23', 'temperature': 37.5, 'appetite': 'normal', 'mental_state': 'active', 'excretion': 'normal', 'feeding_record': '正常饲喂，饲料消耗30kg', 'water_intake': '正常饮水', 'environment_temp': 23.0, 'environment_humidity': 55.0},
                ],
                'description': '饲养记录漏填样本：部分日期缺少饲养记录，影响放行审批'
            },
        ]
        
        for sample in samples:
            if not Batch.objects.filter(batch_number=sample['batch_number']).exists():
                batch = Batch.objects.create(
                    batch_number=sample['batch_number'],
                    animal_type=sample['animal_type'],
                    quantity=sample['quantity'],
                    origin_country=sample['origin_country'],
                    entry_date=sample['entry_date'],
                    quarantine_site=sample['quarantine_site'],
                    status=sample['status'],
                    vaccine_certificate=sample['vaccine_certificate'],
                    health_certificate=sample['health_certificate'],
                    quarantine_certificate=sample['quarantine_certificate'],
                    created_by=inspector
                )
                
                StatusHistory.objects.create(
                    batch=batch,
                    from_status='pending',
                    to_status='quarantining',
                    changed_by=inspector,
                    notes='批次创建，开始隔离'
                )
                
                for obs_data in sample['observations']:
                    ObservationRecord.objects.create(
                        batch=batch,
                        observation_date=obs_data['date'],
                        observer=staff,
                        temperature=obs_data['temperature'],
                        appetite=obs_data['appetite'],
                        mental_state=obs_data['mental_state'],
                        excretion=obs_data['excretion'],
                        feeding_record=obs_data['feeding_record'],
                        water_intake=obs_data['water_intake'],
                        environment_temp=obs_data['environment_temp'],
                        environment_humidity=obs_data['environment_humidity'],
                        abnormal_symptoms=obs_data.get('abnormal_symptoms', None)
                    )
                
                self.stdout.write(self.style.SUCCESS(f'成功创建样本: {batch.batch_number} - {sample["description"]}'))
            else:
                self.stdout.write(self.style.WARNING(f'样本已存在: {sample["batch_number"]}'))
        
        self.stdout.write(self.style.SUCCESS('预置样本数据创建完成'))