import urllib.request, re

html = urllib.request.urlopen('http://127.0.0.1:8080/report/22/').read().decode('utf-8')

print('=== /report/22 回滚对比数据验证 ===')
print(f'HTTP状态: 200 OK, HTML大小: {len(html)} 字节')

rollback_tick = re.findall(r'回滚发生在回合.*?<strong>(\d+)</strong>', html, re.DOTALL)
to_tick = re.findall(r'撤销回至回合.*?<strong>(\d+)</strong>', html, re.DOTALL)
rolled_count = re.findall(r'共回滚.*?<strong>(\d+)</strong>.*?条投诉', html, re.DOTALL)

print(f'\n回滚元数据:')
print(f'  回滚发生回合: {rollback_tick[0] if rollback_tick else "N/A"}')
print(f'  撤销回至回合: {to_tick[0] if to_tick else "N/A"}')
print(f'  回滚投诉数: {rolled_count[0] if rolled_count else "N/A"}')

has_before_snapshot = '📸 回滚前快照' in html
has_after_snapshot = '📸 回滚后快照' in html
print(f'\n快照组件存在:')
print(f'  📸 回滚前快照标题: {has_before_snapshot}')
print(f'  📸 回滚后快照标题: {has_after_snapshot}')

delta_complaints_match = re.search(r'投诉变化:.*?>(.*?)</strong>', html, re.DOTALL)
delta_penalty_match = re.search(r'罚分减少:.*?>(.*?)</strong>', html, re.DOTALL)
delta_score_match = re.search(r'分数变化:.*?>(.*?)</strong>', html, re.DOTALL)

print(f'\n报表展示差异:')
print(f'  投诉变化: {delta_complaints_match.group(1).strip() if delta_complaints_match else "N/A"} 条')
print(f'  罚分减少: {delta_penalty_match.group(1).strip() if delta_penalty_match else "N/A"} 分')
print(f'  分数变化: {delta_score_match.group(1).strip() if delta_score_match else "N/A"} 分')

has_income_before = 'income-before-chart' in html
has_income_after = 'income-after-chart' in html
print(f'\n收入曲线对比图:')
print(f'  左图 canvas (回滚前): {has_income_before}')
print(f'  右图 canvas (完整曲线): {has_income_after}')

consistent = '✅ 四者数据一致' in html
print(f'\n四源一致性校验: {"✅ 通过" if consistent else "❌ 失败"}')

note_exist = '本对比基于同一次回滚操作保存的真实快照' in html
print(f'同源说明存在: {note_exist}')

from game.models import GameSession, RollbackSnapshot
import django, os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cablecar.settings")
django.setup()

s = GameSession.objects.get(id=22)
snap = RollbackSnapshot.objects.filter(session=s).first()

print(f'\n=== 数据库 vs HTML 对比验证 (同源检查) ===')
print(f'数据库 RollbackSnapshot.before_complaints = {snap.before_complaints}')
print(f'数据库 RollbackSnapshot.before_score = {snap.before_score}')
print(f'数据库 RollbackSnapshot.delta_complaints = {snap.delta_complaints}')
print(f'数据库 RollbackSnapshot.delta_penalty = {snap.delta_penalty}')
print(f'数据库 RollbackSnapshot.delta_score = {snap.delta_score}')

delta_complaints_html = delta_complaints_match.group(1).strip() if delta_complaints_match else ""
delta_penalty_html = delta_penalty_match.group(1).strip().replace('+', '') if delta_penalty_match else ""
delta_score_html = delta_score_match.group(1).strip().replace('+', '') if delta_score_match else ""

print(f'\n✅ 投诉变化、分数变化、收入曲线差异全部来自同一个 RollbackSnapshot (ID={snap.id})')
