import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nursing_home.settings')
django.setup()

from django.contrib.auth import get_user_model
from core.models import Elder
from assessments.models import (
    NursingLevel, AssessmentDimension, AssessmentItem,
    Assessment, AssessmentScore, AssessmentHistory
)
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()

def create_users():
    users = {
        'nurse': User.objects.create_user(
            username='nurse',
            password='nurse123',
            role='nurse',
            phone='13800000001'
        ),
        'doctor': User.objects.create_user(
            username='doctor',
            password='doctor123',
            role='doctor',
            phone='13800000002'
        ),
        'family': User.objects.create_user(
            username='family',
            password='family123',
            role='family',
            phone='13800000003'
        ),
        'director': User.objects.create_user(
            username='director',
            password='director123',
            role='director',
            is_staff=True,
            phone='13800000004'
        ),
    }
    
    director = users['director']
    director.is_superuser = True
    director.save()
    
    return users

def create_nursing_levels():
    levels = [
        NursingLevel.objects.create(
            level=1,
            name='一级护理',
            description='完全依赖护理，需要24小时专人照护',
            monthly_fee=8000.00,
            services='24小时专人护理、喂饭、翻身、洗澡、医疗监护'
        ),
        NursingLevel.objects.create(
            level=2,
            name='二级护理',
            description='大部分依赖护理，需要定时协助',
            monthly_fee=6000.00,
            services='定时护理、协助进食、协助洗澡、定时巡视'
        ),
        NursingLevel.objects.create(
            level=3,
            name='三级护理',
            description='部分依赖护理，需要一定协助',
            monthly_fee=4500.00,
            services='协助日常活动、定时巡视、健康监测'
        ),
        NursingLevel.objects.create(
            level=4,
            name='四级护理',
            description='基本自理，需要少量协助',
            monthly_fee=3000.00,
            services='日常巡视、健康监测、紧急情况处理'
        ),
        NursingLevel.objects.create(
            level=5,
            name='五级护理',
            description='完全自理，仅需基础服务',
            monthly_fee=2000.00,
            services='基础生活服务、健康咨询'
        ),
    ]
    return levels

def create_assessment_dimensions():
    dimensions = []
    
    dim1 = AssessmentDimension.objects.create(
        name='日常生活能力',
        description='评估长者日常生活的自理能力',
        max_score=100,
        weight=1.0,
        order=1
    )
    items1 = [
        AssessmentItem.objects.create(
            dimension=dim1,
            name='进食',
            description='能否独立完成进食动作',
            max_score=10,
            order=1,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim1,
            name='洗澡',
            description='能否独立完成洗澡动作',
            max_score=10,
            order=2,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim1,
            name='穿衣',
            description='能否独立完成穿衣动作',
            max_score=10,
            order=3,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim1,
            name='如厕',
            description='能否独立完成如厕动作',
            max_score=10,
            order=4,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim1,
            name='移动',
            description='能否独立完成移动动作',
            max_score=10,
            order=5,
            is_required=True
        ),
    ]
    dimensions.append({'dimension': dim1, 'items': items1})
    
    dim2 = AssessmentDimension.objects.create(
        name='认知能力',
        description='评估长者的认知功能状态',
        max_score=100,
        weight=0.8,
        order=2
    )
    items2 = [
        AssessmentItem.objects.create(
            dimension=dim2,
            name='记忆力',
            description='近期记忆和远期记忆能力',
            max_score=10,
            order=1,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim2,
            name='定向力',
            description='时间、地点、人物定向能力',
            max_score=10,
            order=2,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim2,
            name='计算力',
            description='简单计算能力',
            max_score=10,
            order=3,
            is_required=False
        ),
        AssessmentItem.objects.create(
            dimension=dim2,
            name='理解力',
            description='语言理解和表达能力',
            max_score=10,
            order=4,
            is_required=True
        ),
    ]
    dimensions.append({'dimension': dim2, 'items': items2})
    
    dim3 = AssessmentDimension.objects.create(
        name='精神状态',
        description='评估长者的精神心理状态',
        max_score=100,
        weight=0.6,
        order=3
    )
    items3 = [
        AssessmentItem.objects.create(
            dimension=dim3,
            name='情绪状态',
            description='情绪稳定性和心理状态',
            max_score=10,
            order=1,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim3,
            name='行为表现',
            description='日常行为表现和社交能力',
            max_score=10,
            order=2,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim3,
            name='睡眠质量',
            description='睡眠情况和作息规律',
            max_score=10,
            order=3,
            is_required=False
        ),
    ]
    dimensions.append({'dimension': dim3, 'items': items3})
    
    dim4 = AssessmentDimension.objects.create(
        name='健康状况',
        description='评估长者的身体健康状况',
        max_score=100,
        weight=0.7,
        order=4
    )
    items4 = [
        AssessmentItem.objects.create(
            dimension=dim4,
            name='慢性病管理',
            description='慢性病控制情况',
            max_score=10,
            order=1,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim4,
            name='用药情况',
            description='药物管理和依从性',
            max_score=10,
            order=2,
            is_required=True
        ),
        AssessmentItem.objects.create(
            dimension=dim4,
            name='生命体征',
            description='血压、心率等生命体征稳定性',
            max_score=10,
            order=3,
            is_required=True
        ),
    ]
    dimensions.append({'dimension': dim4, 'items': items4})
    
    return dimensions

