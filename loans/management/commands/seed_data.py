from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

from loans.models import (
    Exhibit, Borrower, LoanApplication, TransportRecord,
    InsurancePolicy, EnvironmentData, ReturnInspection,
    StatusHistory, UserProfile
)


class Command(BaseCommand):
    help = '初始化示例数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化数据...')

        self._create_users()
        self._create_exhibits()
        self._create_borrowers()
        self._create_sample_loans()

        self.stdout.write(self.style.SUCCESS('数据初始化完成！'))

    def _create_users(self):
        self.stdout.write('创建用户...')

        users_data = [
            ('admin', 'admin', '系统管理员', 'admin'),
            ('clerk', '123456', '张三', 'collection_clerk'),
            ('transport', '123456', '李四', 'transport_coordinator'),
            ('insurance', '123456', '王五', 'insurance_reviewer'),
            ('conservator', '123456', '赵六', 'conservator'),
        ]

        for username, password, name, role in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'first_name': name,
                    'is_staff': role == 'admin',
                    'is_superuser': role == 'admin',
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f'  创建用户: {username} ({role})')

            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.department = {
                'admin': '信息中心',
                'collection_clerk': '馆藏部',
                'transport_coordinator': '运输部',
                'insurance_reviewer': '财务部',
                'conservator': '文保部',
            }.get(role, '')
            profile.save()

    def _create_exhibits(self):
        self.stdout.write('创建展品...')

        exhibits_data = [
            {
                'name': '青铜方鼎',
                'accession_number': 'GB001',
                'level': 'first',
                'category': '青铜器',
                'era': '商代',
                'description': '商代晚期青铜方鼎，器形庄重，纹饰精美。',
                'estimated_value': Decimal('5000000.00'),
                'temperature_min': 15.0,
                'temperature_max': 25.0,
                'humidity_min': 45.0,
                'humidity_max': 65.0,
            },
            {
                'name': '青花缠枝莲纹瓶',
                'accession_number': 'GB002',
                'level': 'second',
                'category': '瓷器',
                'era': '明代',
                'description': '明代永乐年间青花瓷，釉色温润，画工精细。',
                'estimated_value': Decimal('2000000.00'),
                'temperature_min': 18.0,
                'temperature_max': 22.0,
                'humidity_min': 50.0,
                'humidity_max': 60.0,
            },
            {
                'name': '山水人物画轴',
                'accession_number': 'GB003',
                'level': 'second',
                'category': '书画',
                'era': '清代',
                'description': '清代四王风格山水画，笔墨精湛，意境深远。',
                'estimated_value': Decimal('1500000.00'),
                'temperature_min': 18.0,
                'temperature_max': 22.0,
                'humidity_min': 50.0,
                'humidity_max': 55.0,
            },
            {
                'name': '玉璧',
                'accession_number': 'GB004',
                'level': 'third',
                'category': '玉器',
                'era': '汉代',
                'description': '汉代青玉璧，玉质温润，工艺古朴。',
                'estimated_value': Decimal('500000.00'),
                'temperature_min': 15.0,
                'temperature_max': 28.0,
                'humidity_min': 40.0,
                'humidity_max': 70.0,
            },
            {
                'name': '陶俑一组',
                'accession_number': 'GB005',
                'level': 'third',
                'category': '陶器',
                'era': '唐代',
                'description': '唐代彩绘陶俑，造型生动，色彩鲜艳。',
                'estimated_value': Decimal('300000.00'),
                'temperature_min': 15.0,
                'temperature_max': 25.0,
                'humidity_min': 45.0,
                'humidity_max': 65.0,
            },
            {
                'name': '古籍善本',
                'accession_number': 'GB006',
                'level': 'first',
                'category': '古籍',
                'era': '宋代',
                'description': '宋代刻本古籍，版本珍贵，具有重要历史价值。',
                'estimated_value': Decimal('8000000.00'),
                'temperature_min': 16.0,
                'temperature_max': 20.0,
                'humidity_min': 45.0,
                'humidity_max': 50.0,
            },
            {
                'name': '鎏金佛像',
                'accession_number': 'GB007',
                'level': 'second',
                'category': '造像',
                'era': '北魏',
                'description': '北魏时期鎏金铜佛像，造型优美，工艺精湛。',
                'estimated_value': Decimal('3000000.00'),
                'temperature_min': 15.0,
                'temperature_max': 25.0,
                'humidity_min': 40.0,
                'humidity_max': 60.0,
            },
            {
                'name': '紫砂茶壶',
                'accession_number': 'GB008',
                'level': 'general',
                'category': '杂项',
                'era': '清代',
                'description': '清代紫砂名家制壶，泥质细腻，形制典雅。',
                'estimated_value': Decimal('80000.00'),
                'temperature_min': 10.0,
                'temperature_max': 30.0,
                'humidity_min': 35.0,
                'humidity_max': 75.0,
            },
        ]

        for data in exhibits_data:
            exhibit, created = Exhibit.objects.get_or_create(
                accession_number=data['accession_number'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  创建展品: {exhibit.name}')

    def _create_borrowers(self):
        self.stdout.write('创建借展方...')

        borrowers_data = [
            {
                'name': '故宫博物院',
                'type': 'museum',
                'contact_person': '周文博',
                'contact_phone': '010-12345678',
                'contact_email': 'zhou@pm.org.cn',
                'address': '北京市东城区景山前街4号',
                'credit_rating': 5,
            },
            {
                'name': '上海博物馆',
                'type': 'museum',
                'contact_person': '钱馆长',
                'contact_phone': '021-87654321',
                'contact_email': 'qian@shanghaimuseum.net',
                'address': '上海市黄浦区人民大道201号',
                'credit_rating': 5,
            },
            {
                'name': '南京博物院',
                'type': 'museum',
                'contact_person': '孙主任',
                'contact_phone': '025-11112222',
                'contact_email': 'sun@njmuseum.com',
                'address': '江苏省南京市玄武区中山东路321号',
                'credit_rating': 4,
            },
            {
                'name': '北京大学考古文博学院',
                'type': 'university',
                'contact_person': '吴教授',
                'contact_phone': '010-62751234',
                'contact_email': 'wu@pku.edu.cn',
                'address': '北京市海淀区颐和园路5号',
                'credit_rating': 4,
            },
            {
                'name': '市美术馆',
                'type': 'gallery',
                'contact_person': '郑馆长',
                'contact_phone': '020-33334444',
                'contact_email': 'zheng@gz-art.org',
                'address': '广州市越秀区麓湖路',
                'credit_rating': 3,
            },
        ]

        for data in borrowers_data:
            borrower, created = Borrower.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                self.stdout.write(f'  创建借展方: {borrower.name}')

    def _create_sample_loans(self):
        self.stdout.write('创建示例出借记录...')

        clerk = User.objects.get(username='clerk')
        transport_user = User.objects.get(username='transport')
        insurance_user = User.objects.get(username='insurance')
        conservator = User.objects.get(username='conservator')

        exhibit1 = Exhibit.objects.get(accession_number='GB001')
        exhibit2 = Exhibit.objects.get(accession_number='GB002')
        exhibit3 = Exhibit.objects.get(accession_number='GB003')
        exhibit4 = Exhibit.objects.get(accession_number='GB004')
        exhibit6 = Exhibit.objects.get(accession_number='GB006')

        borrower1 = Borrower.objects.get(name='故宫博物院')
        borrower2 = Borrower.objects.get(name='上海博物馆')
        borrower3 = Borrower.objects.get(name='北京大学考古文博学院')
        borrower4 = Borrower.objects.get(name='市美术馆')

        self._create_normal_loan(exhibit2, borrower1, clerk, transport_user, insurance_user, conservator)
        self._create_insurance_insufficient_loan(exhibit6, borrower2, clerk, transport_user, insurance_user)
        self._create_environment_anomaly_loan(exhibit3, borrower3, clerk, transport_user, insurance_user)
        self._create_damage_return_loan(exhibit1, borrower4, clerk, transport_user, insurance_user, conservator)
        self._create_in_progress_loan(exhibit4, borrower2, clerk, transport_user, insurance_user)

    def _create_normal_loan(self, exhibit, borrower, clerk, transport_user, insurance_user, conservator):
        self.stdout.write('  创建正常出借样本（已完成）...')

        loan = LoanApplication.objects.create(
            loan_number='JL202401010001',
            exhibit=exhibit,
            borrower=borrower,
            purpose='联合展览"古代青铜艺术珍品展"',
            planned_start_date=timezone.now().date() - timedelta(days=60),
            planned_end_date=timezone.now().date() - timedelta(days=10),
            actual_start_date=timezone.now().date() - timedelta(days=58),
            actual_end_date=timezone.now().date() - timedelta(days=12),
            status='completed',
            submitted_by=clerk,
            submitted_at=timezone.now() - timedelta(days=62),
        )

        StatusHistory.objects.create(loan=loan, to_status='draft', changed_by=clerk, change_reason='创建出借申请', changed_at=timezone.now() - timedelta(days=65))
        StatusHistory.objects.create(loan=loan, from_status='draft', to_status='submitted', changed_by=clerk, change_reason='馆藏经办人提交', changed_at=timezone.now() - timedelta(days=62))
        StatusHistory.objects.create(loan=loan, from_status='submitted', to_status='transport_registered', changed_by=transport_user, change_reason='运输信息已登记', changed_at=timezone.now() - timedelta(days=61))
        StatusHistory.objects.create(loan=loan, from_status='transport_registered', to_status='insurance_approved', changed_by=insurance_user, change_reason='保险复核通过', changed_at=timezone.now() - timedelta(days=60))
        StatusHistory.objects.create(loan=loan, from_status='insurance_approved', to_status='out_of_storage', changed_by=clerk, change_reason='展品已出库', changed_at=timezone.now() - timedelta(days=58))
        StatusHistory.objects.create(loan=loan, from_status='out_of_storage', to_status='arrived', changed_by=transport_user, change_reason='展品已到达', changed_at=timezone.now() - timedelta(days=56))
        StatusHistory.objects.create(loan=loan, from_status='arrived', to_status='on_display', changed_by=clerk, change_reason='展品开始展出', changed_at=timezone.now() - timedelta(days=55))
        StatusHistory.objects.create(loan=loan, from_status='on_display', to_status='returning', changed_by=clerk, change_reason='开始归还', changed_at=timezone.now() - timedelta(days=15))
        StatusHistory.objects.create(loan=loan, from_status='returning', to_status='inspection_pending', changed_by=transport_user, change_reason='展品已归还，待鉴定', changed_at=timezone.now() - timedelta(days=12))
        StatusHistory.objects.create(loan=loan, from_status='inspection_pending', to_status='inspection_done', changed_by=conservator, change_reason='归还鉴定完成', changed_at=timezone.now() - timedelta(days=11))
        StatusHistory.objects.create(loan=loan, from_status='inspection_done', to_status='completed', changed_by=clerk, change_reason='出借流程完成', changed_at=timezone.now() - timedelta(days=10))

        TransportRecord.objects.create(
            loan=loan,
            route_from='本馆',
            route_to=borrower.name,
            transport_company='安泰文物运输有限公司',
            vehicle_number='京A·88888',
            driver_name='王师傅',
            driver_phone='13800138001',
            packing_method='专业文物包装（防震、防潮）',
            estimated_departure=timezone.now() - timedelta(days=58),
            estimated_arrival=timezone.now() - timedelta(days=56),
            actual_departure=timezone.now() - timedelta(days=58, hours=8),
            actual_arrival=timezone.now() - timedelta(days=56, hours=15),
            registered_by=transport_user,
            notes='全程恒温恒湿运输'
        )

        policy = InsurancePolicy.objects.create(
            loan=loan,
            policy_number='PICC20240101001',
            insurance_company='中国人保财险',
            amount=Decimal('2500000.00'),
            coverage_type='一切险（含运输险）',
            start_date=timezone.now().date() - timedelta(days=60),
            end_date=timezone.now().date() - timedelta(days=5),
            status='approved',
            reviewed_by=insurance_user,
            reviewed_at=timezone.now() - timedelta(days=60),
            review_notes='保额充足，保险条款完整，同意承保。',
        )

        for i in range(5):
            EnvironmentData.objects.create(
                loan=loan,
                record_time=timezone.now() - timedelta(days=57 - i),
                temperature=20.0 + i * 0.5,
                humidity=52.0 + i,
                location='运输途中',
                is_anomaly=False,
                recorded_by=transport_user
            )

        ReturnInspection.objects.create(
            loan=loan,
            return_date=timezone.now().date() - timedelta(days=12),
            condition='perfect',
            description='展品完好无损，与出库时状态一致。包装完整，无磕碰、划痕。',
            photos='照片记录齐全，出库、到达、归还各阶段照片均有留存。',
            conservator=conservator,
            inspection_date=timezone.now().date() - timedelta(days=11),
            recommendations='无需特殊处理，可正常入库。',
        )

        exhibit.status = 'in_storage'
        exhibit.save()

        self.stdout.write(f'    出借单: {loan.loan_number} - {exhibit.name}')

    def _create_insurance_insufficient_loan(self, exhibit, borrower, clerk, transport_user, insurance_user):
        self.stdout.write('  创建保险额度不足样本...')

        loan = LoanApplication.objects.create(
            loan_number='JL202402010002',
            exhibit=exhibit,
            borrower=borrower,
            purpose='宋版古籍精品展',
            planned_start_date=timezone.now().date() + timedelta(days=5),
            planned_end_date=timezone.now().date() + timedelta(days=35),
            status='insurance_pending',
            submitted_by=clerk,
            submitted_at=timezone.now() - timedelta(days=2),
        )

        StatusHistory.objects.create(loan=loan, to_status='draft', changed_by=clerk, change_reason='创建出借申请', changed_at=timezone.now() - timedelta(days=5))
        StatusHistory.objects.create(loan=loan, from_status='draft', to_status='submitted', changed_by=clerk, change_reason='馆藏经办人提交', changed_at=timezone.now() - timedelta(days=4))
        StatusHistory.objects.create(loan=loan, from_status='submitted', to_status='transport_registered', changed_by=transport_user, change_reason='运输信息已登记', changed_at=timezone.now() - timedelta(days=3))
        StatusHistory.objects.create(loan=loan, from_status='transport_registered', to_status='insurance_pending', changed_by=insurance_user, change_reason='已添加保险单，待复核', changed_at=timezone.now() - timedelta(days=2))

        TransportRecord.objects.create(
            loan=loan,
            route_from='本馆',
            route_to=borrower.name,
            transport_company='安泰文物运输有限公司',
            vehicle_number='京A·66666',
            driver_name='李师傅',
            driver_phone='13800138002',
            packing_method='古籍专用包装（恒温恒湿、防震）',
            estimated_departure=timezone.now() + timedelta(days=5),
            estimated_arrival=timezone.now() + timedelta(days=7),
            registered_by=transport_user,
            notes='需特别注意温湿度控制'
        )

        InsurancePolicy.objects.create(
            loan=loan,
            policy_number='PICC20240201002',
            insurance_company='中国人保财险',
            amount=Decimal('5000000.00'),
            coverage_type='古籍专项保险',
            start_date=timezone.now().date() + timedelta(days=3),
            end_date=timezone.now().date() + timedelta(days=40),
            status='pending',
        )

        exhibit.status = 'in_storage'
        exhibit.save()

        self.stdout.write(f'    出借单: {loan.loan_number} - {exhibit.name} (保额不足，缺口300万)')

    def _create_environment_anomaly_loan(self, exhibit, borrower, clerk, transport_user, insurance_user):
        self.stdout.write('  创建运输温湿度异常样本...')

        loan = LoanApplication.objects.create(
            loan_number='JL202403010003',
            exhibit=exhibit,
            borrower=borrower,
            purpose='教学展览"中国古代书画艺术"',
            planned_start_date=timezone.now().date() - timedelta(days=20),
            planned_end_date=timezone.now().date() + timedelta(days=10),
            actual_start_date=timezone.now().date() - timedelta(days=18),
            status='on_display',
            submitted_by=clerk,
            submitted_at=timezone.now() - timedelta(days=25),
        )

        StatusHistory.objects.create(loan=loan, to_status='draft', changed_by=clerk, change_reason='创建出借申请', changed_at=timezone.now() - timedelta(days=28))
        StatusHistory.objects.create(loan=loan, from_status='draft', to_status='submitted', changed_by=clerk, change_reason='馆藏经办人提交', changed_at=timezone.now() - timedelta(days=25))
        StatusHistory.objects.create(loan=loan, from_status='submitted', to_status='transport_registered', changed_by=transport_user, change_reason='运输信息已登记', changed_at=timezone.now() - timedelta(days=24))
        StatusHistory.objects.create(loan=loan, from_status='transport_registered', to_status='insurance_approved', changed_by=insurance_user, change_reason='保险复核通过', changed_at=timezone.now() - timedelta(days=22))
        StatusHistory.objects.create(loan=loan, from_status='insurance_approved', to_status='out_of_storage', changed_by=clerk, change_reason='展品已出库', changed_at=timezone.now() - timedelta(days=20))
        StatusHistory.objects.create(loan=loan, from_status='out_of_storage', to_status='in_transit', changed_by=transport_user, change_reason='运输途中', changed_at=timezone.now() - timedelta(days=19))
        StatusHistory.objects.create(loan=loan, from_status='in_transit', to_status='arrived', changed_by=transport_user, change_reason='展品已到达', changed_at=timezone.now() - timedelta(days=18))
        StatusHistory.objects.create(loan=loan, from_status='arrived', to_status='on_display', changed_by=clerk, change_reason='开始展出', changed_at=timezone.now() - timedelta(days=17))

        TransportRecord.objects.create(
            loan=loan,
            route_from='本馆',
            route_to=borrower.name,
            transport_company='安泰文物运输有限公司',
            vehicle_number='京A·99999',
            driver_name='张师傅',
            driver_phone='13800138003',
            packing_method='书画专用包装',
            estimated_departure=timezone.now() - timedelta(days=20),
            estimated_arrival=timezone.now() - timedelta(days=18),
            actual_departure=timezone.now() - timedelta(days=20, hours=9),
            actual_arrival=timezone.now() - timedelta(days=18, hours=14),
            registered_by=transport_user,
        )

        InsurancePolicy.objects.create(
            loan=loan,
            policy_number='PICC20240301003',
            insurance_company='中国人保财险',
            amount=Decimal('2000000.00'),
            coverage_type='书画一切险',
            start_date=timezone.now().date() - timedelta(days=21),
            end_date=timezone.now().date() + timedelta(days=15),
            status='approved',
            reviewed_by=insurance_user,
            reviewed_at=timezone.now() - timedelta(days=22),
            review_notes='保额超过估值，保险条款完整。',
        )

        env_data_list = [
            (timezone.now() - timedelta(days=19, hours=10), 20.5, 52.0, '运输途中-第一天', False, ''),
            (timezone.now() - timedelta(days=19, hours=16), 22.0, 55.0, '运输途中-第一天下午', False, ''),
            (timezone.now() - timedelta(days=19, hours=22), 28.5, 40.0, '运输途中-夜间', True, '温度过高、湿度过低'),
            (timezone.now() - timedelta(days=18, hours=4), 26.0, 42.0, '运输途中-第二天凌晨', True, '温度过高、湿度过低'),
            (timezone.now() - timedelta(days=18, hours=10), 21.0, 53.0, '运输途中-第二天上午', False, ''),
            (timezone.now() - timedelta(days=15), 20.0, 52.0, '展厅', False, ''),
            (timezone.now() - timedelta(days=10), 20.5, 53.0, '展厅', False, ''),
            (timezone.now() - timedelta(days=5), 20.0, 51.0, '展厅', False, ''),
        ]

        for record_time, temp, hum, loc, is_anom, anom_type in env_data_list:
            EnvironmentData.objects.create(
                loan=loan,
                record_time=record_time,
                temperature=temp,
                humidity=hum,
                location=loc,
                is_anomaly=is_anom,
                anomaly_type=anom_type,
                recorded_by=transport_user
            )

        exhibit.status = 'on_loan'
        exhibit.save()

        self.stdout.write(f'    出借单: {loan.loan_number} - {exhibit.name} (运输途中温湿度异常)')

    def _create_damage_return_loan(self, exhibit, borrower, clerk, transport_user, insurance_user, conservator):
        self.stdout.write('  创建归还损伤样本...')

        loan = LoanApplication.objects.create(
            loan_number='JL202404010004',
            exhibit=exhibit,
            borrower=borrower,
            purpose='城市文化节展览',
            planned_start_date=timezone.now().date() - timedelta(days=40),
            planned_end_date=timezone.now().date() - timedelta(days=5),
            actual_start_date=timezone.now().date() - timedelta(days=38),
            actual_end_date=timezone.now().date() - timedelta(days=3),
            status='inspection_done',
            submitted_by=clerk,
            submitted_at=timezone.now() - timedelta(days=45),
        )

        StatusHistory.objects.create(loan=loan, to_status='draft', changed_by=clerk, change_reason='创建出借申请', changed_at=timezone.now() - timedelta(days=48))
        StatusHistory.objects.create(loan=loan, from_status='draft', to_status='submitted', changed_by=clerk, change_reason='馆藏经办人提交', changed_at=timezone.now() - timedelta(days=45))
        StatusHistory.objects.create(loan=loan, from_status='submitted', to_status='transport_registered', changed_by=transport_user, change_reason='运输信息已登记', changed_at=timezone.now() - timedelta(days=44))
        StatusHistory.objects.create(loan=loan, from_status='transport_registered', to_status='insurance_approved', changed_by=insurance_user, change_reason='保险复核通过', changed_at=timezone.now() - timedelta(days=42))
        StatusHistory.objects.create(loan=loan, from_status='insurance_approved', to_status='out_of_storage', changed_by=clerk, change_reason='展品已出库', changed_at=timezone.now() - timedelta(days=40))
        StatusHistory.objects.create(loan=loan, from_status='out_of_storage', to_status='arrived', changed_by=transport_user, change_reason='展品已到达', changed_at=timezone.now() - timedelta(days=38))
        StatusHistory.objects.create(loan=loan, from_status='arrived', to_status='on_display', changed_by=clerk, change_reason='开始展出', changed_at=timezone.now() - timedelta(days=37))
        StatusHistory.objects.create(loan=loan, from_status='on_display', to_status='returning', changed_by=clerk, change_reason='开始归还', changed_at=timezone.now() - timedelta(days=8))
        StatusHistory.objects.create(loan=loan, from_status='returning', to_status='inspection_pending', changed_by=transport_user, change_reason='展品已归还，待鉴定', changed_at=timezone.now() - timedelta(days=5))
        StatusHistory.objects.create(loan=loan, from_status='inspection_pending', to_status='inspection_done', changed_by=conservator, change_reason='归还鉴定完成', changed_at=timezone.now() - timedelta(days=3))

        TransportRecord.objects.create(
            loan=loan,
            route_from='本馆',
            route_to=borrower.name,
            transport_company='安泰文物运输有限公司',
            vehicle_number='京A·77777',
            driver_name='赵师傅',
            driver_phone='13800138004',
            packing_method='大型文物专用包装',
            estimated_departure=timezone.now() - timedelta(days=40),
            estimated_arrival=timezone.now() - timedelta(days=38),
            actual_departure=timezone.now() - timedelta(days=40, hours=8),
            actual_arrival=timezone.now() - timedelta(days=38, hours=16),
            registered_by=transport_user,
        )

        InsurancePolicy.objects.create(
            loan=loan,
            policy_number='PICC20240401004',
            insurance_company='中国人保财险',
            amount=Decimal('6000000.00'),
            coverage_type='一切险（含运输和展览险）',
            start_date=timezone.now().date() - timedelta(days=41),
            end_date=timezone.now().date() - timedelta(days=1),
            status='approved',
            reviewed_by=insurance_user,
            reviewed_at=timezone.now() - timedelta(days=42),
            review_notes='保额充足，覆盖完整展览周期。',
        )

        ReturnInspection.objects.create(
            loan=loan,
            return_date=timezone.now().date() - timedelta(days=5),
            condition='minor_damage',
            description='归还后检查发现：鼎身右侧有轻微划痕，长约3cm，宽约0.5cm。推测为展览期间搬运或陈列时不慎碰触所致。整体结构完好，无变形、开裂。',
            photos='有出库时完好照片、展览现场照片、归还时划痕特写照片。',
            conservator=conservator,
            inspection_date=timezone.now().date() - timedelta(days=3),
            recommendations='1. 对划痕进行专业修复处理；\n2. 修复后入库观察一周；\n3. 建议后续展览增加防护展柜。',
        )

        exhibit.status = 'conserved'
        exhibit.save()

        self.stdout.write(f'    出借单: {loan.loan_number} - {exhibit.name} (轻微损伤)')

    def _create_in_progress_loan(self, exhibit, borrower, clerk, transport_user, insurance_user):
        self.stdout.write('  创建正在展出样本...')

        loan = LoanApplication.objects.create(
            loan_number='JL202405010005',
            exhibit=exhibit,
            borrower=borrower,
            purpose='玉石文化特展',
            planned_start_date=timezone.now().date() - timedelta(days=10),
            planned_end_date=timezone.now().date() + timedelta(days=20),
            actual_start_date=timezone.now().date() - timedelta(days=8),
            status='on_display',
            submitted_by=clerk,
            submitted_at=timezone.now() - timedelta(days=15),
        )

        StatusHistory.objects.create(loan=loan, to_status='draft', changed_by=clerk, change_reason='创建出借申请', changed_at=timezone.now() - timedelta(days=18))
        StatusHistory.objects.create(loan=loan, from_status='draft', to_status='submitted', changed_by=clerk, change_reason='馆藏经办人提交', changed_at=timezone.now() - timedelta(days=15))
        StatusHistory.objects.create(loan=loan, from_status='submitted', to_status='transport_registered', changed_by=transport_user, change_reason='运输信息已登记', changed_at=timezone.now() - timedelta(days=14))
        StatusHistory.objects.create(loan=loan, from_status='transport_registered', to_status='insurance_approved', changed_by=insurance_user, change_reason='保险复核通过', changed_at=timezone.now() - timedelta(days=12))
        StatusHistory.objects.create(loan=loan, from_status='insurance_approved', to_status='out_of_storage', changed_by=clerk, change_reason='展品已出库', changed_at=timezone.now() - timedelta(days=10))
        StatusHistory.objects.create(loan=loan, from_status='out_of_storage', to_status='arrived', changed_by=transport_user, change_reason='展品已到达', changed_at=timezone.now() - timedelta(days=8))
        StatusHistory.objects.create(loan=loan, from_status='arrived', to_status='on_display', changed_by=clerk, change_reason='开始展出', changed_at=timezone.now() - timedelta(days=7))

        TransportRecord.objects.create(
            loan=loan,
            route_from='本馆',
            route_to=borrower.name,
            transport_company='安泰文物运输有限公司',
            vehicle_number='京A·55555',
            driver_name='孙师傅',
            driver_phone='13800138005',
            packing_method='玉器专用包装',
            estimated_departure=timezone.now() - timedelta(days=10),
            estimated_arrival=timezone.now() - timedelta(days=8),
            actual_departure=timezone.now() - timedelta(days=10, hours=9),
            actual_arrival=timezone.now() - timedelta(days=8, hours=15),
            registered_by=transport_user,
        )

        InsurancePolicy.objects.create(
            loan=loan,
            policy_number='PICC20240501005',
            insurance_company='平安保险',
            amount=Decimal('600000.00'),
            coverage_type='玉器运输展览险',
            start_date=timezone.now().date() - timedelta(days=11),
            end_date=timezone.now().date() + timedelta(days=25),
            status='approved',
            reviewed_by=insurance_user,
            reviewed_at=timezone.now() - timedelta(days=12),
            review_notes='保额充足。',
        )

        EnvironmentData.objects.create(
            loan=loan,
            record_time=timezone.now() - timedelta(days=5),
            temperature=22.0,
            humidity=50.0,
            location='展厅',
            is_anomaly=False,
            recorded_by=transport_user
        )

        exhibit.status = 'on_loan'
        exhibit.save()

        self.stdout.write(f'    出借单: {loan.loan_number} - {exhibit.name} (展出中)')
