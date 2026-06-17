import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'alpine_cal.settings'
django.setup()

from django.test import RequestFactory
from calibration.views import (dashboard, station_map, calibration_list,
                                batch_list, anomaly_overview, export_summary,
                                offline_sync, StationListView, InstrumentListView,
                                TransportListView, CertificateListView)

factory = RequestFactory()

views_to_test = [
    ('dashboard', lambda: dashboard(factory.get('/'))),
    ('station_map', lambda: station_map(factory.get('/station-map/'))),
    ('calibration_list', lambda: calibration_list(factory.get('/calibrations/'))),
    ('batch_list', lambda: batch_list(factory.get('/batches/'))),
    ('anomaly_overview', lambda: anomaly_overview(factory.get('/anomalies/'))),
    ('export_summary_json', lambda: export_summary(factory.get('/export-summary/'))),
    ('export_summary_csv', lambda: export_summary(factory.get('/export-summary/?format=csv'))),
    ('offline_sync', lambda: offline_sync(factory.get('/offline-sync/'))),
]

for name, fn in views_to_test:
    try:
        resp = fn()
        print(f'{resp.status_code} {name}')
    except Exception as e:
        print(f'ERR {name}: {e}')

for name, view_class in [('stations', StationListView), ('instruments', InstrumentListView),
                          ('transports', TransportListView), ('certificates', CertificateListView)]:
    try:
        view = view_class.as_view()
        resp = view(factory.get(f'/{name}/'))
        print(f'{resp.status_code} {name}')
    except Exception as e:
        print(f'ERR {name}: {e}')
