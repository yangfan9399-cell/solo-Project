from datetime import datetime, timedelta
from models import db, VenueActivity, InjuryEvent, OnSiteTreatment, Evidence, InsuranceReport, ReviewRectification, CompensationPayment, ExceptionFeedback

def generate_event_no():
    now = datetime.now()
    return f"INJ{now.strftime('%Y%m%d')}{now.strftime('%H%M%S')}"

def seed_database():
    print("开始初始化示例数据...")
    
    activities_data = [
        {
            'activity_name': '2024春季篮球联赛',
            'venue': '主体育馆A区',
            'activity_type': '竞技比赛',
            'start_time': datetime.now() - timedelta(days=3),
            'end_time': datetime.now() + timedelta(days=2),
            'participant_count': 120,
            'organizer': '市体育局',
            'contact_phone': '13800138001',
            'remarks': '年度重要赛事'
        },
        {
            'activity_name': '青少年游泳培训班',
            'venue': '游泳馆B池',
            'activity_type': '培训教学',
            'start_time': datetime.now() - timedelta(days=10),
            'end_time': datetime.now() + timedelta(days=20),
            'participant_count': 45,
            'organizer': '腾飞培训中心',
            'contact_phone': '13800138002',
            'remarks': '每周六日上课'
        },
        {
            'activity_name': '企业团建运动会',
            'venue': '户外运动场',
            'activity_type': '团建活动',
            'start_time': datetime.now() - timedelta(days=1),
            'end_time': datetime.now() + timedelta(hours=8),
            'participant_count': 200,
            'organizer': '某科技公司',
            'contact_phone': '13800138003',
            'remarks': '全天活动'
        },
        {
            'activity_name': '羽毛球公开赛',
            'venue': '羽毛球馆',
            'activity_type': '竞技比赛',
            'start_time': datetime.now() - timedelta(days=5),
            'end_time': datetime.now() - timedelta(days=2),
            'participant_count': 80,
            'organizer': '羽毛球协会',
            'contact_phone': '13800138004',
            'remarks': '已完成'
        },
        {
            'activity_name': '健身操公开课程',
            'venue': '健身中心',
            'activity_type': '公开课程',
            'start_time': datetime.now() - timedelta(hours=2),
            'end_time': datetime.now() + timedelta(hours=1),
            'participant_count': 30,
            'organizer': '健身中心',
            'contact_phone': '13800138005',
            'remarks': ''
        }
    ]
    
    activities = []
    for data in activities_data:
        activity = VenueActivity(**data)
        db.session.add(activity)
        activities.append(activity)
    
    db.session.flush()
    
    injuries_data = [
        {
            'event_no': 'INJ2024061001',
            'activity_id': activities[0].id,
            'reporter_name': '张三',
            'reporter_role': '场馆值班员',
            'injured_name': '李四',
            'injured_gender': '男',
            'injured_age': 25,
            'injury_time': datetime.now() - timedelta(hours=5),
            'injury_location': '主体育馆A区篮球场3号场地',
            'injury_type': '扭伤',
            'injury_part': '左脚踝',
            'severity': '轻微',
            'description': '比赛中抢篮板落地时不慎扭伤左脚踝，当时无法站立，现场冰敷后可勉强行走。',
            'status': '已结案',
            'risk_level': 'low'
        },
        {
            'event_no': 'INJ2024061002',
            'activity_id': activities[1].id,
            'reporter_name': '王医生',
            'reporter_role': '医务点人员',
            'injured_name': '小明',
            'injured_gender': '男',
            'injured_age': 12,
            'injury_time': datetime.now() - timedelta(hours=2),
            'injury_location': '游泳馆B池浅水区',
            'injury_type': '擦伤',
            'injury_part': '右膝盖',
            'severity': '轻微',
            'description': '学员跳水时不慎滑到，膝盖与池边摩擦造成表皮擦伤。',
            'status': '现场处置中',
            'risk_level': 'low'
        },
        {
            'event_no': 'INJ2024061003',
            'activity_id': activities[2].id,
            'reporter_name': '刘值班',
            'reporter_role': '场馆值班员',
            'injured_name': '赵六',
            'injured_gender': '女',
            'injured_age': 32,
            'injury_time': datetime.now() - timedelta(minutes=30),
            'injury_location': '户外运动场接力赛道',
            'injury_type': '肌肉拉伤',
            'injury_part': '右大腿',
            'severity': '一般',
            'description': '参加4x100接力赛冲刺时，突然感觉右大腿后侧剧烈疼痛，无法继续跑动。',
            'status': '待处理',
            'risk_level': 'medium'
        },
        {
            'event_no': 'INJ2024060901',
            'activity_id': activities[3].id,
            'reporter_name': '李医生',
            'reporter_role': '医务点人员',
            'injured_name': '孙七',
            'injured_gender': '男',
            'injured_age': 28,
            'injury_time': datetime.now() - timedelta(days=3),
            'injury_location': '羽毛球馆2号场地',
            'injury_type': '韧带损伤',
            'injury_part': '右膝关节',
            'severity': '严重',
            'description': '比赛中急停变向时听到膝关节响声，随即肿胀疼痛，无法活动。已送医院检查，确诊为前交叉韧带部分撕裂。',
            'status': '跟进中',
            'risk_level': 'high'
        },
        {
            'event_no': 'INJ2024060801',
            'activity_id': activities[3].id,
            'reporter_name': '周值班',
            'reporter_role': '场馆值班员',
            'injured_name': '吴八',
            'injured_gender': '男',
            'injured_age': 35,
            'injury_time': datetime.now() - timedelta(days=4),
            'injury_location': '羽毛球馆休息区',
            'injury_type': '磕碰伤',
            'injury_part': '额头',
            'severity': '轻微',
            'description': '休息起身时不慎撞到桌角，额头破皮出血，已消毒包扎。',
            'status': '已归档',
            'risk_level': 'low'
        }
    ]
    
    injuries = []
    for data in injuries_data:
        injury = InjuryEvent(**data)
        db.session.add(injury)
        injuries.append(injury)
    
    db.session.flush()
    
    treatments_data = [
        {
            'event_id': injuries[0].id,
            'handler_name': '王医生',
            'treatment_time': datetime.now() - timedelta(hours=4, minutes=30),
            'measures': '1. 立即停止活动，原地休息；2. 冰敷20分钟；3. 弹力绷带加压包扎；4. 抬高患肢。',
            'vital_signs': '血压125/80mmHg，心率85次/分',
            'medication': '云南白药气雾剂',
            'referred': False,
            'next_steps': '建议休息3-5天，如疼痛加重复诊。'
        },
        {
            'event_id': injuries[1].id,
            'handler_name': '李医生',
            'treatment_time': datetime.now() - timedelta(hours=1, minutes=45),
            'measures': '1. 立即出水擦干；2. 生理盐水冲洗伤口；3. 碘伏消毒；4. 无菌敷料覆盖。',
            'vital_signs': '正常',
            'medication': '碘伏、创可贴',
            'referred': False,
            'next_steps': '每日消毒换药，保持伤口干燥。'
        },
        {
            'event_id': injuries[3].id,
            'handler_name': '王医生',
            'treatment_time': datetime.now() - timedelta(days=3),
            'measures': '1. 制动，严禁活动；2. 冰敷；3. 夹板临时固定；4. 拨打120送医。',
            'vital_signs': '血压130/85mmHg，心率90次/分',
            'medication': '冰敷处理',
            'referred': True,
            'referral_hospital': '市第一人民医院骨科',
            'next_steps': '住院检查，择期手术治疗。'
        },
        {
            'event_id': injuries[4].id,
            'handler_name': '张护士',
            'treatment_time': datetime.now() - timedelta(days=4),
            'measures': '1. 生理盐水冲洗；2. 碘伏消毒；3. 加压止血；4. 无菌敷料包扎。',
            'vital_signs': '正常',
            'medication': '碘伏、纱布',
            'referred': False,
            'next_steps': '24小时后换药，观察愈合情况。'
        }
    ]
    
    for data in treatments_data:
        db.session.add(OnSiteTreatment(**data))
    
    evidences_data = [
        {
            'event_id': injuries[0].id,
            'evidence_type': '现场照片',
            'file_name': '脚踝肿胀照片.jpg',
            'description': '受伤后脚踝肿胀情况照片',
            'uploader': '张三'
        },
        {
            'event_id': injuries[0].id,
            'evidence_type': '视频记录',
            'file_name': '现场视频.mp4',
            'description': '事发时场地监控录像片段',
            'uploader': '安保部'
        },
        {
            'event_id': injuries[3].id,
            'evidence_type': '医疗记录',
            'file_name': '医院诊断报告.pdf',
            'description': '市一医院MRI检查报告和诊断证明',
            'uploader': '王医生'
        },
        {
            'event_id': injuries[3].id,
            'evidence_type': '费用单据',
            'file_name': '医疗费用发票.jpg',
            'description': '门诊检查费用发票',
            'uploader': '家属'
        }
    ]
    
    for data in evidences_data:
        db.session.add(Evidence(**data))
    
    insurance_reports_data = [
        {
            'event_id': injuries[0].id,
            'report_no': 'INS20240610001',
            'reporter': '陈保险',
            'report_time': datetime.now() - timedelta(hours=3),
            'insurance_company': '平安保险',
            'policy_no': 'PA20240012345',
            'claimant_name': '李四',
            'claimant_contact': '13900139001',
            'estimated_amount': 500.0,
            'status': '已赔付',
            'remarks': '小额快赔案件'
        },
        {
            'event_id': injuries[3].id,
            'report_no': 'INS20240609001',
            'reporter': '陈保险',
            'report_time': datetime.now() - timedelta(days=2, hours=20),
            'insurance_company': '平安保险',
            'policy_no': 'PA20240012345',
            'claimant_name': '孙七',
            'claimant_contact': '13900139002',
            'estimated_amount': 50000.0,
            'status': '审核中',
            'remarks': '需要补充手术方案材料'
        },
        {
            'event_id': injuries[4].id,
            'report_no': 'INS20240608001',
            'reporter': '陈保险',
            'report_time': datetime.now() - timedelta(days=3, hours=12),
            'insurance_company': '平安保险',
            'policy_no': 'PA20240012345',
            'claimant_name': '吴八',
            'claimant_contact': '13900139003',
            'estimated_amount': 200.0,
            'status': '已赔付',
            'remarks': '小额快赔案件'
        }
    ]
    
    insurance_reports = []
    for data in insurance_reports_data:
        report = InsuranceReport(**data)
        db.session.add(report)
        insurance_reports.append(report)
    
    db.session.flush()
    
    reviews_data = [
        {
            'event_id': injuries[0].id,
            'reviewer': '安全管理员',
            'review_time': datetime.now() - timedelta(hours=2),
            'root_cause': '场地地面有轻微积水，运动员落地时打滑；运动员热身不充分。',
            'improvement_measures': '1. 加强场地巡检，及时清理积水；2. 比赛前提醒各队充分热身；3. 场边备齐急救物资。',
            'responsible_person': '场地主管',
            'deadline': datetime.now() + timedelta(days=3),
            'completed': True,
            'completion_note': '已完成场地检查，增加防滑警示牌。'
        },
        {
            'event_id': injuries[3].id,
            'reviewer': '安全主管',
            'review_time': datetime.now() - timedelta(days=1),
            'root_cause': '高强度比赛中运动员疲劳导致动作变形，属于竞技体育正常风险，但场地边缘保护可以加强。',
            'improvement_measures': '1. 在场地边缘增加缓冲垫；2. 比赛中增加医疗点巡视；3. 要求球队配备队医。',
            'responsible_person': '场馆经理',
            'deadline': datetime.now() + timedelta(days=7),
            'completed': False
        },
        {
            'event_id': injuries[4].id,
            'reviewer': '安全管理员',
            'review_time': datetime.now() - timedelta(days=3),
            'root_cause': '休息区桌椅摆放位置不合理，尖角突出。',
            'improvement_measures': '1. 对所有桌椅尖角进行包边处理；2. 重新规划休息区布局。',
            'responsible_person': '后勤主管',
            'deadline': datetime.now() - timedelta(days=1),
            'completed': True,
            'completion_note': '已全部完成包边处理，优化了桌椅摆放位置。'
        }
    ]
    
    for data in reviews_data:
        db.session.add(ReviewRectification(**data))
    
    payments_data = [
        {
            'event_id': injuries[0].id,
            'insurance_report_id': insurance_reports[0].id,
            'payment_no': 'PAY20240610001',
            'payment_time': datetime.now() - timedelta(hours=1),
            'amount': 480.0,
            'payment_method': '银行转账',
            'payee': '李四',
            'status': '已到账',
            'remarks': '医疗费450元，交通费30元'
        },
        {
            'event_id': injuries[4].id,
            'insurance_report_id': insurance_reports[2].id,
            'payment_no': 'PAY20240608001',
            'payment_time': datetime.now() - timedelta(days=2),
            'amount': 186.5,
            'payment_method': '银行转账',
            'payee': '吴八',
            'status': '已到账',
            'remarks': '包扎费、换药费'
        }
    ]
    
    for data in payments_data:
        db.session.add(CompensationPayment(**data))
    
    feedbacks_data = [
        {
            'event_id': injuries[1].id,
            'feedback_type': '流程问题',
            'content': '游泳馆更衣室到医务点的路线指示不清晰，家属找不到位置。',
            'feedback_by': '学员家长',
            'handled': False
        },
        {
            'event_id': injuries[3].id,
            'feedback_type': '建议',
            'content': '建议在每个场馆门口都放置急救包和AED设备，目前只有主入口有。',
            'feedback_by': '王医生',
            'handled': True,
            'handle_note': '已提交采购申请，预计下周到位。',
            'handled_at': datetime.now() - timedelta(days=1)
        }
    ]
    
    for data in feedbacks_data:
        db.session.add(ExceptionFeedback(**data))
    
    db.session.commit()
    print("示例数据初始化完成！")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        db.drop_all()
        db.create_all()
        seed_database()
