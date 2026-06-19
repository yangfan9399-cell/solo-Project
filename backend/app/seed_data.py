from datetime import datetime
from sqlalchemy.orm import Session

from . import models, schemas, crud


def seed_database(db: Session):
    if db.query(models.Specimen).count() > 0:
        return

    specimens_data = [
        {
            "status": "已锁定",
            "specimen_no": "LICHEN-2024-001",
            "collection_point": "武夷山黄岗山",
            "collection_coords": {"lat": 27.8567, "lng": 117.6833},
            "collection_altitude": 2158,
            "substrate": "树皮",
            "spore_density": "高",
            "humidity_exposure": "湿润",
            "collection_source": "野外采集",
            "micrograph_url": "/images/lichen-001.jpg",
            "interpreter_opinion": "经形态学和分子生物学鉴定，确认该标本为Parmelia sulcata，特征性裂片边缘具纤毛，子囊盘茶褐色。",
            "original_belongs_to": "梅衣属",
            "current_belongs_to": "梅衣属",
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "春",
            "collection_date": datetime(2024, 4, 15, 10, 30)
        },
        {
            "status": "复判中",
            "specimen_no": "LICHEN-2024-002",
            "collection_point": "武夷山黄岗山",
            "collection_coords": {"lat": 27.8567, "lng": 117.6833},
            "collection_altitude": 2158,
            "substrate": "树皮",
            "spore_density": "中",
            "humidity_exposure": "适中",
            "collection_source": "复测",
            "micrograph_url": "/images/lichen-002.jpg",
            "interpreter_opinion": "复测样本，与春季样本相比，孢子密度有所下降，形态特征略有差异，需进一步确认是否为同一种。",
            "original_belongs_to": "梅衣属",
            "current_belongs_to": "待确认",
            "is_remeasure": True,
            "parent_specimen_id": 1,
            "season": "秋",
            "collection_date": datetime(2024, 10, 20, 14, 0)
        },
        {
            "status": "待接收",
            "specimen_no": "LICHEN-2024-003",
            "collection_point": "黄山光明顶",
            "collection_coords": {"lat": 30.1234, "lng": 118.1567},
            "collection_altitude": 1864,
            "substrate": "岩石",
            "spore_density": "低",
            "humidity_exposure": "干燥",
            "collection_source": "野外采集",
            "micrograph_url": "/images/lichen-003.jpg",
            "interpreter_opinion": None,
            "original_belongs_to": "石蕊属",
            "current_belongs_to": None,
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "夏",
            "collection_date": datetime(2024, 7, 8, 9, 15)
        },
        {
            "status": "已退回",
            "specimen_no": "LICHEN-2024-004",
            "collection_point": "长白山天池",
            "collection_coords": {"lat": 42.0123, "lng": 128.0678},
            "collection_altitude": 2189,
            "substrate": "苔藓层",
            "spore_density": "无",
            "humidity_exposure": "湿润",
            "collection_source": "送检",
            "micrograph_url": None,
            "interpreter_opinion": None,
            "original_belongs_to": "地卷属",
            "current_belongs_to": None,
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "冬",
            "collection_date": datetime(2024, 1, 25, 11, 45)
        },
        {
            "status": "已锁定",
            "specimen_no": "LICHEN-2024-005",
            "collection_point": "峨眉山金顶",
            "collection_coords": {"lat": 29.5234, "lng": 103.3345},
            "collection_altitude": 3077,
            "substrate": "树皮",
            "spore_density": "高",
            "humidity_exposure": "水淹",
            "collection_source": "野外采集",
            "micrograph_url": "/images/lichen-005.jpg",
            "interpreter_opinion": "鉴定为Sticta fuliginosa，具有典型的叶状体形态，下表面具绒毛，共生念珠藻。",
            "original_belongs_to": "地卷属",
            "current_belongs_to": "肺衣属",
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "夏",
            "collection_date": datetime(2024, 8, 12, 16, 20)
        },
        {
            "status": "复判中",
            "specimen_no": "LICHEN-2024-006",
            "collection_point": "泰山玉皇顶",
            "collection_coords": {"lat": 36.2567, "lng": 117.1034},
            "collection_altitude": 1545,
            "substrate": "土壤",
            "spore_density": "中",
            "humidity_exposure": "适中",
            "collection_source": "送检",
            "micrograph_url": "/images/lichen-006.jpg",
            "interpreter_opinion": "初步鉴定为Cladonia rangiferina，但化学显色反应结果不典型，需进行薄层色谱分析确认。",
            "original_belongs_to": "石蕊属",
            "current_belongs_to": "石蕊属",
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "秋",
            "collection_date": datetime(2024, 9, 5, 13, 30)
        },
        {
            "status": "待接收",
            "specimen_no": "LICHEN-2024-007",
            "collection_point": "华山南峰",
            "collection_coords": {"lat": 34.4923, "lng": 110.0908},
            "collection_altitude": 2154,
            "substrate": "岩石",
            "spore_density": "高",
            "humidity_exposure": "干燥",
            "collection_source": "野外采集",
            "micrograph_url": "/images/lichen-007.jpg",
            "interpreter_opinion": None,
            "original_belongs_to": "地图衣属",
            "current_belongs_to": None,
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "春",
            "collection_date": datetime(2024, 5, 18, 8, 45)
        },
        {
            "status": "已锁定",
            "specimen_no": "LICHEN-2024-008",
            "collection_point": "庐山五老峰",
            "collection_coords": {"lat": 29.5678, "lng": 115.9123},
            "collection_altitude": 1474,
            "substrate": "树皮",
            "spore_density": "中",
            "humidity_exposure": "湿润",
            "collection_source": "野外采集",
            "micrograph_url": "/images/lichen-008.jpg",
            "interpreter_opinion": "鉴定为Hypogymnia physodes，具有典型的囊状叶状体，含原岛衣酸。",
            "original_belongs_to": "梅衣属",
            "current_belongs_to": "黄髓衣属",
            "is_remeasure": False,
            "parent_specimen_id": None,
            "season": "夏",
            "collection_date": datetime(2024, 6, 30, 15, 0)
        },
        {
            "status": "已退回",
            "specimen_no": "LICHEN-2024-009",
            "collection_point": "五台山北台",
            "collection_coords": {"lat": 39.0123, "lng": 113.5678},
            "collection_altitude": 3061,
            "substrate": "土壤",
            "spore_density": "低",
            "humidity_exposure": "干燥",
            "collection_source": "复测",
            "micrograph_url": "/images/lichen-009.jpg",
            "interpreter_opinion": "样本污染严重，无法进行有效鉴定，建议重新采集。",
            "original_belongs_to": "待定",
            "current_belongs_to": None,
            "is_remeasure": True,
            "parent_specimen_id": None,
            "season": "秋",
            "collection_date": datetime(2024, 10, 10, 10, 0)
        },
        {
            "status": "复判中",
            "specimen_no": "LICHEN-2024-010",
            "collection_point": "武夷山黄岗山",
            "collection_coords": {"lat": 27.8569, "lng": 117.6835},
            "collection_altitude": 2100,
            "substrate": "岩石",
            "spore_density": "高",
            "humidity_exposure": "湿润",
            "collection_source": "复测",
            "micrograph_url": "/images/lichen-010.jpg",
            "interpreter_opinion": "秋季复测的岩石生地衣样本，与春季样本相比，地理分布略有差异，可能为不同生态型。",
            "original_belongs_to": "地图衣属",
            "current_belongs_to": "地图衣属",
            "is_remeasure": True,
            "parent_specimen_id": 1,
            "season": "秋",
            "collection_date": datetime(2024, 10, 21, 9, 30)
        }
    ]

    for spec_data in specimens_data:
        specimen = schemas.SpecimenCreate(**spec_data)
        crud.create_specimen(db, specimen)

    assignments_data = [
        {"specimen_id": 2, "assign_from": "李主任", "assign_to": "王研究员", "notes": "武夷山复测样本，重点关注季节变化对归属的影响"},
        {"specimen_id": 6, "assign_from": "李主任", "assign_to": "张博士", "notes": "需补充化学显色实验数据"},
        {"specimen_id": 10, "assign_from": "李主任", "assign_to": "王研究员", "notes": "同地点复测，与ID=1和ID=2对比分析"}
    ]

    for assign_data in assignments_data:
        assignment = schemas.AssignmentCreate(**assign_data)
        crud.create_assignment(db, assignment)

    rejections_data = [
        {"specimen_id": 4, "rejected_by": "王研究员", "reason": "缺少显微切片图，且样本孢子密度为无，无法进行有效鉴定", "is_deficient": True},
        {"specimen_id": 9, "rejected_by": "张博士", "reason": "样本污染严重，已无法鉴定", "is_deficient": False}
    ]

    for reject_data in rejections_data:
        rejection = schemas.RejectionCreate(**reject_data)
        crud.create_rejection(db, rejection)

    lock_records_data = [
        {"specimen_id": 1, "locked_by": "李主任", "is_locked": True},
        {"specimen_id": 5, "locked_by": "李主任", "is_locked": True},
        {"specimen_id": 8, "locked_by": "李主任", "is_locked": True}
    ]

    for lock_data in lock_records_data:
        lock_record = schemas.LockRecordCreate(**lock_data)
        crud.create_lock_record(db, lock_record)

    db.commit()
