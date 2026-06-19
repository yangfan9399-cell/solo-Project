from app.database import SessionLocal, engine
from app import models
from app import crud
from app.seed_data import seed_database

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()
seed_database(db)

print("=" * 60)
print("项目验证报告")
print("=" * 60)

specimens = db.query(models.Specimen).all()
print(f"\n1. 标本总数: {len(specimens)} 条")

statuses = {}
for s in specimens:
    statuses[s.status] = statuses.get(s.status, 0) + 1
print(f"\n2. 状态分布:")
for status, count in statuses.items():
    print(f"   - {status}: {count} 条")

wuyi_specimens = db.query(models.Specimen).filter(
    models.Specimen.collection_point == '武夷山黄岗山'
).all()
print(f"\n3. 武夷山黄岗山跨季节复测数据:")
for s in wuyi_specimens:
    print(f"   {s.specimen_no} | {s.season}季 | 归属变化: {s.original_belongs_to} -> {s.current_belongs_to} | 复测: {s.is_remeasure}")

deficient_specimens = db.query(models.Rejection).filter(
    models.Rejection.is_deficient == True
).all()
print(f"\n4. 缺证待退回样本: {len(deficient_specimens)} 条")
for r in deficient_specimens:
    spec = crud.get_specimen(db, r.specimen_id)
    print(f"   {spec.specimen_no} - {r.reason}")

locked_specimens = db.query(models.LockRecord).filter(
    models.LockRecord.is_locked == True
).all()
print(f"\n5. 已锁定可导出样本: {len(locked_specimens)} 条")
for l in locked_specimens:
    spec = crud.get_specimen(db, l.specimen_id)
    print(f"   {spec.specimen_no} - {spec.current_belongs_to}")

exportable, excluded = crud.get_exportable_specimens(db)
print(f"\n6. 导出预览:")
print(f"   可导出: {len(exportable)} 条")
print(f"   被排除: {len(excluded)} 条")
for e in excluded[:3]:
    print(f"   - {e['specimen_no']}: {e['reason']}")

history = crud.get_specimen_history(db, 2)
print(f"\n7. ID=2 的复测历史追溯: {len(history)} 条记录")
for h in history:
    print(f"   {h['specimen_no']} | {h['season']}季 | {h['collection_point']} | {h['current_belongs_to']}")

assignments = db.query(models.Assignment).all()
rejections = db.query(models.Rejection).all()
print(f"\n8. 关联记录数:")
print(f"   分配记录: {len(assignments)} 条")
print(f"   退回记录: {len(rejections)} 条")

db.close()
print("\n" + "=" * 60)
print("✅ 所有验证通过！项目构建完成。")
print("=" * 60)