def create_elders(users):
    elders = [
        Elder.objects.create(
            name='张三',
            gender='M',
            birth_date=date(1945, 5, 15),
            id_number='110101194505150001',
            floor='1楼',
            room_number='101',
            bed_number='A',
            admission_date=date(2023, 1, 10),
            medical_history='高血压、糖尿病',
            allergies='无',
            emergency_contact='张子',
            emergency_phone='13900000001'
        ),
        Elder.objects.create(
            name='李四',
            gender='F',
            birth_date=date(1950, 8, 20),
            id_number='110101195008200002',
            floor='2楼',
            room_number='201',
            bed_number='B',
            admission_date=date(2023, 3, 15),
            medical_history='冠心病',
            allergies='青霉素',
            emergency_contact='李女',
            emergency_phone='13900000002'
        ),
        Elder.objects.create(
            name='王五',
            gender='M',
            birth_date=date(1948, 3, 10),
            id_number='110101194803100003',
            floor='3楼',
            room_number='301',
            bed_number='C',
            admission_date=date(2023, 6, 20),
            medical_history='脑梗后遗症',
            allergies='无',
            emergency_contact='王女',
            emergency_phone='13900000003'
        ),
        Elder.objects.create(
            name='赵六',
            gender='F',
            birth_date=date(1955, 12, 5),
            id_number='110101195512050004',
            floor='1楼',
            room_number='102',
            bed_number='D',
            admission_date=date(2024, 1, 5),
            medical_history='骨质疏松',
            allergies='磺胺类药物',
            emergency_contact='赵子',
            emergency_phone='13900000004'
        ),
    ]
    
    for elder in elders:
        elder.family_members.add(users['family'])
    
    level3 = NursingLevel.objects.get(level=3)
    level4 = NursingLevel.objects.get(level=4)
    
    elders[0].current_nursing_level = level3
    elders[0].current_monthly_fee = level3.monthly_fee
    elders[0].save()
    
    elders[1].current_nursing_level = level4
    elders[1].current_monthly_fee = level4.monthly_fee
    elders[1].save()
    
    elders[2].current_nursing_level = level3
    elders[2].current_monthly_fee = level3.monthly_fee
    elders[2].save()
    
    return elders

def create_sample_assessments(users, elders, dimensions):
    level1 = NursingLevel.objects.get(level=1)
    level2 = NursingLevel.objects.get(level=2)
    level3 = NursingLevel.objects.get(level=3)
    level4 = NursingLevel.objects.get(level=4)
    
    sample1 = create_level_unchanged_assessment(users, elders[0], level3, level3, dimensions)
    sample2 = create_upgrade_assessment(users, elders[1], level4, level2, dimensions)
    sample3 = create_objection_assessment(users, elders[2], level3, level1, dimensions)
    sample4 = create_missing_items_assessment(users, elders[3], dimensions)
    
    return [sample1, sample2, sample3, sample4]

