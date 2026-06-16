import urllib.request
import urllib.error

test_urls = [
    ('/', '仪表盘'),
    ('/samples/', '岩心台账'),
    ('/tasks/', '切割任务'),
    ('/workbench/', '工作台'),
    ('/batches/', '批次版本'),
    ('/anomalies/', '异常中心'),
    ('/cutters/', '切割机管理'),
    ('/purposes/', '切割目的'),
    ('/export/summary/', '导出CSV'),
    ('/samples/1/', '岩心详情'),
    ('/samples/create/', '新建样本表单'),
    ('/samples/1/edit/', '编辑样本表单'),
    ('/tasks/1/', '任务详情'),
    ('/tasks/create/', '新建任务表单'),
    ('/tasks/1/edit/', '编辑任务表单'),
    ('/batches/1/', '批次详情'),
    ('/batches/create/', '新建批次表单'),
    ('/anomalies/1/resolve/', '处理异常表单'),
    ('/export/summary/xlsx/', '导出Excel'),
]

print('=== 页面可访问性测试 ===\n')
passed = 0
failed = 0

for url, name in test_urls:
    try:
        req = urllib.request.Request('http://127.0.0.1:9000' + url)
        resp = urllib.request.urlopen(req, timeout=10)
        content_type = resp.headers.get('Content-Type', '')
        print(f'  ✓ {name}')
        print(f'    URL: {url}')
        print(f'    状态: {resp.status}')
        print(f'    类型: {content_type[:50]}')
        passed += 1
    except urllib.error.HTTPError as e:
        print(f'  ? {name}: HTTP {e.code}')
        failed += 1
    except Exception as e:
        print(f'  ✗ {name}: {type(e).__name__}: {e}')
        failed += 1
    print()

print(f'=== 测试完成: {passed} 通过, {failed} 失败 ===')
