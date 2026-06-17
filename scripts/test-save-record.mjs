import http from 'http';
import { URLSearchParams } from 'url';

const params = new URLSearchParams();
params.append('action', 'saveRecord');
params.append('by', '验船师TEST');
params.append('change_summary', '测试保存全部并更新batch_codeTEST');

params.append('batch_code', 'BATCH-TEST-001');
params.append('record_date', '2026-06-17');
params.append('location', '测试港口TEST');
params.append('weather_condition', '晴TEST');
params.append('sea_state', '平静TEST');
params.append('magnetic_variation', '4.2');
params.append('variation_direction', 'E');
params.append('corrector_fore_and_aft', '10');
params.append('corrector_athwartship', '-5');
params.append('corrector_vertical', '5');
params.append('corrector_quadrantal', '2');
params.append('corrector_heeling', '0');
params.append('inspector_name', '验船师TEST');
params.append('inspector_certificate', 'CERT-TEST-001');
params.append('survey_company', '测试检验公司TEST');
params.append('notes', '测试备注TEST');

const headings = [0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330, 345];
for (let i = 0; i < headings.length; i++) {
  const h = headings[i];
  const deviation = (Math.abs(Math.sin(h * Math.PI / 180)) * 3 + 2).toFixed(1); // 用 abs 确保非负
  params.append(`dev_${h}`, deviation);
  params.append(`dir_${h}`, 'E');
  params.append(`mag_${h}`, (h - Number(deviation) + 360).toFixed(1));
  params.append(`true_${h}`, (h + 4.2).toFixed(1));
  params.append(`meas_${h}`, (i % 2 === 0 ? '1' : '0'));
}

const corrHeadings = [0, 45, 90, 135, 180, 225, 270, 315];
for (const ch of corrHeadings) {
  params.append(`corr_${ch}`, '2.0');
  params.append(`corrdir_${ch}`, 'E');
  params.append(`corrrange_${ch}`, `${(ch - 22 + 360) % 360}° - ${(ch + 22) % 360}°`);
  params.append(`corrrule_${ch}`, `测试规则TEST`);
}

const body = params.toString();
console.log('请求体长度:', Buffer.byteLength(body));

const options = {
  hostname: 'localhost',
  port: 6876,
  path: '/records/1',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(body),
    'Connection': 'close'
  },
  timeout: 10000
};

console.log('\n=== 发送 saveRecord 请求...');
console.log('batch_code = BATCH-TEST-001');

const req = http.request(options, (res) => {
  console.log('HTTP状态:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('完成！');
    process.exit(0);
  });
});

req.on('timeout', () => {
  console.error('请求超时！');
  req.destroy();
  process.exit(1);
});

req.on('error', (e) => {
  console.error('请求错误:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
