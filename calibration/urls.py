from django.urls import path
from . import views

app_name = 'calibration'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('station-map/', views.station_map, name='station_map'),
    path('stations/', views.StationListView.as_view(), name='station_list'),
    path('stations/create/', views.StationCreateView.as_view(), name='station_create'),
    path('stations/<uuid:pk>/', views.StationDetailView.as_view(), name='station_detail'),
    path('stations/<uuid:pk>/edit/', views.StationUpdateView.as_view(), name='station_edit'),
    path('instruments/', views.InstrumentListView.as_view(), name='instrument_list'),
    path('instruments/create/', views.InstrumentCreateView.as_view(), name='instrument_create'),
    path('instruments/<uuid:pk>/', views.InstrumentDetailView.as_view(), name='instrument_detail'),
    path('instruments/<uuid:pk>/edit/', views.InstrumentUpdateView.as_view(), name='instrument_edit'),
    path('calibrations/', views.calibration_list, name='calibration_list'),
    path('calibrations/create/', views.CalibrationRecordCreateView.as_view(), name='calibration_create'),
    path('calibrations/<uuid:pk>/', views.CalibrationRecordDetailView.as_view(), name='calibration_detail'),
    path('calibrations/<uuid:pk>/edit/', views.CalibrationRecordUpdateView.as_view(), name='calibration_edit'),
    path('batches/', views.batch_list, name='batch_list'),
    path('batches/create/', views.BatchCreateView.as_view(), name='batch_create'),
    path('batches/<uuid:pk>/', views.BatchDetailView.as_view(), name='batch_detail'),
    path('transports/', views.TransportListView.as_view(), name='transport_list'),
    path('transports/create/', views.TransportCreateView.as_view(), name='transport_create'),
    path('transports/<uuid:pk>/', views.TransportDetailView.as_view(), name='transport_detail'),
    path('transports/<uuid:pk>/edit/', views.TransportUpdateView.as_view(), name='transport_edit'),
    path('certificates/', views.CertificateListView.as_view(), name='certificate_list'),
    path('certificates/create/', views.CertificateCreateView.as_view(), name='certificate_create'),
    path('certificates/<uuid:pk>/', views.CertificateDetailView.as_view(), name='certificate_detail'),
    path('certificates/<uuid:pk>/edit/', views.CertificateUpdateView.as_view(), name='certificate_edit'),
    path('anomalies/', views.anomaly_overview, name='anomaly_overview'),
    path('offline-sync/', views.offline_sync, name='offline_sync'),
    path('export-summary/', views.export_summary, name='export_summary'),
]