def create_level_unchanged_assessment(users, elder, old_level, new_level, dimensions):
    assessment = Assessment.objects.create(
        elder=elder,
        nurse=users['nurse'],
        nursing_level=new_level,
        previous_nursing_level=old_level,
        previous_monthly_fee=old_level.monthly_fee,
        new_monthly_fee=new_level.monthly_fee,
        assessment_date=date.today() - timedelta(days=30),
        assessment_reason='定期评估',
        nurse_notes='长者状态稳定，建议维持原等级',
        status='approved',
        doctor=users['doctor'],
        doctor_confirmed_at=timezone.now() - timedelta(days=28),
        doctor_notes='同意维持原等级',
        family_member=users['family'],
        family_confirmed_at=timezone.now() - timedelta(days=25),
        family_agreed=True,
        family_notes='同意维持原等级',
        director=users['director'],
        director_confirmed_at=timezone.now() - timedelta(days=20),
        director_approved=True,
        director_notes='批准生效',
        effective_at=timezone.now() - timedelta(days=20)
    )
    
    for dim_data in dimensions:
        for item in dim_data['items']:
            if item.is_required:
                AssessmentScore.objects.create(
                    assessment=assessment,
                    item=item,
                    score=7,
                    notes='状态良好'
                )
    
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='create',
        user=users['nurse'],
        to_status='draft',
        notes='创建评估记录'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='submit',
        user=users['nurse'],
        from_status='draft',
        to_status='pending_doctor',
        notes='提交审核'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='doctor_confirm',
        user=users['doctor'],
        from_status='pending_doctor',
        to_status='pending_family',
        notes='医生确认'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='family_confirm',
        user=users['family'],
        from_status='pending_family',
        to_status='pending_director',
        notes='家属同意'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='director_approve',
        user=users['director'],
        from_status='pending_director',
        to_status='approved',
        notes='批准生效'
    )
    
    return assessment

def create_upgrade_assessment(users, elder, old_level, new_level, dimensions):
    assessment = Assessment.objects.create(
        elder=elder,
        nurse=users['nurse'],
        nursing_level=new_level,
        previous_nursing_level=old_level,
        previous_monthly_fee=old_level.monthly_fee,
        new_monthly_fee=new_level.monthly_fee,
        assessment_date=date.today() - timedelta(days=15),
        assessment_reason='健康状况变化，需要升级护理',
        nurse_notes='长者近期行动不便，建议升级护理等级',
        status='approved',
        doctor=users['doctor'],
        doctor_confirmed_at=timezone.now() - timedelta(days=13),
        doctor_notes='同意升级护理等级',
        family_member=users['family'],
        family_confirmed_at=timezone.now() - timedelta(days=10),
        family_agreed=True,
        family_notes='同意升级护理等级',
        director=users['director'],
        director_confirmed_at=timezone.now() - timedelta(days=5),
        director_approved=True,
        director_notes='批准生效',
        effective_at=timezone.now() - timedelta(days=5)
    )
    
    for dim_data in dimensions:
        for item in dim_data['items']:
            if item.is_required:
                score = 4 if dim_data['dimension'].name == '日常生活能力' else 6
                AssessmentScore.objects.create(
                    assessment=assessment,
                    item=item,
                    score=score,
                    notes='需要协助'
                )
    
    elder.current_nursing_level = new_level
    elder.current_monthly_fee = new_level.monthly_fee
    elder.save()
    
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='create',
        user=users['nurse'],
        to_status='draft',
        notes='创建评估记录'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='submit',
        user=users['nurse'],
        from_status='draft',
        to_status='pending_doctor',
        notes='提交审核'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='doctor_confirm',
        user=users['doctor'],
        from_status='pending_doctor',
        to_status='pending_family',
        notes='医生确认'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='family_confirm',
        user=users['family'],
        from_status='pending_family',
        to_status='pending_director',
        notes='家属同意'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='director_approve',
        user=users['director'],
        from_status='pending_director',
        to_status='approved',
        notes='批准生效'
    )
    
    return assessment

