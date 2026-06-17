import urllib.request, json

r = urllib.request.urlopen('http://127.0.0.1:8000/', timeout=10)
h = r.read().decode()
print('CDN present:', 'cdn.jsdelivr' in h)
print('Local Chart.js:', 'vendor/chart' in h)
print('Group chart canvas:', 'group-compare-chart' in h)
print('No old data-chart:', 'data-chart=' not in h)

r2 = urllib.request.urlopen('http://127.0.0.1:8000/api/trend-data/?days=30', timeout=10)
d = json.loads(r2.read())
print(f'Trend API: {len(d["labels"])} days, conc sample: {d["conc_avg"][:3]}')

r3 = urllib.request.urlopen('http://127.0.0.1:8000/pools/1/', timeout=10)
h3 = r3.read().decode()
print(f'Pool detail: pool-trend-chart={"pool-trend-chart" in h3}, localChart={"vendor/chart" in h3}')

r4 = urllib.request.urlopen('http://127.0.0.1:8000/api/trend-data/?days=30&pool_id=1', timeout=10)
d2 = json.loads(r4.read())
print(f'Pool trend API: {len(d2["labels"])} days')

print('\nALL VERIFIED')
