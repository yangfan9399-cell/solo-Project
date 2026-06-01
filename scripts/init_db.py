import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import User, ReworkOrder, ReworkStep, ProcessGuide, Inspection, StatusLog, ExceptionFeedback
from app.constants import UserRole, ReworkStatus, DefectCategory
from datetime import datetime, timedelta
import random


def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).count() > 0:
            print("数据库已存在数据，跳过初始化")
            return

        print("开始初始化示例数据...")

        users = [
            User(username="demo_leader", name="张班长", role=UserRole.LINE_LEADER),
            User(username="demo_quality", name="李质检员", role=UserRole.QUALITY_INSPECTOR),
            User(username="demo_engineer", name="王工程师", role=UserRole.PROCESS_ENGINEER),
        ]
        db.add_all(users)
        db.flush()

        guides = [
            ProcessGuide(
                title="表面划痕返工指导",
                defect_category=DefectCategory.SURFACE,
                content="""1. 检查划痕深度和位置
2. 使用800目砂纸轻轻打磨
3. 再用1200目砂纸抛光
4. 清洁表面，检查效果
5. 必要时进行补漆处理

注意事项：
- 打磨时保持力度均匀
- 避免过度打磨导致尺寸超差""",
                author_id=users[2].id
            ),
            ProcessGuide(
                title="尺寸偏差校正指导",
                defect_category=DefectCategory.DIMENSION,
                content="""1. 使用三坐标测量仪确认偏差值
2. 分析偏差原因（加工/装配）
3. 对于可校正零件，采用磨削/铣削修正
4. 不可校正零件评估是否让步接收
5. 重新测量验证校正结果""",
                author_id=users[2].id
            ),
            ProcessGuide(
                title="装配问题返工指导",
                defect_category=DefectCategory.ASSEMBLY,
                content="""1. 拆解有问题的装配部件
2. 检查各零件尺寸和状态
3. 清洁配合面
4. 更换损坏的密封件或紧固件
5. 按工艺文件重新装配
6. 进行装配质量检查""",
                author_id=users[2].id
            ),
            ProcessGuide(
                title="材料缺陷处理指导",
                defect_category=DefectCategory.MATERIAL,
                content="""1. 确认材料缺陷类型（裂纹/夹杂/气孔）
2. 评估对性能的影响
3. 轻微缺陷可进行焊补修复
4. 严重缺陷建议报废
5. 记录并反馈给供应商""",
                author_id=users[2].id
            ),
        ]
        db.add_all(guides)
        db.flush()

        products = [
            ("电机壳体", "DJ-001"),
            ("轴承座", "ZC-002"),
            ("齿轮箱", "CL-003"),
            ("端盖", "DG-004"),
            ("输出轴", "SC-005"),
        ]

        defect_descriptions = {
            DefectCategory.SURFACE: "表面存在明显划痕，影响外观质量",
            DefectCategory.DIMENSION: "关键尺寸超差，超出公差范围",
            DefectCategory.ASSEMBLY: "装配间隙过大，存在异响",
            DefectCategory.MATERIAL: "铸件内部存在气孔缺陷",
            DefectCategory.FUNCTION: "性能测试不达标",
            DefectCategory.OTHER: "其他质量问题",
        }

        statuses = [
            ReworkStatus.PENDING,
            ReworkStatus.ASSIGNED,
            ReworkStatus.IN_PROGRESS,
            ReworkStatus.REINSPECTION,
            ReworkStatus.APPROVED,
            ReworkStatus.SCRAP,
        ]

        for i in range(15):
            product_name, product_code = random.choice(products)
            defect_category = random.choice(list(DefectCategory))
            status = random.choice(statuses)
            created_at = datetime.utcnow() - timedelta(days=random.randint(0, 30))

            order_no = f"RW{created_at.strftime('%Y%m%d')}{i+1:04d}"

            rework = ReworkOrder(
                order_no=order_no,
                product_name=product_name,
                product_code=product_code,
                batch_no=f"BATCH{2024001 + i}",
                quantity=random.randint(1, 20),
                defect_category=defect_category,
                defect_description=defect_descriptions[defect_category],
                status=status,
                creator_id=users[0].id,
                assignee_id=users[1].id if status != ReworkStatus.PENDING else None,
                process_guide_id=guides[0].id if defect_category == DefectCategory.SURFACE else None,
                created_at=created_at,
                updated_at=created_at,
                completed_at=created_at + timedelta(hours=random.randint(2, 48)) if status in [ReworkStatus.APPROVED, ReworkStatus.SCRAP] else None,
            )
            db.add(rework)
            db.flush()

            steps = [
                ReworkStep(
                    rework_order_id=rework.id,
                    step_order=1,
                    step_name="缺陷确认",
                    step_description="确认缺陷位置和严重程度",
                    is_completed=1 if status != ReworkStatus.PENDING else 0,
                ),
                ReworkStep(
                    rework_order_id=rework.id,
                    step_order=2,
                    step_name="返工处理",
                    step_description="按工艺指导进行返工操作",
                    is_completed=1 if status in [ReworkStatus.REINSPECTION, ReworkStatus.APPROVED] else 0,
                ),
                ReworkStep(
                    rework_order_id=rework.id,
                    step_order=3,
                    step_name="自检确认",
                    step_description="完成返工后进行自检",
                    is_completed=1 if status in [ReworkStatus.REINSPECTION, ReworkStatus.APPROVED] else 0,
                ),
            ]
            db.add_all(steps)

            if status in [ReworkStatus.APPROVED, ReworkStatus.SCRAP]:
                inspection = Inspection(
                    rework_order_id=rework.id,
                    inspector_id=users[1].id,
                    result="pass" if status == ReworkStatus.APPROVED else "fail",
                    quantity_passed=rework.quantity if status == ReworkStatus.APPROVED else 0,
                    quantity_failed=0 if status == ReworkStatus.APPROVED else rework.quantity,
                    remarks="复检合格" if status == ReworkStatus.APPROVED else "无法修复，建议报废",
                    created_at=created_at + timedelta(hours=random.randint(1, 24)),
                )
                db.add(inspection)

        exceptions = [
            ExceptionFeedback(
                rework_order_id=None,
                reporter_id=users[0].id,
                title="打磨设备故障",
                description="3号打磨台设备振动异常，影响打磨质量，需维修",
                priority="high",
                status="open",
                created_at=datetime.utcnow() - timedelta(hours=2),
            ),
            ExceptionFeedback(
                rework_order_id=None,
                reporter_id=users[1].id,
                title="检测量具需校准",
                description="游标卡尺编号QC-007超出校准有效期，影响测量准确性",
                priority="normal",
                status="resolved",
                created_at=datetime.utcnow() - timedelta(days=3),
                resolved_at=datetime.utcnow() - timedelta(days=2),
            ),
        ]
        db.add_all(exceptions)

        db.commit()
        print("示例数据初始化完成！")
        print(f"创建用户: {len(users)} 个")
        print(f"创建工艺指导: {len(guides)} 个")
        print(f"创建返工单: 15 个")
        print(f"创建异常反馈: {len(exceptions)} 个")
        print("\n演示账号:")
        print("  产线班长: demo_leader")
        print("  质检员: demo_quality")
        print("  工艺工程师: demo_engineer")

    except Exception as e:
        db.rollback()
        print(f"初始化失败: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