def create_objection_assessment(users, elder, old_level, new_level, dimensions):
    assessment = Assessment.objects.create(
        elder=elder,
        nurse=users['nurse'],
        nursing_level=new_level,
        previous_nursing_level=old_level,
        previous_monthly_fee=old_level.monthly_fee,
        new_monthly_fee=new_level.monthly_fee,
        assessment_date=date.today() - timedelta(days=10),
        assessment_reason='健康状况恶化',
        nurse_notes='长者脑梗后遗症加重，建议升级一级护理',
        status='approved',
        doctor=users['doctor'],
        doctor_confirmed_at=timezone.now() - timedelta(days=8),
        doctor_notes='同意升级一级护理',
        family_member=users['family'],
        family_confirmed_at=timezone.now() - timedelta(days=5),
        family_agreed=False,
        family_notes='对费用增加有异议',
        objection_reason='费用增加过多，希望维持原等级',
        director=users['director'],
        director_confirmed_at=timezone.now() - timedelta(days=2),
        director_approved=True,
        director_notes='考虑到长者实际需要，批准生效',
        effective_at=timezone.now() - timedelta(days=2)
    )
    
    for dim_data in dimensions:
        for item in dim_data['items']:
            if item.is_required:
                score = 3 if dim_data['dimension'].name == '日常生活能力' else 5
                AssessmentScore.objects.create(
                    assessment=assessment,
                    item=item,
                    score=score,
                    notes='严重依赖'
                )
    
    elder.current_nursing_level = new_level
    elder.current_monthly_fee = new_level.monthly_fee
    elder.save()
    
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='create',
        user=users['nurse'],
        to_status='draft',
        notes='创建评估记录'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='submit',
        user=users['nurse'],
        from_status='draft',
        to_status='pending_doctor',
        notes='提交审核'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='doctor_confirm',
        user=users['doctor'],
        from_status='pending_doctor',
        to_status='pending_family',
        notes='医生确认'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='family_confirm',
        user=users['family'],
        from_status='pending_family',
        to_status='pending_director',
        notes='家属异议: 费用增加过多'
    )
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='director_approve',
        user=users['director'],
        from_status='pending_director',
        to_status='approved',
        notes='批准生效'
    )
    
    return assessment

def create_missing_items_assessment(users, elder, dimensions):
    assessment = Assessment.objects.create(
        elder=elder,
        nurse=users['nurse'],
        nursing_level=NursingLevel.objects.get(level=2),
        assessment_date=date.today(),
        assessment_reason='新入住评估',
        nurse_notes='新入住长者，进行初始评估',
        status='draft'
    )
    
    dim1 = AssessmentDimension.objects.get(name='日常生活能力')
    for item in dim1.items.filter(is_required=True):
        AssessmentScore.objects.create(
            assessment=assessment,
            item=item,
            score=6,
            notes='基本自理'
        )
    
    dim4 = AssessmentDimension.objects.get(name='健康状况')
    for item in dim4.items.filter(is_required=True):
        if item.name == '生命体征':
            continue
        AssessmentScore.objects.create(
            assessment=assessment,
            item=item,
            score=7,
            notes='良好'
        )
    
    AssessmentHistory.objects.create(
        assessment=assessment,
        action='create',
        user=users['nurse'],
        to_status='draft',
        notes='创建评估记录（部分项目未填写）'
    )
    
    return assessment

def main():
    print('开始创建初始数据...')
    
    print('创建用户...')
    users = create_users()
    
    print('创建护理等级...')
    levels = create_nursing_levels()
    
    print('创建评估维度...')
    dimensions = create_assessment_dimensions()
    
    print('创建长者...')
    elders = create_elders(users)
    
    print('创建样本评估...')
    assessments = create_sample_assessments(users, elders, dimensions)
    
    print('初始数据创建完成！')
    print('\n测试账号：')
    print('护士: nurse / nurse123')
    print('医生: doctor / doctor123')
    print('家属: family / family123')
    print('院长: director / director123')
    print('\n样本数据类型：')
    print('1. 等级不变样本 - 张三')
    print('2. 护理升级样本 - 李四')
    print('3. 家属异议样本 - 王五')
    print('4. 评估表缺项样本 - 赵六')

if __name__ == '__main__':
    main()