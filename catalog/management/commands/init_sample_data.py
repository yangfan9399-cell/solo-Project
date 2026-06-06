from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, date, time
from accounts.models import User
from catalog.models import BookCategory, RareBook
from reservations.models import Reservation
from circulation.models import CirculationLog
from conservation.models import DamageAssessment, Decision


class Command(BaseCommand):
    help = '初始化样本数据'

    def handle(self, *args, **options):
        self.stdout.write('开始初始化样本数据...')
        
        self._create_users()
        self._create_categories()
        self._create_books()
        self._create_reservations()
        
        self.stdout.write(self.style.SUCCESS('样本数据初始化完成！'))

    def _create_users(self):
        self.stdout.write('创建用户账号...')
        
        users_data = [
            {
                'username': 'supervisor',
                'password': '123456',
                'role': 'supervisor',
                'real_name': '张明主管',
                'email': 'supervisor@library.edu.cn',
            },
            {
                'username': 'librarian',
                'password': '123456',
                'role': 'librarian',
                'real_name': '李馆员',
                'email': 'librarian@library.edu.cn',
            },
            {
                'username': 'conservator',
                'password': '123456',
                'role': 'conservator',
                'real_name': '王修复师',
                'email': 'conservator@library.edu.cn',
            },
            {
                'username': 'teacher_reader',
                'password': '123456',
                'role': 'reader',
                'real_name': '陈教授',
                'reader_type': 'teacher',
                'institution': '历史学院',
                'has_proof': True,
                'email': 'chen@university.edu.cn',
                'phone': '13800138001',
            },
            {
                'username': 'grad_reader',
                'password': '123456',
                'role': 'reader',
                'real_name': '刘研究生',
                'reader_type': 'graduate',
                'institution': '文学院',
                'has_proof': False,
                'email': 'liu@university.edu.cn',
                'phone': '13800138002',
            },
            {
                'username': 'undergrad_reader',
                'password': '123456',
                'role': 'reader',
                'real_name': '赵本科生',
                'reader_type': 'undergrad',
                'institution': '历史学院',
                'has_proof': False,
                'email': 'zhao@university.edu.cn',
                'phone': '13800138003',
            },
        ]
        
        for user_data in users_data:
            if not User.objects.filter(username=user_data['username']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    password=user_data['password'],
                    email=user_data.get('email', ''),
                    real_name=user_data['real_name'],
                    role=user_data['role'],
                    reader_type=user_data.get('reader_type'),
                    institution=user_data.get('institution', ''),
                    has_proof=user_data.get('has_proof', False),
                    phone=user_data.get('phone', ''),
                )
                self.stdout.write(f'  - 创建用户: {user.username} ({user.real_name})')
            else:
                self.stdout.write(f'  - 用户已存在: {user_data["username"]}')

    def _create_categories(self):
        self.stdout.write('创建馆藏分类...')
        
        categories_data = [
            {'name': '普通古籍', 'code': 'GJ-PT', 'rarity_level': 'common', 'description': '明清及以后普通古籍'},
            {'name': '善本', 'code': 'GJ-SB', 'rarity_level': 'rare', 'description': '具有较高学术价值的善本'},
            {'name': '特藏珍本', 'code': 'GJ-TC', 'rarity_level': 'precious', 'description': '珍贵特藏文献，需特别保护'},
            {'name': '地方志', 'code': 'DFZ', 'rarity_level': 'rare', 'description': '各地方志文献'},
            {'name': '家谱', 'code': 'JP', 'rarity_level': 'common', 'description': '族谱、家谱类文献'},
        ]
        
        for cat_data in categories_data:
            if not BookCategory.objects.filter(code=cat_data['code']).exists():
                category = BookCategory.objects.create(**cat_data)
                self.stdout.write(f'  - 创建分类: {category.name}')
            else:
                self.stdout.write(f'  - 分类已存在: {cat_data["name"]}')

    def _create_books(self):
        self.stdout.write('创建珍本书目...')
        
        common_cat = BookCategory.objects.get(code='GJ-PT')
        rare_cat = BookCategory.objects.get(code='GJ-SB')
        precious_cat = BookCategory.objects.get(code='GJ-TC')
        local_cat = BookCategory.objects.get(code='DFZ')
        
        books_data = [
            {
                'title': '史记',
                'author': '司马迁',
                'call_number': 'GJ-PT-001',
                'category': common_cat,
                'status': 'in_stack',
                'condition': 'good',
                'description': '二十四史之首，中国第一部纪传体通史。记载了从上古传说中的黄帝时代到汉武帝太初四年间共3000多年的历史。',
                'publisher': '中华书局',
                'edition': '清乾隆武英殿本',
                'pages': 3250,
                'format_size': '线装十六开',
                'location': '古籍库A区-01架',
            },
            {
                'title': '资治通鉴',
                'author': '司马光',
                'call_number': 'GJ-PT-002',
                'category': common_cat,
                'status': 'in_stack',
                'condition': 'good',
                'description': '中国第一部编年体通史，记载了从战国到五代共1362年的史实。',
                'publisher': '中华书局',
                'edition': '元刻本',
                'pages': 4800,
                'format_size': '线装十六开',
                'location': '古籍库A区-02架',
            },
            {
                'title': '永乐大典',
                'author': '解缙等',
                'call_number': 'GJ-SB-001',
                'category': rare_cat,
                'status': 'in_stack',
                'condition': 'fair',
                'description': '明代永乐年间编纂的一部集中国古代典籍于大成的类书，是中国最大的一部类书。',
                'publisher': '翰林院',
                'edition': '明永乐元年抄本',
                'pages': 12000,
                'format_size': '线装八开',
                'location': '善本库B区-01架',
            },
            {
                'title': '四库全书',
                'author': '纪昀等',
                'call_number': 'GJ-TC-001',
                'category': precious_cat,
                'status': 'in_stack',
                'condition': 'good',
                'description': '清代乾隆时期编修的大型丛书，是中国古代最大的文化工程，对中国古典文化进行了一次最系统、最全面的总结。',
                'publisher': '武英殿',
                'edition': '清乾隆文渊阁本',
                'pages': 79000,
                'format_size': '线装十六开',
                'location': '特藏库C区-01架',
            },
            {
                'title': '山海经',
                'author': '佚名',
                'call_number': 'GJ-PT-003',
                'category': common_cat,
                'status': 'in_stack',
                'condition': 'good',
                'description': '中国先秦重要古籍，是一部富于神话传说的最古老的奇书。',
                'publisher': '商务印书馆',
                'edition': '明万历刻本',
                'pages': 320,
                'format_size': '线装十六开',
                'location': '古籍库A区-03架',
            },
            {
                'title': '水经注',
                'author': '郦道元',
                'call_number': 'GJ-SB-002',
                'category': rare_cat,
                'status': 'in_stack',
                'condition': 'fair',
                'description': '古代中国地理名著，共四十卷。作者是北魏晚期的郦道元。',
                'publisher': '世界书局',
                'edition': '明嘉靖刻本',
                'pages': 850,
                'format_size': '线装十六开',
                'location': '善本库B区-02架',
            },
            {
                'title': '江南通志',
                'author': '尹继善等',
                'call_number': 'DFZ-001',
                'category': local_cat,
                'status': 'in_stack',
                'condition': 'good',
                'description': '清代江南地区的地方志，记载了江南地区的历史、地理、人文等内容。',
                'publisher': '乾隆刻本',
                'edition': '清乾隆元年刻本',
                'pages': 2100,
                'format_size': '线装十六开',
                'location': '方志库D区-01架',
            },
            {
                'title': '文心雕龙',
                'author': '刘勰',
                'call_number': 'GJ-TC-002',
                'category': precious_cat,
                'status': 'in_stack',
                'condition': 'excellent',
                'description': '中国南朝文学理论家刘勰创作的一部理论系统、结构严密、论述细致的文学理论专著。',
                'publisher': '上海古籍出版社',
                'edition': '元至正本',
                'pages': 280,
                'format_size': '线装十六开',
                'location': '特藏库C区-02架',
            },
        ]
        
        for book_data in books_data:
            if not RareBook.objects.filter(call_number=book_data['call_number']).exists():
                book = RareBook.objects.create(**book_data)
                self.stdout.write(f'  - 创建珍本: {book.title}')
            else:
                self.stdout.write(f'  - 珍本已存在: {book_data["title"]}')

    def _create_reservations(self):
        self.stdout.write('创建预约及相关样本数据...')
        
        teacher = User.objects.get(username='teacher_reader')
        grad = User.objects.get(username='grad_reader')
        undergrad = User.objects.get(username='undergrad_reader')
        librarian = User.objects.get(username='librarian')
        conservator = User.objects.get(username='conservator')
        supervisor = User.objects.get(username='supervisor')
        
        shiji = RareBook.objects.get(call_number='GJ-PT-001')
        yongle = RareBook.objects.get(call_number='GJ-SB-001')
        sikushu = RareBook.objects.get(call_number='GJ-TC-001')
        shanhai = RareBook.objects.get(call_number='GJ-PT-003')
        wenxin = RareBook.objects.get(call_number='GJ-TC-002')
        shuijing = RareBook.objects.get(call_number='GJ-SB-002')
        
        today = timezone.now().date()
        
        # 样本1: 正常归库 - 史记
        self.stdout.write('  - 创建【正常归库】样本...')
        if not Reservation.objects.filter(book=shiji, user=teacher, status='completed').exists():
            res_date = today - timedelta(days=5)
            res1 = Reservation.objects.create(
                book=shiji,
                user=teacher,
                reserved_date=res_date,
                start_time=time(9, 0),
                end_time=time(11, 0),
                purpose='research',
                purpose_detail='汉代史学研究参考',
                status='completed',
                approved_by=librarian,
                approved_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=1), time(14, 0))
                ),
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=2), time(10, 0))
                ),
            )
            
            log1 = CirculationLog.objects.create(
                reservation=res1,
                book=shiji,
                librarian=librarian,
                checkout_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(9, 15))
                ),
                return_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(11, 0))
                ),
                condition_out='good',
                condition_out_notes='外观完好，无明显损伤',
                condition_in='good',
                condition_in_notes='归还时状况良好，与出库一致',
                reader_signature='陈教授',
                return_receiver=librarian,
            )
            
            assess1 = DamageAssessment.objects.create(
                circulation=log1,
                conservator=conservator,
                damage_level='minor',
                damage_type='other',
                damage_description='经检查，书籍状况良好，仅有自然老化痕迹，无新增损伤。',
                damage_location='无',
                previous_damage=False,
                repair_suggestion='无需修复，正常入库保存即可。建议定期检查防虫防潮。',
                needs_supervisor_review=True,
                assessed_at=timezone.make_aware(
                    timezone.datetime.combine(res_date + timedelta(days=1), time(10, 30))
                ),
            )
            
            Decision.objects.create(
                assessment=assess1,
                supervisor=supervisor,
                decision_type='return_to_stack',
                decision_reason='书籍状况良好，无新增损伤，符合正常归库条件。',
                decided_at=timezone.make_aware(
                    timezone.datetime.combine(res_date + timedelta(days=1), time(15, 0))
                ),
            )
            
            shiji.status = 'in_stack'
            shiji.save()
            self.stdout.write('    正常归库样本创建完成')
        
        # 样本2: 页面污损 - 永乐大典
        self.stdout.write('  - 创建【页面污损】样本...')
        if not Reservation.objects.filter(book=yongle, user=grad, status='completed').exists():
            res_date = today - timedelta(days=3)
            res2 = Reservation.objects.create(
                book=yongle,
                user=grad,
                reserved_date=res_date,
                start_time=time(14, 0),
                end_time=time(16, 30),
                purpose='research',
                purpose_detail='明代类书研究，毕业论文参考资料',
                status='completed',
                approved_by=librarian,
                approved_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=1), time(10, 0))
                ),
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=2), time(15, 30))
                ),
            )
            
            log2 = CirculationLog.objects.create(
                reservation=res2,
                book=yongle,
                librarian=librarian,
                checkout_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(14, 0))
                ),
                return_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(16, 30))
                ),
                condition_out='fair',
                condition_out_notes='书品一般，有旧折痕，整体完好',
                condition_in='damaged',
                condition_in_notes='发现第127页有茶渍污损，约掌心大小',
                reader_signature='刘研究生',
                return_receiver=librarian,
            )
            
            assess2 = DamageAssessment.objects.create(
                circulation=log2,
                conservator=conservator,
                damage_level='moderate',
                damage_type='stain',
                damage_description='第127页至129页有明显茶渍污渍，污渍呈不规则圆形，直径约8厘米。污渍颜色为棕黄色，已渗透至背面。纸张轻微变形，但未造成文字模糊。',
                damage_location='第127-129页，中部偏下位置',
                previous_damage=False,
                repair_suggestion='建议进行去污处理。使用专业脱酸剂和清洁剂进行污渍清理，然后进行压平处理。如处理效果不理想，可考虑托裱修复。预计修复周期约5-7个工作日。',
                estimated_cost=800.00,
                needs_supervisor_review=True,
                assessed_at=timezone.make_aware(
                    timezone.datetime.combine(res_date + timedelta(days=1), time(11, 0))
                ),
            )
            
            Decision.objects.create(
                assessment=assess2,
                supervisor=supervisor,
                decision_type='send_for_repair',
                decision_reason='中度茶渍污损，影响书页外观和保存寿命，需专业修复处理。本次损伤为读者使用不当造成，但考虑到为初次且非故意，暂不追究赔付责任。',
                decided_at=timezone.make_aware(
                    timezone.datetime.combine(res_date + timedelta(days=1), time(16, 0))
                ),
            )
            
            yongle.status = 'in_repair'
            yongle.save()
            self.stdout.write('    页面污损样本创建完成')
        
        # 样本3: 预约资格不足 - 本科生预约特藏珍本（被系统拦截）
        self.stdout.write('  - 创建【预约资格不足】样本...')
        if not Reservation.objects.filter(book=sikushu, user=undergrad, status='pending').exists():
            res3 = Reservation.objects.create(
                book=sikushu,
                user=undergrad,
                reserved_date=today + timedelta(days=3),
                start_time=time(10, 0),
                end_time=time(12, 0),
                purpose='study',
                purpose_detail='课程论文参考',
                status='pending',
                qualification_checked=True,
                qualification_notes='本科生读者仅可预约普通古籍，如需预约珍本请提供学院出具的研究证明；预约特藏珍本需提交资格证明文件',
                created_at=timezone.now() - timedelta(hours=2),
            )
            self.stdout.write('    资格不足样本创建完成')
        
        # 样本4: 调阅冲突 - 同一珍本同时段两个预约
        self.stdout.write('  - 创建【调阅冲突】样本...')
        if not Reservation.objects.filter(book=shanhai, user=teacher, status='approved').exists():
            res_date = today + timedelta(days=2)
            
            # 第一个预约 - 已通过
            res4a = Reservation.objects.create(
                book=shanhai,
                user=teacher,
                reserved_date=res_date,
                start_time=time(9, 0),
                end_time=time(11, 30),
                purpose='research',
                purpose_detail='上古神话研究',
                status='approved',
                approved_by=librarian,
                approved_at=timezone.now() - timedelta(days=1),
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.now() - timedelta(days=3),
            )
            
            shanhai.status = 'reserved'
            shanhai.save()
            
            # 第二个预约 - 待审核（有冲突）
            res4b = Reservation.objects.create(
                book=shanhai,
                user=grad,
                reserved_date=res_date,
                start_time=time(10, 30),
                end_time=time(12, 30),
                purpose='study',
                purpose_detail='先秦文学课程作业参考',
                status='pending',
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.now() - timedelta(hours=5),
            )
            self.stdout.write('    调阅冲突样本创建完成')
        
        # 样本5: 待审核预约
        self.stdout.write('  - 创建【待审核】样本...')
        if not Reservation.objects.filter(book=shuijing, user=grad, status='pending').exists():
            res5 = Reservation.objects.create(
                book=shuijing,
                user=grad,
                reserved_date=today + timedelta(days=4),
                start_time=time(13, 30),
                end_time=time(15, 30),
                purpose='research',
                purpose_detail='历史地理研究',
                status='pending',
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.now() - timedelta(hours=10),
            )
            self.stdout.write('    待审核样本创建完成')
        
        # 样本6: 阅览中
        self.stdout.write('  - 创建【阅览中】样本...')
        if not Reservation.objects.filter(book=wenxin, user=teacher, status='checked_out').exists():
            res_date = today
            res6 = Reservation.objects.create(
                book=wenxin,
                user=teacher,
                reserved_date=res_date,
                start_time=time(9, 0),
                end_time=time(12, 0),
                purpose='research',
                purpose_detail='六朝文学理论研究',
                status='checked_out',
                approved_by=librarian,
                approved_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=1), time(15, 0))
                ),
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=2), time(9, 30))
                ),
            )
            
            CirculationLog.objects.create(
                reservation=res6,
                book=wenxin,
                librarian=librarian,
                checkout_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(9, 0))
                ),
                condition_out='excellent',
                condition_out_notes='品相如新，保存极佳',
                reader_signature='陈教授',
            )
            
            wenxin.status = 'checked_out'
            wenxin.save()
            self.stdout.write('    阅览中样本创建完成')
        
        # 样本7: 待鉴定（已归还未鉴定）
        self.stdout.write('  - 创建【待鉴定】样本...')
        if not Reservation.objects.filter(book=yongle, user=teacher, status='completed').exists():
            res_date = today - timedelta(days=1)
            res7 = Reservation.objects.create(
                book=yongle,
                user=teacher,
                reserved_date=res_date,
                start_time=time(14, 0),
                end_time=time(16, 0),
                purpose='teaching',
                purpose_detail='研究生课程教学使用',
                status='completed',
                approved_by=librarian,
                approved_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=1), time(10, 0))
                ),
                qualification_checked=True,
                qualification_notes='资格核验通过',
                created_at=timezone.make_aware(
                    timezone.datetime.combine(res_date - timedelta(days=2), time(14, 0))
                ),
            )
            
            CirculationLog.objects.create(
                reservation=res7,
                book=yongle,
                librarian=librarian,
                checkout_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(14, 0))
                ),
                return_time=timezone.make_aware(
                    timezone.datetime.combine(res_date, time(16, 0))
                ),
                condition_out='fair',
                condition_out_notes='原有旧损，状况一般',
                condition_in='fair',
                condition_in_notes='归还时状况与出库基本一致',
                reader_signature='陈教授',
                return_receiver=librarian,
            )
            self.stdout.write('    待鉴定样本创建完成')
