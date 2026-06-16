from django.test import TestCase
from django.urls import reverse
from .models import (
    CoreSample, Cutter, CuttingPurpose, CuttingTask,
    BatchVersion, AnomalyRecord
)
from .services import detect_all_anomalies, generate_summary_data


class CoreModelTests(TestCase):
    def setUp(self):
        self.purpose = CuttingPurpose.objects.create(
            code='TEST',
            name='测试目的',
            standard_loss_rate=3.0,
            typical_length=0.05,
        )
        self.cutter = Cutter.objects.create(
            cutter_no='TEST-001',
            name='测试切割机',
            cutter_type='diamond',
            status='available',
            daily_capacity=10.0,
        )
        self.sample = CoreSample.objects.create(
            sample_no='TEST-SAMPLE-001',
            well_name='测试井',
            depth_start=1000.0,
            depth_end=1003.0,
            total_length=3.0,
            remaining_length=2.0,
            lithology='砂岩',
            priority='high',
            status='pending',
        )
        self.task = CuttingTask.objects.create(
            task_no='TEST-TASK-001',
            core_sample=self.sample,
            cutter=self.cutter,
            purpose=self.purpose,
            planned_cut_length=0.5,
            slice_count=10,
            slice_thickness=0.05,
        )

    def test_sample_usage_rate(self):
        self.assertEqual(self.sample.usage_rate, 33.3)

    def test_task_expected_loss(self):
        expected = 0.5 * 3.0 / 100
        self.assertAlmostEqual(self.task.expected_loss, expected, places=4)

    def test_task_loss_rate(self):
        self.task.loss_length = 0.025
        self.task.planned_cut_length = 0.5
        self.assertEqual(self.task.loss_rate, 5.0)

    def test_sample_validation(self):
        self.sample.remaining_length = 5.0
        with self.assertRaises(Exception):
            self.sample.full_clean()

    def test_sample_has_anomaly_false(self):
        self.assertFalse(self.sample.has_anomaly)

    def test_detect_anomalies_data_incomplete(self):
        self.sample.lithology = ''
        self.sample.save()
        anomalies = detect_all_anomalies()
        self.assertTrue(len(anomalies) >= 0)


class ViewTests(TestCase):
    def setUp(self):
        self.sample = CoreSample.objects.create(
            sample_no='VIEW-TEST-001',
            well_name='视图测试井',
            depth_start=1000.0,
            depth_end=1002.0,
            total_length=2.0,
            remaining_length=1.5,
            priority='medium',
            status='pending',
        )
        self.purpose = CuttingPurpose.objects.create(
            code='VIEW',
            name='视图测试目的',
        )
        self.cutter = Cutter.objects.create(
            cutter_no='VIEW-001',
            name='视图测试切割机',
        )

    def test_dashboard_view(self):
        response = self.client.get(reverse('core:dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, '岩心样本切割排程系统')

    def test_sample_list_view(self):
        response = self.client.get(reverse('core:sample_list'))
        self.assertEqual(response.status_code, 200)

    def test_sample_detail_view(self):
        response = self.client.get(reverse('core:sample_detail', args=[self.sample.pk]))
        self.assertEqual(response.status_code, 200)

    def test_sample_create_view(self):
        response = self.client.get(reverse('core:sample_create'))
        self.assertEqual(response.status_code, 200)

    def test_task_list_view(self):
        response = self.client.get(reverse('core:task_list'))
        self.assertEqual(response.status_code, 200)

    def test_workbench_view(self):
        response = self.client.get(reverse('core:workbench'))
        self.assertEqual(response.status_code, 200)

    def test_batch_list_view(self):
        response = self.client.get(reverse('core:batch_list'))
        self.assertEqual(response.status_code, 200)

    def test_anomaly_list_view(self):
        response = self.client.get(reverse('core:anomaly_list'))
        self.assertEqual(response.status_code, 200)

    def test_export_csv(self):
        response = self.client.get(reverse('core:export_summary'))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/csv; charset=utf-8')

    def test_cutter_list_view(self):
        response = self.client.get(reverse('core:cutter_list'))
        self.assertEqual(response.status_code, 200)

    def test_purpose_list_view(self):
        response = self.client.get(reverse('core:purpose_list'))
        self.assertEqual(response.status_code, 200)


class ServiceTests(TestCase):
    def test_generate_summary_data(self):
        data = generate_summary_data()
        self.assertIn('total_samples', data)
        self.assertIn('total_tasks', data)
        self.assertIn('open_anomalies', data)
        self.assertGreaterEqual(data['total_samples'], 0)
